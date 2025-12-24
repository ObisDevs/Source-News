'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function UserAnalytics() {
  const [stats, setStats] = useState({ searches: 0, aiChats: 0, bookmarks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const { count: bookmarkCount } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: aiChatCount } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setStats({
      searches: usage?.searches_performed || 0,
      aiChats: aiChatCount || 0,
      bookmarks: bookmarkCount || 0,
    });
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
        <div className="text-2xl mb-1">🔍</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Searches</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.searches}</div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
        <div className="text-2xl mb-1">🤖</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">AI Chats</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.aiChats}</div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
        <div className="text-2xl mb-1">🔖</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Bookmarks</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.bookmarks}</div>
      </div>
    </div>
  );
}
