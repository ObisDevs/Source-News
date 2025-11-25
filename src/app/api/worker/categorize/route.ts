import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

function categorizeByKeywords(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  
  const keywords = {
    Politics: ['government', 'election', 'president', 'senate', 'politics', 'minister', 'governor', 'policy', 'law', 'parliament', 'tinubu', 'buhari', 'pdp', 'apc'],
    Business: ['business', 'economy', 'market', 'company', 'trade', 'investment', 'bank', 'finance', 'stock', 'naira', 'dollar', 'cbn', 'inflation'],
    Sports: ['football', 'sport', 'match', 'player', 'team', 'league', 'coach', 'goal', 'tournament', 'athlete', 'super eagles', 'afcon'],
    Technology: ['technology', 'tech', 'digital', 'software', 'app', 'internet', 'startup', 'innovation', 'ai', 'crypto', 'blockchain', 'fintech'],
    Entertainment: ['entertainment', 'music', 'movie', 'celebrity', 'film', 'artist', 'nollywood', 'concert', 'album', 'actor', 'actress', 'wizkid', 'davido'],
    Health: ['health', 'medical', 'hospital', 'doctor', 'disease', 'patient', 'treatment', 'vaccine', 'covid', 'medicine', 'lassa', 'cholera']
  };

  let maxScore = 0;
  let category = 'General';

  for (const [cat, words] of Object.entries(keywords)) {
    const score = words.filter(word => text.includes(word)).length;
    if (score > maxScore) {
      maxScore = score;
      category = cat;
    }
  }

  return category;
}

export async function GET() {
  try {
    const { data: stories } = await supabaseAdmin
      .from('stories_raw')
      .select('id, title, content, category')
      .or('category.is.null,category.eq.General')
      .limit(200);

    if (!stories || stories.length === 0) {
      return NextResponse.json({ message: 'No stories to categorize', updated: 0 });
    }

    let updated = 0;
    for (const story of stories) {
      const category = categorizeByKeywords(story.title, story.content || '');
      
      await supabaseAdmin
        .from('stories_raw')
        .update({ category })
        .eq('id', story.id);
      
      updated++;
    }

    return NextResponse.json({ message: 'Stories categorized', updated });
  } catch (error) {
    console.error('Categorization error:', error);
    return NextResponse.json({ error: 'Failed to categorize' }, { status: 500 });
  }
}
