import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('stories_raw')
      .select(`
        id,
        title,
        content,
        url,
        published_at,
        created_at,
        metadata,
        sources (
          name,
          bias_lean
        )
      `)
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ stories: data || [] });
  } catch (error) {
    return NextResponse.json({ stories: [], error: String(error) }, { status: 500 });
  }
}
