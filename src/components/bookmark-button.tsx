'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth/auth-provider';
import { analytics } from '@/lib/analytics/tracker';

export function BookmarkButton({ storyId }: { storyId: string }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      checkBookmark();
    }
  }, [user]);

  const checkBookmark = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/bookmarks?storyId=${storyId}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarked(data.bookmarked);
      }
    } catch (error) {
      // Silently fail if not authenticated
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookmarks', {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
        credentials: 'include',
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
        analytics.bookmark(storyId, bookmarked ? 'remove' : 'add');
      } else {
        console.error('Bookmark failed:', response.status);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !user) return null;

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this story'}
    >
      <svg className={`w-5 h-5 ${bookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`} fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}
