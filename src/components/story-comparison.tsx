'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Story {
  id: string;
  title: string;
  content: string;
  url: string;
  sources: {
    name: string;
    bias_lean: string;
    credibility_score: number;
  };
}

export function StoryComparison({ clusterId }: { clusterId: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStories = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('stories_raw')
      .select('id, title, content, url, sources(name, bias_lean, credibility_score)')
      .eq('cluster_id', clusterId)
      .limit(4);

    setStories(data || []);
    setLoading(false);
  };

  const biasColors: Record<string, string> = {
    left: 'border-blue-500',
    centre: 'border-gray-500',
    right: 'border-red-500',
    government: 'border-yellow-500',
    independent: 'border-green-500',
  };

  if (stories.length < 2 && !showComparison) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compare Coverage</h3>
        <button
          onClick={() => {
            setShowComparison(!showComparison);
            if (!showComparison && stories.length === 0) fetchStories();
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          {showComparison ? 'Hide' : 'Compare Sources'}
        </button>
      </div>

      {showComparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-8 text-gray-500">Loading...</div>
          ) : (
            stories.map((story) => (
              <div
                key={story.id}
                className={`border-l-4 ${biasColors[story.sources?.bias_lean] || 'border-gray-500'} bg-gray-50 dark:bg-gray-800 rounded-lg p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {story.sources?.name}
                  </span>
                  <span className="text-xs px-2 py-1 bg-white dark:bg-gray-900 rounded">
                    {story.sources?.bias_lean}
                  </span>
                </div>
                <Link
                  href={`/story/${story.id}`}
                  className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-3 mb-2 block"
                >
                  {story.title}
                </Link>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                  {story.content?.substring(0, 150)}...
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Credibility: {story.sources?.credibility_score}/100
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
