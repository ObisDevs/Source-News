import { NextRequest, NextResponse } from 'next/server';
import { generateStorySummary } from '@/lib/ai/summary-generator';
import { extractEntities } from '@/lib/ai/knowledge-graph';

export async function POST(request: NextRequest) {
  try {
    const { storyIds, action } = await request.json();

    if (!storyIds?.length) {
      return NextResponse.json({ error: 'No stories selected' }, { status: 400 });
    }

    let processed = 0;

    for (const storyId of storyIds) {
      try {
        if (action === 'summaries') {
          await generateStorySummary(storyId);
        } else if (action === 'entities') {
          await extractEntities(storyId);
        }
        processed++;
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`Failed to process ${storyId}:`, error);
      }
    }

    return NextResponse.json({ success: true, processed, total: storyIds.length });
  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
