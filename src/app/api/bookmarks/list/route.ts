import { NextResponse } from 'next/server';
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
      return NextResponse.json({ bookmarks: [] });
    }

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('id, story_id, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Bookmarks fetch error:', error);
      return NextResponse.json({ bookmarks: [] });
    }

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({ bookmarks: [] });
    }

    const storyIds = bookmarks.map(b => b.story_id);
    const { data: stories } = await supabase
      .from('stories_raw')
      .select('id, title, url, published_at, metadata')
      .in('id', storyIds);

    const storiesMap = new Map(stories?.map(s => [s.id, s]) || []);
    const enrichedBookmarks = bookmarks.map(b => ({
      ...b,
      stories_raw: storiesMap.get(b.story_id)
    }));

    return NextResponse.json({ bookmarks: enrichedBookmarks });
  } catch (error) {
    console.error('Bookmarks API error:', error);
    return NextResponse.json({ bookmarks: [] });
  }
}
