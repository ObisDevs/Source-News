'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface HeatmapOverlayProps {
  stories: any[];
  mode: 'engagement' | 'temporal' | 'controversy';
}

export function HeatmapOverlay({ stories, mode }: HeatmapOverlayProps) {
  const heatmapData = useMemo(() => {
    return stories.map((story, index) => ({
      story,
      intensity: getHeatmapIntensity(story, mode),
      position: getPosition(story, index, stories.length),
      color: getHeatmapColor(getHeatmapIntensity(story, mode), mode)
    }));
  }, [stories, mode]);

  return (
    <group>
      {heatmapData.map(({ story, intensity, position, color }) => (
        <HeatmapNode 
          key={story.id} 
          story={story}
          intensity={intensity}
          position={position}
          color={color}
          mode={mode}
        />
      ))}
    </group>
  );
}

function HeatmapNode({ story, intensity, position, color, mode }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + intensity * 10) * 0.1 * intensity;
      meshRef.current.scale.setScalar(pulse * (hovered ? 1.3 : 1));
    }
  });

  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.2 + intensity * 0.8, 20, 20]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2 + intensity * 0.4}
        />
      </mesh>

      {hovered && (
        <Html position={[position[0], position[1] + 2, position[2]]} center>
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg shadow-2xl p-3 w-64 pointer-events-none">
            <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">{story.title}</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Heat Level:</span>
                <span className="font-bold" style={{ color }}>{(intensity * 100).toFixed(0)}%</span>
              </div>
              {mode === 'engagement' && (
                <div className="flex justify-between">
                  <span>Engagement:</span>
                  <span>{(story.metadata?.reactions || 0) + (story.metadata?.comments || 0) * 2}</span>
                </div>
              )}
              {mode === 'temporal' && (
                <div className="flex justify-between">
                  <span>Age:</span>
                  <span>{Math.floor((Date.now() - new Date(story.published_at).getTime()) / (1000 * 60 * 60))}h ago</span>
                </div>
              )}
              {mode === 'controversy' && (
                <div className="flex justify-between">
                  <span>Controversy:</span>
                  <span>{story.metadata?.upvotes || 0} ↑ / {story.metadata?.downvotes || 0} ↓</span>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function getHeatmapIntensity(story: any, mode: string): number {
  switch (mode) {
    case 'engagement':
      const reactions = story.metadata?.reactions || 0;
      const comments = story.metadata?.comments || 0;
      return Math.min((reactions + comments * 2) / 100, 1);
    
    case 'temporal':
      const hoursSincePublished = (Date.now() - new Date(story.published_at).getTime()) / (1000 * 60 * 60);
      return Math.max(0, 1 - hoursSincePublished / 24);
    
    case 'controversy':
      const upvotes = story.metadata?.upvotes || 0;
      const downvotes = story.metadata?.downvotes || 0;
      const total = upvotes + downvotes;
      if (total === 0) return 0;
      const ratio = Math.abs(upvotes - downvotes) / total;
      return 1 - ratio;
    
    default:
      return 0.5;
  }
}

function getHeatmapColor(intensity: number, mode: string): string {
  if (mode === 'controversy') {
    if (intensity > 0.7) return '#dc2626';
    if (intensity > 0.4) return '#f59e0b';
    return '#3b82f6';
  }
  
  if (intensity > 0.8) return '#dc2626';
  if (intensity > 0.6) return '#ef4444';
  if (intensity > 0.4) return '#f59e0b';
  if (intensity > 0.2) return '#3b82f6';
  return '#6b7280';
}

function getPosition(story: any, index: number, total: number): [number, number, number] {
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
