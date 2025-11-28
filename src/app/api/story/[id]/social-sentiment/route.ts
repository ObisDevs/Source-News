import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { analyzeTwitterSentiment, extractTopicsFromStory } from '@/lib/workers/twitter-scraper';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: existing } = await supabaseAdmin
      .from('social_sentiment')
      .select('*')
      .eq('story_id', id)
      .eq('platform', 'twitter')
      .single();

    if (existing) {
      return NextResponse.json({
        sentiment: {
          positive: existing.positive_count,
          negative: existing.negative_count,
          neutral: existing.neutral_count,
          totalTweets: existing.total_count,
          keywords: existing.keywords,
        },
        tweets: existing.sample_tweets || [],
        cached: true,
      });
    }

    const { data: story } = await supabaseAdmin
      .from('stories_raw')
      .select('title, content')
      .eq('id', id)
      .single();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const topics = await extractTopicsFromStory(story.title, story.content || '');
    const searchQuery = `${topics.join(' OR ')} Nigeria`;
    const result = await analyzeTwitterSentiment(searchQuery, id);

    return NextResponse.json({ 
      sentiment: result.sentiment,
      tweets: result.tweets || [],
      cached: false 
    });
  } catch (error) {
    console.error('Social sentiment error:', error);
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 });
  }
}
