import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ stories: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.id) {
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabaseAdmin.rpc('increment_user_usage', {
        p_user_id: user.id,
        p_date: today,
        p_field: 'searches_performed'
      });
    } catch (e) {
      console.log('Usage tracking failed:', e);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('stories_raw')
    .select(`
      id,
      title,
      content,
      url,
      published_at,
      metadata,
      sources (name, bias_lean)
    `)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Search error:', error);
    return NextResponse.json({ stories: [], error: error.message });
  }

  return NextResponse.json({ stories: data || [] });
}
