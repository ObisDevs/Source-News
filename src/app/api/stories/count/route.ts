import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { count } = await supabaseAdmin
      .from('stories_raw')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    return NextResponse.json({ count: 0, error: String(error) }, { status: 500 });
  }
}
