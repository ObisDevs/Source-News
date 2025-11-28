'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GridBoardProps {
  stories: any[];
  onStoryClick: (story: any) => void;
}

export function GridBoard({ stories, onStoryClick }: GridBoardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['Politics', 'Business', 'Sports', 'Technology', 'Entertainment', 'Health', 'General'];
  
  const groupedStories = categories.reduce((acc, cat) => {
    acc[cat] = stories.filter(s => (s.category || 'General') === cat);
    return acc;
  }, {} as Record<string, any[]>);

  const displayStories = selectedCategory 
    ? groupedStories[selectedCategory] || []
    : stories;

  return (
    <div className="h-full overflow-y-auto bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({stories.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat} ({groupedStories[cat]?.length || 0})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayStories.map((story) => (
            <StoryCard key={story.id} story={story} onClick={() => onStoryClick(story)} />
          ))}
        </div>

        {displayStories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No stories in this category
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCard({ story, onClick }: { story: any; onClick: () => void }) {
  const categoryColors: Record<string, string> = {
    Politics: 'bg-blue-600',
    Business: 'bg-green-600',
    Sports: 'bg-yellow-600',
    Technology: 'bg-purple-600',
    Entertainment: 'bg-pink-600',
    Health: 'bg-red-600',
    General: 'bg-gray-600',
  };

  const category = story.category || 'General';
  const bgColor = categoryColors[category] || categoryColors.General;
  const imageUrl = story.metadata?.image || story.metadata?.og_image;
  const hoursSince = (Date.now() - new Date(story.published_at).getTime()) / (1000 * 60 * 60);
  const isRecent = hoursSince < 6;

  return (
    <div
      onClick={onClick}
      className="group bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/20"
    >
      {imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {isRecent && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
              NEW
            </div>
          )}
          {story.cluster_id && (
            <div className="absolute top-2 left-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className={`inline-block px-2 py-1 ${bgColor} text-white text-xs font-bold rounded mb-2`}>
          {category}
        </div>

        <h3 className="text-white font-bold text-sm mb-2 line-clamp-3 group-hover:text-blue-400 transition-colors">
          {story.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{story.sources?.name || 'Unknown'}</span>
          <span>{new Date(story.published_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
