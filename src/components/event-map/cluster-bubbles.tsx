'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface ClusterBubblesProps {
  stories: any[];
}

export function ClusterBubbles({ stories }: ClusterBubblesProps) {
  const clusters = useMemo(() => groupStoriesIntoClusters(stories), [stories]);
  
  return (
    <group>
      {clusters.map((cluster, index) => (
        <ClusterBubble key={`${cluster.category}-${index}`} cluster={cluster} />
      ))}
    </group>
  );
}

function ClusterBubble({ cluster }: { cluster: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.08;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.015;
      meshRef.current.scale.setScalar(hovered ? scale * 1.05 : scale);
    }
  });
  
  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={cluster.center}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[cluster.radius, 32, 32]} />
        <meshBasicMaterial
          color={cluster.color}
          transparent
          opacity={hovered ? 0.15 : 0.08}
          wireframe
        />
      </mesh>

      <Text
        position={[cluster.center[0], cluster.center[1] + cluster.radius + 2, cluster.center[2]]}
        fontSize={1.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {cluster.category}
      </Text>

      <Text
        position={[cluster.center[0], cluster.center[1] + cluster.radius + 0.5, cluster.center[2]]}
        fontSize={0.7}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        {cluster.stories.length} stories
      </Text>

      {hovered && (
        <Html position={[cluster.center[0], cluster.center[1] - cluster.radius - 2, cluster.center[2]]} center>
          <div className="bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl p-3 w-64 pointer-events-none">
            <h3 className="text-white font-bold mb-2">{cluster.category} Cluster</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>{cluster.stories.length} related stories</div>
              <div className="text-xs text-gray-400 mt-2">Stories:</div>
              {cluster.stories.slice(0, 3).map((story: any, idx: number) => (
                <div key={idx} className="text-xs text-gray-400 truncate">• {story.title}</div>
              ))}
              {cluster.stories.length > 3 && (
                <div className="text-xs text-gray-500">+{cluster.stories.length - 3} more</div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function groupStoriesIntoClusters(stories: any[]) {
  const clusters: any[] = [];
  const categoryGroups: Record<string, any[]> = {};
  
  stories.forEach(story => {
    const cat = story.category || 'General';
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(story);
  });
  
  Object.entries(categoryGroups).forEach(([category, storyGroup]) => {
    if (storyGroup.length < 3) return;
    
    const positions = storyGroup.map((s, i) => getPosition(s, i, storyGroup.length));
    const center = calculateCenter(positions);
    const radius = calculateRadius(positions, center);
    
    clusters.push({
      category,
      center,
      radius: radius * 1.5,
      color: getCategoryColor(category),
      stories: storyGroup,
    });
  });
  
  return clusters;
}

function calculateCenter(positions: [number, number, number][]): [number, number, number] {
  const sum = positions.reduce(
    (acc, pos) => [acc[0] + pos[0], acc[1] + pos[1], acc[2] + pos[2]],
    [0, 0, 0]
  );
  return [sum[0] / positions.length, sum[1] / positions.length, sum[2] / positions.length];
}

function calculateRadius(positions: [number, number, number][], center: [number, number, number]): number {
  const distances = positions.map(pos => 
    Math.sqrt(
      Math.pow(pos[0] - center[0], 2) +
      Math.pow(pos[1] - center[1], 2) +
      Math.pow(pos[2] - center[2], 2)
    )
  );
  return Math.max(...distances);
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

  const radius = 20;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = goldenAngle * index;
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return [x, y, z];
}
