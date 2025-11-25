'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface VerticalTimelineCardProps {
  story: {
    id: string;
    title: string;
    published_at: string;
    category?: string;
    sources?: { name: string; bias_lean?: string };
    metadata?: { image?: string; og_image?: string };
  };
  index: number;
  isLeft: boolean;
  isCenter?: boolean;
}

export function VerticalTimelineCard({ story, index, isLeft, isCenter }: VerticalTimelineCardProps) {
  const imageUrl = story.metadata?.image || story.metadata?.og_image;
  const publishedTime = new Date(story.published_at);
  
  const biasColors = {
    left: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
    centre: 'border-gray-400 bg-gray-50 dark:bg-gray-950/20',
    right: 'border-red-400 bg-red-50 dark:bg-red-950/20',
  };
  
  const biasColor = biasColors[story.sources?.bias_lean as keyof typeof biasColors] || biasColors.centre;

  return (
    <div className="relative group">
      {/* Time and connector */}
      {!isCenter && (
        <div className={`absolute top-4 ${isLeft ? '-right-20' : '-left-20'} flex items-center ${isLeft ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`text-xs font-sans text-gray-600 dark:text-gray-400 ${isLeft ? 'mr-3' : 'ml-3'}`}>
            {publishedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10 transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/50"></div>
        </div>
      )}

      {/* Card */}
      <Link href={`/story/${story.id}`}>
        <div className={`p-4 rounded-lg border ${biasColor} shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 group aspect-[7/4] bg-white dark:bg-gray-800 mb-4 transform hover:-translate-y-2 animate-fade-in-up`} style={{ animationDelay: `${index * 100}ms` }}>
          <div className="h-full flex flex-col">
            {imageUrl && (
              <div className="w-full h-20 rounded overflow-hidden mb-3">
                <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-white mb-2">
                {story.title}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium truncate">{story.sources?.name}</span>
                <div className="flex items-center gap-2">
                  {isCenter && (
                    <span className="text-xs font-sans text-blue-600 dark:text-blue-400 font-medium">
                      {publishedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {story.category && (
                    <span className="px-2 py-1 bg-white/60 dark:bg-black/40 rounded-full">
                      {story.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}