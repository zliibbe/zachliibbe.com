'use client';
import { useState } from 'react';
import styles from '../contact/page.module.css';
import { analytics } from '../utils/analytics';

export default function EmailCopy() {
  const [showNotification, setShowNotification] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText('zliibbe@gmail.com');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2500);

      // Track email copy event
      analytics.trackEvent({
        event_name: 'email_copy',
        event_parameters: {
          category: 'engagement',
          label: 'contact_email_copy',
          email: 'zliibbe@gmail.com',
        },
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.emailText}
        onClick={handleClick}
        aria-label="Copy email address zliibbe@gmail.com to clipboard"
      >
        zliibbe@gmail.com
      </button>
      <p className={styles.text}>Click or press Enter to copy. ☺️ </p>
      <p
        className={`${styles.notification} ${
          showNotification ? styles.visible : ''
        }`}
      >
        Email copied to your clipboard!
      </p>
    </>
  );
}
