import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateStorySummary } from '@/lib/ai/summary-generator';

export async function POST(request: NextRequest) {
  try {
    const { limit = 50 } = await request.json();

    const { data: stories } = await supabaseAdmin
      .from('stories_raw')
      .select('id')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (!stories) {
      return NextResponse.json({ error: 'No stories found' }, { status: 404 });
    }

    let processed = 0;
    for (const story of stories) {
      const { data: existing } = await supabaseAdmin
        .from('story_summaries')
        .select('id')
        .eq('story_id', story.id)
        .single();

      if (!existing) {
        await generateStorySummary(story.id);
        processed++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return NextResponse.json({ success: true, processed, total: stories.length });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
