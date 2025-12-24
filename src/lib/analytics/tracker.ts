let sessionId: string | null = null;

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_sid');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_sid', sessionId);
    }
  }
  return sessionId;
};

const getDeviceInfo = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
});

const track = async (eventType: string, data: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;

  const payload = {
    event_type: eventType,
    session_id: getSessionId(),
    event_data: data,
    device_info: getDeviceInfo(),
    page_url: window.location.href,
    referrer: document.referrer,
  };

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export const analytics = {
  pageView: (page: string) => track('page_view', { page }),
  storyView: (storyId: string, timeSpent: number, scrollDepth: number) =>
    track('story_view', { story_id: storyId, time_spent: timeSpent, scroll_depth: scrollDepth }),
  storyComplete: (storyId: string, timeSpent: number) =>
    track('story_complete', { story_id: storyId, time_spent: timeSpent }),
  sourceClick: (storyId: string, sourceUrl: string) =>
    track('source_click', { story_id: storyId, source_url: sourceUrl }),
  search: (query: string, resultsCount: number, filters: any) =>
    track('search', { query, results_count: resultsCount, filters }),
  searchClick: (query: string, storyId: string, position: number) =>
    track('search_click', { query, story_id: storyId, position }),
  aiChat: (personality: string, deepThinking: boolean, storyAttached: boolean) =>
    track('ai_chat', { personality, deep_thinking: deepThinking, story_attached: storyAttached }),
  aiChatResponse: (personality: string, satisfaction: number, conversationLength: number) =>
    track('ai_chat_response', { personality, satisfaction, conversation_length: conversationLength }),
  bookmark: (storyId: string, action: 'add' | 'remove') =>
    track('bookmark', { story_id: storyId, action }),
  reaction: (storyId: string, reactionType: string) =>
    track('reaction', { story_id: storyId, reaction_type: reactionType }),
  biasFilter: (filters: string[]) =>
    track('bias_filter', { filters }),
  categoryView: (category: string) =>
    track('category_view', { category }),
  timelineInteraction: (action: string, clusterId?: string) =>
    track('timeline_interaction', { action, cluster_id: clusterId }),
  eventMapInteraction: (action: string, storyId?: string) =>
    track('event_map_interaction', { action, story_id: storyId }),
  socialSentimentView: (storyId: string, expanded: boolean) =>
    track('social_sentiment_view', { story_id: storyId, expanded }),
  subscriptionView: (tier: string) =>
    track('subscription_view', { tier }),
  featureLimitHit: (feature: string, tier: string) =>
    track('feature_limit_hit', { feature, tier }),
  share: (storyId: string, platform: string) =>
    track('share', { story_id: storyId, platform }),
  comment: (storyId: string, parentId?: string) =>
    track('comment', { story_id: storyId, parent_id: parentId }),
};
