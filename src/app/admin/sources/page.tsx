'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_ID = '551b99a5-eaf2-4513-b218-eda99c1d1f3b';

type Source = {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'twitter' | 'government';
  url: string;
  credibility_score: number;
  bias_lean: 'left' | 'centre' | 'right' | 'government' | 'independent';
  is_active: boolean;
  license_status: 'pending' | 'approved' | 'rejected';
  metadata: any;
};

export default function SourcesManagement() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'rss' as const,
    url: '',
    credibility_score: 50,
    bias_lean: 'centre' as const,
    is_active: true,
    license_status: 'pending' as const,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchSources();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== ADMIN_ID) {
      router.push('/admin');
    }
  };

  const fetchSources = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false });

    setSources(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    
    const { error } = await supabase
      .from('sources')
      .insert([formData]);

    if (!error) {
      setShowForm(false);
      setFormData({
        name: '',
        type: 'rss',
        url: '',
        credibility_score: 50,
        bias_lean: 'centre',
        is_active: true,
        license_status: 'pending',
      });
      fetchSources();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = createClient();
    await supabase
      .from('sources')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    fetchSources();
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Delete this source?')) return;
    const supabase = createClient();
    await supabase.from('sources').delete().eq('id', id);
    fetchSources();
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sources Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              {showForm ? 'Cancel' : 'Add Source'}
            </button>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Source</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="rss">RSS</option>
                    <option value="api">API</option>
                    <option value="twitter">Twitter</option>
                    <option value="government">Government</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credibility Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.credibility_score}
                    onChange={(e) => setFormData({ ...formData, credibility_score: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bias Lean</label>
                  <select
                    value={formData.bias_lean}
                    onChange={(e) => setFormData({ ...formData, bias_lean: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="left">Left</option>
                    <option value="centre">Centre</option>
                    <option value="right">Right</option>
                    <option value="government">Government</option>
                    <option value="independent">Independent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Status</label>
                  <select
                    value={formData.license_status}
                    onChange={(e) => setFormData({ ...formData, license_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Add Source
              </button>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Credibility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bias</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{source.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{source.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                        {source.url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{source.credibility_score}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{source.bias_lean}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        source.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {source.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(source.id, source.is_active)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          {source.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteSource(source.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
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
