'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TrainingPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    const supabase = createClient();
    const { data } = await supabase
      .from('stories_raw')
      .select('id, title, published_at, category, sources(name)')
      .order('published_at', { ascending: false })
      .limit(100);
    setStories(data || []);
  }

  function toggleStory(id: string) {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  }

  async function runTraining(type: 'summaries' | 'entities' | 'both') {
    setLoading(true);
    setStatus(`Running ${type}...`);

    try {
      const storyIds = Array.from(selected);

      if (type === 'summaries' || type === 'both') {
        const res = await fetch('/api/admin/train-stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyIds, action: 'summaries' }),
        });
        const data = await res.json();
        setStatus(`Summaries: ${data.processed}/${data.total}`);
      }

      if (type === 'entities' || type === 'both') {
        const res = await fetch('/api/admin/train-stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyIds, action: 'entities' }),
        });
        const data = await res.json();
        setStatus(`Entities: ${data.processed}/${data.total}`);
      }

      setStatus('✓ Complete');
      setSelected(new Set());
    } catch (error) {
      setStatus('✗ Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI Training Dashboard</h1>
        <p className="text-gray-400 mb-8">Select stories to generate summaries and extract entities</p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => runTraining('summaries')}
            disabled={loading || selected.size === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded"
          >
            Generate Summaries ({selected.size})
          </button>
          <button
            onClick={() => runTraining('entities')}
            disabled={loading || selected.size === 0}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded"
          >
            Extract Entities ({selected.size})
          </button>
          <button
            onClick={() => runTraining('both')}
            disabled={loading || selected.size === 0}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded"
          >
            Both ({selected.size})
          </button>
          <button
            onClick={() => setSelected(new Set(stories.map(s => s.id)))}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Select All
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Clear
          </button>
        </div>

        {status && (
          <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-800">
            {status}
          </div>
        )}

        <div className="space-y-2">
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => toggleStory(story.id)}
              className={`p-4 rounded border cursor-pointer transition-colors ${
                selected.has(story.id)
                  ? 'bg-blue-900/30 border-blue-600'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{story.title}</h3>
                  <div className="text-sm text-gray-400">
                    {story.sources?.name} • {story.category} • {new Date(story.published_at).toLocaleDateString()}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selected.has(story.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                }`}>
                  {selected.has(story.id) && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
