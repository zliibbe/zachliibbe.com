'use client';

import { useEffect, useState } from 'react';
import type { StravaActivity } from '@/lib/strava/types';
import ActivityGrid from '../components/ActivityGrid';
import CurrentlyReadingBooks from '../components/CurrentlyReadingBooks';
import Footer from '../components/Footer';
import RecentAudiobooks from '../components/RecentAudiobooks';
import RecentBooks from '../components/RecentBooks';
import styles from './LiveFeed.module.css';

export default function LiveFeedPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [booksLoading, setBooksLoading] = useState(true);
  const [audiobooksLoading, setAudiobooksLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/strava/activities?days=365', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.status}`);
        }

        const data = await response.json();
        setActivities(data);
      } catch (err: unknown) {
        setActivitiesError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <>
      <main>
        <div className="universal-gradient-container">
          <div className="universal-gradient-background"></div>
          <div className={styles.container}>
            <div className={styles.contentWrapper}>
              <div className={styles.content}>
                <h1 className={styles.title}>Live Feed</h1>
                <p className={styles.subtitle}>
                  An up-to-date feed of my recent activity out in the real world
                </p>

                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2>Activities</h2>
                    <p>
                      A collection of my outdoor (mostly) activities pulled via
                      the{' '}
                      <a
                        href="https://developers.strava.com/"
                        className={styles.apiLink}
                      >
                        Strava API
                      </a>
                      .
                    </p>
                  </div>

                  {activitiesLoading && (
                    <p className={styles.loadingText}>Loading activities...</p>
                  )}
                  {activitiesError && (
                    <p className={styles.error}>Error: {activitiesError}</p>
                  )}
                  {!activitiesLoading &&
                    !activitiesError &&
                    activities.length > 0 && (
                      <ActivityGrid activities={activities} />
                    )}
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2>Currently Reading</h2>
                    <p>
                      What I&apos;m currently working through (via my{' '}
                      <a
                        href="https://www.goodreads.com/review/list/24890536-zach-liibbe?ref=nav_mybooks&shelf=currently-reading"
                        className={styles.apiLink}
                      >
                        Goodreads &apos;Currently Reading&apos; Shelf
                      </a>
                      )
                    </p>
                  </div>
                  <CurrentlyReadingBooks />
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2>Read</h2>
                    <p>
                      Books recently completed (via my{' '}
                      <a
                        href="https://www.goodreads.com/review/list/24890536-zach-liibbe?ref=nav_mybooks&shelf=zach-read"
                        className={styles.apiLink}
                      >
                        Goodreads &apos;Read&apos; Shelf
                      </a>
                      )
                    </p>
                  </div>
                  <RecentBooks onLoadingChange={setBooksLoading} />
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2>Listening</h2>
                    <p>
                      Latest audiobooks I&apos;ve listened to (via my{' '}
                      <a
                        href="https://www.goodreads.com/review/list/24890536-zach-liibbe?ref=nav_mybooks&shelf=audiobooks"
                        className={styles.apiLink}
                      >
                        Goodreads &apos;Audiobooks&apos; Shelf
                      </a>
                      )
                    </p>
                  </div>
                  <RecentAudiobooks />
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
