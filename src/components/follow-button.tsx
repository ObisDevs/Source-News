'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FollowButtonProps {
  type: 'category' | 'source' | 'topic';
  value: string;
  label?: string;
}

export function FollowButton({ type, value, label }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [type, value]);

  const checkFollowStatus = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('follow_type', type)
      .eq('follow_value', value)
      .single();

    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to follow');
      return;
    }

    setLoading(true);

    if (isFollowing) {
      await supabase
        .from('user_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('follow_type', type)
        .eq('follow_value', value);
    } else {
      await supabase
        .from('user_follows')
        .insert({ user_id: user.id, follow_type: type, follow_value: value });
    }

    await checkFollowStatus();
    setLoading(false);
  };

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
        isFollowing
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {loading ? '...' : isFollowing ? 'Following' : `Follow ${label || type}`}
    </button>
  );
}
