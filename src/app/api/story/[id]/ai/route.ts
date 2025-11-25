import { NextRequest, NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai/orchestrator';
import { supabaseAdmin } from '@/lib/supabase/client';

const PROMPTS: Record<string, (title: string, content: string) => string> = {
  summary: (title, content) => 
    `Summarize this Nigerian news article in 3-4 sentences:\n\nTitle: ${title}\n\nContent: ${content}`,
  
  eli5: (title, content) => 
    `Explain this Nigerian news story in simple terms that a 5-year-old could understand:\n\nTitle: ${title}\n\nContent: ${content}`,
  
  sentiment: (title, content) => 
    `Analyze the sentiment and emotional tone of this Nigerian news article. Identify if it's positive, negative, or neutral, and explain why:\n\nTitle: ${title}\n\nContent: ${content}`,
  
  bias: (title, content) => 
    `Analyze the political bias in this Nigerian news article. Identify any left-leaning, right-leaning, or centrist perspectives:\n\nTitle: ${title}\n\nContent: ${content}`,
  
  fact_check: (title, content) => 
    `Identify the key factual claims in this Nigerian news article and assess their verifiability:\n\nTitle: ${title}\n\nContent: ${content}`,
  
  context: (title, content) => 
    `Provide historical and political context for this Nigerian news story. What background information helps understand this better?\n\nTitle: ${title}\n\nContent: ${content}`,
  
  impact: (title, content) => 
    `Analyze who is affected by this Nigerian news story and what the potential impacts are:\n\nTitle: ${title}\n\nContent: ${content}`,
  
  timeline: (title, content) => 
    `Create a chronological timeline of events mentioned in this Nigerian news article:\n\nTitle: ${title}\n\nContent: ${content}`,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { feature, title, content } = await request.json();

    if (!PROMPTS[feature]) {
      return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
    }

    const { data: cached } = await supabaseAdmin
      .from('ai_explanations')
      .select('content')
      .eq('story_id', id)
      .eq('explanation_type', feature)
      .single();

    if (cached) {
      return NextResponse.json({ result: cached.content, cached: true });
    }

    const prompt = PROMPTS[feature](title, content);
    const result = await generateAICompletion(prompt);

    await supabaseAdmin.from('ai_explanations').insert({
      story_id: id,
      explanation_type: feature,
      content: result,
    });

    return NextResponse.json({ result, cached: false });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
