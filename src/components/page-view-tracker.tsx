'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics/tracker';

export function PageViewTracker({ page, category }: { page: string; category?: string }) {
  useEffect(() => {
    analytics.pageView(page);
    if (category) {
      analytics.categoryView(category);
    }
  }, [page, category]);

  return null;
}
