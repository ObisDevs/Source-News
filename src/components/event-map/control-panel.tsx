'use client';

import { useState, memo } from 'react';

interface ControlPanelProps {
  viewMode: 'default' | 'heatmap' | 'clusters';
  onViewModeChange: (mode: 'default' | 'heatmap' | 'clusters') => void;
  selectedStory: any;
  onClose: () => void;
  totalStories: number;
  filters?: any;
  onFiltersChange?: (filters: any) => void;
  heatmapMode?: 'engagement' | 'temporal' | 'controversy';
  onHeatmapModeChange?: (mode: 'engagement' | 'temporal' | 'controversy') => void;
  isMobile?: boolean;
}

export const ControlPanel = memo(function ControlPanel({ viewMode, onViewModeChange, selectedStory, onClose, totalStories, filters, onFiltersChange, heatmapMode, onHeatmapModeChange, isMobile }: ControlPanelProps) {
  const [minimized, setMinimized] = useState(false);
  
  return (
    <>
      <div className={`fixed ${isMobile ? 'bottom-2 left-2 right-2' : 'bottom-4 left-4'} z-10 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg ${isMobile ? 'p-2' : 'p-4'} text-white shadow-xl ${isMobile ? 'max-w-full' : 'w-64'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>View Mode</h3>
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-800 rounded transition-colors"
          >
            {minimized ? '▲' : '▼'}
          </button>
        </div>
        
        {!minimized && (
          <>
            <div className={`${isMobile ? 'flex gap-1' : 'space-y-2'}`}>
              <button
                onClick={() => onViewModeChange('default')}
                className={`${isMobile ? 'flex-1 px-2 py-1 text-xs' : 'w-full px-3 py-2 text-sm'} rounded transition-colors ${
                  viewMode === 'default'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {isMobile ? 'Board' : 'Investigation Board'}
              </button>
              <button
                onClick={() => onViewModeChange('heatmap')}
                className={`${isMobile ? 'flex-1 px-2 py-1 text-xs' : 'w-full px-3 py-2 text-sm'} rounded transition-colors ${
                  viewMode === 'heatmap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Heatmap
              </button>
              <button
                onClick={() => onViewModeChange('clusters')}
                className={`${isMobile ? 'flex-1 px-2 py-1 text-xs' : 'w-full px-3 py-2 text-sm'} rounded transition-colors ${
                  viewMode === 'clusters'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Clusters
              </button>
            </div>
            
            {viewMode === 'heatmap' && heatmapMode && onHeatmapModeChange && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <h4 className="text-xs font-bold mb-2">Heatmap Type</h4>
                <div className="space-y-1">
                  {(['engagement', 'temporal', 'controversy'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => onHeatmapModeChange(mode)}
                      className={`w-full px-2 py-1 rounded text-xs transition-colors ${
                        heatmapMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                <div className="flex justify-between mb-1">
                  <span>Total Stories:</span>
                  <span className="font-bold text-white">{totalStories}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedStory && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={onClose}
          />
          <div className={`absolute ${isMobile ? 'top-2 left-2 right-2' : 'top-20 right-4'} z-30 bg-gray-900/95 backdrop-blur-sm border-2 border-blue-500 rounded-lg ${isMobile ? 'p-3' : 'p-5'} text-white ${isMobile ? 'max-w-full' : 'max-w-md'} shadow-2xl`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-sm">Story Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              {(selectedStory.metadata?.image || selectedStory.metadata?.og_image) && (
                <img
                  src={selectedStory.metadata.image || selectedStory.metadata.og_image}
                  alt=""
                  className={`w-full ${isMobile ? 'h-32' : 'h-40'} object-cover rounded`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              
              <h4 className="font-semibold text-white line-clamp-3">{selectedStory.title}</h4>
              
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${getCategoryColor(selectedStory.category)}`}>
                  {selectedStory.category}
                </span>
                <span className="text-gray-400">
                  {new Date(selectedStory.published_at).toLocaleDateString()}
                </span>
              </div>
              
              {selectedStory.sources && (
                <div className="text-xs text-gray-400">
                  Source: {selectedStory.sources.name}
                </div>
              )}
              
              <div className="flex gap-2">
                <a
                  href={`/story/${selectedStory.id}`}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-center text-sm font-medium transition-colors"
                >
                  View Story
                </a>
                <button
                  onClick={onClose}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Politics: 'bg-blue-600',
    Business: 'bg-green-600',
    Sports: 'bg-yellow-600',
    Technology: 'bg-purple-600',
    Entertainment: 'bg-pink-600',
    Health: 'bg-red-600',
    General: 'bg-gray-600',
  };
  return colors[category] || colors.General;
}
