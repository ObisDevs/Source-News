'use client';

import { useState } from 'react';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const AI_FEATURES: AIFeature[] = [
  { id: 'summary', title: 'AI Summary', description: 'Get a concise summary', icon: 'S' },
  { id: 'eli5', title: 'Explain Like I\'m 5', description: 'Simple explanation', icon: 'E' },
  { id: 'sentiment', title: 'Sentiment Analysis', description: 'Emotional tone analysis', icon: 'SE' },
  { id: 'bias', title: 'Bias Detection', description: 'Political lean analysis', icon: 'B' },
  { id: 'fact_check', title: 'Fact Check', description: 'Verify key claims', icon: 'F' },
  { id: 'context', title: 'Historical Context', description: 'Background information', icon: 'H' },
  { id: 'impact', title: 'Impact Analysis', description: 'Who is affected', icon: 'I' },
  { id: 'timeline', title: 'Timeline', description: 'Event chronology', icon: 'T' },
];

export function StoryAIFeatures({ 
  storyId, 
  storyTitle, 
  storyContent 
}: { 
  storyId: string; 
  storyTitle: string; 
  storyContent: string;
}) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFeatureClick = async (featureId: string) => {
    setActiveFeature(featureId);
    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`/api/story/${storyId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feature: featureId,
          title: storyTitle,
          content: storyContent 
        }),
      });

      const data = await response.json();
      setResult(data.result || 'No result available');
    } catch (error) {
      setResult('Failed to generate AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-6 bg-white dark:bg-gray-900 shadow-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">AI-Powered Insights</h2>
      
      {/* Feature Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {AI_FEATURES.map((feature) => (
          <button
            key={feature.id}
            onClick={() => handleFeatureClick(feature.id)}
            className={`p-3 sm:p-4 border rounded-lg text-left transition-all ${
              activeFeature === feature.id 
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-500' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 mb-2 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm">{feature.icon}</div>
            <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">{feature.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{feature.description}</div>
          </button>
        ))}
      </div>

      {/* Result Display */}
      {activeFeature && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">
            {AI_FEATURES.find(f => f.id === activeFeature)?.title}
          </h3>
          
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>Generating AI response...</span>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{result}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
