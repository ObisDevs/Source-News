'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './auth/auth-provider';

export function TrackReading({ storyId }: { storyId: string }) {
  const { user } = useAuth();
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!user || !storyId) return;

    const trackReading = () => {
      const readTime = Math.floor((Date.now() - startTime.current) / 1000);
      fetch('/api/reading-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, readTime }),
        credentials: 'include',
      }).catch(() => {});
    };

    trackReading();
    const interval = setInterval(trackReading, 30000);

    return () => clearInterval(interval);
  }, [user, storyId]);

  return null;
}
