'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import StoryNodes from './story-nodes';
import { ConnectionLines } from './connection-lines';
import { ControlPanel } from './control-panel';

type Story = {
  id: string;
  title: string;
  category?: string;
  published_at?: string;
  source?: string;
  metadata?: any;
  position_3d?: { x: number; y: number; z: number };
};

export default function Visualization() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selected, setSelected] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch('/api/event-map/stories');
        const json = await res.json();
        if (!mounted) return;
        const s = json.stories || json;

        // Ensure positions exist; fallback to pseudo-random layout if not present
        const withPos = s.map((st: Story, i: number) => ({
          ...st,
          position_3d:
            st.position_3d || {
              x: (Math.random() - 0.5) * 30,
              y: (Math.random() - 0.5) * 30,
              z: (Math.random() - 0.5) * 30,
            },
        }));

        setStories(withPos);
      } catch (e) {
        console.error('Failed to load event-map stories', e);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative w-full h-[70vh] flex">
      <div className="flex-1">
        {loading && (
          <div className="p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading event map...</p>
          </div>
        )}

        <Canvas camera={{ position: [0, 0, 60], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[50, 50, 50]} />
          <Suspense fallback={null}>
            <StoryNodes stories={stories} onStoryClick={setSelected} />
            <ConnectionLines stories={stories} />
          </Suspense>
          <OrbitControls enablePan enableZoom enableRotate />
        </Canvas>
      </div>

      <div className="w-80 p-4 border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <ControlPanel
          viewMode="default"
          onViewModeChange={() => {}}
          selectedStory={selected}
          onClose={() => setSelected(null)}
          totalStories={stories.length}
        />
      </div>
    </div>
  );
}
