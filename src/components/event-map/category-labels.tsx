'use client';

import { Html } from '@react-three/drei';

const categoryZones: Record<string, { x: number; z: number; color: string }> = {
  Politics: { x: -15, z: 0, color: '#3b82f6' },
  Business: { x: 15, z: 0, color: '#10b981' },
  Sports: { x: 0, z: -15, color: '#f59e0b' },
  Technology: { x: 0, z: 15, color: '#8b5cf6' },
  Entertainment: { x: -15, z: 15, color: '#ec4899' },
  Health: { x: 15, z: -15, color: '#ef4444' },
  General: { x: 0, z: 0, color: '#6b7280' },
};

export function CategoryLabels() {
  return (
    <group>
      {Object.entries(categoryZones).map(([category, zone]) => (
        <Html key={category} position={[zone.x, -12, zone.z]} center>
          <div 
            className="px-3 py-1 rounded-full text-xs font-bold pointer-events-none"
            style={{ 
              backgroundColor: zone.color,
              color: 'white',
              opacity: 0.8
            }}
          >
            {category}
          </div>
        </Html>
      ))}
    </group>
  );
}
