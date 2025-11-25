import Parser from 'rss-parser';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateFingerprint, normalizeURL } from '@/lib/utils/fingerprint';
import { extractImageFromURL } from '@/lib/utils/image-extractor';

interface RSSSource {
  name: string;
  url: string;
  bias: string;
}

const RSS_SOURCES: RSSSource[] = [
  { name: 'Vanguard', url: 'https://www.vanguardngr.com/feed/', bias: 'centre' },
  { name: 'Channels TV', url: 'https://www.channelstv.com/feed/', bias: 'centre' },
  { name: 'Techpoint Africa', url: 'https://techpoint.africa/feed/', bias: 'centre' },
  { name: 'Nairametrics', url: 'https://nairametrics.com/feed/', bias: 'centre' },
  { name: 'The Guardian NG', url: 'https://guardian.ng/feed/', bias: 'centre' },
  { name: 'Daily Trust', url: 'https://dailytrust.com/feed/', bias: 'centre' },
  { name: 'BusinessDay', url: 'https://businessday.ng/feed/', bias: 'centre' },
  { name: 'This Day', url: 'https://www.thisdaylive.com/index.php/feed/', bias: 'centre' },
];

interface IngestResult {
  ingested: number;
  skipped: number;
  errors: number;
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
  const results: IngestResult = { ingested: 0, skipped: 0, errors: 0 };
  
  console.log('Starting RSS ingestion from', RSS_SOURCES.length, 'sources');
  console.log('Note: Skipping Premium Times and Punch due to feed issues');

  for (const source of RSS_SOURCES) {
    try {
      // Get source ID from database
      const { data: sourceData, error: sourceError } = await supabaseAdmin
        .from('sources')
        .select('id')
        .eq('name', source.name)
        .single();

      if (sourceError) {
        console.error(`Database error for ${source.name}:`, sourceError);
        results.errors++;
        continue;
      }

      if (!sourceData) {
        console.warn(`Source not found in database: ${source.name}`);
        results.errors++;
        continue;
      }

      console.log(`Fetching ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      console.log(`✓ ${source.name}: ${feed.items.length} items`);

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
            source_id: sourceData.id,
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
          } else if (error.code === '23505') {
            results.skipped++;
          } else {
            results.errors++;
            console.error('Insert error:', error);
          }
        } catch (itemError) {
          results.errors++;
          console.error('Item processing error:', itemError);
        }
      }
    } catch (feedError) {
      results.errors++;
      console.error(`✗ ${source.name}: Failed`);
    }
  }

  console.log('Ingestion complete:', results);
  return results;
}
