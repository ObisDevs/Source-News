import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL('https://premiumtimesng.com/feed');
    
    const items = feed.items.slice(0, 3).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
    }));

    return NextResponse.json({
      success: true,
      feedTitle: feed.title,
      itemCount: feed.items.length,
      sampleItems: items,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
