'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StoryCard } from './story-card';

export function PersonalizedFeed() {
  const [view, setView] = useState<'all' | 'foryou'>('all');
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (view === 'foryou') {
      fetchPersonalizedStories();
    }
  }, [view]);

  const fetchPersonalizedStories = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setView('all');
      setLoading(false);
      return;
    }

    // Get user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('preferred_categories, preferred_sources')
      .eq('user_id', user.id)
      .single();

    // Get reading history
    const { data: history } = await supabase
      .from('reading_history')
      .select('story_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch personalized stories based on preferences
    let query = supabase
      .from('story_clusters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (prefs?.preferred_categories?.length > 0) {
      query = query.in('category', prefs.preferred_categories);
    }

    const { data } = await query;
    setStories(data || []);
    setLoading(false);
  };

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All News
        </button>
        <button
          onClick={() => setView('foryou')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'foryou'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          For You
        </button>
      </div>

      {view === 'foryou' && loading && (
        <div className="text-center py-8 text-gray-500">Loading personalized feed...</div>
      )}

      {view === 'foryou' && !loading && stories.length > 0 && (
        <div className="grid gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} cluster={story} />
          ))}
        </div>
      )}
    </div>
  );
}
