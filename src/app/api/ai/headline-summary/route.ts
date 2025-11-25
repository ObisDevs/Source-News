import { NextRequest, NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const { stories, storyIds } = await request.json();

    // If specific story IDs provided, fetch those stories
    if (storyIds && storyIds.length > 0) {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      const { data } = await supabaseAdmin
        .from('stories_raw')
        .select('id, title, content')
        .in('id', storyIds);
      
      if (data && data.length > 0) {
        const headlines = data.map((s: any, i: number) => `${i + 1}. ${s.title}`).join('\n');
        const prompt = `Provide a comprehensive, engaging summary (4-5 sentences) of these Nigerian news headlines. Explain the key events, their context, and significance:\n\n${headlines}\n\nSummary:`;
        const summary = await generateAICompletion(prompt);
        return NextResponse.json({ summary });
      }
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({ error: 'No stories provided' }, { status: 400 });
    }

    const headlines = stories.map((s: any, i: number) => `${i + 1}. ${s.title}`).join('\n');
    
    const prompt = `Provide a comprehensive, engaging summary (4-5 sentences) of these top Nigerian news headlines. Explain the key events, their context, and significance to Nigerian readers:\n\n${headlines}\n\nSummary:`;

    const summary = await generateAICompletion(prompt);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI summary error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
