import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';

interface ConnectionLinesProps {
  stories: any[];
}

export function ConnectionLines({ stories }: ConnectionLinesProps) {
  const lines = useMemo(() => {
    const connections: any[] = [];
    
    for (let i = 0; i < stories.length; i++) {
      for (let j = i + 1; j < stories.length; j++) {
        const similarity = calculateSimilarity(stories[i], stories[j]);
        
        if (similarity > 0.6) {
          connections.push({
            start: getPosition(stories[i], i, stories.length),
            end: getPosition(stories[j], j, stories.length),
            similarity,
          });
        }
      }
    }
    
    return connections;
  }, [stories]);

  return (
    <group>
      {lines.map((line, index) => (
        <Line
          key={index}
          start={line.start}
          end={line.end}
          opacity={line.similarity * 0.5}
        />
      ))}
    </group>
  );
}

function Line({ start, end, opacity }: any) {
  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
    [start, end]
  );

  const geomRef = useRef<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (geomRef.current) {
      geomRef.current.setFromPoints(points);
      geomRef.current.computeBoundingSphere();
    }
  }, [points]);

  return (
    <line>
      <bufferGeometry ref={geomRef} />
      <lineBasicMaterial color="#3b82f6" transparent opacity={opacity} />
    </line>
  );
}

function calculateSimilarity(story1: any, story2: any): number {
  if (story1.cluster_id && story1.cluster_id === story2.cluster_id) {
    return 0.9;
  }
  
  if (story1.category === story2.category) {
    return 0.7;
  }
  
  const timeDiff = Math.abs(
    new Date(story1.published_at).getTime() - new Date(story2.published_at).getTime()
  );
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  if (daysDiff < 1) return 0.6;
  
  return 0;
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
