import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { StoryAIFeatures } from '@/components/story-ai-features';
import { BookmarkButton } from '@/components/bookmark-button';
import { AIExplainButton } from '@/components/ai-explain-button';
import { SocialSentimentWidget } from '@/components/social-sentiment-widget';
import { ShareButton } from '@/components/share-button';
import { StoryReactions } from '@/components/story-reactions';
import { CommentsSection } from '@/components/comments-section';
import { FactCheckButton } from '@/components/fact-check-button';
import { StoryTimeline } from '@/components/story-timeline';
import { StoryComparison } from '@/components/story-comparison';
import { QuickReactions } from '@/components/quick-reactions';
import { TrackReading } from '@/components/track-reading';
import Link from 'next/link';
import * as cheerio from 'cheerio';
import { Metadata } from 'next';

async function getFullContent(url: string, dbContent: string): Promise<string> {
  if (dbContent && dbContent.length > 500) return dbContent;
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();
    
    const selectors = ['article', '[role="article"]', '.article-content', '.post-content', 'main'];
    let fullText = '';
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        fullText = element.find('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
        if (fullText.length > 200) break;
      }
    }
    
    return fullText.length > dbContent.length ? fullText : dbContent;
  } catch {
    return dbContent;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: story } = await supabaseAdmin
    .from('stories_raw')
    .select('*, sources(name)')
    .eq('id', id)
    .single();

  if (!story) {
    return {
      title: 'Story Not Found',
    };
  }

  const imageUrl = story.metadata?.image || story.metadata?.og_image || '/icon.svg';
  const description = story.content?.substring(0, 160) || story.title;
  const url = `https://source-news.vercel.app/story/${id}`;

  return {
    title: `${story.title} - Source News`,
    description,
    openGraph: {
      title: story.title,
      description,
      url,
      siteName: 'Source News',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: story.title,
        },
      ],
      type: 'article',
      publishedTime: story.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description,
      images: [imageUrl],
      creator: '@SourceNews_NG',
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: story, error } = await supabaseAdmin
    .from('stories_raw')
    .select(`
      *,
      sources (name, bias_lean, credibility_score)
    `)
    .eq('id', id)
    .single();

  if (error || !story) {
    notFound();
  }
  
  const fullContent = await getFullContent(story.url, story.content || '');

  // Get related stories (same category, recent)
  const { data: relatedStories } = await supabaseAdmin
    .from('stories_raw')
    .select('id, title, url, published_at, metadata, sources(name, bias_lean)')
    .neq('id', id)
    .eq('category', story.category || 'General')
    .order('published_at', { ascending: false })
    .limit(6);

  const imageUrl = story.metadata?.image || story.metadata?.og_image;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TrackReading storyId={story.id} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        {/* Header with Image */}
        <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
          {imageUrl && (
            <div className="relative w-full h-64 sm:h-96 bg-gray-200 dark:bg-gray-800 overflow-hidden rounded-t-lg">
              <img 
                src={imageUrl} 
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold flex-1 text-gray-900 dark:text-gray-100">{story.title}</h1>
              <div className="flex gap-2">
                <FactCheckButton storyId={story.id} />
                <ShareButton title={story.title} url={`/story/${story.id}`} />
                <BookmarkButton storyId={story.id} />
              </div>
            </div>
            
            <div className="mb-4">
              <QuickReactions storyId={story.id} />
            </div>
          
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">{story.sources?.name}</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span>{formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs">
                {story.sources?.bias_lean}
              </span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="text-xs">Credibility: <span className="font-semibold text-blue-600 dark:text-blue-400">{story.sources?.credibility_score}/100</span></span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {fullContent.split('\n\n').map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4">{para}</p>
            ))}
          </div>
          <Link 
            href={`/source?url=${encodeURIComponent(story.url)}&title=${encodeURIComponent(story.title)}`}
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Read full article at source
          </Link>
        </div>

        {/* Social Sentiment */}
        <div className="mb-6 sm:mb-8">
          <SocialSentimentWidget storyId={story.id} />
        </div>

        {/* Story Reactions */}
        <div className="mb-6 sm:mb-8">
          <StoryReactions storyId={story.id} />
        </div>

        {/* Story Comparison */}
        {story.cluster_id && (
          <div className="mb-6 sm:mb-8">
            <StoryComparison clusterId={story.cluster_id} />
          </div>
        )}

        {/* Story Timeline */}
        {story.cluster_id && (
          <div className="mb-6 sm:mb-8">
            <StoryTimeline clusterId={story.cluster_id} />
          </div>
        )}

        {/* AI Features */}
        <StoryAIFeatures storyId={story.id} storyTitle={story.title} storyContent={story.content} />

        {/* Comments Section */}
        <div id="comments-section" className="mt-6 sm:mt-8">
          <CommentsSection storyId={story.id} />
        </div>

        {/* Floating AI Button */}
        <AIExplainButton storyId={story.id} />

        {/* Related Stories */}
        {relatedStories && relatedStories.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Related Stories</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedStories.map((related: any) => {
                const relatedImage = related.metadata?.image || related.metadata?.og_image;
                return (
                  <a
                    key={related.id}
                    href={`/story/${related.id}`}
                    className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition-colors shadow-sm hover:shadow-md"
                  >
                    {relatedImage && (
                      <img src={relatedImage} alt="" className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 line-clamp-2">{related.title}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{related.sources?.name}</span>
                        {related.published_at && (
                          <span>{formatDistanceToNow(new Date(related.published_at), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
