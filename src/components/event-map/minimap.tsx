'use client';

import { useRef, useEffect, useMemo } from 'react';

interface MinimapProps {
  stories: any[];
  cameraPosition?: [number, number, number];
}

export function Minimap({ stories, cameraPosition }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clusterGroups = useMemo(() => {
    const groups = new Map<string, any[]>();
    stories.forEach(story => {
      const key = story.cluster_id || story.category || 'general';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(story);
    });
    return groups;
  }, [stories]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = 2.5;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo((i * w) / 10, 0);
      ctx.lineTo((i * w) / 10, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (i * h) / 10);
      ctx.lineTo(w, (i * h) / 10);
      ctx.stroke();
    }

    // Draw cluster bubbles
    clusterGroups.forEach((clusterStories, clusterId) => {
      if (clusterStories.length < 2) return;

      const positions = clusterStories.map(s => getPosition(s, 0, stories.length));
      const centerX = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
      const centerZ = positions.reduce((sum, p) => sum + p[2], 0) / positions.length;
      
      const maxDist = Math.max(...positions.map(p => 
        Math.sqrt(Math.pow(p[0] - centerX, 2) + Math.pow(p[2] - centerZ, 2))
      ));

      const x = (centerX / scale) + w / 2;
      const y = (centerZ / scale) + h / 2;
      const radius = (maxDist / scale) * 1.5;

      const category = clusterStories[0].category || 'General';
      const color = getCategoryColor(category);

      ctx.fillStyle = color + '20';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Draw story dots
    stories.forEach((story, idx) => {
      const pos = getPosition(story, idx, stories.length);
      const x = (pos[0] / scale) + w / 2;
      const y = (pos[2] / scale) + h / 2;
      
      ctx.fillStyle = getCategoryColor(story.category);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw viewport indicator
    if (cameraPosition) {
      const x = (cameraPosition[0] / scale) + w / 2;
      const y = (cameraPosition[2] / scale) + h / 2;
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [stories, cameraPosition, clusterGroups]);

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-2 shadow-xl">
      <div className="text-xs font-bold text-white mb-1">Overview</div>
      <canvas
        ref={canvasRef}
        width={180}
        height={180}
        className="rounded border border-gray-800"
      />
      <div className="text-[10px] text-gray-400 text-center mt-1">{stories.length} stories</div>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Politics: '#3b82f6',
    Business: '#10b981',
    Sports: '#f59e0b',
    Technology: '#8b5cf6',
    Entertainment: '#ec4899',
    Health: '#ef4444',
    General: '#6b7280',
  };
  return colors[category] || colors.General;
}

function getPosition(story: any, index: number, total: number): [number, number, number] {
  if (story.position_3d) {
    return [story.position_3d.x, story.position_3d.y, story.position_3d.z];
  }

  const categoryZones: Record<string, { x: number; z: number }> = {
    Politics: { x: -20, z: 0 },
    Business: { x: 20, z: 0 },
    Sports: { x: 0, z: -20 },
    Technology: { x: 0, z: 20 },
    Entertainment: { x: -20, z: 20 },
    Health: { x: 20, z: -20 },
    General: { x: 0, z: 0 },
  };

  const category = story.category || 'General';
  const zone = categoryZones[category] || categoryZones.General;
  
  const hoursSincePublished = (Date.now() - new Date(story.published_at).getTime()) / (1000 * 60 * 60);
  const y = 15 - (hoursSincePublished / 24) * 4;
  
  const clusterOffset = story.cluster_id ? 
    (parseInt(story.cluster_id.slice(-4), 16) % 12) - 6 : 
    (Math.random() - 0.5) * 10;
  
  const x = zone.x + clusterOffset + (Math.random() - 0.5) * 3;
  const z = zone.z + clusterOffset + (Math.random() - 0.5) * 3;

  return [x, y, z];
}
