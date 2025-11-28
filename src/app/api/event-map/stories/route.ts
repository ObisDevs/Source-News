import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const { data: stories, error } = await supabaseAdmin
      .from('stories_raw')
      .select(`
        id, 
        title, 
        category, 
        published_at, 
        metadata,
        sources(name)
      `)
      .gte('published_at', thirtyDaysAgo.toISOString())
      .order('published_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ stories: [], error: error.message }, { status: 500 });
    }

    const { data: clusterItems } = await supabaseAdmin
      .from('cluster_items')
      .select('story_id, cluster_id');

    const clusterMap = new Map<string, string>();
    clusterItems?.forEach(item => {
      clusterMap.set(item.story_id, item.cluster_id);
    });

    const enrichedStories = stories?.map(story => ({
      ...story,
      cluster_id: clusterMap.get(story.id) || null
    })) || [];

    return NextResponse.json({ stories: enrichedStories });
  } catch (e) {
    console.error('Event map API error:', e);
    return NextResponse.json({ stories: [], error: String(e) }, { status: 500 });
  }
}
