'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const ADMIN_ID = '551b99a5-eaf2-4513-b218-eda99c1d1f3b';

interface FactCheckRequest {
  id: string;
  story_id: string;
  reason: string;
  status: string;
  admin_notes: string;
  created_at: string;
  stories_raw: {
    title: string;
  };
}

export default function FactChecksPage() {
  const [requests, setRequests] = useState<FactCheckRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchRequests();
  }, [filter]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== ADMIN_ID) {
      router.push('/admin');
    }
  };

  const fetchRequests = async () => {
    const supabase = createClient();
    let query = supabase
      .from('fact_check_requests')
      .select('*, stories_raw(title)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setRequests(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase
      .from('fact_check_requests')
      .update({ status })
      .eq('id', id);
    fetchRequests();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fact-Check Requests</h1>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'in_progress', 'completed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Story</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-md">
                      <Link href={`/story/${request.story_id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                        {request.stories_raw?.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {request.reason || 'No reason provided'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        request.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={request.status}
                        onChange={(e) => updateStatus(request.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
