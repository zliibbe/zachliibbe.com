'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from './error.module.css';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'Access denied. This admin interface is restricted to authorized users only.';
      case 'Configuration':
        return 'Authentication configuration error. Please try again later.';
      case 'Verification':
        return 'Email verification failed. Please try again.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <div className={styles.errorCard}>
      <h1>Authentication Error</h1>
      <p className={styles.errorMessage}>{getErrorMessage(error)}</p>

      <div className={styles.actions}>
        <Link href="/auth/signin" className={styles.retryButton}>
          Try Again
        </Link>
        <Link href="/" className={styles.homeButton}>
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <main className={styles.content}>
          <Suspense
            fallback={
              <div className={styles.errorCard}>
                <h1>Authentication Error</h1>
                <p className={styles.errorMessage}>Loading...</p>
              </div>
            }
          >
            <AuthErrorContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
