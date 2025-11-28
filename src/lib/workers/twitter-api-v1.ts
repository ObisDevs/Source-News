import { generateAICompletion } from '@/lib/ai/orchestrator';

interface Tweet {
  text: string;
  created_at: string;
  retweet_count: number;
  favorite_count: number;
}

interface TwitterSearchResult {
  tweets: Tweet[];
  totalCount: number;
}

export async function searchTwitterV1(query: string): Promise<TwitterSearchResult> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!bearerToken && (!apiKey || !apiSecret)) {
    throw new Error('Twitter API credentials not configured');
  }

  try {
    const searchQuery = encodeURIComponent(query);
    const url = `https://api.twitter.com/1.1/search/tweets.json?q=${searchQuery}&count=100&result_type=recent&lang=en`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      tweets: data.statuses || [],
      totalCount: data.statuses?.length || 0,
    };
  } catch (error) {
    console.error('Twitter API v1 error:', error);
    return { tweets: [], totalCount: 0 };
  }
}

export async function analyzeTweetsSentiment(tweets: Tweet[]): Promise<{
  positive: number;
  negative: number;
  neutral: number;
}> {
  if (tweets.length === 0) {
    return { positive: 33, negative: 33, neutral: 34 };
  }

  const sampleTweets = tweets.slice(0, 20).map(t => t.text).join('\n---\n');
  
  const prompt = `Analyze sentiment of these ${tweets.length} tweets about a Nigerian news story:

${sampleTweets}

Return JSON with percentages:
{"positive": <0-100>, "negative": <0-100>, "neutral": <0-100>}`;

  try {
    const response = await generateAICompletion(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response');
    }

    const sentiment = JSON.parse(jsonMatch[0]);
    return sentiment;
  } catch (error) {
    const positive = tweets.filter(t => 
      /good|great|excellent|happy|love|support/i.test(t.text)
    ).length;
    const negative = tweets.filter(t => 
      /bad|terrible|awful|sad|hate|against/i.test(t.text)
    ).length;
    
    const posPercent = Math.round((positive / tweets.length) * 100);
    const negPercent = Math.round((negative / tweets.length) * 100);
    
    return {
      positive: posPercent,
      negative: negPercent,
      neutral: 100 - posPercent - negPercent,
    };
  }
}

export function extractHashtags(tweets: Tweet[]): string[] {
  const hashtags = new Set<string>();
  
  tweets.forEach(tweet => {
    const matches = tweet.text.match(/#\w+/g);
    if (matches) {
      matches.forEach(tag => hashtags.add(tag.replace('#', '')));
    }
  });
  
  return Array.from(hashtags).slice(0, 5);
}
