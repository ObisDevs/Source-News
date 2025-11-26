'use client';

import { useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { StoryImage } from './story-image';

interface LoadMoreButtonProps {
  category?: string;
  initialStories: any[];
}

export function LoadMoreButton({ category, initialStories }: LoadMoreButtonProps) {
  const [stories, setStories] = useState(initialStories);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      const lastStory = stories[stories.length - 1];

      // Determine a safe pivot date to page older stories from.
      // Prefer `published_at`, fall back to common alternatives, otherwise use now.
      let pivotDate = new Date();
      if (lastStory) {
        const fallbackTimestamp =
          lastStory.published_at ?? lastStory.inserted_at ?? lastStory.created_at ?? lastStory?.metadata?.published_at ?? null;

        if (fallbackTimestamp) {
          const parsed = new Date(fallbackTimestamp);
          if (!isNaN(parsed.getTime())) pivotDate = parsed;
        }
      }

      // Page one day earlier than the pivot date
      pivotDate.setDate(pivotDate.getDate() - 1);

      const startOfDay = new Date(pivotDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(pivotDate.setHours(23, 59, 59, 999));
      
      let query = supabaseAdmin
        .from('stories_raw')
        .select(`
          id,
          title,
          content,
          url,
          published_at,
          metadata,
          category,
          sources (name, bias_lean)
        `)
        .gte('published_at', startOfDay.toISOString())
        .lte('published_at', endOfDay.toISOString())
        .order('published_at', { ascending: false })
        .limit(20);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data } = await query;
      
      if (data && data.length > 0) {
        setStories(prev => [...prev, ...data]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more stories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {stories.slice(initialStories.length).map((story: any) => {
        const imageUrl = story.metadata?.image || story.metadata?.og_image;
        return (
          <div key={story.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md animate-fade-in-up">
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
      
      {hasMore && (
        <div className="col-span-full flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:scale-100"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </>
  );
}