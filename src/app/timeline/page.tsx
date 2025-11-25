import { supabaseAdmin } from '@/lib/supabase/client';
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';
import { TimelineNav } from '@/components/timeline-nav';

export const revalidate = 900;

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const selectedDate = new Date();
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
    { label: '0:00 - 6:00', order: 0, name: 'Night', color: 'bg-gray-900', borderColor: 'border-gray-900', bgSection: 'bg-gray-900', textColor: 'text-white' },
    { label: '6:00 - 12:00', order: 1, name: 'Morning', color: 'bg-blue-500', borderColor: 'border-blue-500', bgSection: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-white' },
    { label: '12:00 - 18:00', order: 2, name: 'Afternoon', color: 'bg-yellow-400', borderColor: 'border-yellow-400', bgSection: 'bg-yellow-50 dark:bg-yellow-950/20', textColor: 'text-gray-900' },
    { label: '18:00 - 24:00', order: 3, name: 'Evening', color: 'bg-orange-500', borderColor: 'border-orange-500', bgSection: 'bg-orange-50 dark:bg-orange-950/30', textColor: 'text-white' },
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
        <div className="text-center mb-8">
          <p className="text-2xl font-serif italic text-gray-700 dark:text-gray-300 mb-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stories?.length || 0} stories published today
          </p>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <div className="flex gap-2">
            <Link
              href={`/timeline?date=${previousDay}`}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              ← Previous Day
            </Link>
            {!isToday && (
              <Link
                href="/timeline"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Today
              </Link>
            )}
            <Link
              href="/timeline/history"
              className="px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                <div key={timeBlock.label} id={`block-${timeBlock.order}`} className={`relative scroll-mt-24 ${timeBlock.bgSection} py-8`}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="sticky top-20 z-10 py-3 mb-6" style={{ backgroundColor: 'inherit' }}>
                      <div className="flex items-center gap-4">
                        <div className={`px-6 py-3 rounded-lg ${timeBlock.color} ${timeBlock.textColor} font-bold text-lg shadow-md`}>
                          {timeBlock.label}
                        </div>
                        <div className="flex-1 relative">
                          <div className={`h-1 ${timeBlock.color} rounded-full`}></div>
                          <div className={`absolute -top-6 left-0 text-sm font-semibold ${timeBlock.color.replace('bg-', 'text-')}`}>
                            {timeBlock.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {timeBlock.stories.map((story: any) => {
                      const imageUrl = story.metadata?.image || story.metadata?.og_image;
                      return (
                        <Link
                          key={story.id}
                          href={`/story/${story.id}`}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {imageUrl && (
                            <img src={imageUrl} alt="" className="w-full h-40 object-cover" />
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
                              {story.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {story.sources?.name}
                              </span>
                              <span>{formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
                            </div>
                            {story.category && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                {story.category}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
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
