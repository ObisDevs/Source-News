'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      events,
      storyViews,
      searches,
      aiChats,
      bookmarks,
      reactions,
      users,
      readingHistory,
      socialSentiment,
      comments
    ] = await Promise.all([
      supabaseAdmin.from('analytics_events').select('*').gte('created_at', since.toISOString()),
      supabaseAdmin.from('reading_history').select('*, stories_raw(category, sources(name))').gte('viewed_at', since.toISOString()),
      supabaseAdmin.from('analytics_events').select('*').eq('event_type', 'search').gte('created_at', since.toISOString()),
      supabaseAdmin.from('ai_interactions').select('*').gte('created_at', since.toISOString()),
      supabaseAdmin.from('bookmarks').select('*, stories_raw(category)').gte('created_at', since.toISOString()),
      supabaseAdmin.from('story_reactions').select('*, stories_raw(category)').gte('created_at', since.toISOString()),
      supabaseAdmin.from('users').select('id, plan_tier, created_at').gte('created_at', since.toISOString()),
      supabaseAdmin.from('reading_history').select('user_id, viewed_at').gte('viewed_at', since.toISOString()),
      supabaseAdmin.from('social_sentiment').select('*').gte('analyzed_at', since.toISOString()),
      supabaseAdmin.from('comments').select('*, stories_raw(category)').gte('created_at', since.toISOString())
    ]);

    const analytics = processAnalytics({
      events: events.data || [],
      storyViews: storyViews.data || [],
      searches: searches.data || [],
      aiChats: aiChats.data || [],
      bookmarks: bookmarks.data || [],
      reactions: reactions.data || [],
      users: users.data || [],
      readingHistory: readingHistory.data || [],
      socialSentiment: socialSentiment.data || [],
      comments: comments.data || []
    });

    setStats(analytics);
    setLoading(false);
  };

  const processAnalytics = (data: any) => {
    const uniqueSessions = new Set(data.events.map((e: any) => e.session_id)).size;
    const uniqueUsers = new Set(data.events.filter((e: any) => e.user_id).map((e: any) => e.user_id)).size;
    
    const categoryEngagement: any = {};
    data.storyViews.forEach((v: any) => {
      const cat = v.stories_raw?.category || 'General';
      categoryEngagement[cat] = (categoryEngagement[cat] || 0) + 1;
    });

    const sourceEngagement: any = {};
    data.storyViews.forEach((v: any) => {
      const source = v.stories_raw?.sources?.name;
      if (source) sourceEngagement[source] = (sourceEngagement[source] || 0) + 1;
    });

    const biasDistribution: any = {};
    data.reactions.forEach((r: any) => {
      biasDistribution[r.reaction_type] = (biasDistribution[r.reaction_type] || 0) + 1;
    });

    const searchQueries = data.searches.map((s: any) => s.event_data?.query).filter(Boolean);
    
    const aiPersonalities: any = {};
    data.aiChats.forEach((c: any) => {
      const p = c.personality || 'professional';
      aiPersonalities[p] = (aiPersonalities[p] || 0) + 1;
    });

    const usersByTier = data.users.reduce((acc: any, u: any) => {
      acc[u.plan_tier] = (acc[u.plan_tier] || 0) + 1;
      return acc;
    }, {});

    const avgSessionDuration = calculateAvgSessionDuration(data.events);
    const bounceRate = calculateBounceRate(data.events);

    return {
      totalEvents: data.events.length,
      uniqueSessions,
      uniqueUsers,
      totalStoryViews: data.storyViews.length,
      totalSearches: data.searches.length,
      totalAIChats: data.aiChats.length,
      totalBookmarks: data.bookmarks.length,
      totalReactions: data.reactions.length,
      totalComments: data.comments.length,
      newUsers: data.users.length,
      categoryEngagement,
      sourceEngagement,
      biasDistribution,
      searchQueries,
      aiPersonalities,
      usersByTier,
      avgSessionDuration,
      bounceRate,
      socialSentimentCount: data.socialSentiment.length
    };
  };

  const calculateAvgSessionDuration = (events: any[]) => {
    const sessions: any = {};
    events.forEach(e => {
      if (!sessions[e.session_id]) sessions[e.session_id] = [];
      sessions[e.session_id].push(new Date(e.created_at).getTime());
    });
    
    const durations = Object.values(sessions).map((times: any) => {
      if (times.length < 2) return 0;
      return Math.max(...times) - Math.min(...times);
    });
    
    const avg = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
    return Math.round(avg / 1000 / 60);
  };

  const calculateBounceRate = (events: any[]) => {
    const sessions: any = {};
    events.forEach(e => {
      sessions[e.session_id] = (sessions[e.session_id] || 0) + 1;
    });
    
    const singlePageSessions = Object.values(sessions).filter((count: any) => count === 1).length;
    return ((singlePageSessions / Object.keys(sessions).length) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 block">
              ← Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Events" value={stats.totalEvents.toLocaleString()} color="blue" />
          <StatCard title="Unique Sessions" value={stats.uniqueSessions.toLocaleString()} color="green" />
          <StatCard title="Unique Users" value={stats.uniqueUsers.toLocaleString()} color="purple" />
          <StatCard title="Story Views" value={stats.totalStoryViews.toLocaleString()} color="red" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Searches" value={stats.totalSearches.toLocaleString()} />
          <StatCard title="AI Chats" value={stats.totalAIChats.toLocaleString()} />
          <StatCard title="Bookmarks" value={stats.totalBookmarks.toLocaleString()} />
          <StatCard title="Reactions" value={stats.totalReactions.toLocaleString()} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Avg Session" value={`${stats.avgSessionDuration}m`} />
          <StatCard title="Bounce Rate" value={`${stats.bounceRate}%`} />
          <StatCard title="New Users" value={stats.newUsers.toLocaleString()} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Category Engagement" data={stats.categoryEngagement} />
          <ChartCard title="Source Performance" data={stats.sourceEngagement} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="User Reactions" data={stats.biasDistribution} />
          <ChartCard title="AI Personalities" data={stats.aiPersonalities} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Users by Tier" data={stats.usersByTier} />
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Top Search Queries</h3>
            <div className="space-y-2">
              {stats.searchQueries.slice(0, 10).map((q: string, i: number) => (
                <div key={i} className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {i + 1}. {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, color }: any) => {
  const colors: any = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div className={`rounded-lg p-6 border-l-4 ${colors[color] || 'border-gray-300 bg-white dark:bg-gray-900'}`}>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
};

const ChartCard = ({ title, data }: any) => {
  const entries = Object.entries(data).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...entries.map((e: any) => e[1]));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="space-y-3">
        {entries.map(([key, value]: any) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">{key}</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{value}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
