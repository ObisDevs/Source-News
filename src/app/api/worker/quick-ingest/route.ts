import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: latestStory } = await supabase
      .from('stories')
      .select('published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    const since = latestStory?.published_at || new Date(Date.now() - 3600000).toISOString();

    const newsApiKey = process.env.NEWS_API_KEY;
    if (!newsApiKey) {
      return NextResponse.json({ error: 'NEWS_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=Nigeria&language=en&sortBy=publishedAt&pageSize=20&apiKey=${newsApiKey}&from=${since}`
    );

    if (!response.ok) {
      throw new Error('NewsAPI request failed');
    }

    const data = await response.json();
    const articles = data.articles || [];

    let newCount = 0;

    for (const article of articles) {
      if (!article.title || !article.url) continue;

      const { data: existing } = await supabase
        .from('stories')
        .select('id')
        .eq('url', article.url)
        .single();

      if (existing) continue;

      const { error } = await supabase.from('stories').insert({
        title: article.title,
        url: article.url,
        published_at: article.publishedAt || new Date().toISOString(),
        source_id: null,
        category: 'General',
        metadata: {
          description: article.description,
          image: article.urlToImage,
          author: article.author,
          source_name: article.source?.name,
        },
      });

      if (!error) newCount++;
    }

    return NextResponse.json({ 
      success: true, 
      newStories: newCount,
      message: newCount > 0 ? `Added ${newCount} new stories` : 'No new stories found'
    });

  } catch (error) {
    console.error('Quick ingest error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch latest news',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
