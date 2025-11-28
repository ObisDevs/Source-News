'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const categoryColors: Record<string, string> = {
  Politics: '#3b82f6',
  Business: '#10b981',
  Sports: '#f59e0b',
  Technology: '#8b5cf6',
  Entertainment: '#ec4899',
  Health: '#ef4444',
  General: '#6b7280',
};

export function EnhancedStoryNodes({ stories, onStoryClick, viewMode }: { stories: any[]; onStoryClick: (s: any) => void; viewMode?: string }) {
  const storyPositions = useMemo(() => {
    return stories.map((story, index) => ({
      story,
      position: calculatePosition(story, index, stories.length),
      color: categoryColors[story.category] || categoryColors.General,
      size: 0.9 + ((story.metadata?.credibility_score || 50) / 100) * 0.8
    }));
  }, [stories]);

  return (
    <group>
      {storyPositions.map(({ story, position, color, size }, index) => (
        <EnhancedNode
          key={story.id}
          story={story}
          position={position}
          color={color}
          size={viewMode === 'clusters' ? size * 0.7 : size}
          onClick={() => onStoryClick(story)}
        />
      ))}
    </group>
  );
}

function EnhancedNode({ story, position, color, size, onClick }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerOver = () => {
    setHovered(true);
    hoverTimeoutRef.current = setTimeout(() => setTooltipVisible(true), 100);
  };

  const handlePointerOut = () => {
    setHovered(false);
    setTooltipVisible(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[size, 20, 20]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={hovered ? 0.4 : 0.1} 
          metalness={0.3} 
          roughness={0.5}
        />
      </mesh>

      {tooltipVisible && (
        <Html 
          position={[position[0], position[1] + 2, position[2]]} 
          center 
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl p-3 w-72 animate-in fade-in duration-200">
            {(story.metadata?.image || story.metadata?.og_image) && (
              <img
                src={story.metadata.image || story.metadata.og_image}
                alt=""
                className="w-full h-32 object-cover rounded mb-2"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className={`text-xs font-bold mb-2 px-2 py-1 rounded inline-block ${getCategoryBg(story.category)}`}>
              {story.category || 'General'}
            </div>
            <h3 className="text-sm font-bold text-white line-clamp-3 mb-2 leading-tight">
              {story.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="truncate">{story.sources?.name || 'Unknown'}</span>
              <span>{new Date(story.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function calculatePosition(story: any, index: number, total: number): [number, number, number] {
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

function getCategoryBg(category: string): string {
  const colors: Record<string, string> = {
    Politics: 'bg-blue-600 text-white',
    Business: 'bg-green-600 text-white',
    Sports: 'bg-yellow-600 text-white',
    Technology: 'bg-purple-600 text-white',
    Entertainment: 'bg-pink-600 text-white',
    Health: 'bg-red-600 text-white',
    General: 'bg-gray-600 text-white',
  };
  return colors[category] || colors.General;
}
