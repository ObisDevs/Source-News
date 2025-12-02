import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { story_url } = await request.json();

    const { data } = await supabaseAdmin
      .from('posted_tweets')
      .select('id, posted_at')
      .eq('story_url', story_url)
      .single();

    return NextResponse.json({ 
      already_posted: !!data,
      posted_at: data?.posted_at || null
    });
  } catch (error: any) {
    return NextResponse.json({ 
      already_posted: false,
      error: error.message 
    });
  }
}
