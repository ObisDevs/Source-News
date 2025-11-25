'use client';

export function StoryImage({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-800">
      <img 
        src={src || 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=News'} 
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e: any) => { e.currentTarget.src = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=News'; }}
      />
    </div>
  );
}
