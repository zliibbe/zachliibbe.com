import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Feed | Zach Liibbe - Real-time Activities & Reading',
  description:
    "Follow Zach Liibbe's real-time activities, fitness tracking via Strava API, and current reading from Goodreads. Live feed of outdoor adventures, books, and audiobooks.",
  keywords: [
    'live feed',
    'Strava activities',
    'Goodreads books',
    'fitness tracking',
    'reading list',
    'outdoor activities',
    'real-time updates',
    'Strava',
  ],
  authors: [{ name: 'Zach Liibbe' }],
  creator: 'Zach Liibbe',
  openGraph: {
    title: 'Live Feed | Zach Liibbe - Real-time Activities & Reading',
    description:
      "Follow Zach Liibbe's real-time activities, fitness tracking via Strava API, and current reading from Goodreads. Live feed of outdoor adventures, books, and audiobooks.",
    url: 'https://zachliibbe.com/live-feed',
    siteName: 'Zach Liibbe',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Feed | Zach Liibbe - Real-time Activities & Reading',
    description:
      "Follow Zach Liibbe's real-time activities, fitness tracking via Strava API, and current reading from Goodreads.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://zachliibbe.com/live-feed',
  },
};

export default function LiveFeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
