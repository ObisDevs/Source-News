import { supabaseAdmin } from '@/lib/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';
import { TimelineNav } from '@/components/timeline-nav';
import { VerticalTimelineCard } from '@/components/vertical-timeline-card';

export const revalidate = 900;

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const { data: stories } = await supabaseAdmin
    .from('stories_raw')
    .select(`
      id,
      title,
      content,
      url,
      published_at,
      metadata,
      category,
      sources (name, bias_lean)
    `)
    .gte('published_at', dayStart.toISOString())
    .lte('published_at', dayEnd.toISOString())
    .order('published_at', { ascending: false });

  const previousDay = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

  const getTimeBlock = (date: Date) => {
    const hour = date.getHours();
    const block = Math.floor(hour / 6);
    const startHour = block * 6;
    const endHour = startHour + 6;
    return {
      label: `${startHour}:00 - ${endHour}:00`,
      order: block,
    };
  };

  const timeBlocks = [
    { label: '0:00 - 6:00', order: 0, name: 'Night', color: 'bg-gray-900', borderColor: 'border-gray-900', bgSection: 'bg-gradient-to-b from-indigo-100 to-purple-200 dark:from-gray-900 dark:to-indigo-950', textColor: 'text-white' },
    { label: '6:00 - 12:00', order: 1, name: 'Morning', color: 'bg-blue-500', borderColor: 'border-blue-500', bgSection: 'bg-gradient-to-b from-yellow-100 to-orange-200 dark:from-blue-950 dark:to-indigo-900', textColor: 'text-white' },
    { label: '12:00 - 18:00', order: 2, name: 'Afternoon', color: 'bg-yellow-400', borderColor: 'border-yellow-400', bgSection: 'bg-gradient-to-b from-blue-100 to-cyan-200 dark:from-yellow-950 dark:to-orange-900', textColor: 'text-gray-900' },
    { label: '18:00 - 24:00', order: 3, name: 'Evening', color: 'bg-orange-500', borderColor: 'border-orange-500', bgSection: 'bg-gradient-to-b from-orange-100 to-red-200 dark:from-orange-950 dark:to-red-950', textColor: 'text-white' },
  ];

  const currentHour = new Date().getHours();
  const currentBlock = Math.floor(currentHour / 6);

  const groupedByTimeBlock = (stories || []).reduce((acc: any, story: any) => {
    const timeBlock = getTimeBlock(new Date(story.published_at));
    const key = timeBlock.label;
    const blockInfo = timeBlocks.find(b => b.label === timeBlock.label);
    if (!acc[key]) acc[key] = { ...timeBlock, ...blockInfo, stories: [] };
    acc[key].stories.push(story);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TimelineNav timeBlocks={timeBlocks} currentBlock={currentBlock} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-6 md:mb-8">
          <p className="text-xl md:text-2xl font-serif italic text-gray-700 dark:text-gray-300 mb-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stories?.length || 0} stories published today
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div></div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href={`/timeline?date=${previousDay}`}
              className="px-3 md:px-4 py-2 text-xs md:text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 whitespace-nowrap"
            >
              ← Previous Day
            </Link>
            {!isToday && (
              <Link
                href="/timeline"
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                Today
              </Link>
            )}
            <Link
              href="/timeline/history"
              className="px-3 md:px-4 py-2 text-xs md:text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 whitespace-nowrap"
            >
              History
            </Link>
          </div>
        </div>

        {Object.keys(groupedByTimeBlock).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No stories found for this date.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {Object.values(groupedByTimeBlock)
              .sort((a: any, b: any) => {
                if (!dateParam) {
                  if (a.order === currentBlock) return -1;
                  if (b.order === currentBlock) return 1;
                }
                return b.order - a.order;
              })
              .map((timeBlock: any) => (
                <div key={timeBlock.label} id={`block-${timeBlock.order}`} className={`relative scroll-mt-24 ${timeBlock.bgSection} py-6 md:py-8 transition-all duration-500 hover:shadow-inner`}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="sticky top-20 z-10 py-2 md:py-3 mb-4 md:mb-6 group" style={{ backgroundColor: 'inherit' }}>
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className={`px-3 md:px-6 py-2 md:py-3 rounded-lg ${timeBlock.color} ${timeBlock.textColor} font-bold text-sm md:text-lg shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl whitespace-nowrap`}>
                          {timeBlock.label}
                        </div>
                        <div className="flex-1 relative">
                          <div className={`h-1 ${timeBlock.color} rounded-full transition-all duration-500 group-hover:h-2 group-hover:shadow-lg`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div className={`absolute -top-5 md:-top-6 left-0 text-xs md:text-sm font-semibold ${timeBlock.color.replace('bg-', 'text-')} transition-all duration-300 group-hover:scale-110`}>
                            {timeBlock.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: 3-column layout with absolute positioning */}
                    <div className="hidden lg:block relative max-w-6xl mx-auto">
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-blue-600 h-full transition-all duration-300 hover:w-1 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/50">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-300/50 to-transparent animate-pulse opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="relative">
                        <div className="relative">
                          {timeBlock.stories
                            .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
                            .map((story: any, idx: number) => {
                              const position = idx % 3;
                              let className = 'absolute w-80';
                              let topOffset = Math.floor(idx / 3) * 220 + (position * 60);
                              
                              if (position === 0) className += ' left-0';
                              else if (position === 1) className += ' left-1/2 transform -translate-x-1/2';
                              else className += ' right-0';
                              
                              return (
                                <div key={story.id} className={className} style={{ top: `${topOffset}px` }}>
                                  <VerticalTimelineCard 
                                    story={story} 
                                    index={idx} 
                                    isLeft={position !== 2}
                                    isCenter={position === 1}
                                  />
                                </div>
                              );
                            })}
                        </div>
                        <div style={{ height: `${Math.ceil(timeBlock.stories.length / 3) * 220 + 120}px` }}></div>
                      </div>
                    </div>

                    {/* Tablet: 2-column alternating layout */}
                    <div className="hidden md:block lg:hidden relative max-w-4xl mx-auto">
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-blue-600 h-full"></div>
                      <div className="space-y-6">
                        {timeBlock.stories
                          .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
                          .map((story: any, idx: number) => {
                            const isLeft = idx % 2 === 0;
                            return (
                              <div key={story.id} className={`flex ${isLeft ? 'justify-start pr-8' : 'justify-end pl-8'}`}>
                                <div className="w-full max-w-sm">
                                  <VerticalTimelineCard 
                                    story={story} 
                                    index={idx} 
                                    isLeft={isLeft}
                                    isCenter={false}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Mobile: Single column stacked layout */}
                    <div className="block md:hidden relative max-w-md mx-auto">
                      <div className="absolute left-4 w-0.5 bg-blue-600 h-full"></div>
                      <div className="space-y-4 pl-10">
                        {timeBlock.stories
                          .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
                          .map((story: any, idx: number) => (
                            <div key={story.id} className="relative">
                              <div className="absolute -left-10 top-4 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10"></div>
                              <VerticalTimelineCard 
                                story={story} 
                                index={idx} 
                                isLeft={false}
                                isCenter={false}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
