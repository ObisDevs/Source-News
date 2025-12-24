'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { analytics } from '@/lib/analytics/tracker';

interface QuickReactionsProps {
  storyId: string;
}

export function QuickReactions({ storyId }: QuickReactionsProps) {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVotes();
  }, [storyId]);

  const fetchVotes = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: reactions } = await supabase
      .from('story_reactions')
      .select('reaction_type, user_id')
      .eq('story_id', storyId)
      .in('reaction_type', ['accurate', 'misleading']);

    const up = reactions?.filter((r: any) => r.reaction_type === 'accurate').length || 0;
    const down = reactions?.filter((r: any) => r.reaction_type === 'misleading').length || 0;
    
    setUpvotes(up);
    setDownvotes(down);

    if (user) {
      const userReaction = reactions?.find((r: any) => r.user_id === user.id);
      if (userReaction) {
        setUserVote(userReaction.reaction_type === 'accurate' ? 'up' : 'down');
      }
    }
  };

  const handleVote = async (type: 'up' | 'down') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    setLoading(true);
    const reactionType = type === 'up' ? 'accurate' : 'misleading';

    if (userVote === type) {
      await supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);
    } else {
      if (userVote) {
        await supabase
          .from('story_reactions')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);
      }
      await supabase
        .from('story_reactions')
        .insert({ story_id: storyId, user_id: user.id, reaction_type: reactionType });
      analytics.reaction(storyId, reactionType);
    }

    await fetchVotes();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
          userVote === 'up'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        <span className="text-sm font-medium">{upvotes}</span>
      </button>

      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
          userVote === 'down'
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span className="text-sm font-medium">{downvotes}</span>
      </button>

      <button
        onClick={() => {
          const commentsSection = document.getElementById('comments-section');
          commentsSection?.scrollIntoView({ behavior: 'smooth' });
          const textarea = document.querySelector('#comments-section textarea') as HTMLTextAreaElement;
          setTimeout(() => textarea?.focus(), 500);
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
}
