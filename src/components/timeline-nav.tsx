'use client';

import { useEffect, useState } from 'react';

interface TimeBlock {
  label: string;
  order: number;
  name: string;
  color: string;
  textColor: string;
}

export function TimelineNav({ timeBlocks, currentBlock }: { timeBlocks: TimeBlock[]; currentBlock: number }) {
  const [activeBlock, setActiveBlock] = useState(currentBlock);

  // Sort blocks so current time is at top, then earlier times below
  const sortedBlocks = [...timeBlocks].sort((a, b) => {
    if (a.order === currentBlock) return -1;
    if (b.order === currentBlock) return 1;
    if (a.order > currentBlock && b.order > currentBlock) return b.order - a.order;
    if (a.order < currentBlock && b.order < currentBlock) return b.order - a.order;
    return a.order > currentBlock ? -1 : 1;
  });

  useEffect(() => {
    const handleScroll = () => {
      const blocks = timeBlocks.map(block => {
        const element = document.getElementById(`block-${block.order}`);
        if (!element) return { order: block.order, top: Infinity };
        const rect = element.getBoundingClientRect();
        return { order: block.order, top: Math.abs(rect.top) };
      });

      const closest = blocks.reduce((prev, curr) => 
        curr.top < prev.top ? curr : prev
      );

      setActiveBlock(closest.order);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [timeBlocks]);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-3">
      {sortedBlocks.map((block) => {
        const isActive = activeBlock === block.order;
        const Icon = () => {
          if (block.order === 0) return (
            <svg className={`transition-all ${isActive ? 'w-7 h-7' : 'w-6 h-6'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          );
          if (block.order === 1) return (
            <svg className={`transition-all ${isActive ? 'w-7 h-7' : 'w-6 h-6'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2m0 16v2M4.22 4.22l1.41 1.41m11.32 11.32l1.41 1.41M1 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          );
          if (block.order === 2) return (
            <svg className={`transition-all ${isActive ? 'w-7 h-7' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5"/>
              <path fill="none" stroke="currentColor" strokeWidth="2" d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M6.34 17.66l-2.12 2.12M19.78 4.22l-2.12 2.12"/>
            </svg>
          );
          return (
            <svg className={`transition-all ${isActive ? 'w-7 h-7' : 'w-6 h-6'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M12 8a4 4 0 100 8 4 4 0 000-8z"/>
              <path d="M12 2a10 10 0 00-10 10h20A10 10 0 0012 2z" fill="currentColor" opacity="0.3"/>
            </svg>
          );
        };

        return (
          <a
            key={block.label}
            href={`#block-${block.order}`}
            className={`rounded-full ${block.color} flex items-center justify-center ${block.textColor} transition-all duration-300 shadow-lg ${
              isActive ? 'w-14 h-14 scale-110' : 'w-12 h-12 scale-90 opacity-70'
            }`}
            title={`${block.name} (${block.label})`}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
}
