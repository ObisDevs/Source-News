'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { EnhancedStoryNodes } from './enhanced-story-nodes';
import { ConnectionLines } from './connection-lines';
import { ControlPanel } from './control-panel';
import { HeatmapOverlay } from './heatmap-overlay';
import { ClusterBubbles } from './cluster-bubbles';
import { TimeSlider } from './time-slider';
import { Minimap } from './minimap';
import { InvestigationBoard2D } from './investigation-board-2d';

export default function EventMapVisualization() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'default' | 'heatmap' | 'clusters'>('default');
  const [heatmapMode, setHeatmapMode] = useState<'engagement' | 'temporal' | 'controversy'>('temporal');
  const [timeOffset, setTimeOffset] = useState(0);
  const [filters, setFilters] = useState({
    categories: ['Politics', 'Business', 'Sports', 'Technology', 'Entertainment', 'Health', 'General'],
    timeRange: 7,
    minEngagement: 0,
  });
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchStories = useCallback(async () => {
    try {
      const response = await fetch('/api/event-map/stories');
      const data = await response.json();
      setStories(data.stories || []);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      if (!filters.categories.includes(story.category || 'General')) return false;
      
      const publishedDate = new Date(story.published_at);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - timeOffset);
      
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      if (publishedDate < startOfDay || publishedDate > endOfDay) return false;
      
      return true;
    });
  }, [stories, filters.categories, timeOffset]);

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

  if (viewMode === 'default') {
    return (
      <>
        <InvestigationBoard2D stories={filteredStories} onStoryClick={setSelectedStory} />
        
        <ControlPanel 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedStory={selectedStory}
          onClose={() => setSelectedStory(null)}
          totalStories={filteredStories.length}
          filters={filters}
          onFiltersChange={setFilters}
          heatmapMode={heatmapMode}
          onHeatmapModeChange={setHeatmapMode}
          isMobile={isMobile}
        />
      </>
    );
  }

  return (
    <>
      <Canvas 
        className="w-full h-full"
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        dpr={[1, isMobile ? 1.5 : 2]}
        frameloop="demand"
        performance={{ min: 0.5 }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={60} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.08}
          minDistance={10}
          maxDistance={120}
          enablePan
          panSpeed={isMobile ? 0.4 : 0.6}
          rotateSpeed={isMobile ? 0.4 : 0.6}
          zoomSpeed={isMobile ? 0.6 : 1}
          makeDefault
          touches={{
            ONE: 2,
            TWO: 1
          }}
          mouseButtons={{
            LEFT: 2,
            MIDDLE: 1,
            RIGHT: 0
          }}
        />
        
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <directionalLight position={[-10, -10, -10]} intensity={0.3} />
        
        {viewMode === 'heatmap' && (
          <>
            <HeatmapOverlay stories={filteredStories} mode={heatmapMode} />
            <EnhancedStoryNodes stories={filteredStories} onStoryClick={setSelectedStory} viewMode={viewMode} />
            <ConnectionLines stories={filteredStories} />
            <gridHelper args={[100, 20, '#374151', '#1f2937']} />
          </>
        )}
        
        {viewMode === 'clusters' && (
          <>
            <ClusterBubbles stories={filteredStories} />
            <EnhancedStoryNodes stories={filteredStories} onStoryClick={setSelectedStory} viewMode={viewMode} />
            <ConnectionLines stories={filteredStories} />
            <gridHelper args={[100, 20, '#374151', '#1f2937']} />
          </>
        )}
      </Canvas>

      <ControlPanel 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedStory={selectedStory}
        onClose={() => setSelectedStory(null)}
        totalStories={filteredStories.length}
        filters={filters}
        onFiltersChange={setFilters}
        heatmapMode={heatmapMode}
        onHeatmapModeChange={setHeatmapMode}
        isMobile={isMobile}
      />
      
      {!isMobile && (viewMode === 'heatmap' || viewMode === 'clusters') && <TimeSlider onTimeChange={setTimeOffset} maxDays={30} />}
      {!isMobile && (viewMode === 'heatmap' || viewMode === 'clusters') && <Minimap stories={filteredStories} />}

      <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700 text-white text-xs">
        <div className="font-bold mb-1">Legend</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Politics</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Business</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Sports</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Technology</div>
        </div>
      </div>
    </>
  );
}
