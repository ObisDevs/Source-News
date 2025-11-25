'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  title: string;
  url: string;
  published_at: string;
  metadata: any;
  sources: {
    name: string;
  };
}

export function NewsCarousel({ stories }: { stories: Story[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    if (!isAutoPlaying || stories.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % storiesWithImages.length;
        setImageKey(k => k + 1);
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, stories.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const next = (prev - 1 + storiesWithImages.length) % storiesWithImages.length;
      setImageKey(k => k + 1);
      return next;
    });
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const next = (prev + 1) % storiesWithImages.length;
      setImageKey(k => k + 1);
      return next;
    });
  };

  if (stories.length === 0) return null;
  
  // Filter stories with images
  const storiesWithImages = stories.filter(s => s?.metadata?.image || s?.metadata?.og_image);
  
  // Don't show carousel if no images available
  if (storiesWithImages.length === 0) return null;

  const currentStory = storiesWithImages[currentIndex % storiesWithImages.length];
  if (!currentStory) return null;
  
  const imageUrl = currentStory.metadata?.image || currentStory.metadata?.og_image;
  if (!imageUrl) return null;

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-gray-900">
      {/* Background Image */}
      <div 
        key={imageKey}
        className="absolute inset-0 transition-opacity duration-700 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${imageUrl})`,
          filter: 'brightness(0.4)'
        }}
      />

      {/* Content Overlay */}
      <Link href={`/story/${currentStory.id}`} className="absolute inset-0 flex items-end group cursor-pointer">
        <div className="w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 sm:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {currentStory.title}
            </h2>
            
            <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base text-gray-300">
              <span className="font-medium">{currentStory.sources?.name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(currentStory.published_at), { addSuffix: true })}</span>
            </div>

            {/* Dots Indicator */}
            <div className="flex gap-2 mt-4 sm:mt-6">
              {storiesWithImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setImageKey(k => k + 1);
                    setIsAutoPlaying(false);
                  }}
                  className={`h-1 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-8 bg-white' 
                      : 'w-4 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Navigation Buttons */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToPrevious();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
