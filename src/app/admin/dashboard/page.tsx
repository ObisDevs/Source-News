'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_ID = '551b99a5-eaf2-4513-b218-eda99c1d1f3b';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ stories: 0, sources: 0, clusters: 0 });
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [sourceStories, setSourceStories] = useState<any[]>([]);
  const [storyDate, setStoryDate] = useState(new Date());
  const [editingSource, setEditingSource] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== ADMIN_ID) {
      router.push('/admin');
    }
  };

  const fetchData = async () => {
    const supabase = createClient();
    
    const [storiesRes, sourcesRes, clustersRes] = await Promise.all([
      supabase.from('stories_raw').select('id', { count: 'exact', head: true }),
      supabase.from('sources').select('*').order('name'),
      supabase.from('stories_raw').select('cluster_id').not('cluster_id', 'is', null)
    ]);

    setStats({
      stories: storiesRes.count || 0,
      sources: sourcesRes.data?.length || 0,
      clusters: new Set(clustersRes.data?.map((s: any) => s.cluster_id)).size
    });
    setSources(sourcesRes.data || []);
    setLoading(false);
  };

  const fetchSourceStories = async (sourceId: string, date: Date) => {
    const supabase = createClient();
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999)).toISOString();

    // Try with source_id first
    let { data } = await supabase
      .from('stories_raw')
      .select('*, sources(name)')
      .eq('source_id', sourceId)
      .gte('published_at', startOfDay)
      .lte('published_at', endOfDay)
      .order('published_at', { ascending: false });

    // If no results, try matching by source name in metadata
    if (!data || data.length === 0) {
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        const { data: metaData } = await supabase
          .from('stories_raw')
          .select('*, sources(name)')
          .gte('published_at', startOfDay)
          .lte('published_at', endOfDay)
          .order('published_at', { ascending: false });
        
        data = metaData?.filter((s: any) => 
          s.metadata?.source_name?.toLowerCase().includes(source.name.toLowerCase()) ||
          s.sources?.name?.toLowerCase().includes(source.name.toLowerCase())
        ) || [];
      }
    }

    setSourceStories(data || []);
  };

  const handleSourceClick = (source: any) => {
    setSelectedSource(source);
    setStoryDate(new Date());
    fetchSourceStories(source.id, new Date());
  };

  const goToPreviousDay = () => {
    const newDate = new Date(storyDate);
    newDate.setDate(newDate.getDate() - 1);
    setStoryDate(newDate);
    if (selectedSource) fetchSourceStories(selectedSource.id, newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(storyDate);
    newDate.setDate(newDate.getDate() + 1);
    setStoryDate(newDate);
    if (selectedSource) fetchSourceStories(selectedSource.id, newDate);
  };

  const updateSource = async () => {
    if (!editingSource) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('sources')
      .update(editingSource)
      .eq('id', editingSource.id);

    if (!error) {
      setEditingSource(null);
      fetchData();
      if (selectedSource?.id === editingSource.id) {
        setSelectedSource(editingSource);
      }
    }
  };

  const deleteSource = async (sourceId: string) => {
    if (!confirm('Delete this source? This cannot be undone.')) return;
    const supabase = createClient();
    const { error } = await supabase.from('sources').delete().eq('id', sourceId);
    if (!error) {
      fetchData();
      if (selectedSource?.id === sourceId) setSelectedSource(null);
    }
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your news platform</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Stories</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.stories.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sources</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.sources}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Story Clusters</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.clusters}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/ingestion" className="group">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white hover:shadow-xl transition-all">
              <div className="text-2xl font-bold mb-2">Ingestion Monitor</div>
              <div className="text-green-100">Monitor RSS feeds and data ingestion</div>
            </div>
          </Link>

          <Link href="/admin/sources" className="group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:shadow-xl transition-all">
              <div className="text-2xl font-bold mb-2">Manage Sources</div>
              <div className="text-blue-100">Add, edit, and configure news sources</div>
            </div>
          </Link>

          <Link href="/admin/fact-checks" className="group">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white hover:shadow-xl transition-all">
              <div className="text-2xl font-bold mb-2">Fact-Checks</div>
              <div className="text-purple-100">Review and manage fact-checking</div>
            </div>
          </Link>

          <Link href="/admin/training" className="group">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white hover:shadow-xl transition-all">
              <div className="text-2xl font-bold mb-2">AI Training</div>
              <div className="text-red-100">Generate summaries and extract entities</div>
            </div>
          </Link>

          <Link href="/admin/analytics" className="group">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white hover:shadow-xl transition-all">
              <div className="text-2xl font-bold mb-2">Analytics</div>
              <div className="text-orange-100">View user behavior and site metrics</div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">News Sources</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {sources.map((source) => (
                <div key={source.id} className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedSource?.id === source.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                }`} onClick={() => handleSourceClick(source)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{source.name}</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                      source.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{source.type}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            {selectedSource ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSource.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{storyDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={goToPreviousDay} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">← Prev Day</button>
                    <button onClick={goToNextDay} disabled={storyDate.toDateString() === new Date().toDateString()} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded text-sm">Next Day →</button>
                    <button onClick={() => setEditingSource(selectedSource)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Edit</button>
                    <button onClick={() => deleteSource(selectedSource.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Delete</button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {sourceStories.length > 0 ? sourceStories.map((story) => {
                    const storyImage = story.metadata?.image || story.metadata?.og_image;
                    const fallbackImage = selectedSource.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSource.name)}&size=100&background=3b82f6&color=fff`;
                    const imageUrl = storyImage || fallbackImage;
                    return (
                      <div key={story.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-500 transition-colors">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                            <img 
                              src={imageUrl} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              onError={(e) => { 
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallbackImage;
                              }} 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">{story.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(story.published_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">No stories found for this date</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Select a source to view stories</div>
            )}
          </div>
        </div>

        {editingSource && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingSource(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Source</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input type="text" value={editingSource.name} onChange={(e) => setEditingSource({...editingSource, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RSS URL</label>
                  <input type="url" value={editingSource.rss_url || ''} onChange={(e) => setEditingSource({...editingSource, rss_url: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input type="url" value={editingSource.image_url || ''} onChange={(e) => setEditingSource({...editingSource, image_url: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editingSource.is_active} onChange={(e) => setEditingSource({...editingSource, is_active: e.target.checked})} className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={updateSource} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">Save</button>
                <button onClick={() => setEditingSource(null)} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
