import {
  GAEvent,
  GAConfig,
  GAPageView,
  GACustomEvent,
} from '@/types/analytics';

// Configuration (single responsibility)
const getConfig = (): GAConfig => ({
  measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  enabled:
    Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) &&
    typeof window !== 'undefined',
});

// Core GA functions (keep it short, single responsibility)
const isEnabled = (): boolean => getConfig().enabled;

const getGtag = () => {
  if (!isEnabled()) return null;
  return window.gtag;
};

/**
 * Track page views
 */
const trackPageView = (pageView: GAPageView): void => {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', 'page_view', {
    page_title: pageView.page_title,
    page_location: pageView.page_location,
  });
};

/**
 * Track custom events
 */
const trackEvent = (event: GACustomEvent): void => {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', event.event_name, event.event_parameters);
};

/**
 * Command pattern implementations (specialized functions)
 */
const trackContactSubmission = (): void => {
  trackEvent({
    event_name: 'contact_form_submit',
    event_parameters: {
      category: 'engagement',
      label: 'contact_form',
    },
  });
};

const trackProjectView = (projectName: string): void => {
  trackEvent({
    event_name: 'project_view',
    event_parameters: {
      category: 'engagement',
      label: projectName,
    },
  });
};

const trackExternalLink = (url: string, linkText: string): void => {
  trackEvent({
    event_name: 'external_link_click',
    event_parameters: {
      category: 'engagement',
      link_url: url,
      link_text: linkText,
    },
  });
};

/**
 * Blog-specific tracking functions
 */
const trackBlogView = (slug: string, title: string, category: string): void => {
  trackEvent({
    event_name: 'blog_post_view',
    event_parameters: {
      category: 'blog',
      post_slug: slug,
      post_title: title,
      post_category: category,
    },
  });
};

const trackBlogReadComplete = (slug: string, readTimeMinutes: number): void => {
  trackEvent({
    event_name: 'blog_post_complete',
    event_parameters: {
      category: 'blog',
      post_slug: slug,
      read_time_minutes: readTimeMinutes,
    },
  });
};

const trackBlogShare = (
  slug: string,
  platform: 'twitter' | 'linkedin' | 'email'
): void => {
  trackEvent({
    event_name: 'blog_post_share',
    event_parameters: {
      category: 'blog',
      post_slug: slug,
      share_platform: platform,
    },
  });
};

/**
 * Chat widget tracking functions
 */
const trackChatOpen = (): void => {
  trackEvent({
    event_name: 'chat_opened',
    event_parameters: {
      category: 'chat',
    },
  });
};

const trackChatMessage = (isUser: boolean, messageNumber: number): void => {
  trackEvent({
    event_name: isUser ? 'chat_message_sent' : 'chat_message_received',
    event_parameters: {
      category: 'chat',
      message_number: messageNumber,
    },
  });
};

const trackChatClose = (
  messageCount: number,
  durationSeconds: number
): void => {
  trackEvent({
    event_name: 'chat_closed',
    event_parameters: {
      category: 'chat',
      message_count: messageCount,
      duration_seconds: durationSeconds,
    },
  });
};

/**
 * Search and filter tracking functions
 */
const trackSearch = (query: string, resultsCount: number): void => {
  trackEvent({
    event_name: 'search',
    event_parameters: {
      category: 'search',
      search_term: query,
      results_count: resultsCount,
    },
  });
};

const trackFilter = (
  type: 'category' | 'tag',
  value: string,
  resultsCount: number
): void => {
  trackEvent({
    event_name: 'filter_applied',
    event_parameters: {
      category: 'blog',
      filter_type: type,
      filter_value: value,
      results_count: resultsCount,
    },
  });
};

// Export clean functional API
export const analytics = {
  trackPageView,
  trackEvent,
  trackContactSubmission,
  trackProjectView,
  trackExternalLink,
  trackBlogView,
  trackBlogReadComplete,
  trackBlogShare,
  trackChatOpen,
  trackChatMessage,
  trackChatClose,
  trackSearch,
  trackFilter,
  isEnabled,
} as const;
