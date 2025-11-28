'use client';

import { useState } from 'react';

interface TimeSliderProps {
  onTimeChange: (daysAgo: number) => void;
  maxDays?: number;
}

export function TimeSlider({ onTimeChange, maxDays = 30 }: TimeSliderProps) {
  const [daysAgo, setDaysAgo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleChange = (value: number) => {
    setDaysAgo(value);
    onTimeChange(value);
  };

  return (
    <div className="absolute bottom-20 left-4 right-4 z-10 bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={maxDays}
            value={daysAgo}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Today</span>
            <span className="font-bold text-white">
              {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
            </span>
            <span>{maxDays} days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
