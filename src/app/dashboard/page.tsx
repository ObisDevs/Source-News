'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historySortBy, setHistorySortBy] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchBookmarks();
      fetchHistory();
    }
  }, [user, loading, router]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks/list');
      const data = await response.json();
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/reading-history');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Profile</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </p>
          </div>

          {/* Bookmarks Card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Bookmarks</h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {loadingBookmarks ? '...' : bookmarks.length}
            </p>
            {bookmarks.length > 0 && (
              <a href="#bookmarks" className="text-blue-600 hover:underline text-sm">
                View below →
              </a>
            )}
          </div>

          {/* Reading History Card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reading History</h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {loadingHistory ? '...' : history.length}
            </p>
            {history.length > 0 && (
              <a href="#history" className="text-blue-600 hover:underline text-sm">
                View below →
              </a>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="flex gap-4">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Browse Stories
            </a>
            <a href="/dashboard/settings" className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
              Settings
            </a>
          </div>
        </div>

        {/* Bookmarks List */}
        {bookmarks.length > 0 && (
          <div id="bookmarks" className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your Bookmarks</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {bookmarks.map((bookmark: any) => {
                const story = bookmark.stories_raw;
                const imageUrl = story?.metadata?.image_url || story?.metadata?.og_image;
                return (
                  <a 
                    key={bookmark.id}
                    href={`/story/${bookmark.story_id}`}
                    className="flex gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="" 
                        className="w-24 h-24 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2 mb-1 text-gray-900 dark:text-white">
                        {story?.title || 'Untitled Story'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Saved {new Date(bookmark.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Reading History */}
        {history.length > 0 && (
          <div id="history" className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reading History</h2>
              <select 
                value={historySortBy}
                onChange={(e) => setHistorySortBy(e.target.value as 'recent' | 'oldest')}
                className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[...history].sort((a: any, b: any) => {
                const dateA = new Date(a.viewed_at).getTime();
                const dateB = new Date(b.viewed_at).getTime();
                return historySortBy === 'recent' ? dateB - dateA : dateA - dateB;
              }).map((item: any) => {
                const story = item.stories_raw;
                const imageUrl = story?.metadata?.image_url || story?.metadata?.og_image;
                return (
                  <a 
                    key={item.id}
                    href={`/story/${item.story_id}`}
                    className="flex gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="" 
                        className="w-24 h-24 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2 mb-1 text-gray-900 dark:text-white">
                        {story?.title || 'Untitled Story'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Read {new Date(item.viewed_at).toLocaleDateString()}
                        {item.read_time > 0 && ` • ${Math.floor(item.read_time / 60)}m ${item.read_time % 60}s`}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
