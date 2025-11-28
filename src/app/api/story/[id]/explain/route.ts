import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateAICompletion } from '@/lib/ai/orchestrator';
import { getCached, setCache } from '@/lib/redis/client';
import { checkLimit, incrementUsage } from '@/lib/usage/tracker';
import { TIER_LIMITS } from '@/lib/types/subscription';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { question, userId = 'anonymous', tier = 'free' } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 });
    }

    const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS].aiExplanationsPerDay;
    const canUse = await checkLimit(userId, 'aiExplanations', limit);

    if (!canUse) {
      return NextResponse.json(
        { error: 'Daily limit reached', limit, upgrade: tier === 'free' },
        { status: 429 }
      );
    }

    const cacheKey = `explain:${id}:${question}`;
    const cached = await getCached<string>(cacheKey);
    if (cached) {
      return NextResponse.json({ explanation: cached, cached: true });
    }

    const { data: story } = await supabaseAdmin
      .from('stories_raw')
      .select('title, content, url')
      .eq('id', id)
      .single();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const prompt = `Story: ${story.title}\n\nContent: ${story.content?.slice(0, 1000)}\n\nQuestion: ${question}\n\nProvide a clear, concise explanation.`;
    
    const explanation = await generateAICompletion(prompt);

    await setCache(cacheKey, explanation, 3600);
    await incrementUsage(userId, 'aiExplanations');

    return NextResponse.json({ explanation, cached: false });
  } catch (error) {
    console.error('Explanation error:', error);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
