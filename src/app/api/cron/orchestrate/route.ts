import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://source-news.vercel.app';
  const results = { ingestion: null, summaries: null, entities: null };

  try {
    console.log('🚀 Starting orchestration...');

    // Step 1: Ingestion
    console.log('📥 Running ingestion...');
    const ingestRes = await fetch(`${baseUrl}/api/cron/ingest`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
    });
    results.ingestion = await ingestRes.json();
    console.log('✓ Ingestion complete');

    // Wait 2 minutes for ingestion to settle
    await new Promise(r => setTimeout(r, 120000));

    // Step 2: Generate Summaries
    console.log('📝 Generating summaries...');
    const summariesRes = await fetch(`${baseUrl}/api/cron/generate-summaries`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
    });
    results.summaries = await summariesRes.json();
    console.log('✓ Summaries complete');

    // Step 3: Extract Entities
    console.log('🏷️ Extracting entities...');
    const entitiesRes = await fetch(`${baseUrl}/api/cron/extract-entities`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
    });
    results.entities = await entitiesRes.json();
    console.log('✓ Entities complete');

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
