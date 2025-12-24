import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { event_type, session_id, event_data, device_info, page_url, referrer } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ipHash = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

    await supabaseAdmin.from('analytics_events').insert({
      event_type,
      user_id: user?.id || null,
      session_id,
      story_id: event_data?.story_id || null,
      event_data,
      device_info,
      page_url,
      referrer,
      ip_hash: ipHash,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
