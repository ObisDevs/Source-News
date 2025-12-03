import Parser from 'rss-parser';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateFingerprint, normalizeURL } from '@/lib/utils/fingerprint';
import { extractImageFromURL } from '@/lib/utils/image-extractor';

interface RSSSource {
  id: string;
  name: string;
  url: string;
  bias: string;
}

interface IngestResult {
  ingested: number;
  skipped: number;
  errors: number;
  sources?: Array<{
    name: string;
    ingested: number;
    skipped: number;
    errors: number;
  }>;
}

function categorizeByKeywords(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  
  const keywords = {
    Politics: ['government', 'election', 'president', 'senate', 'politics', 'minister', 'governor', 'policy', 'law', 'parliament', 'tinubu', 'buhari', 'pdp', 'apc'],
    Business: ['business', 'economy', 'market', 'company', 'trade', 'investment', 'bank', 'finance', 'stock', 'naira', 'dollar', 'cbn', 'inflation'],
    Sports: ['football', 'sport', 'match', 'player', 'team', 'league', 'coach', 'goal', 'tournament', 'athlete', 'super eagles', 'afcon'],
    Technology: ['technology', 'tech', 'digital', 'software', 'app', 'internet', 'startup', 'innovation', 'ai', 'crypto', 'blockchain', 'fintech'],
    Entertainment: ['entertainment', 'music', 'movie', 'celebrity', 'film', 'artist', 'nollywood', 'concert', 'album', 'actor', 'actress', 'wizkid', 'davido'],
    Health: ['health', 'medical', 'hospital', 'doctor', 'disease', 'patient', 'treatment', 'vaccine', 'covid', 'medicine', 'lassa', 'cholera']
  };

  let maxScore = 0;
  let category = 'General';

  for (const [cat, words] of Object.entries(keywords)) {
    const score = words.filter(word => text.includes(word)).length;
    if (score > maxScore) {
      maxScore = score;
      category = cat;
    }
  }

  return category;
}

export async function ingestRSSFeeds(): Promise<IngestResult> {
  const parser = new Parser();
  const results: IngestResult = { ingested: 0, skipped: 0, errors: 0, sources: [] };
  
  console.log('\n=== RSS Feed Ingestion Started ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Fetch active RSS sources from database
  const { data: rssSources, error: sourcesError } = await supabaseAdmin
    .from('sources')
    .select('id, name, rss_url, bias_lean')
    .eq('type', 'rss')
    .eq('is_active', true);

  if (sourcesError || !rssSources || rssSources.length === 0) {
    console.error('❌ Failed to fetch RSS sources from database:', sourcesError);
    return results;
  }

  console.log(`📡 Processing ${rssSources.length} RSS sources\n`);

  for (const dbSource of rssSources) {
    if (!dbSource.rss_url) {
      console.log(`\n⚠️  ${dbSource.name}: No RSS URL configured, skipping`);
      continue;
    }

    const source: RSSSource = {
      id: dbSource.id,
      name: dbSource.name,
      url: dbSource.rss_url,
      bias: dbSource.bias_lean || 'centre'
    };
    console.log(`\n📰 Source: ${source.name}`);
    try {
      console.log(`   🌐 Fetching RSS feed from ${source.url}...`);
      const feed = await parser.parseURL(source.url);
      console.log(`   ✅ Retrieved ${feed.items.length} items`);
      console.log(`   🔄 Processing items...`);

      let sourceIngested = 0, sourceSkipped = 0, sourceErrors = 0;

      for (const item of feed.items) {
        try {
          const url = item.link || item.guid || '';
          if (!url) continue;

          const canonicalUrl = normalizeURL(url);
          const fingerprint = generateFingerprint(canonicalUrl);

          // Check database for existing fingerprint
          const { data: existing } = await supabaseAdmin
            .from('stories_raw')
            .select('id')
            .eq('fingerprint', fingerprint)
            .single();

          if (existing) {
            results.skipped++;
            sourceSkipped++;
            continue;
          }

          // Extract image from RSS or scrape from URL
          let imageUrl = null;
          
          // Try RSS enclosure/media tags first
          if (item.enclosure?.url) {
            imageUrl = item.enclosure.url;
          } else if ((item as any)['media:content']?.$?.url) {
            imageUrl = (item as any)['media:content'].$.url;
          } else if ((item as any)['media:thumbnail']?.$?.url) {
            imageUrl = (item as any)['media:thumbnail'].$.url;
          }
          
          // If no image in RSS, scrape from article URL
          if (!imageUrl && url) {
            imageUrl = await extractImageFromURL(url);
          }

          // Categorize by keywords
          const title = item.title || '';
          const content = item.contentSnippet || item.content || '';
          const category = categorizeByKeywords(title, content);

          // Insert story
          const { error } = await supabaseAdmin.from('stories_raw').insert({
            title: item.title || 'Untitled',
            content: item.contentSnippet || item.content || '',
            url,
            canonical_url: canonicalUrl,
            fingerprint,
            published_at: item.pubDate || new Date().toISOString(),
            source_id: source.id,
            category,
            metadata: {
              source: source.name,
              bias: source.bias,
              author: item.creator || item.author,
              image: imageUrl,
              og_image: imageUrl,
            },
          });

          if (!error) {
            results.ingested++;
            sourceIngested++;
          } else if (error.code === '23505') {
            results.skipped++;
            sourceSkipped++;
          } else {
            results.errors++;
            sourceErrors++;
            console.error(`   ❌ Insert error: ${error.message}`);
          }
        } catch (itemError) {
          results.errors++;
          sourceErrors++;
          console.error(`   ❌ Item error: ${itemError}`);
        }
      }

      console.log(`   📊 ${source.name} Results:`);
      console.log(`      ✅ Ingested: ${sourceIngested}`);
      console.log(`      ⏭️  Skipped: ${sourceSkipped}`);
      console.log(`      ❌ Errors: ${sourceErrors}`);
      
      results.sources!.push({
        name: source.name,
        ingested: sourceIngested,
        skipped: sourceSkipped,
        errors: sourceErrors
      });
    } catch (feedError) {
      results.errors++;
      console.error(`   ❌ Feed fetch failed: ${feedError}`);
    }
  }

  console.log('\n📊 Total RSS Results:');
  console.log(`   ✅ Ingested: ${results.ingested}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log('=== RSS Feed Ingestion Complete ===\n');
  return results;
}
