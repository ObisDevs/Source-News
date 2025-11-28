'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

const EventMapVisualization = dynamic(() => import('@/components/event-map/event-map-visualization'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="text-white">Loading 3D Event Map...</div>
    </div>
  ),
});

export default function EventMapPage() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  
  return (
    <div className="h-screen bg-gray-950 overflow-hidden touch-none">
      {!isFullscreen && (
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium border border-gray-700"
          >
            ← Back
          </Link>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium border border-gray-700 flex items-center gap-2"
          title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Fullscreen
            </>
          )}
        </button>
      </div>
      
      {!isMobile && !isFullscreen && (
        <div className="absolute top-16 right-4 z-10">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-white text-sm">
            <h3 className="font-bold mb-2">Controls</h3>
            <ul className="space-y-1 text-xs text-gray-300">
              <li>• Drag to rotate</li>
              <li>• Scroll to zoom</li>
              <li>• Click nodes for details</li>
            </ul>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700 text-white text-xs">
          Press <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">ESC</kbd> to exit fullscreen
        </div>
      )}

      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white">Loading...</div>}>
        <EventMapVisualization />
      </Suspense>
    </div>
  );
}
