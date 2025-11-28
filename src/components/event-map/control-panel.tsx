'use client';

import React from 'react';

export default function ControlPanel({
  selected,
  stories,
  onCenter,
}: {
  selected: any | null;
  stories: any[];
  onCenter: (pos: { x: number; y: number; z: number } | null) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Controls</h2>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-gray-300">View Mode</label>
        <select className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2">
          <option>Semantic Layout</option>
          <option>Force Layout</option>
          <option>Heatmap</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-gray-300">Filters</label>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Politics</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Business</span>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected</h3>
        {selected ? (
          <div className="mt-2 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selected.title}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">{selected.category}</div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onCenter(selected.position_3d || null)}
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs"
              >
                Center
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">No story selected</div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Legend</h3>
        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>Blue: Politics</li>
          <li>Green: Business</li>
          <li>Orange: Sports</li>
          <li>Purple: Technology</li>
        </ul>
      </div>
    </div>
  );
}
'use client';

interface ControlPanelProps {
  viewMode: 'default' | 'heatmap' | 'clusters';
  onViewModeChange: (mode: 'default' | 'heatmap' | 'clusters') => void;
  selectedStory: any;
  onClose: () => void;
  totalStories: number;
}

export function ControlPanel({ viewMode, onViewModeChange, selectedStory, onClose, totalStories }: ControlPanelProps) {
  return (
    <>
      <div className="absolute bottom-4 left-4 z-10 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white">
        <h3 className="font-bold mb-3 text-sm">View Mode</h3>
        <div className="space-y-2">
          <button
            onClick={() => onViewModeChange('default')}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              viewMode === 'default'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Default
          </button>
          <button
            onClick={() => onViewModeChange('heatmap')}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => onViewModeChange('clusters')}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              viewMode === 'clusters'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Clusters
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <div className="flex justify-between mb-1">
              <span>Total Stories:</span>
              <span className="font-bold text-white">{totalStories}</span>
            </div>
          </div>
        </div>
      </div>

      {selectedStory && (
        <div className="absolute top-20 right-4 z-10 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white max-w-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-sm">Story Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold text-white line-clamp-2">{selectedStory.title}</h4>
            
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
            
            <a
              href={`/story/${selectedStory.id}`}
              className="block mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-center text-sm"
            >
              View Full Story
            </a>
          </div>
        </div>
      )}
    </>
  );
}

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
