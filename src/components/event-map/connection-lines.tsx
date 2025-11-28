import * as THREE from 'three';
import { useMemo, useRef } from 'react';

interface ConnectionLinesProps {
  stories: any[];
}

export function ConnectionLines({ stories }: ConnectionLinesProps) {
  const { geometry, material } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const colors: number[] = [];
    const maxConnections = Math.min(stories.length * 3, 500);
    let connectionCount = 0;
    
    const clusterMap = new Map<string, any[]>();
    stories.forEach((story, idx) => {
      const key = story.cluster_id || story.category || 'general';
      if (!clusterMap.has(key)) clusterMap.set(key, []);
      clusterMap.get(key)!.push({ story, index: idx });
    });

    clusterMap.forEach((clusterStories) => {
      for (let i = 0; i < clusterStories.length && connectionCount < maxConnections; i++) {
        for (let j = i + 1; j < clusterStories.length && connectionCount < maxConnections; j++) {
          const story1 = clusterStories[i];
          const story2 = clusterStories[j];
          
          const pos1 = getPosition(story1.story, story1.index, stories.length);
          const pos2 = getPosition(story2.story, story2.index, stories.length);
          
          points.push(new THREE.Vector3(...pos1));
          points.push(new THREE.Vector3(...pos2));
          
          const color = new THREE.Color('#dc2626');
          colors.push(color.r, color.g, color.b);
          colors.push(color.r, color.g, color.b);
          
          connectionCount++;
        }
      }
    });
    
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const mat = new THREE.LineBasicMaterial({ 
      vertexColors: true, 
      transparent: true, 
      opacity: 0.3,
      linewidth: 1
    });
    
    return { geometry: geom, material: mat };
  }, [stories]);

  return <lineSegments geometry={geometry} material={material} />;
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
