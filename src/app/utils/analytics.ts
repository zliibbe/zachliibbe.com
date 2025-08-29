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

// Export clean functional API
export const analytics = {
  trackPageView,
  trackEvent,
  trackContactSubmission,
  trackProjectView,
  trackExternalLink,
  isEnabled,
} as const;
