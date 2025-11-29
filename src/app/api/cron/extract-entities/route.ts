import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractEntities } from '@/lib/ai/knowledge-graph';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: stories } = await supabaseAdmin
      .from('stories_raw')
      .select('id')
      .not('id', 'in', supabaseAdmin.from('knowledge_graph').select('story_ids'))
      .order('published_at', { ascending: false })
      .limit(10);

    if (stories) {
      for (const story of stories) {
        await extractEntities(story.id);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return NextResponse.json({ success: true, processed: stories?.length || 0 });
  } catch (error) {
    console.error('Entity extraction error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
