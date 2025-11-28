'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StoryReactionsProps {
  storyId: string;
}

type ReactionType = 'accurate' | 'misleading' | 'important' | 'biased';

const reactions: { type: ReactionType; label: string; icon: string; color: string }[] = [
  { type: 'accurate', label: 'Accurate', icon: '✓', color: 'text-blue-600 dark:text-blue-400' },
  { type: 'misleading', label: 'Misleading', icon: '!', color: 'text-red-600 dark:text-red-400' },
  { type: 'important', label: 'Important', icon: '★', color: 'text-blue-600 dark:text-blue-400' },
  { type: 'biased', label: 'Biased', icon: '⚖', color: 'text-red-600 dark:text-red-400' },
];

export function StoryReactions({ storyId }: StoryReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [storyId]);

  const fetchReactions = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: allReactions } = await supabase
      .from('story_reactions')
      .select('reaction_type')
      .eq('story_id', storyId);

    const reactionCounts: Record<string, number> = {};
    allReactions?.forEach((r: any) => {
      reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
    });
    setCounts(reactionCounts);

    if (user) {
      const { data: userReacts } = await supabase
        .from('story_reactions')
        .select('reaction_type')
        .eq('story_id', storyId)
        .eq('user_id', user.id);

      setUserReactions(new Set((userReacts?.map((r: any) => r.reaction_type as ReactionType) || [])));
    }
  };

  const toggleReaction = async (type: ReactionType) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to react');
      return;
    }

    setLoading(true);

    if (userReactions.has(type)) {
      await supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .eq('reaction_type', type);
    } else {
      await supabase
        .from('story_reactions')
        .insert({ story_id: storyId, user_id: user.id, reaction_type: type });
    }

    await fetchReactions();
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Community Reactions</h3>
      <div className="flex flex-wrap gap-2">
        {reactions.map(({ type, label, icon, color }) => (
          <button
            key={type}
            onClick={() => toggleReaction(type)}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              userReactions.has(type)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            <span className={`text-lg ${color}`}>{icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            {counts[type] > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">({counts[type]})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
