'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/client';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function StoryAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyMetrics, setStoryMetrics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    if (selectedStory) {
      loadStoryMetrics(selectedStory.id);
    }
  }, [selectedStory]);

  const loadStories = async () => {
    const { data } = await supabaseAdmin
      .from('stories_raw')
      .select('id, title, category, published_at, sources(name)')
      .order('published_at', { ascending: false })
      .limit(100);
    
    setStories(data || []);
    if (data && data.length > 0) {
      setSelectedStory(data[0]);
    }
    setLoading(false);
  };

  const loadStoryMetrics = async (storyId: string) => {
    const [
      views,
      reactions,
      bookmarks,
      comments,
      sentiment,
      readingHistory,
      analyticsEvents
    ] = await Promise.all([
      supabaseAdmin.from('reading_history').select('*').eq('story_id', storyId),
      supabaseAdmin.from('story_reactions').select('*').eq('story_id', storyId),
      supabaseAdmin.from('bookmarks').select('*').eq('story_id', storyId),
      supabaseAdmin.from('comments').select('*').eq('story_id', storyId),
      supabaseAdmin.from('social_sentiment').select('*').eq('story_id', storyId).single(),
      supabaseAdmin.from('reading_history').select('viewed_at, user_id').eq('story_id', storyId),
      supabaseAdmin.from('analytics_events').select('*').eq('story_id', storyId)
    ]);

    const metrics = processStoryMetrics({
      views: views.data || [],
      reactions: reactions.data || [],
      bookmarks: bookmarks.data || [],
      comments: comments.data || [],
      sentiment: sentiment.data,
      readingHistory: readingHistory.data || [],
      analyticsEvents: analyticsEvents.data || []
    });

    setStoryMetrics(metrics);
  };

  const processStoryMetrics = (data: any) => {
    // 1. View Velocity (views over time)
    const viewsByHour: any = {};
    data.readingHistory.forEach((v: any) => {
      const hour = new Date(v.viewed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
      viewsByHour[hour] = (viewsByHour[hour] || 0) + 1;
    });
    const viewVelocity = Object.entries(viewsByHour).map(([time, count]) => ({ time, views: count }));

    // 2. Engagement Rate
    const totalViews = data.views.length;
    const totalEngagements = data.reactions.length + data.bookmarks.length + data.comments.length;
    const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(1) : '0';

    // 3. Sentiment Evolution
    const sentimentData = data.sentiment ? {
      positive: data.sentiment.positive_count,
      negative: data.sentiment.negative_count,
      neutral: data.sentiment.neutral_count,
      total: data.sentiment.total_count
    } : { positive: 0, negative: 0, neutral: 0, total: 0 };

    // 4. User Retention (return viewers)
    const userViews: any = {};
    data.readingHistory.forEach((v: any) => {
      userViews[v.user_id] = (userViews[v.user_id] || 0) + 1;
    });
    const returnViewers = Object.values(userViews).filter((count: any) => count > 1).length;
    const retentionRate = totalViews > 0 ? ((returnViewers / Object.keys(userViews).length) * 100).toFixed(1) : '0';

    // 5. Reading Depth (scroll depth from analytics)
    const scrollDepths = data.analyticsEvents
      .filter((e: any) => e.event_type === 'story_view' && e.event_data?.scroll_depth)
      .map((e: any) => e.event_data.scroll_depth);
    const avgScrollDepth = scrollDepths.length > 0 
      ? (scrollDepths.reduce((a: number, b: number) => a + b, 0) / scrollDepths.length).toFixed(1)
      : '0';

    // 6. Time Spent Distribution
    const timeSpent = data.analyticsEvents
      .filter((e: any) => e.event_type === 'story_view' && e.event_data?.time_spent)
      .map((e: any) => e.event_data.time_spent);
    const avgTimeSpent = timeSpent.length > 0
      ? Math.round(timeSpent.reduce((a: number, b: number) => a + b, 0) / timeSpent.length)
      : 0;
    const timeDistribution = {
      '0-30s': timeSpent.filter((t: number) => t < 30).length,
      '30s-1m': timeSpent.filter((t: number) => t >= 30 && t < 60).length,
      '1-2m': timeSpent.filter((t: number) => t >= 60 && t < 120).length,
      '2-5m': timeSpent.filter((t: number) => t >= 120 && t < 300).length,
      '5m+': timeSpent.filter((t: number) => t >= 300).length,
    };

    // 7. Reaction Breakdown
    const reactionTypes: any = {};
    data.reactions.forEach((r: any) => {
      reactionTypes[r.reaction_type] = (reactionTypes[r.reaction_type] || 0) + 1;
    });

    // 8. Share Potential Score
    const shareScore = (
      (data.bookmarks.length * 3) +
      (data.reactions.length * 2) +
      (data.comments.length * 4) +
      (sentimentData.positive * 1)
    );

    // 9. Virality Index
    const viralityIndex = totalViews > 0
      ? ((totalEngagements / totalViews) * (returnViewers / Object.keys(userViews).length) * 100).toFixed(1)
      : '0';

    // 10. Peak Activity Time
    const hourlyActivity: any = {};
    data.readingHistory.forEach((v: any) => {
      const hour = new Date(v.viewed_at).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyActivity).sort((a: any, b: any) => b[1] - a[1])[0];

    return {
      totalViews,
      totalEngagements,
      engagementRate,
      sentimentData,
      returnViewers,
      retentionRate,
      avgScrollDepth,
      avgTimeSpent,
      timeDistribution,
      reactionTypes,
      shareScore,
      viralityIndex,
      peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
      viewVelocity,
      completionRate: scrollDepths.filter((d: number) => d > 80).length / scrollDepths.length * 100 || 0,
      bookmarkRate: totalViews > 0 ? (data.bookmarks.length / totalViews * 100).toFixed(1) : '0',
      commentRate: totalViews > 0 ? (data.comments.length / totalViews * 100).toFixed(1) : '0',
    };
  };

  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading story analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/analytics" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 block">
              ← Back to Analytics
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Story Analytics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Deep dive into individual story performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Story List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 h-[calc(100vh-200px)] overflow-y-auto">
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm mb-4"
            />
            <div className="space-y-2">
              {filteredStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStory?.id === story.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                    {story.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {story.category} • {story.sources?.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Story Metrics */}
          <div className="lg:col-span-3 space-y-6">
            {selectedStory && storyMetrics && (
              <>
                {/* Header */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{selectedStory.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{selectedStory.category}</span>
                    <span>•</span>
                    <span>{selectedStory.sources?.name}</span>
                    <span>•</span>
                    <span>{new Date(selectedStory.published_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <MetricCard title="Total Views" value={storyMetrics.totalViews} icon="👁️" color="blue" />
                  <MetricCard title="Engagement Rate" value={`${storyMetrics.engagementRate}%`} icon="📊" color="green" />
                  <MetricCard title="Avg Time" value={`${storyMetrics.avgTimeSpent}s`} icon="⏱️" color="purple" />
                  <MetricCard title="Scroll Depth" value={`${storyMetrics.avgScrollDepth}%`} icon="📜" color="orange" />
                  <MetricCard title="Virality" value={storyMetrics.viralityIndex} icon="🚀" color="pink" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard title="Completion Rate" value={`${storyMetrics.completionRate.toFixed(1)}%`} icon="✅" />
                  <MetricCard title="Bookmark Rate" value={`${storyMetrics.bookmarkRate}%`} icon="🔖" />
                  <MetricCard title="Comment Rate" value={`${storyMetrics.commentRate}%`} icon="💬" />
                  <MetricCard title="Share Score" value={storyMetrics.shareScore} icon="📤" />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="View Velocity">
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={storyMetrics.viewVelocity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                        <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Sentiment Distribution">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Positive', value: storyMetrics.sentimentData.positive },
                            { name: 'Neutral', value: storyMetrics.sentimentData.neutral },
                            { name: 'Negative', value: storyMetrics.sentimentData.negative },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#6b7280" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Time Spent Distribution">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={Object.entries(storyMetrics.timeDistribution).map(([range, count]) => ({ range, count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="range" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                        <Bar dataKey="count" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Reaction Breakdown">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(storyMetrics.reactionTypes).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {Object.keys(storyMetrics.reactionTypes).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Additional Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="text-sm mb-2">Peak Activity Time</div>
                    <div className="text-3xl font-bold">{storyMetrics.peakHour}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="text-sm mb-2">Return Viewers</div>
                    <div className="text-3xl font-bold">{storyMetrics.returnViewers}</div>
                    <div className="text-sm mt-1">Retention: {storyMetrics.retentionRate}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="text-sm mb-2">Total Engagements</div>
                    <div className="text-3xl font-bold">{storyMetrics.totalEngagements}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, icon, color }: any) => {
  const colors: any = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    pink: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
  };

  return (
    <div className={`rounded-lg p-4 border-l-4 ${colors[color] || 'border-gray-300 bg-white dark:bg-gray-900'}`}>
      <div className="text-2xl mb-2">{icon}</div>
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
