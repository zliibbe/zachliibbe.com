import { Lexend, Roboto_Mono } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import React from 'react';
import Link from 'next/link';
import { ThemeProvider } from './context/ThemeContext';
import { Metadata } from 'next';
import Script from 'next/script';
import Analytics from './components/Analytics';
import AuthProvider from '@/lib/auth-provider';
import ChatProvider from '@/components/chat/ChatProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Zach Liibbe - Always Iterating...',
  description:
    "Zach Liibbe's corner of the web—thinking, tinkering, and typing it all out. Part work, part words, all curiosity (with the occasional tangent).",
  applicationName: 'zachliibbe.com',
  icons: {
    icon: [
      {
        url: '/favicon-light.png',
        media: '(prefers-color-scheme: light)',
        type: 'image/png',
      },
      {
        url: '/favicon-dark.png',
        media: '(prefers-color-scheme: dark)',
        type: 'image/png',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//images-na.ssl-images-amazon.com" />
        <link rel="dns-prefetch" href="//www.strava.com" />

        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Preload critical assets */}
        <link rel="preload" href="/headshot.png" as="image" type="image/png" />

        <link
          rel="icon"
          href="/favicon-light.png"
          media="(prefers-color-scheme: light)"
          type="image/png"
        />
        <link
          rel="icon"
          href="/favicon-dark.png"
          media="(prefers-color-scheme: dark)"
          type="image/png"
        />
      </head>
      <body className={`${lexend.className} theme-transition`}>
        {/* Google Analytics - optimized loading */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `}
            </Script>
          </>
        )}

        <AuthProvider>
          <ErrorBoundary
            resetOnPropsChange={true}
            resetKeys={[
              typeof window !== 'undefined' ? window.location.pathname : '',
            ]}
            fallback={
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                }}
              >
                <h1 style={{ marginBottom: '16px' }}>
                  Oops! Something went wrong
                </h1>
                <p
                  style={{
                    marginBottom: '20px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  The page encountered an error. Please try refreshing or go
                  back to the homepage.
                </p>
                <Link
                  href="/"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: 'inherit',
                  }}
                >
                  Go Home
                </Link>
              </div>
            }
          >
            <ThemeProvider>
              <Analytics />
              <div className="root-container theme-transition">
                <Header />
                <ErrorBoundary resetOnPropsChange={true}>
                  {children}
                </ErrorBoundary>
              </div>
              <ChatProvider />
            </ThemeProvider>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
