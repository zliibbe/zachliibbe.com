'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '../utils/analytics';

interface BlogPostAnalyticsProps {
  slug: string;
  title: string;
  category: string;
  readTimeMinutes: number;
}

/**
 * Client component for tracking blog post analytics
 * - Tracks post view on mount
 * - Tracks read completion when user scrolls to bottom
 * - Follows single responsibility principle
 */
export default function BlogPostAnalytics({
  slug,
  title,
  category,
  readTimeMinutes,
}: BlogPostAnalyticsProps) {
  const hasTrackedView = useRef(false);
  const hasTrackedCompletion = useRef(false);

  // Track blog post view on mount
  useEffect(() => {
    if (!analytics.isEnabled() || hasTrackedView.current) return;

    analytics.trackBlogView(slug, title, category);
    hasTrackedView.current = true;
  }, [slug, title, category]);

  // Track read completion when user scrolls near bottom
  useEffect(() => {
    if (!analytics.isEnabled()) return;

    const handleScroll = () => {
      if (hasTrackedCompletion.current) return;

      const article = document.querySelector('article');
      if (!article) return;

      const scrollPosition = window.scrollY + window.innerHeight;
      const articleBottom = article.offsetTop + article.offsetHeight;
      const scrollPercentage = (scrollPosition / articleBottom) * 100;

      // Track completion when user reaches 90% of article
      if (scrollPercentage >= 90) {
        analytics.trackBlogReadComplete(slug, readTimeMinutes);
        hasTrackedCompletion.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, readTimeMinutes]);

  return null;
}
