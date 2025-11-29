import { supabaseAdmin } from '@/lib/supabase/client';
import { generateFingerprint, normalizeURL } from '@/lib/utils/fingerprint';

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

export async function ingestNewsAPI(): Promise<IngestResult> {
  const results: IngestResult = { ingested: 0, skipped: 0, errors: 0 };
  const apiKey = process.env.NEWSAPI_KEY;

  console.log('\n=== NewsAPI Ingestion Started ===')
  console.log(`Timestamp: ${new Date().toISOString()}`);

  if (!apiKey) {
    console.log('⚠️  NewsAPI key not configured, skipping');
    return results;
  }

  try {
    console.log('📡 Checking NewsAPI source in database...');
    // Get or create NewsAPI source
    let { data: sourceData } = await supabaseAdmin
      .from('sources')
      .select('id')
      .eq('name', 'NewsAPI')
      .single();

    if (!sourceData) {
      console.log('➕ Creating NewsAPI source...');
      const { data: newSource, error: insertError } = await supabaseAdmin
        .from('sources')
        .insert({
          name: 'NewsAPI',
          type: 'api',
          url: 'https://newsapi.org',
          is_active: true,
          credibility_score: 70,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Failed to create NewsAPI source:', insertError);
        return results;
      }
      sourceData = newSource;
      console.log('✅ NewsAPI source created');
    } else {
      console.log('✅ NewsAPI source found');
    }

    console.log('🌐 Fetching articles from NewsAPI...');
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=ng&pageSize=50&apiKey=${apiKey}`
    );

    if (!response.ok) {
      console.error(`❌ NewsAPI HTTP error: ${response.status}`);
      results.errors++;
      return results;
    }

    const data = await response.json();
    console.log(`📰 Received ${data.articles?.length || 0} articles from NewsAPI`);

    console.log('\n🔄 Processing articles...');
    for (const article of data.articles || []) {
      try {
        const url = article.url;
        if (!url) {
          console.log('⏭️  Skipping article without URL');
          continue;
        }

        const canonicalUrl = normalizeURL(url);
        const fingerprint = generateFingerprint(canonicalUrl);

        const { data: existing } = await supabaseAdmin
          .from('stories_raw')
          .select('id')
          .eq('fingerprint', fingerprint)
          .single();

        if (existing) {
          results.skipped++;
          console.log(`⏭️  Duplicate: ${article.title?.substring(0, 50)}...`);
          continue;
        }

        const category = categorizeByKeywords(
          article.title || '',
          article.description || article.content || ''
        );

        const { error } = await supabaseAdmin.from('stories_raw').insert({
          title: article.title || 'Untitled',
          content: article.description || article.content || '',
          url,
          canonical_url: canonicalUrl,
          fingerprint,
          published_at: article.publishedAt || new Date().toISOString(),
          source_id: sourceData.id,
          category,
          metadata: {
            source_name: article.source?.name || 'NewsAPI',
            author: article.author,
            image: article.urlToImage,
            og_image: article.urlToImage,
          },
        });

        if (!error) {
          results.ingested++;
          console.log(`✅ Ingested [${category}]: ${article.title?.substring(0, 50)}...`);
        } else if (error.code === '23505') {
          results.skipped++;
          console.log(`⏭️  Duplicate: ${article.title?.substring(0, 50)}...`);
        } else {
          results.errors++;
          console.error(`❌ Insert error for "${article.title?.substring(0, 50)}...": ${error.message}`);
        }
      } catch (itemError) {
        results.errors++;
        console.error(`❌ Article processing error: ${itemError}`);
      }
    }
  } catch (error) {
    results.errors++;
    console.error(`❌ NewsAPI fetch error: ${error}`);
  }

  console.log('\n📊 NewsAPI Results:');
  console.log(`   ✅ Ingested: ${results.ingested}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log('=== NewsAPI Ingestion Complete ===\n');

  return results;
}
