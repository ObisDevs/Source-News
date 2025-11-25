import { NextRequest, NextResponse } from 'next/server';
import { ingestRSSFeeds } from '@/lib/workers/rss-ingest';
import { ingestNewsAPI } from '@/lib/workers/newsapi-ingest';
import { ingestTwitterTrends } from '@/lib/workers/twitter-ingest';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rssResults, newsApiResults, twitterResults] = await Promise.all([
      ingestRSSFeeds(),
      ingestNewsAPI(),
      ingestTwitterTrends(),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        rss: rssResults,
        newsapi: newsApiResults,
        twitter: twitterResults,
        total: {
          ingested: rssResults.ingested + newsApiResults.ingested + twitterResults.ingested,
          skipped: rssResults.skipped + newsApiResults.skipped + twitterResults.skipped,
          errors: rssResults.errors + newsApiResults.errors + twitterResults.errors,
        },
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
    const [rssResults, newsApiResults, twitterResults] = await Promise.all([
      ingestRSSFeeds(),
      ingestNewsAPI(),
      ingestTwitterTrends(),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        rss: rssResults,
        newsapi: newsApiResults,
        twitter: twitterResults,
        total: {
          ingested: rssResults.ingested + newsApiResults.ingested + twitterResults.ingested,
          skipped: rssResults.skipped + newsApiResults.skipped + twitterResults.skipped,
          errors: rssResults.errors + newsApiResults.errors + twitterResults.errors,
        },
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
