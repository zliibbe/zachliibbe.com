'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import styles from './Footer.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { analytics } from '../utils/analytics';
import { useSession } from 'next-auth/react';
import {
  FaGithub,
  FaGoodreads,
  FaStrava,
  FaLinkedin,
  FaEnvelope,
} from 'react-icons/fa6';
import moment from 'moment';
import CurrentlyReading from './CurrentlyReading';
import { useTheme } from '@/app/context/ThemeContext';
import {
  formatDistanceToMiles,
  formatDistanceToYards,
  formatElapsedTime,
  getTimeAgo,
  numberToWords,
} from '@/app/utils/index';

type Book = {
  title: string;
  currentPage: number | null;
  totalPages: number | null;
};

export default function Footer() {
  const { isDarkMode } = useTheme();
  const { data: session } = useSession();
  const [activity, setActivity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentlyReading, setCurrentlyReading] = useState<Book[]>([]);
  const [bookLoading, setBookLoading] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

  const year = moment().year();

  // Analytics helper function
  const handleExternalLinkClick = (url: string, linkText: string) => {
    analytics.trackExternalLink(url, linkText);
  };

  // Strava Activity Fetching
  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/strava/latest', {
        next: {
          revalidate: 1800, // Revalidate cache every 30 minutes
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const latestActivity = await response.json();
      setActivity(latestActivity);
    } catch (err) {
      console.error(
        'Footer: Error fetching activity:',
        err instanceof Error ? err.message : err
      );
      setError('Failed to load most-recent activity');
      setActivity(null);
    } finally {
      setLoading(false);
    }
  };

  // Goodreads Book Fetching
  async function fetchBooks() {
    try {
      setBookLoading(true);
      setBookError(null);

      const response = await fetch('/api/goodreads/currently-reading');

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.status}`);
      }

      const data = await response.json();
      // Check if data is an array or has a books property
      let booksArray = [];
      if (Array.isArray(data)) {
        booksArray = data;
      } else if (data && data.books && Array.isArray(data.books)) {
        booksArray = data.books;
      } else {
        throw new Error('No books data received');
      }

      setCurrentlyReading(booksArray);
    } catch (err) {
      console.error('Error fetching books:', err);
      setBookError(
        err instanceof Error ? err.message : 'Failed to fetch books'
      );
      setCurrentlyReading([]); // Reset books on error
    } finally {
      setBookLoading(false);
    }
  }

  useEffect(() => {
    fetchActivity();
    fetchBooks();

    // Fetch new data every 30 minutes
    const activityInterval = setInterval(fetchActivity, 1800000); // 30 minutes
    const booksInterval = setInterval(fetchBooks, 3600000); // 60 minutes

    return () => {
      clearInterval(activityInterval);
      clearInterval(booksInterval);
    };
  }, []);

  /**
   * Gets the activity time ago string
   * @param activity - The Strava activity object
   * @returns Human-readable time ago string
   */
  const getActivityTimeAgo = (activity: any) => {
    if (!activity || !activity.start_date) {
      return 'recently';
    }

    // Pass the start_date to getTimeAgo
    return getTimeAgo(activity.start_date);
  };

  const getActivityDisplay = () => {
    if (loading) return { text: 'Loading activity...', isLoading: true };
    if (error) return { text: error, isLoading: false };
    if (!activity) return { text: 'No recent activity', isLoading: false };

    const getActivityText = () => {
      // Use the new helper function instead of directly calling getTimeAgo
      const daysAgo = getActivityTimeAgo(activity);
      const activityUrl = `https://www.strava.com/activities/${activity.id}`;

      switch (activity.type) {
        case 'Walk':
          return (
            <>
              Recorded a{' '}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${formatDistanceToMiles(activity.distance)} walk on Strava`}
              >
                {formatDistanceToMiles(activity.distance)} walk
              </a>{' '}
              {daysAgo}.
            </>
          );
        case 'WeightTraining':
          return (
            <>
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View weight training session on Strava"
              >
                Lifted weights
              </a>{' '}
              for {formatElapsedTime(activity.elapsed_time)} {daysAgo}.
            </>
          );
        case 'Ride':
          return (
            <>
              Recorded a{' '}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${formatDistanceToMiles(activity.distance)} bike ride on Strava`}
              >
                {formatDistanceToMiles(activity.distance)} ride
              </a>{' '}
              {daysAgo}.
            </>
          );
        case 'Run':
          return (
            <>
              Recorded a{' '}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${formatDistanceToMiles(activity.distance)} run on Strava`}
              >
                {formatDistanceToMiles(activity.distance)} run
              </a>{' '}
              {daysAgo}.
            </>
          );
        case 'Swim':
          return (
            <>
              Recorded a{' '}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${formatDistanceToYards(activity.distance)} swim on Strava`}
              >
                {formatDistanceToYards(activity.distance)} swim
              </a>{' '}
              {formatElapsedTime(activity.elapsed_time)} {daysAgo}.
            </>
          );
        default:
          return (
            <>
              Recorded{' '}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${activity.name} activity on Strava`}
              >
                {activity.name} - {formatDistanceToMiles(activity.distance)}
              </a>{' '}
              {daysAgo}.
            </>
          );
      }
    };

    return { text: getActivityText(), isLoading: false };
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.container}>
          <div className={styles.liveFeed}>
            <span className={styles.liveFeedLink}>What I&apos;m Up To</span>
            <div className={styles.feedContent}>
              <div className={styles.liveFeedList}>
                <div className={styles.liveFeedItem}>
                  <a
                    href="https://www.strava.com/athletes/zachliibbe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.feedIcon}
                    aria-label="View Strava profile"
                    onClick={() =>
                      handleExternalLinkClick(
                        'https://www.strava.com/athletes/zachliibbe',
                        'Strava Profile'
                      )
                    }
                  >
                    <FaStrava className={styles.stravaIcon} size={30} />
                  </a>
                  <p
                    className={`${styles.liveFeedText} ${
                      loading ? styles.loadingText : ''
                    }`}
                  >
                    <span className={styles.liveFeedTextContent}>
                      {getActivityDisplay().text}
                    </span>
                  </p>
                </div>

                <div className={styles.liveFeedItem}>
                  <a
                    href="https://www.goodreads.com/user/show/24890536-zach-liibbe"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      handleExternalLinkClick(
                        'https://www.goodreads.com/user/show/24890536-zach-liibbe',
                        'Goodreads Profile'
                      )
                    }
                  >
                    <span className={styles.feedIcon}>
                      <FaGoodreads className={styles.goodreadsIcon} size={30} />
                    </span>
                  </a>
                  <p className={styles.liveFeedText}>
                    <span className={styles.liveFeedTextContent}>
                      <CurrentlyReading />
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.socialsAndCopywrite}>
            <div className={styles.socials}>
              <a
                className={styles.socialLink}
                href="https://linkedin.com/in/zach-liibbe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit LinkedIn profile"
                onClick={() =>
                  handleExternalLinkClick(
                    'https://linkedin.com/in/zach-liibbe',
                    'LinkedIn Profile'
                  )
                }
              >
                <FaLinkedin
                  className={`${styles.socialIcon} ${styles.linkedInIcon}`}
                />
              </a>

              <a
                className={styles.socialLink}
                href="https://github.com/zliibbe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit GitHub profile"
                onClick={() =>
                  handleExternalLinkClick(
                    'https://github.com/zliibbe',
                    'GitHub Profile'
                  )
                }
              >
                <FaGithub className={styles.socialIcon} />
              </a>

              <a
                className={styles.socialLink}
                href="/contact"
                aria-label="Go to contact page"
              >
                <FaEnvelope
                  className={`${styles.socialIcon} ${styles.emailIcon}`}
                />
              </a>
            </div>
            <div className={styles.copywrite}>
              <span>© {year}, built using</span>
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techLink}
              >
                <Image
                  className={styles.nextVercelIcon}
                  src="/next.svg"
                  alt="Next.js logo"
                  sizes="60"
                  height={60}
                  width={60}
                />
              </a>
              <span>and</span>
              <a
                className={styles.techLink}
                href="https://vercel.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className={styles.nextVercelIcon}
                  src="/vercel.svg"
                  alt="Vercel logo"
                  width={60}
                  height={60}
                />
              </a>
              <span>in Colorado Springs, CO</span>
              {session && (
                <Link href="/admin" className={styles.adminLink}>
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
