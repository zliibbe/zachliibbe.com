'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './page.module.css';

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires the error boundary export to be named exactly "Error"
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className={styles.notFound}>
      <h2>Something went wrong!</h2>
      <p>An unexpected error occurred. Please try again.</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={() => reset()}
          className={styles.link}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid var(--theme-color)',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link href="/" className={styles.link}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
