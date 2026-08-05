import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = {
  title: 'Health | Zach Liibbe',
  description: 'Personal health and training dashboard.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
