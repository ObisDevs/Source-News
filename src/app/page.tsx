import { supabaseAdmin } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { NewsCarousel } from '@/components/news-carousel';
import { AIHeadlineSummary } from '@/components/ai-headline-summary';
import { StoryImage } from '@/components/story-image';
import { LoadMoreButton } from '@/components/load-more-button';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getStories(category?: string, date?: string) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    let query = supabaseAdmin
      .from('stories_raw')
      .select(`
        id,
        title,
        content,
        url,
        published_at,
        ingested_at,
        metadata,
        category,
        sources (name, bias_lean)
      `)
      .gte('published_at', startOfDay.toISOString())
      .lte('published_at', endOfDay.toISOString())
      .order('published_at', { ascending: false })
      .limit(100);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Query error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    return [];
  }
}

async function getFeaturedStories() {
  try {
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from('sources')
      .select('id, name')
      .limit(10);

    if (sourcesError || !sources) {
      console.error('Sources error:', sourcesError);
      return [];
    }

    const storiesPromises = sources.map(source =>
      supabaseAdmin
        .from('stories_raw')
        .select(`
          id,
          title,
          url,
          published_at,
          metadata,
          source_id,
          sources (name)
        `)
        .eq('source_id', source.id)
        .order('published_at', { ascending: false })
        .limit(2)
    );

    const results = await Promise.all(storiesPromises);
    const allStories = results.flatMap(r => r.data || []);

    const interleaved: any[] = [];
    const sourceGroups = new Map<string, any[]>();
    
    allStories.forEach(story => {
      const sourceId = story.source_id;
      if (!sourceGroups.has(sourceId)) {
        sourceGroups.set(sourceId, []);
      }
      sourceGroups.get(sourceId)!.push(story);
    });

    const maxPerSource = 2;
    for (let i = 0; i < maxPerSource; i++) {
      sourceGroups.forEach(stories => {
        if (stories[i]) {
          interleaved.push(stories[i]);
        }
      });
    }

    return interleaved.slice(0, 10);
  } catch (error) {
    console.error('Failed to fetch featured stories:', error);
    return [];
  }
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string; date?: string }> }) {
  const { category, date } = await searchParams;
  const [stories, featuredStories] = await Promise.all([
    getStories(category, date),
    getFeaturedStories()
  ]);
  
  const displayDate = date ? new Date(date) : new Date();
  const prevDate = new Date(displayDate);
  prevDate.setDate(prevDate.getDate() - 1);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {featuredStories.length > 0 && <NewsCarousel stories={featuredStories} />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {category ? `${category} News` : 'Latest Nigerian News'}
            </h1>
            {!date && (
              <Link
                href={`/?date=${prevDate.toISOString().split('T')[0]}${category ? `&category=${category}` : ''}`}
                className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                History
              </Link>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {date ? displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'} • {stories.length} stories
          </p>
          {date && (
            <div className="flex gap-2 mt-2">
              <Link
                href={`/${category ? `?category=${category}` : ''}`}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Today
              </Link>
              <Link
                href={`/?date=${prevDate.toISOString().split('T')[0]}${category ? `&category=${category}` : ''}`}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Previous Day
              </Link>
            </div>
          )}
        </div>
        
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {stories.slice(0, 6).map((story: any) => {
            const imageUrl = story.metadata?.image || story.metadata?.og_image;
            return (
              <div key={story.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md">
                <Link href={`/story/${story.id}`} className="block">
                  <StoryImage src={imageUrl} alt={story.title} />
                  
                  <div className="p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-semibold mb-3 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {story.title}
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{story.sources?.name}</span>
                      {story.published_at && (
                        <span className="text-gray-500 dark:text-gray-500">{formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                </Link>
                
                <div className="px-4 sm:px-5 pb-4 flex items-center justify-between">
                  {story.sources?.bias_lean && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                      {story.sources.bias_lean}
                    </span>
                  )}
                  <a 
                    href={story.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                    title="View original source"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Source
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <AIHeadlineSummary stories={stories} />

        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {stories.slice(6).map((story: any) => {
            const imageUrl = story.metadata?.image || story.metadata?.og_image;
            return (
              <div key={story.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md">
                <Link href={`/story/${story.id}`} className="block">
                  <StoryImage src={imageUrl} alt={story.title} />
                  
                  <div className="p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-semibold mb-3 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {story.title}
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{story.sources?.name}</span>
                      {story.published_at && (
                        <span className="text-gray-500 dark:text-gray-500">{formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                </Link>
                
                <div className="px-4 sm:px-5 pb-4 flex items-center justify-between">
                  {story.sources?.bias_lean && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                      {story.sources.bias_lean}
                    </span>
                  )}
                  <a 
                    href={story.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                    title="View original source"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Source
                  </a>
                </div>
              </div>
            );
          })}
          
          <LoadMoreButton category={category} initialStories={stories} />
        </div>
        
        {stories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No stories for this date.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
