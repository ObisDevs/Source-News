import { NextRequest, NextResponse } from 'next/server';
import { generateBatchSummaries } from '@/lib/ai/summary-generator';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await generateBatchSummaries(20);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
