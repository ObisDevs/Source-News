'use client';

import { useEffect, useState } from 'react';

interface SocialSentimentProps {
  storyId: string;
}

export function SocialSentimentWidget({ storyId }: SocialSentimentProps) {
  const [sentiment, setSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTweets, setShowTweets] = useState(false);

  useEffect(() => {
    fetch(`/api/story/${storyId}/social-sentiment`)
      .then(res => res.json())
      .then(data => {
        setSentiment(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storyId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!sentiment?.sentiment) return null;

  const { sentiment: sentimentData, tweets } = sentiment;
  const total = sentimentData.positive + sentimentData.negative + sentimentData.neutral;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Social Media Sentiment</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-600 dark:text-green-400 font-medium">Positive</span>
            <span className="text-gray-600 dark:text-gray-400">{sentimentData.positive}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${sentimentData.positive}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Neutral</span>
            <span className="text-gray-600 dark:text-gray-400">{sentimentData.neutral}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gray-500 h-2 rounded-full transition-all"
              style={{ width: `${sentimentData.neutral}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-600 dark:text-red-400 font-medium">Negative</span>
            <span className="text-gray-600 dark:text-gray-400">{sentimentData.negative}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${sentimentData.negative}%` }}
            />
          </div>
        </div>
      </div>

      {sentimentData.keywords && sentimentData.keywords.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Trending Keywords:</p>
          <div className="flex flex-wrap gap-2">
            {sentimentData.keywords.map((keyword: string, i: number) => (
              <span 
                key={i}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Based on {sentimentData.totalTweets.toLocaleString()} estimated social media reactions
        </p>
        {tweets && tweets.length > 0 && (
          <button
            onClick={() => setShowTweets(!showTweets)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showTweets ? 'Hide' : 'View'} Tweets
          </button>
        )}
      </div>

      {showTweets && tweets && tweets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3 max-h-96 overflow-y-auto">
          {tweets.map((tweet: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{tweet.text}</p>
                  {tweet.sentiment && (
                    <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
                      tweet.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      tweet.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {tweet.sentiment}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
