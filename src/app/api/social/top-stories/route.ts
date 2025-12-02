import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: stories, error } = await supabaseAdmin
      .from('stories_raw')
      .select(`
        id,
        title,
        content,
        url,
        published_at,
        category,
        sources(name, bias_lean)
      `)
      .gte('published_at', today.toISOString())
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!stories) {
      return NextResponse.json({ stories: [] });
    }

    const rankedStories = stories
      .map(story => ({
        id: story.id,
        title: story.title,
        content: story.content?.substring(0, 200),
        url: story.url,
        published_at: story.published_at,
        category: story.category || 'General',
        source_name: story.sources?.name || 'Unknown',
        bias_lean: story.sources?.bias_lean || 'centre',
        story_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/story/${story.id}`
      }))
      .slice(0, 10);

    return NextResponse.json({ 
      stories: rankedStories,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch stories',
      details: error.message 
    }, { status: 500 });
  }
}
