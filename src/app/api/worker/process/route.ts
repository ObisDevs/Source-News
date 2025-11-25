import { NextRequest, NextResponse } from 'next/server';
import { batchProcessEmbeddings } from '@/lib/embeddings/generator';
import { batchProcessClustering } from '@/lib/clustering/engine';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const embeddingsProcessed = await batchProcessEmbeddings(20);
    const storiesClustered = await batchProcessClustering(20);

    return NextResponse.json({
      success: true,
      results: {
        embeddingsProcessed,
        storiesClustered,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const embeddingsProcessed = await batchProcessEmbeddings(20);
    const storiesClustered = await batchProcessClustering(20);

    return NextResponse.json({
      success: true,
      results: {
        embeddingsProcessed,
        storiesClustered,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
