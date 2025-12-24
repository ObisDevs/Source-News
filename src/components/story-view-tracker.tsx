'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics/tracker';

export function StoryViewTracker({ storyId }: { storyId: string }) {
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      maxScroll.current = Math.max(maxScroll.current, scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      analytics.storyView(storyId, timeSpent, Math.round(maxScroll.current));
      
      if (maxScroll.current > 80 && timeSpent > 30) {
        analytics.storyComplete(storyId, timeSpent);
      }
    };
  }, [storyId]);

  return null;
}
