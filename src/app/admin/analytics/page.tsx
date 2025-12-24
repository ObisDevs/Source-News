'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const MetricCard = ({ title, value, change, color, icon }: any) => {
  const colors: any = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    pink: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
  };

  return (
    <div className={`rounded-lg p-4 border-l-4 ${colors[color] || 'border-gray-300 bg-white dark:bg-gray-900'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        {change && (
          <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
};

const ChartCard = ({ title, children }: any) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
    {children}
  </div>
);

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedMetric, selectedCategory]);

  const loadAnalytics = async () => {
    setLoading(true);
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
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
      comments,
      stories,
      sources,
      clusters
    ] = await Promise.all([
      supabaseAdmin.from('analytics_events').select('*').gte('created_at', since.toISOString()),
      supabaseAdmin.from('reading_history').select('*, stories_raw(category, sources(name, bias_lean))').gte('viewed_at', since.toISOString()),
      supabaseAdmin.from('analytics_events').select('*').eq('event_type', 'search').gte('created_at', since.toISOString()),
      supabaseAdmin.from('ai_interactions').select('*').gte('created_at', since.toISOString()),
      supabaseAdmin.from('bookmarks').select('*, stories_raw(category, title)').gte('created_at', since.toISOString()),
      supabaseAdmin.from('story_reactions').select('*, stories_raw(category, title)').gte('created_at', since.toISOString()),
      supabaseAdmin.from('users').select('id, plan_tier, created_at, preferences').gte('created_at', since.toISOString()),
      supabaseAdmin.from('reading_history').select('user_id, viewed_at, story_id').gte('viewed_at', since.toISOString()),
      supabaseAdmin.from('social_sentiment').select('*').gte('analyzed_at', since.toISOString()),
      supabaseAdmin.from('comments').select('*, stories_raw(category, title)').gte('created_at', since.toISOString()),
      supabaseAdmin.from('stories_raw').select('id, category, published_at, metadata').gte('published_at', since.toISOString()),
      supabaseAdmin.from('sources').select('*'),
      supabaseAdmin.from('story_clusters').select('*').gte('created_at', since.toISOString())
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
      comments: comments.data || [],
      stories: stories.data || [],
      sources: sources.data || [],
      clusters: clusters.data || []
    });

    setStats(analytics);
    setLoading(false);
  };

  const processAnalytics = (data: any) => {
    const uniqueSessions = new Set(data.events.map((e: any) => e.session_id)).size;
    const uniqueUsers = new Set([
      ...data.events.filter((e: any) => e.user_id).map((e: any) => e.user_id),
      ...data.readingHistory.map((r: any) => r.user_id)
    ]).size;
    
    const categoryEngagement: any = {};
    const categoryViews: any = {};
    const categoryTime: any = {};
    
    data.storyViews.forEach((v: any) => {
      const cat = v.stories_raw?.category || 'General';
      categoryEngagement[cat] = (categoryEngagement[cat] || 0) + 1;
    });

    data.events.filter((e: any) => e.event_type === 'story_view').forEach((e: any) => {
      const cat = e.event_data?.category || 'General';
      categoryViews[cat] = (categoryViews[cat] || 0) + 1;
      categoryTime[cat] = (categoryTime[cat] || 0) + (e.event_data?.time_spent || 0);
    });

    const sourceEngagement: any = {};
    const sourceClicks: any = {};
    data.storyViews.forEach((v: any) => {
      const source = v.stories_raw?.sources?.name;
      if (source) {
        sourceEngagement[source] = (sourceEngagement[source] || 0) + 1;
      }
    });

    data.events.filter((e: any) => e.event_type === 'source_click').forEach((e: any) => {
      const source = e.event_data?.source_name;
      if (source) sourceClicks[source] = (sourceClicks[source] || 0) + 1;
    });

    const biasDistribution: any = {};
    data.reactions.forEach((r: any) => {
      biasDistribution[r.reaction_type] = (biasDistribution[r.reaction_type] || 0) + 1;
    });

    const searchQueries = data.searches.map((s: any) => ({
      query: s.event_data?.query,
      results: s.event_data?.results_count,
      timestamp: s.created_at
    })).filter((s: any) => s.query);
    
    const aiPersonalities: any = {};
    const aiDeepThinking = { enabled: 0, disabled: 0 };
    data.aiChats.forEach((c: any) => {
      const p = c.personality || 'professional';
      aiPersonalities[p] = (aiPersonalities[p] || 0) + 1;
    });

    data.events.filter((e: any) => e.event_type === 'ai_chat').forEach((e: any) => {
      if (e.event_data?.deep_thinking) aiDeepThinking.enabled++;
      else aiDeepThinking.disabled++;
    });

    const usersByTier = data.users.reduce((acc: any, u: any) => {
      acc[u.plan_tier] = (acc[u.plan_tier] || 0) + 1;
      return acc;
    }, {});

    const deviceTypes = data.events.reduce((acc: any, e: any) => {
      const type = e.device_info?.deviceType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const hourlyActivity = processHourlyActivity(data.events);
    const dailyActivity = processDailyActivity(data.events);
    const avgSessionDuration = calculateAvgSessionDuration(data.events);
    const bounceRate = calculateBounceRate(data.events);
    const topStories = processTopStories(data.storyViews, data.reactions, data.bookmarks);
    const userJourney = processUserJourney(data.events);
    const conversionFunnel = processConversionFunnel(data.events, data.users);
    const performanceMetrics = processPerformanceMetrics(data.events);

    return {
      totalEvents: data.events.length,
      uniqueSessions,
      uniqueUsers,
      totalStoryViews: data.storyViews.length + data.events.filter((e: any) => e.event_type === 'story_view').length,
      totalSearches: data.searches.length,
      totalAIChats: data.aiChats.length + data.events.filter((e: any) => e.event_type === 'ai_chat').length,
      totalBookmarks: data.bookmarks.length,
      totalReactions: data.reactions.length,
      totalComments: data.comments.length,
      newUsers: data.users.length,
      categoryEngagement,
      categoryViews,
      categoryTime,
      sourceEngagement,
      sourceClicks,
      biasDistribution,
      searchQueries,
      aiPersonalities,
      aiDeepThinking,
      usersByTier,
      deviceTypes,
      avgSessionDuration,
      bounceRate,
      socialSentimentCount: data.socialSentiment.length,
      hourlyActivity,
      dailyActivity,
      topStories,
      userJourney,
      conversionFunnel,
      performanceMetrics,
      totalStories: data.stories.length,
      totalSources: data.sources.length,
      totalClusters: data.clusters.length,
    };
  };

  const processHourlyActivity = (events: any[]) => {
    const hourly: any = {};
    events.forEach(e => {
      const hour = new Date(e.created_at).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      events: hourly[i] || 0
    }));
  };

  const processDailyActivity = (events: any[]) => {
    const daily: any = {};
    events.forEach(e => {
      const date = new Date(e.created_at).toLocaleDateString();
      daily[date] = (daily[date] || 0) + 1;
    });
    return Object.entries(daily).map(([date, count]) => ({ date, events: count }));
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

  const processTopStories = (views: any[], reactions: any[], bookmarks: any[]) => {
    const storyMetrics: any = {};
    
    views.forEach(v => {
      const id = v.story_id;
      if (!storyMetrics[id]) storyMetrics[id] = { views: 0, reactions: 0, bookmarks: 0, title: v.stories_raw?.title || 'Unknown' };
      storyMetrics[id].views++;
    });
    
    reactions.forEach(r => {
      const id = r.story_id;
      if (!storyMetrics[id]) storyMetrics[id] = { views: 0, reactions: 0, bookmarks: 0, title: r.stories_raw?.title || 'Unknown' };
      storyMetrics[id].reactions++;
    });
    
    bookmarks.forEach(b => {
      const id = b.story_id;
      if (!storyMetrics[id]) storyMetrics[id] = { views: 0, reactions: 0, bookmarks: 0, title: b.stories_raw?.title || 'Unknown' };
      storyMetrics[id].bookmarks++;
    });

    return Object.entries(storyMetrics)
      .map(([id, metrics]: any) => ({ id, ...metrics, score: metrics.views + metrics.reactions * 2 + metrics.bookmarks * 3 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  const processUserJourney = (events: any[]) => {
    const journeys: any = {};
    events.forEach(e => {
      if (!journeys[e.session_id]) journeys[e.session_id] = [];
      journeys[e.session_id].push({ type: e.event_type, time: e.created_at });
    });
    
    const commonPaths: any = {};
    Object.values(journeys).forEach((journey: any) => {
      const path = journey.slice(0, 5).map((j: any) => j.type).join(' → ');
      commonPaths[path] = (commonPaths[path] || 0) + 1;
    });

    return Object.entries(commonPaths)
      .map(([path, count]) => ({ path, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  };

  const processConversionFunnel = (events: any[], users: any[]) => {
    const funnel = {
      visitors: new Set(events.map(e => e.session_id)).size,
      engaged: events.filter(e => e.event_type === 'story_view').length,
      interacted: events.filter(e => ['bookmark', 'reaction', 'comment'].includes(e.event_type)).length,
      subscribed: users.filter(u => u.plan_tier !== 'free').length,
    };

    return [
      { stage: 'Visitors', count: funnel.visitors },
      { stage: 'Engaged', count: funnel.engaged },
      { stage: 'Interacted', count: funnel.interacted },
      { stage: 'Subscribed', count: funnel.subscribed },
    ];
  };

  const processPerformanceMetrics = (events: any[]) => {
    const metrics = events
      .filter(e => e.performance?.loadTime)
      .map(e => e.performance);

    if (metrics.length === 0) return { avgLoadTime: 0, avgTTFB: 0, avgDomReady: 0 };

    return {
      avgLoadTime: Math.round(metrics.reduce((a, m) => a + (m.loadTime || 0), 0) / metrics.length),
      avgTTFB: Math.round(metrics.reduce((a, m) => a + (m.ttfb || 0), 0) / metrics.length),
      avgDomReady: Math.round(metrics.reduce((a, m) => a + (m.domReady || 0), 0) / metrics.length),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 block">
              ← Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Comprehensive insights and metrics</p>
          </div>
          
          <div className="flex gap-3 items-center">
            <Link
              href="/admin/analytics/story"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Story Analytics
            </Link>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All Categories</option>
              {Object.keys(stats.categoryEngagement).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All Metrics</option>
              <option value="engagement">Engagement</option>
              <option value="content">Content</option>
              <option value="users">Users</option>
              <option value="performance">Performance</option>
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-2 text-sm ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-2 text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-2 text-sm ${chartType === 'area' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
              >
                Area
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard title="Total Events" value={stats.totalEvents.toLocaleString()} change="+12%" color="blue" icon="📊" />
          <MetricCard title="Unique Users" value={stats.uniqueUsers.toLocaleString()} change="+8%" color="green" icon="👥" />
          <MetricCard title="Sessions" value={stats.uniqueSessions.toLocaleString()} change="+15%" color="purple" icon="🔄" />
          <MetricCard title="Story Views" value={stats.totalStoryViews.toLocaleString()} change="+20%" color="red" icon="📰" />
          <MetricCard title="Avg Session" value={`${stats.avgSessionDuration}m`} change="-5%" color="orange" icon="⏱️" />
          <MetricCard title="Bounce Rate" value={`${stats.bounceRate}%`} change="-3%" color="pink" icon="↩️" />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard title="Searches" value={stats.totalSearches.toLocaleString()} icon="🔍" />
          <MetricCard title="AI Chats" value={stats.totalAIChats.toLocaleString()} icon="🤖" />
          <MetricCard title="Bookmarks" value={stats.totalBookmarks.toLocaleString()} icon="🔖" />
          <MetricCard title="Reactions" value={stats.totalReactions.toLocaleString()} icon="👍" />
          <MetricCard title="Comments" value={stats.totalComments.toLocaleString()} icon="💬" />
          <MetricCard title="New Users" value={stats.newUsers.toLocaleString()} icon="✨" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Activity Over Time">
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' && (
                <LineChart data={stats.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  <Legend />
                  <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              )}
              {chartType === 'bar' && (
                <BarChart data={stats.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  <Bar dataKey="events" fill="#3b82f6" />
                </BarChart>
              )}
              {chartType === 'area' && (
                <AreaChart data={stats.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  <Area type="monotone" dataKey="events" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hourly Activity Pattern">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Area type="monotone" dataKey="events" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Continue in next part... */}
        {/* Charts Row 2 - Category & Source Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Category Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(stats.categoryViews).map(([name, value]) => ({ name, views: value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Bar dataKey="views" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Device Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.deviceTypes).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(stats.deviceTypes).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 3 - User Behavior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ChartCard title="User Reactions">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.biasDistribution).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {Object.keys(stats.biasDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="AI Personalities">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(stats.aiPersonalities).map(([name, value]) => ({ name, count: value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Bar dataKey="count" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Conversion Funnel">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.conversionFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="stage" type="category" stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top Stories Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Top Performing Stories</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Story</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Views</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Reactions</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Bookmarks</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Score</th>
                </tr>
              </thead>
              <tbody>
                {stats.topStories.map((story: any, index: number) => (
                  <tr key={story.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">#{index + 1}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 max-w-md truncate">{story.title}</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{story.views}</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{story.reactions}</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{story.bookmarks}</td>
                    <td className="py-3 px-4 text-sm text-center font-bold text-blue-600 dark:text-blue-400">{story.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Journey & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Common User Journeys</h3>
            <div className="space-y-3">
              {stats.userJourney.map((journey: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{journey.path}</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 ml-4">{journey.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Avg Load Time</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{stats.performanceMetrics.avgLoadTime}ms</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, (3000 - stats.performanceMetrics.avgLoadTime) / 30)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Avg TTFB</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{stats.performanceMetrics.avgTTFB}ms</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (1000 - stats.performanceMetrics.avgTTFB) / 10)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Avg DOM Ready</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{stats.performanceMetrics.avgDomReady}ms</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(100, (2000 - stats.performanceMetrics.avgDomReady) / 20)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Queries */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Recent Search Queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.searchQueries.slice(0, 12).map((q: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{q.query}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{q.results} results</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">{stats.totalStories.toLocaleString()}</div>
            <div className="text-blue-100">Total Stories Published</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">{stats.totalSources.toLocaleString()}</div>
            <div className="text-green-100">Active News Sources</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">{stats.totalClusters.toLocaleString()}</div>
            <div className="text-purple-100">Story Clusters</div>
          </div>
        </div>
      </div>
    </div>
  );
}
