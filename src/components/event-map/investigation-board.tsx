'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface InvestigationBoardProps {
  stories: any[];
  onStoryClick: (story: any) => void;
}

export function InvestigationBoard({ stories, onStoryClick }: InvestigationBoardProps) {
  return (
    <group>
      {stories.map((story, index) => (
        <StoryCard
          key={story.id}
          story={story}
          index={index}
          totalStories={stories.length}
          onClick={() => onStoryClick(story)}
        />
      ))}
    </group>
  );
}

function StoryCard({ story, index, totalStories, onClick }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const position = calculateBoardPosition(story, index, totalStories);
  const rotation = [
    (Math.random() - 0.5) * 0.15,
    (Math.random() - 0.5) * 0.1,
    (Math.random() - 0.5) * 0.2
  ] as [number, number, number];

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(time + index) * 0.05;
      
      if (hovered) {
        groupRef.current.scale.setScalar(1.05);
      } else {
        groupRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <planeGeometry args={[4, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      <Html
        position={[0, 0, 0.02]}
        transform
        occlude
        style={{
          width: '360px',
          pointerEvents: 'none',
        }}
      >
        <div className="p-3 text-gray-900 bg-white rounded">
          {(story.metadata?.image || story.metadata?.og_image) && (
            <img
              src={story.metadata.image || story.metadata.og_image}
              alt=""
              className="w-full h-36 object-cover rounded mb-2"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className={`text-xs font-bold mb-2 px-2 py-1 rounded inline-block ${getCategoryBg(story.category)}`}>
            {story.category || 'General'}
          </div>
          <h3 className="text-sm font-bold mb-1 line-clamp-3">
            {story.title}
          </h3>
          <div className="text-xs text-gray-600">
            {new Date(story.published_at).toLocaleDateString()}
          </div>
        </div>
      </Html>

      <mesh position={[0, 2.8, 0.02]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function calculateBoardPosition(story: any, index: number, total: number): [number, number, number] {
  const categoryZones: Record<string, { x: number; z: number }> = {
    Politics: { x: -15, z: 0 },
    Business: { x: 15, z: 0 },
    Sports: { x: 0, z: -15 },
    Technology: { x: 0, z: 15 },
    Entertainment: { x: -15, z: 15 },
    Health: { x: 15, z: -15 },
    General: { x: 0, z: 0 },
  };

  const category = story.category || 'General';
  const zone = categoryZones[category] || categoryZones.General;
  
  const hoursSincePublished = (Date.now() - new Date(story.published_at).getTime()) / (1000 * 60 * 60);
  const y = 10 - (hoursSincePublished / 24) * 3;
  
  const clusterOffset = story.cluster_id ? 
    (parseInt(story.cluster_id.slice(-4), 16) % 10) - 5 : 
    (Math.random() - 0.5) * 8;
  
  const x = zone.x + clusterOffset + (Math.random() - 0.5) * 2;
  const z = zone.z + clusterOffset + (Math.random() - 0.5) * 2;

  return [x, y, z];
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

function getCategoryBg(category: string): string {
  const colors: Record<string, string> = {
    Politics: 'bg-blue-100 text-blue-800',
    Business: 'bg-green-100 text-green-800',
    Sports: 'bg-yellow-100 text-yellow-800',
    Technology: 'bg-purple-100 text-purple-800',
    Entertainment: 'bg-pink-100 text-pink-800',
    Health: 'bg-red-100 text-red-800',
    General: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || colors.General;
}
