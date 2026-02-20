'use client';

import { useRouter } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import styles from './signin.module.css';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already signed in
    getSession().then(session => {
      if (session) {
        router.push('/admin');
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/admin',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <main className={styles.content}>
          <div className={styles.signInCard}>
            <h1>Admin Access</h1>
            <p>Sign in to access the blog administration interface.</p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={styles.googleButton}
            >
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
            <p className={styles.note}>
              Access restricted to authorized users only.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
