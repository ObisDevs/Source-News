'use client';

import { Html } from '@react-three/drei';

interface RiskIndicatorsProps {
  story: any;
  position: [number, number, number];
}

export function RiskIndicator({ story, position }: RiskIndicatorsProps) {
  const riskLevel = calculateRiskLevel(story);
  
  return (
    <Html position={position} center>
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${getRiskColor(riskLevel)}`}
          title={`Risk: ${riskLevel}`}
        />
      </div>
    </Html>
  );
}

function calculateRiskLevel(story: any): 'low' | 'medium' | 'high' | 'critical' {
  const category = story.category?.toLowerCase();
  const keywords = story.title?.toLowerCase() || '';
  
  if (keywords.includes('breaking') || keywords.includes('urgent') || keywords.includes('alert')) {
    return 'critical';
  }
  
  if (category === 'politics' && (keywords.includes('security') || keywords.includes('crisis'))) {
    return 'high';
  }
  
  if (category === 'politics' || category === 'business') {
    return 'medium';
  }
  
  return 'low';
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'critical': return 'bg-red-600';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}
