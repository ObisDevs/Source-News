import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface StoryCardProps {
  cluster: {
    id: string;
    primary_title: string;
    news_score: number | null;
    created_at: string | null;
    bias_distribution: unknown;
  };
}

export function StoryCard({ cluster }: StoryCardProps) {
  const biasData = (cluster.bias_distribution as Record<string, number>) || {};
  const totalSources = Object.values(biasData).reduce((a: number, b: number) => a + b, 0) || 0;
  
  return (
    <Link href={`/story/${cluster.id}`}>
      <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold mb-3 line-clamp-3">
          {cluster.primary_title}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{totalSources} sources</span>
          {cluster.news_score && (
            <span>Score: {cluster.news_score}</span>
          )}
          {cluster.created_at && (
            <span>{formatDistanceToNow(new Date(cluster.created_at), { addSuffix: true })}</span>
          )}
        </div>
        
        {(totalSources as number) > 0 && (
          <div className="mt-4 flex gap-2">
            {biasData.left > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                Left: {biasData.left}
              </span>
            )}
            {biasData.centre > 0 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                Centre: {biasData.centre}
              </span>
            )}
            {biasData.right > 0 && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                Right: {biasData.right}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
