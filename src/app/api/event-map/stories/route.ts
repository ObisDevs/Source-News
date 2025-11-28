import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('stories_raw')
        .select('id, title, category, published_at, metadata, position_3d')
        .order('published_at', { ascending: false })
        .limit(200);

      if (!error && data) {
        return NextResponse.json({ stories: data });
      }
    }
  } catch (e) {
    console.warn('Supabase fetch failed for event-map stories:', e);
  }

  // Fallback: return mock sample stories so the UI still works in dev without credentials
  const now = new Date().toISOString();
  const sample = Array.from({ length: 16 }).map((_, i) => ({
    id: `sample-${i}`,
    title: `Sample story ${i + 1}`,
    category: ['Politics', 'Business', 'Sports', 'Technology'][i % 4],
    published_at: now,
    metadata: { source: 'Sample' },
    position_3d: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40, z: (Math.random() - 0.5) * 40 },
  }));

  return NextResponse.json({ stories: sample });
}
