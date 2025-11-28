'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { StoryNodes } from './story-nodes';
import { ConnectionLines } from './connection-lines';
import { ControlPanel } from './control-panel';

export default function EventMapVisualization() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'default' | 'heatmap' | 'clusters'>('default');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/event-map/stories');
      const data = await response.json();
      setStories(data.stories || []);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading event map...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 50]} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <StoryNodes 
          stories={stories} 
          onStoryClick={setSelectedStory}
          viewMode={viewMode}
        />
        <ConnectionLines stories={stories} />
        
        <gridHelper args={[100, 20, 0x444444, 0x222222]} />
      </Canvas>

      <ControlPanel 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedStory={selectedStory}
        onClose={() => setSelectedStory(null)}
        totalStories={stories.length}
      />
    </>
  );
}
