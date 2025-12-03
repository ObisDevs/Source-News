import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'All';
    const sort = searchParams.get('sort') || 'date';
    const limit = parseInt(searchParams.get('limit') || '50');

    let dbQuery = supabaseAdmin
      .from('stories_raw')
      .select(`
        id,
        title,
        content,
        url,
        published_at,
        created_at,
        metadata,
        category,
        sources (
          name,
          bias_lean
        )
      `);

    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    // Category filter removed - column may not exist in stories_raw

    if (sort === 'date') {
      dbQuery = dbQuery.order('published_at', { ascending: false });
    }

    dbQuery = dbQuery.limit(limit);

    const { data, error } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({ stories: data || [] });
  } catch (error) {
    console.error('Stories API error:', error);
    return NextResponse.json({ stories: [] });
  }
}
