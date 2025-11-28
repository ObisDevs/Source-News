import { NextRequest, NextResponse } from 'next/server';
import { getUsage } from '@/lib/usage/tracker';
import { TIER_LIMITS } from '@/lib/types/subscription';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'anonymous';
    const tier = (req.nextUrl.searchParams.get('tier') || 'free') as 'free' | 'premium';

    const usage = await getUsage(userId);
    const limits = TIER_LIMITS[tier];

    return NextResponse.json({
      usage,
      limits,
      remaining: {
        aiExplanations: Math.max(0, limits.aiExplanationsPerDay - usage.aiExplanations),
        aiSummaries: Math.max(0, limits.aiSummariesPerDay - usage.aiSummaries),
      },
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
