import { NextRequest, NextResponse } from 'next/server';
import { ingestRSSFeeds } from '@/lib/workers/rss-ingest';
import { ingestNewsAPI } from '@/lib/workers/newsapi-ingest';
import { ingestTwitterTrends } from '@/lib/workers/twitter-ingest';
import { batchProcessEmbeddings } from '@/lib/embeddings/generator';
import { generateBatchSummaries } from '@/lib/ai/summary-generator';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractEntities } from '@/lib/ai/knowledge-graph';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { ingested: 0, embeddings: 0, summaries: 0, entities: 0 };

  try {
    console.log('🚀 Starting full orchestration...');

    // Step 1: Ingest news from all sources
    console.log('\n📥 Step 1: Ingesting news...');
    const [rssResults, newsApiResults, twitterResults] = await Promise.all([
      ingestRSSFeeds(),
      ingestNewsAPI(),
      ingestTwitterTrends(),
    ]);
    results.ingested = rssResults.ingested + newsApiResults.ingested + twitterResults.ingested;
    console.log(`✓ Ingestion complete: ${results.ingested} new stories`);

    // Step 2: Generate embeddings for new stories
    console.log('\n🧠 Step 2: Generating embeddings...');
    results.embeddings = await batchProcessEmbeddings(20);
    console.log(`✓ Embeddings complete: ${results.embeddings} processed`);

    // Step 3: Generate AI summaries
    console.log('\n📝 Step 3: Generating AI summaries...');
    await generateBatchSummaries(20);
    const { count: summaryCount } = await supabaseAdmin
      .from('story_summaries')
      .select('*', { count: 'exact', head: true });
    results.summaries = summaryCount || 0;
    console.log(`✓ Summaries complete: ${results.summaries} total in database`);

    // Step 4: Extract entities for knowledge graph
    console.log('\n🏷️ Step 4: Extracting entities...');
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

    console.log('\n✅ Full orchestration complete');
    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('\n❌ Orchestration failed:', error);
    return NextResponse.json({ 
      error: 'Orchestration failed', 
      details: error.message,
      results 
    }, { status: 500 });
  }
}
