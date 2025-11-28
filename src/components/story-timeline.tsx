'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  summary: string | null;
  published_at: string;
  source_name?: string;
  story_id: string;
}

export function StoryTimeline({ clusterId }: { clusterId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [clusterId]);

  const fetchTimeline = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('story_timeline')
      .select('*, sources(name)')
      .eq('cluster_id', clusterId)
      .order('published_at', { ascending: true });

    setEvents(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-sm text-gray-500">Loading timeline...</div>;
  if (events.length === 0) return null;

  const eventColors = {
    initial: 'bg-blue-500',
    update: 'bg-green-500',
    correction: 'bg-red-500',
    development: 'bg-blue-500',
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Story Timeline</h3>
      <div className="relative">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-6">
          {events.map((event, idx) => (
            <div key={event.id} className="relative pl-8">
              <div className={`absolute left-0 w-4 h-4 rounded-full ${eventColors[event.event_type as keyof typeof eventColors] || 'bg-gray-500'}`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {event.event_type}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDistanceToNow(new Date(event.published_at), { addSuffix: true })}
                  </span>
                </div>
                <a
                  href={`/story/${event.story_id}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {event.title}
                </a>
                {event.summary && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.summary}</p>
                )}
                {event.source_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Source: {event.source_name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
