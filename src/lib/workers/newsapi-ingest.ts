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

  if (!apiKey) {
    console.log('NewsAPI key not configured, skipping');
    return results;
  }

  try {
    // Get NewsAPI source from database
    const { data: sourceData } = await supabaseAdmin
      .from('sources')
      .select('id')
      .eq('name', 'NewsAPI Nigeria')
      .single();

    if (!sourceData) {
      console.warn('NewsAPI source not found in database');
      return results;
    }

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=ng&pageSize=50&apiKey=${apiKey}`
    );

    if (!response.ok) {
      console.error('NewsAPI error:', response.status);
      results.errors++;
      return results;
    }

    const data = await response.json();
    console.log(`Got ${data.articles?.length || 0} articles from NewsAPI`);

    for (const article of data.articles || []) {
      try {
        const url = article.url;
        if (!url) continue;

        const canonicalUrl = normalizeURL(url);
        const fingerprint = generateFingerprint(canonicalUrl);

        const { data: existing } = await supabaseAdmin
          .from('stories_raw')
          .select('id')
          .eq('fingerprint', fingerprint)
          .single();

        if (existing) {
          results.skipped++;
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
            source: article.source?.name || 'NewsAPI',
            author: article.author,
            urlToImage: article.urlToImage,
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
        console.error('Article processing error:', itemError);
      }
    }
  } catch (error) {
    results.errors++;
    console.error('NewsAPI fetch error:', error);
  }

  return results;
}
