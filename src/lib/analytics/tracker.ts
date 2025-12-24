let sessionId: string | null = null;
let sessionStart: number = Date.now();
let pageLoadTime: number = 0;

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_sid');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_sid', sessionId);
      sessionStart = Date.now();
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
  deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
  connection: (navigator as any).connection?.effectiveType || 'unknown',
});

const getPerformanceMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) return {};
  const perf = window.performance.timing;
  return {
    loadTime: perf.loadEventEnd - perf.navigationStart,
    domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
    ttfb: perf.responseStart - perf.navigationStart,
  };
};

const track = async (eventType: string, data: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;

  const payload = {
    event_type: eventType,
    session_id: getSessionId(),
    event_data: {
      ...data,
      sessionDuration: Math.floor((Date.now() - sessionStart) / 1000),
      timestamp: new Date().toISOString(),
    },
    device_info: getDeviceInfo(),
    page_url: window.location.href,
    referrer: document.referrer,
    performance: getPerformanceMetrics(),
  };

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (error) {}
};

export const analytics = {
  pageView: (page: string, metadata?: any) => track('page_view', { page, ...metadata }),
  
  storyView: (storyId: string, timeSpent: number, scrollDepth: number, metadata?: any) =>
    track('story_view', { story_id: storyId, time_spent: timeSpent, scroll_depth: scrollDepth, ...metadata }),
  
  storyComplete: (storyId: string, timeSpent: number) =>
    track('story_complete', { story_id: storyId, time_spent: timeSpent }),
  
  sourceClick: (storyId: string, sourceUrl: string, sourceName: string) =>
    track('source_click', { story_id: storyId, source_url: sourceUrl, source_name: sourceName }),
  
  search: (query: string, resultsCount: number, filters: any) =>
    track('search', { query, results_count: resultsCount, filters }),
  
  searchClick: (query: string, storyId: string, position: number, timeToClick: number) =>
    track('search_click', { query, story_id: storyId, position, time_to_click: timeToClick }),
  
  aiChat: (personality: string, deepThinking: boolean, storyAttached: boolean, queryLength: number) =>
    track('ai_chat', { personality, deep_thinking: deepThinking, story_attached: storyAttached, query_length: queryLength }),
  
  aiChatResponse: (personality: string, responseLength: number, conversationLength: number, thinkingTime: number) =>
    track('ai_chat_response', { personality, response_length: responseLength, conversation_length: conversationLength, thinking_time: thinkingTime }),
  
  bookmark: (storyId: string, action: 'add' | 'remove', category?: string) =>
    track('bookmark', { story_id: storyId, action, category }),
  
  reaction: (storyId: string, reactionType: string, category?: string) =>
    track('reaction', { story_id: storyId, reaction_type: reactionType, category }),
  
  biasFilter: (filters: string[], previousFilters?: string[]) =>
    track('bias_filter', { filters, previous_filters: previousFilters }),
  
  categoryView: (category: string, source?: string) =>
    track('category_view', { category, source }),
  
  timelineInteraction: (action: string, clusterId?: string, duration?: number) =>
    track('timeline_interaction', { action, cluster_id: clusterId, duration }),
  
  eventMapInteraction: (action: string, storyId?: string, zoomLevel?: number) =>
    track('event_map_interaction', { action, story_id: storyId, zoom_level: zoomLevel }),
  
  socialSentimentView: (storyId: string, expanded: boolean, tweetsViewed?: number) =>
    track('social_sentiment_view', { story_id: storyId, expanded, tweets_viewed: tweetsViewed }),
  
  subscriptionView: (tier: string, fromPage?: string) =>
    track('subscription_view', { tier, from_page: fromPage }),
  
  featureLimitHit: (feature: string, tier: string, attemptCount?: number) =>
    track('feature_limit_hit', { feature, tier, attempt_count: attemptCount }),
  
  share: (storyId: string, platform: string, category?: string) =>
    track('share', { story_id: storyId, platform, category }),
  
  comment: (storyId: string, commentLength: number, parentId?: string) =>
    track('comment', { story_id: storyId, comment_length: commentLength, parent_id: parentId }),
  
  storyEngagement: (storyId: string, engagementType: string, value: any) =>
    track('story_engagement', { story_id: storyId, engagement_type: engagementType, value }),
  
  userPreference: (preferenceType: string, value: any) =>
    track('user_preference', { preference_type: preferenceType, value }),
  
  errorOccurred: (errorType: string, errorMessage: string, page: string) =>
    track('error', { error_type: errorType, error_message: errorMessage, page }),
};
