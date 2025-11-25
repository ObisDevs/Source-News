'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface BubbleTimelineCardProps {
  story: {
    id: string;
    title: string;
    published_at: string;
    category?: string;
    sources?: { name: string; bias_lean?: string };
    metadata?: { image?: string; og_image?: string };
  };
  index: number;
  importance: number;
}

export function BubbleTimelineCard({ story, index, importance }: BubbleTimelineCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const size = 180 + (importance * 80);
  const verticalOffset = (index % 3) * 40 - 40;
  const imageUrl = story.metadata?.image || story.metadata?.og_image;
  
  const biasColors = {
    left: 'from-blue-400/20 to-blue-600/20 border-blue-400/40',
    centre: 'from-gray-400/20 to-gray-600/20 border-gray-400/40',
    right: 'from-red-400/20 to-red-600/20 border-red-400/40',
  };
  
  const biasColor = biasColors[story.sources?.bias_lean as keyof typeof biasColors] || biasColors.centre;

  return (
    <div
      className={`absolute transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translateY(${verticalOffset}px)`,
        animation: 'float 6s ease-in-out infinite',
        animationDelay: `${index * 0.5}s`,
      }}
    >
      <Link href={`/story/${story.id}`}>
        <div
          className={`relative w-full h-full rounded-full bg-gradient-to-br ${biasColor} backdrop-blur-md border-2 overflow-hidden group hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-2xl`}
        >
          {imageUrl && (
            <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <h3 className="font-bold text-sm line-clamp-3 text-gray-900 dark:text-white mb-2 group-hover:scale-105 transition-transform">
              {story.title}
            </h3>
            
            <div className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">
              {story.sources?.name}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}
            </div>
            
            {story.category && (
              <span className="mt-2 px-2 py-1 text-xs bg-white/60 dark:bg-black/40 rounded-full backdrop-blur-sm">
                {story.category}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
