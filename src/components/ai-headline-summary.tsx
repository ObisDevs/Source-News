'use client';

import { useEffect, useState } from 'react';

interface Story {
  id: string;
  title: string;
  content: string;
}

export function AIHeadlineSummary({ stories }: { stories: Story[] }) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);

  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async (storyIds?: string[]) => {
    if (stories.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const payload = storyIds 
        ? { storyIds } 
        : { stories: stories.slice(0, 2) };
      
      const response = await fetch('/api/ai/headline-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        if (storyIds) setSelectedStories(storyIds);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (storyId: string) => {
    const newSelection = selectedStories.includes(storyId)
      ? selectedStories.filter(id => id !== storyId)
      : [...selectedStories, storyId].slice(0, 3);
    
    if (newSelection.length > 0) {
      generateSummary(newSelection);
    }
  };

  if (error) return null;

  return (
    <div className="my-16 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI News Summary</h3>
        </div>
        
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm">Generating summary...</span>
            </div>
          </div>
        ) : summary ? (
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-8">
            {summary}
          </p>
        ) : null}

        {/* Story Selector */}
        <div className="mt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select stories to summarize (up to 3):</p>
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                    selectedStories.includes(story.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-dotted border-gray-300 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <span className="max-w-xs truncate">{story.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
