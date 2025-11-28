'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function FactCheckButton({ storyId }: { storyId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitRequest = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to request fact-check');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('fact_check_requests').insert({
      story_id: storyId,
      user_id: user.id,
      reason: reason.trim() || null,
    });

    if (!error) {
      setSubmitted(true);
      setTimeout(() => {
        setShowForm(false);
        setSubmitted(false);
        setReason('');
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Request Fact-Check
      </button>

      {showForm && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowForm(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-20 p-4">
            {submitted ? (
              <div className="text-center py-4">
                <div className="text-green-600 dark:text-green-400 mb-2">✓</div>
                <p className="text-sm text-gray-900 dark:text-white">Request submitted!</p>
              </div>
            ) : (
              <>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Request Fact-Check</h4>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why should this be fact-checked? (optional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={submitRequest}
                  disabled={loading}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
