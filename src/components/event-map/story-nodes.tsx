/*
  StoryNodes - merged implementation
  Renders nodes as spheres with simple hover effect and click handler.
*/

'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
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

export default function StoryNodes({ stories, onSelect }: { stories: any[]; onSelect: (s: any) => void }) {
  return (
    <group>
      {stories.map((story, index) => (
        <Node
          key={story.id}
          story={story}
          index={index}
          totalStories={stories.length}
          onClick={() => onSelect(story)}
        />
      ))}
    </group>
  );
}

function Node({ story, index, totalStories, onClick }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = calculatePosition(story, index, totalStories);
  const color = categoryColors[story.category] || categoryColors.General;
  const size = 0.9 + ((story.metadata?.credibility_score || 50) / 100) * 0.8;

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1.15 + Math.sin(state.clock.elapsedTime * 3) * 0.05);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.3 : 0.05} metalness={0.2} roughness={0.6} />
    </mesh>
  );
}

function calculatePosition(story: any, index: number, total: number): [number, number, number] {
  if (story.position_3d) {
    return [story.position_3d.x, story.position_3d.y, story.position_3d.z];
  }

  const radius = 20;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = goldenAngle * index;
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return [x, y, z];
}

