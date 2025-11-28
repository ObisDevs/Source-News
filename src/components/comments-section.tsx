'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  user_email?: string;
}

export function CommentsSection({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'liked'>('recent');

  useEffect(() => {
    fetchComments();
  }, [storyId, sortBy]);

  const fetchComments = async () => {
    const supabase = createClient();
    const query = supabase
      .from('comments')
      .select('*')
      .eq('story_id', storyId)
      .eq('is_flagged', false);

    if (sortBy === 'recent') {
      query.order('created_at', { ascending: false });
    } else {
      query.order('likes_count', { ascending: false });
    }

    const { data } = await query;
    setComments(data || []);
  };

  const postComment = async () => {
    if (!newComment.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to comment');
      return;
    }

    setLoading(true);
    await supabase.from('comments').insert({
      story_id: storyId,
      user_id: user.id,
      content: newComment,
      parent_comment_id: replyTo,
    });

    setNewComment('');
    setReplyTo(null);
    await fetchComments();
    setLoading(false);
  };

  const likeComment = async (commentId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to like');
      return;
    }

    const { error } = await supabase.from('comment_likes').insert({
      comment_id: commentId,
      user_id: user.id,
    });

    if (!error) fetchComments();
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_comment_id === parentId);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Discussion ({comments.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="recent">Most Recent</option>
          <option value="liked">Most Liked</option>
        </select>
      </div>

      <div className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
          rows={3}
        />
        <div className="flex justify-between items-center mt-2">
          {replyTo && (
            <button
              onClick={() => setReplyTo(null)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel Reply
            </button>
          )}
          <button
            onClick={postComment}
            disabled={loading || !newComment.trim()}
            className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {topLevelComments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">{comment.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                  <button
                    onClick={() => likeComment(comment.id)}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    ▲ {comment.likes_count}
                  </button>
                  <button
                    onClick={() => setReplyTo(comment.id)}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>

            {getReplies(comment.id).length > 0 && (
              <div className="ml-6 mt-3 space-y-3">
                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} className="text-sm">
                    <p className="text-gray-900 dark:text-white">{reply.content}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                      <button
                        onClick={() => likeComment(reply.id)}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        ▲ {reply.likes_count}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
