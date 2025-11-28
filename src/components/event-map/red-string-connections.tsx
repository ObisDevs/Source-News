'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RedStringConnectionsProps {
  stories: any[];
}

export function RedStringConnections({ stories }: RedStringConnectionsProps) {
  const linesRef = useRef<THREE.Group>(null);

  const connections = useMemo(() => {
    const lines: any[] = [];
    
    for (let i = 0; i < stories.length; i++) {
      for (let j = i + 1; j < stories.length; j++) {
        const similarity = calculateSimilarity(stories[i], stories[j]);
        
        if (similarity > 0.6) {
          lines.push({
            start: getPosition(stories[i], i, stories.length),
            end: getPosition(stories[j], j, stories.length),
            similarity,
          });
        }
      }
    }
    
    return lines;
  }, [stories]);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((line, i) => {
        const material = (line as THREE.Line).material as THREE.LineBasicMaterial;
        material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
      });
    }
  });

  return (
    <group ref={linesRef}>
      {connections.map((conn, index) => (
        <RedString
          key={index}
          start={conn.start}
          end={conn.end}
          opacity={conn.similarity * 0.4}
        />
      ))}
    </group>
  );
}

function RedString({ start, end, opacity }: any) {
  const points = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = new THREE.Vector3().lerpVectors(startVec, endVec, 0.5);
    midPoint.z -= 1;
    
    const curve = new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
    return curve.getPoints(20);
  }, [start, end]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#dc2626', transparent: true, opacity }))} />
  );
}

function calculateSimilarity(story1: any, story2: any): number {
  if (story1.cluster_id && story1.cluster_id === story2.cluster_id) {
    return 0.95;
  }
  
  if (story1.category === story2.category) {
    const timeDiff = Math.abs(
      new Date(story1.published_at).getTime() - new Date(story2.published_at).getTime()
    );
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 6) return 0.7;
    if (hoursDiff < 24) return 0.65;
  }
  
  return 0;
}

function getPosition(story: any, index: number, total: number): [number, number, number] {
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
  
  const x = zone.x + clusterOffset;
  const z = zone.z + clusterOffset;

  return [x, y, z];
}
