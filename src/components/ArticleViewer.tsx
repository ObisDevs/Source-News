'use client';

import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react';

interface Article {
  title: string;
  content: string;
  image_url?: string;
  source_name: string;
  source_url: string;
  url: string;
}

export default function ArticleViewer({ article, onBack }: { article: Article; onBack: () => void }) {
  const [useFallback, setUseFallback] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [reactions, setReactions] = useState({ positive: 0, negative: 0, comments: 0 });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setUseFallback(true), 3000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleIframeLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setUseFallback(false);
  };

  const openSource = () => {
    window.open(article.source_url, '_blank', 'noopener,noreferrer');
  };

  if (useFallback) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 z-10">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <ArrowLeft size={20} />
          </button>
        </div>
        
        <div className="max-w-4xl mx-auto p-8">
          {article.image_url && (
            <img src={article.image_url} alt={article.title} className="w-full h-64 object-cover rounded-lg mb-6" />
          )}
          
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{article.title}</h1>
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={openSource}
              className="text-green-600 font-bold hover:text-green-700 transition text-sm"
            >
              {article.source_name}
            </button>
            
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <button className="flex items-center gap-1 hover:text-blue-600">
                <ThumbsUp size={16} className="text-blue-600" />
                <span>{reactions.positive}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-red-600">
                <ThumbsDown size={16} className="text-red-600" />
                <span>{reactions.negative}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-gray-700">
                <MessageSquare size={16} />
                <span>{reactions.comments}</span>
              </button>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {article.content.split('\n').map((para, i) => (
              <p key={i} className="mb-4 text-gray-800 dark:text-gray-200">{para}</p>
            ))}
          </div>

          <button
            onClick={() => setShowAI(!showAI)}
            className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
          >
            <Sparkles size={20} />
          </button>

          {showAI && (
            <div className="fixed bottom-20 right-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl w-80 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white">AI Analysis</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">Loading AI insights...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex items-center">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <ArrowLeft size={18} />
        </button>
      </div>
      
      <iframe
        ref={iframeRef}
        src={article.url}
        className="flex-1 w-full border-0"
        onLoad={handleIframeLoad}
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}
