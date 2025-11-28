'use client';

import { useEffect, useState } from 'react';

interface UsageIndicatorProps {
  userId?: string;
  tier?: 'free' | 'premium';
}

export function UsageIndicator({ userId = 'anonymous', tier = 'free' }: UsageIndicatorProps) {
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/usage?userId=${userId}&tier=${tier}`)
      .then(res => res.json())
      .then(data => setUsage(data))
      .catch(console.error);
  }, [userId, tier]);

  if (!usage) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Daily Usage {tier === 'free' && '(Free Tier)'}
      </h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>AI Explanations</span>
            <span>{usage.remaining.aiExplanations} / {usage.limits.aiExplanationsPerDay} left</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(usage.usage.aiExplanations / usage.limits.aiExplanationsPerDay) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>AI Summaries</span>
            <span>{usage.remaining.aiSummaries} / {usage.limits.aiSummariesPerDay} left</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(usage.usage.aiSummaries / usage.limits.aiSummariesPerDay) * 100}%` }}
            />
          </div>
        </div>
      </div>
      {tier === 'free' && (
        <button className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
          Upgrade to Premium
        </button>
      )}
    </div>
  );
}
