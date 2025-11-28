'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const EventMapVisualization = dynamic(() => import('@/components/event-map/visualization'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900">
      <div className="text-gray-700 dark:text-gray-200">Loading 3D Event Map...</div>
    </div>
  ),
});

export default function EventMapPage() {
  return (
    <div className="h-[80vh] bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700"
        >
          ← Back
        </Link>
      </div>

      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <EventMapVisualization />
      </Suspense>
    </div>
  );
}
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const EventMapVisualization = dynamic(() => import('@/components/event-map/event-map-visualization'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="text-white">Loading 3D Event Map...</div>
    </div>
  ),
});

export default function EventMapPage() {
  return (
    <div className="h-screen bg-gray-950 overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium border border-gray-700"
        >
          ← Back
        </Link>
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-white text-sm">
          <h3 className="font-bold mb-2">Controls</h3>
          <ul className="space-y-1 text-xs text-gray-300">
            <li>• Drag to rotate</li>
            <li>• Scroll to zoom</li>
            <li>• Click nodes for details</li>
          </ul>
        </div>
      </div>

      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white">Loading...</div>}>
        <EventMapVisualization />
      </Suspense>
    </div>
  );
}
