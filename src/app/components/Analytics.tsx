"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analytics } from "../utils/analytics";

/**
 * Internal component that handles page tracking with search params
 */
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if analytics is enabled
    if (!analytics.isEnabled()) return;

    // Small optimization: avoid unnecessary string building
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    analytics.trackPageView({
      page_title: document.title,
      page_location: window.location.origin + url,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Analytics component for automatic page view tracking
 * Follows the "Keep logic out of views" commandment by delegating to analytics service
 */
export default function Analytics() {
  // Initialize analytics on component mount
  useEffect(() => {
    analytics.initialize();
  }, []);

  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
