import { supabaseAdmin } from '@/lib/supabase/client';
import { generateFingerprint, normalizeURL } from '@/lib/utils/fingerprint';

interface IngestResult {
  ingested: number;
  skipped: number;
  errors: number;
}

interface Tweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    urls?: Array<{ expanded_url: string }>;
  };
}

export async function ingestTwitterTrends(): Promise<IngestResult> {
  const results: IngestResult = { ingested: 0, skipped: 0, errors: 0 };
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!bearerToken) {
    console.log('Twitter Bearer Token not configured, skipping');
    return results;
  }

  try {
    // Get Twitter source from database
    const { data: sourceData } = await supabaseAdmin
      .from('sources')
      .select('id')
      .eq('name', 'Twitter Nigeria')
      .single();

    if (!sourceData) {
      console.warn('Twitter source not found in database');
      return results;
    }

    // Search for trending Nigerian news topics
    const searchQuery = '(Nigeria OR Nigerian OR Lagos OR Abuja) (news OR breaking) -is:retweet lang:en';
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&max_results=50&tweet.fields=created_at,public_metrics,entities&expansions=author_id`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Twitter API error:', response.status);
      results.errors++;
      return results;
    }

    const data = await response.json();
    const tweets: Tweet[] = data.data || [];

    console.log(`Got ${tweets.length} tweets from Twitter`);

    for (const tweet of tweets) {
      try {
        // Only process tweets with significant engagement
        const engagement = tweet.public_metrics.like_count + tweet.public_metrics.retweet_count;
        if (engagement < 10) continue;

        // Extract URL if present
        const tweetUrl = `https://twitter.com/i/web/status/${tweet.id}`;
        const newsUrl = tweet.entities?.urls?.[0]?.expanded_url || tweetUrl;
        
        const canonicalUrl = normalizeURL(newsUrl);
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

        const { error } = await supabaseAdmin.from('stories_raw').insert({
          title: tweet.text.substring(0, 200),
          content: tweet.text,
          url: newsUrl,
          canonical_url: canonicalUrl,
          fingerprint,
          published_at: tweet.created_at,
          source_id: sourceData.id,
          category: 'General',
          metadata: {
            source: 'Twitter',
            tweet_id: tweet.id,
            likes: tweet.public_metrics.like_count,
            retweets: tweet.public_metrics.retweet_count,
            replies: tweet.public_metrics.reply_count,
            engagement_score: engagement,
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
        console.error('Tweet processing error:', itemError);
      }
    }
  } catch (error) {
    results.errors++;
    console.error('Twitter fetch error:', error);
  }

  return results;
}
