'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_ID = '551b99a5-eaf2-4513-b218-eda99c1d1f3b';

export default function IngestionMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== ADMIN_ID) {
      router.push('/admin');
    }
  };

  const fetchStats = async () => {
    const supabase = createClient();
    const { count: totalStories } = await supabase
      .from('stories_raw')
      .select('*', { count: 'exact', head: true });

    const { count: todayStories } = await supabase
      .from('stories_raw')
      .select('*', { count: 'exact', head: true })
      .gte('ingested_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const { count: processedStories } = await supabase
      .from('stories_raw')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true);

    setStats({
      total: totalStories || 0,
      today: todayStories || 0,
      processed: processedStories || 0,
    });
  };

  const runIngestion = async () => {
    setLoading(true);
    setLogs(['Starting ingestion...']);

    try {
      const response = await fetch('/api/worker/ingest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev_secret_123'}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLogs(prev => [
          ...prev,
          `✓ Ingested: ${data.results.total.ingested}`,
          `⊘ Skipped: ${data.results.total.skipped}`,
          `✗ Errors: ${data.results.total.errors}`,
          'Ingestion complete!',
        ]);
        fetchStats();
      } else {
        setLogs(prev => [...prev, `Error: ${data.error}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `Error: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  const runProcessing = async () => {
    setLoading(true);
    setLogs(['Starting AI processing...']);

    try {
      const response = await fetch('/api/worker/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev_secret_123'}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLogs(prev => [
          ...prev,
          `✓ Embeddings: ${data.results.embeddingsProcessed}`,
          `✓ Clustered: ${data.results.storiesClustered}`,
          'Processing complete!',
        ]);
        fetchStats();
      } else {
        setLogs(prev => [...prev, `Error: ${data.error}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `Error: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ingestion Monitor</h1>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Stories</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today</div>
            <div className="text-3xl font-bold text-blue-600">{stats?.today || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Processed</div>
            <div className="text-3xl font-bold text-green-600">{stats?.processed || 0}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Manual Actions</h2>
          <div className="flex gap-3">
            <button
              onClick={runIngestion}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
            >
              {loading ? 'Running...' : 'Run Ingestion'}
            </button>
            <button
              onClick={runProcessing}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
            >
              {loading ? 'Running...' : 'Run Processing'}
            </button>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-3">Logs</h2>
            <div className="space-y-1 font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="text-green-400">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
