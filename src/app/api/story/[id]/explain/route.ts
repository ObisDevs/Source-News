import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateStoryAI } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { question } = await request.json();

    const { data: story } = await supabaseAdmin
      .from('stories_raw')
      .select('*, sources(name)')
      .eq('id', id)
      .single();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const prompt = question 
      ? `Answer this question about the Nigerian news story:

Question: ${question}

Story: ${story.title}
${story.content || story.metadata?.description || ''}

Provide a clear, concise answer. DO NOT include any links or URLs in your response.`
      : `Explain this news story in simple terms for a general audience. Focus on:
1. What happened
2. Why it matters
3. Key context
4. Potential implications

Story: ${story.title}
${story.content || story.metadata?.description || ''}

Provide a clear, unbiased explanation in 3-4 paragraphs. DO NOT include any links or URLs in your response.`;

    const explanation = await generateStoryAI(prompt);

    return NextResponse.json({ 
      explanation,
      storyUrl: story.url,
      storyTitle: story.title
    });

  } catch (error) {
    console.error('AI explanation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate explanation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
