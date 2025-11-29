import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAICompletion } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check subscription and usage
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: subscription } = await adminSupabase
      .from('user_subscriptions')
      .select('*, subscription_tiers(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const tier = subscription?.subscription_tiers || { 
      name: 'Free', 
      features: { ai_explanations: false },
      limits: { ai_explanations_per_day: 0 }
    };

    if (!tier.features.ai_explanations) {
      return NextResponse.json({ 
        error: 'Upgrade required',
        message: 'AI explanations require a paid subscription'
      }, { status: 403 });
    }

    // Check daily usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await adminSupabase
      .from('user_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('feature', 'ai_explanation')
      .eq('date', today)
      .single();

    const dailyLimit = tier.limits.ai_explanations_per_day;
    if (dailyLimit > 0 && usage && usage.count >= dailyLimit) {
      return NextResponse.json({ 
        error: 'Limit reached',
        message: `Daily limit of ${dailyLimit} explanations reached`
      }, { status: 429 });
    }

    // Fetch story
    const { data: story } = await adminSupabase
      .from('stories_raw')
      .select('*, sources(name)')
      .eq('id', id)
      .single();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Generate explanation
    const prompt = `Explain this news story in simple terms for a general audience. Focus on:
1. What happened
2. Why it matters
3. Key context
4. Potential implications

Story: ${story.title}
${story.metadata?.description || ''}

Provide a clear, unbiased explanation in 3-4 paragraphs.`;

    const explanation = await generateAICompletion(prompt, { maxTokens: 500 });

    // Update usage
    await adminSupabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_feature: 'ai_explanation',
      p_date: today
    });

    return NextResponse.json({ 
      explanation,
      usage: {
        used: (usage?.count || 0) + 1,
        limit: dailyLimit
      }
    });

  } catch (error) {
    console.error('AI explanation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate explanation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
