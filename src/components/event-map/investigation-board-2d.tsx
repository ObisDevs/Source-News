'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface InvestigationBoard2DProps {
  stories: any[];
  onStoryClick: (story: any) => void;
}

interface Position {
  x: number;
  y: number;
  rotation: number;
}

export function InvestigationBoard2D({ stories, onStoryClick }: InvestigationBoard2DProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { positions, clusterGroups, connections } = useMemo(() => {
    const newPositions = new Map<string, Position>();
    const clusters = new Map<string, any[]>();
    
    stories.forEach(story => {
      const clusterId = story.cluster_id || story.category || 'general';
      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, []);
      }
      clusters.get(clusterId)!.push(story);
    });

    const clusterArray = Array.from(clusters.entries());
    const conns: Array<{ from: Position; to: Position; clusterId: string }> = [];

    clusterArray.forEach(([clusterId, clusterStories], clusterIndex) => {
      const angle = (clusterIndex / clusterArray.length) * Math.PI * 2;
      const radius = 350;
      const centerX = Math.cos(angle) * radius;
      const centerY = Math.sin(angle) * radius;

      const gridSize = Math.ceil(Math.sqrt(clusterStories.length));
      clusterStories.forEach((story, idx) => {
        const row = Math.floor(idx / gridSize);
        const col = idx % gridSize;
        const offsetX = (col - gridSize / 2) * 220;
        const offsetY = (row - gridSize / 2) * 220;
        const rotation = (idx * 7) % 15 - 7.5;

        const pos = {
          x: centerX + offsetX,
          y: centerY + offsetY,
          rotation
        };
        newPositions.set(story.id, pos);

        if (idx > 0) {
          const prevPos = newPositions.get(clusterStories[idx - 1].id);
          if (prevPos) {
            conns.push({ from: prevPos, to: pos, clusterId });
          }
        }
      });
    });

    return { positions: newPositions, clusterGroups: clusters, connections: conns };
  }, [stories]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(z => Math.max(0.4, Math.min(2.5, z + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const container = document.getElementById('investigation-board-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel])

  return (
    <div 
      id="investigation-board-container" 
      className="relative w-full h-full overflow-hidden bg-gray-950 select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
        >
          Reset
        </button>
        <div className="px-3 py-1.5 text-white text-sm">
          {clusterGroups.size} Clusters • {stories.length} Stories
        </div>
      </div>

      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)',
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          transition: isDragging ? 'none' : 'background-position 0.1s'
        }}
      />

      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
      >
        {connections.map((conn, idx) => (
          <line
            key={idx}
            x1={conn.from.x + window.innerWidth / 2}
            y1={conn.from.y + window.innerHeight / 2}
            x2={conn.to.x + window.innerWidth / 2}
            y2={conn.to.y + window.innerHeight / 2}
            stroke="#dc2626"
            strokeWidth={2 / zoom}
            opacity="0.4"
            strokeDasharray="5,5"
          />
        ))}
      </svg>

      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.1s'
        }}
      >
        <div className="relative" style={{ width: '100%', height: '100%' }}>
          {stories.map(story => {
            const pos = positions.get(story.id);
            if (!pos) return null;

            return (
              <StoryCard
                key={story.id}
                story={story}
                x={pos.x}
                y={pos.y}
                rotation={pos.rotation}
                onClick={() => onStoryClick(story)}
                zoom={zoom}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StoryCard({ story, x, y, rotation, onClick, zoom }: any) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const categoryColors: Record<string, string> = {
    Politics: 'border-blue-500 bg-blue-500',
    Business: 'border-green-500 bg-green-500',
    Sports: 'border-yellow-500 bg-yellow-500',
    Technology: 'border-purple-500 bg-purple-500',
    Entertainment: 'border-pink-500 bg-pink-500',
    Health: 'border-red-500 bg-red-500',
    General: 'border-gray-500 bg-gray-500',
  };

  const category = story.category || 'General';
  const colorClass = categoryColors[category] || categoryColors.General;
  const imageUrl = story.metadata?.image || story.metadata?.og_image;

  const handleMouseEnter = (e: React.MouseEvent) => {
    setShowTooltip(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  return (
    <>
      <div
        className={`absolute w-56 bg-gray-900 border-2 ${colorClass.split(' ')[0]} rounded-lg shadow-xl cursor-pointer hover:shadow-2xl hover:scale-105 hover:z-50 transition-all duration-200 pointer-events-auto`}
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          willChange: 'transform',
        }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full shadow-lg border-2 border-gray-900">
          <div className="absolute inset-1 bg-gray-200 rounded-full"></div>
        </div>

        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-28 object-cover rounded-t"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        <div className="p-2.5">
          <div className={`inline-block px-2 py-0.5 text-xs font-bold rounded mb-1.5 ${colorClass.split(' ')[1]} text-white`}>
            {category}
          </div>

          <h3 className="text-xs font-bold text-white line-clamp-2 mb-1.5 leading-tight">
            {story.title}
          </h3>

          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span className="truncate max-w-[60%]">{story.sources?.name || 'Unknown'}</span>
            <span>{new Date(story.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {showTooltip && zoom < 0.8 && (
        <div
          className="fixed z-[100] bg-gray-800 text-white px-3 py-2 rounded-lg shadow-xl text-sm max-w-xs pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-bold mb-1">{story.title}</div>
          <div className="text-xs text-gray-300">{category} • {story.sources?.name || 'Unknown'}</div>
        </div>
      )}
    </>
  );
}
