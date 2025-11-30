import { NextRequest, NextResponse } from 'next/server';
import { generateBatchSummaries } from '@/lib/ai/summary-generator';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractEntities } from '@/lib/ai/knowledge-graph';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { summaries: 0, entities: 0 };

  try {
    console.log('🚀 Starting orchestration...');

    // Step 1: Generate Summaries for stories without summaries
    console.log('📝 Generating summaries...');
    await generateBatchSummaries(20);
    const { count: summaryCount } = await supabaseAdmin
      .from('story_summaries')
      .select('*', { count: 'exact', head: true });
    results.summaries = summaryCount || 0;
    console.log(`✓ Summaries complete: ${results.summaries} total`);

    // Step 2: Extract Entities for recent stories
    console.log('🏷️ Extracting entities...');
    const { data: recentStories } = await supabaseAdmin
      .from('stories_raw')
      .select('id')
      .order('published_at', { ascending: false })
      .limit(10);

    if (recentStories) {
      for (const story of recentStories) {
        try {
          await extractEntities(story.id);
          results.entities++;
        } catch (e) {
          console.error(`Failed to extract entities for ${story.id}`);
        }
      }
    }
    console.log(`✓ Entities complete: ${results.entities} processed`);

    console.log('✅ Orchestration complete');
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('❌ Orchestration failed:', error);
    return NextResponse.json({ 
      error: 'Orchestration failed', 
      details: error.message,
      results 
    }, { status: 500 });
  }
}
