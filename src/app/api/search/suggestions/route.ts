import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const { data } = await supabaseAdmin
    .from('stories_raw')
    .select('id, title, metadata')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(5);

  const suggestions = (data || []).map(story => ({
    id: story.id,
    title: story.title,
    image: story.metadata?.image || story.metadata?.og_image || story.metadata?.urlToImage,
  }));

  return NextResponse.json({ suggestions });
}
