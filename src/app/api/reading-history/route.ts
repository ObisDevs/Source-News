import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ history: [] });
    }

    const { data: history } = await supabase
      .from('reading_history')
      .select('id, story_id, viewed_at, read_time')
      .eq('user_id', session.user.id)
      .order('viewed_at', { ascending: false })
      .limit(50);

    if (!history || history.length === 0) {
      return NextResponse.json({ history: [] });
    }

    const storyIds = history.map(h => h.story_id);
    const { data: stories } = await supabase
      .from('stories_raw')
      .select('id, title, url, published_at, metadata')
      .in('id', storyIds);

    const storiesMap = new Map(stories?.map(s => [s.id, s]) || []);
    const enrichedHistory = history.map(h => ({
      ...h,
      stories_raw: storiesMap.get(h.story_id)
    }));

    return NextResponse.json({ history: enrichedHistory });
  } catch (error) {
    console.error('Reading history API error:', error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { storyId, readTime } = await request.json();

  await supabase
    .from('reading_history')
    .upsert({ 
      user_id: session.user.id, 
      story_id: storyId, 
      viewed_at: new Date().toISOString(),
      read_time: readTime || 0
    }, { onConflict: 'user_id,story_id' });

  return NextResponse.json({ success: true });
}
