'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

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
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </p>
          </div>

          {/* Bookmarks Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Bookmarks</h2>
            <p className="text-2xl font-bold">{bookmarks.length}</p>
            <a href="/dashboard/bookmarks" className="text-blue-600 hover:underline text-sm">
              View all →
            </a>
          </div>

          {/* Reading History Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Reading History</h2>
            <p className="text-2xl font-bold">0</p>
            <a href="/dashboard/history" className="text-blue-600 hover:underline text-sm">
              View all →
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Browse Stories
            </a>
            <a href="/dashboard/settings" className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
