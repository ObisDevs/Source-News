import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from('stories_raw')
    .select('title, content, metadata, sources(name)')
    .eq('url', url)
    .single();

  let fullContent = data?.content || '';
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();
    
    const articleSelectors = ['article', '[role="article"]', '.article-content', '.post-content', 'main'];
    let articleText = '';
    
    for (const selector of articleSelectors) {
      const element = $(selector).first();
      if (element.length) {
        articleText = element.find('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
        if (articleText.length > 200) break;
      }
    }
    
    if (articleText.length > fullContent.length) {
      fullContent = articleText;
    }
  } catch (e) {}

  const sources = data?.sources as any;

  return NextResponse.json({
    title: data?.title,
    content: fullContent,
    image_url: data?.metadata?.image || data?.metadata?.og_image,
    source_name: sources?.name
  });
}
