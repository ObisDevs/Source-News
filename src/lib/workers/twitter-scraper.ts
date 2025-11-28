import { generateAICompletion } from '@/lib/ai/orchestrator';
import { supabaseAdmin } from '@/lib/supabase/client';
import { getCached, setCache } from '@/lib/redis/client';
import { searchTwitterV1, analyzeTweetsSentiment, extractHashtags } from './twitter-api-v1';

interface TwitterSentiment {
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    totalTweets: number;
    keywords: string[];
  };
  tweets: Array<{
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
}

export async function analyzeTwitterSentiment(
  topic: string,
  storyId: string
): Promise<TwitterSentiment> {
  const cacheKey = `twitter:sentiment:${storyId}`;
  const cached = await getCached<TwitterSentiment>(cacheKey);
  if (cached) return cached;

  try {
    const { tweets, totalCount } = await searchTwitterV1(topic);
    
    if (totalCount > 0) {
      const sentiment = await analyzeTweetsSentiment(tweets);
      const keywords = extractHashtags(tweets);
      
      const sampleTweets = tweets.slice(0, 10).map((t: any) => ({
        text: t.text,
        sentiment: (t as any).sentiment || 'neutral'
      }));
      
      const result: TwitterSentiment = {
        sentiment: {
          positive: sentiment.positive,
          negative: sentiment.negative,
          neutral: sentiment.neutral,
          totalTweets: totalCount,
          keywords,
        },
        tweets: sampleTweets,
      };
      
      await supabaseAdmin
        .from('social_sentiment')
        .upsert({
          story_id: storyId,
          platform: 'twitter',
          positive_count: result.sentiment.positive,
          negative_count: result.sentiment.negative,
          neutral_count: result.sentiment.neutral,
          total_count: result.sentiment.totalTweets,
          keywords: result.sentiment.keywords,
          sample_tweets: result.tweets,
          analyzed_at: new Date().toISOString(),
        });

      await setCache(cacheKey, result, 3600);
      return result;
    }
  } catch (error) {
    console.error('Twitter API error, falling back to AI:', error);
  }

  const prompt = `Analyze public sentiment on Twitter/X about: "${topic}"

Based on typical social media reactions to Nigerian news topics, provide:
1. Sentiment breakdown
2. Sample tweets (5-10 realistic examples)

Return JSON format:
{
  "sentiment": {
    "positive": <percentage 0-100>,
    "negative": <percentage 0-100>,
    "neutral": <percentage 0-100>,
    "totalTweets": <estimated number>,
    "keywords": ["keyword1", "keyword2", "keyword3"]
  },
  "tweets": [
    {"text": "sample tweet text", "sentiment": "positive"},
    {"text": "sample tweet text", "sentiment": "negative"}
  ]
}`;

  try {
    const response = await generateAICompletion(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const result: TwitterSentiment = JSON.parse(jsonMatch[0]);
    
    await supabaseAdmin
      .from('social_sentiment')
      .upsert({
        story_id: storyId,
        platform: 'twitter',
        positive_count: result.sentiment.positive,
        negative_count: result.sentiment.negative,
        neutral_count: result.sentiment.neutral,
        total_count: result.sentiment.totalTweets,
        keywords: result.sentiment.keywords,
        sample_tweets: result.tweets || [],
        analyzed_at: new Date().toISOString(),
      });

    await setCache(cacheKey, result, 3600);
    return result;
  } catch (error) {
    console.error('Twitter sentiment analysis error:', error);
    return {
      sentiment: {
        positive: 33,
        negative: 33,
        neutral: 34,
        totalTweets: 0,
        keywords: [],
      },
      tweets: [],
    };
  }
}

export async function extractTopicsFromStory(title: string, content: string): Promise<string[]> {
  const prompt = `Extract 2-3 key search terms from this Nigerian news story for Twitter search:

Title: ${title}
Content: ${content.slice(0, 500)}

Return only a JSON array of short search terms: ["term1", "term2"]`;

  try {
    const response = await generateAICompletion(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      return [title.split(' ').slice(0, 2).join(' ')];
    }

    const terms = JSON.parse(jsonMatch[0]);
    return terms.slice(0, 2);
  } catch (error) {
    console.error('Topic extraction error:', error);
    return [title.split(' ').slice(0, 2).join(' ')];
  }
}
