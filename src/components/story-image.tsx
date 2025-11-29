'use client';

export function StoryImage({ src, alt, sourceImageUrl }: { src?: string; alt: string; sourceImageUrl?: string }) {
  const fallbackSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%236b7280" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENews%3C/text%3E%3C/svg%3E';
  const imageUrl = src || sourceImageUrl || fallbackSvg;
  
  return (
    <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-800">
      <img 
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e: any) => { 
          e.currentTarget.onerror = null;
          e.currentTarget.src = sourceImageUrl || fallbackSvg;
        }}
        loading="lazy"
      />
    </div>
  );
}
