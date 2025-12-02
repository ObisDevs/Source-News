import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { story_id, story_url, title, tweet_text, tweet_url, category } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('posted_tweets')
      .insert({
        story_id,
        story_url,
        title,
        tweet_text,
        tweet_url,
        category
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      data
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
