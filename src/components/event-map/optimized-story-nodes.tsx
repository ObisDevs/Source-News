'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
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

export function OptimizedStoryNodes({ stories, onStoryClick, viewMode }: { stories: any[]; onStoryClick: (s: any) => void; viewMode?: string }) {
  return (
    <group>
      {stories.map((story, index) => (
        <StoryNode
          key={story.id}
          story={story}
          index={index}
          totalStories={stories.length}
          onClick={() => onStoryClick(story)}
          viewMode={viewMode}
        />
      ))}
    </group>
  );
}

function StoryNode({ story, index, totalStories, onClick, viewMode }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = useMemo(() => calculatePosition(story, index, totalStories), [story, index, totalStories]);
  const color = categoryColors[story.category] || categoryColors.General;
  const size = 1.2;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={hovered ? 0.4 : 0.1} 
          metalness={0.3} 
          roughness={0.5}
        />
      </mesh>

      <Text
        position={[0, size + 0.8, 0]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
        textAlign="center"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {story.title.substring(0, 50)}...
      </Text>

      {hovered && (
        <Html
          position={[0, -size - 2, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 w-64 shadow-xl">
            {(story.metadata?.image || story.metadata?.og_image) && (
              <img
                src={story.metadata.image || story.metadata.og_image}
                alt=""
                className="w-full h-24 object-cover rounded mb-2"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className={`inline-block px-2 py-1 text-xs font-bold rounded mb-1 ${getCategoryBg(story.category)}`}>
              {story.category || 'General'}
            </div>
            <h3 className="text-sm font-bold text-white line-clamp-2 mb-1">
              {story.title}
            </h3>
            <div className="text-xs text-gray-400">
              {story.sources?.name} • {new Date(story.published_at).toLocaleDateString()}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function calculatePosition(story: any, index: number, total: number): [number, number, number] {
  const categoryZones: Record<string, { x: number; z: number }> = {
    Politics: { x: -25, z: 0 },
    Business: { x: 25, z: 0 },
    Sports: { x: 0, z: -25 },
    Technology: { x: 0, z: 25 },
    Entertainment: { x: -25, z: 25 },
    Health: { x: 25, z: -25 },
    General: { x: 0, z: 0 },
  };

  const category = story.category || 'General';
  const zone = categoryZones[category] || categoryZones.General;
  
  const clusterOffset = story.cluster_id ? 
    (parseInt(story.cluster_id.slice(-4), 16) % 15) - 7.5 : 
    (Math.random() - 0.5) * 12;
  
  const x = zone.x + clusterOffset + (Math.random() - 0.5) * 4;
  const y = (Math.random() - 0.5) * 8;
  const z = zone.z + clusterOffset + (Math.random() - 0.5) * 4;

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
