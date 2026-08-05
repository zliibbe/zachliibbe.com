'use client';

import { useEffect, useState } from 'react';
import type { SleepSnapshot } from '@/lib/garmin-health/types';
import styles from './HealthDashboard.module.css';

interface SleepResponse {
  latest: SleepSnapshot | null;
  series: SleepSnapshot[];
}

export default function HealthDashboard() {
  const [sleep, setSleep] = useState<SleepResponse | null>(null);
  const [sleepLoading, setSleepLoading] = useState(true);
  const [sleepError, setSleepError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSleep = async () => {
      try {
        const response = await fetch('/api/me/health/sleep?range=30', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch sleep data: ${response.status}`);
        }
        const data = await response.json();
        setSleep(data);
      } catch (err: unknown) {
        setSleepError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setSleepLoading(false);
      }
    };

    fetchSleep();
  }, []);

  return (
    <main>
      <div className="universal-gradient-container">
        <div className="universal-gradient-background"></div>
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.content}>
              <h1 className={styles.title}>Health</h1>
              <p className={styles.subtitle}>
                My personal health and training dashboard, synced from Garmin
                Connect.
              </p>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Sleep &amp; Recovery</h2>
                  <p>
                    Sleep, body battery, stress, HRV, and resting heart rate.
                  </p>
                </div>

                {sleepLoading && (
                  <p className={styles.loadingText}>Loading sleep data...</p>
                )}
                {sleepError && (
                  <p className={styles.error}>Error: {sleepError}</p>
                )}
                {!sleepLoading && !sleepError && sleep && (
                  <SleepSection data={sleep} />
                )}
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Daily Activity</h2>
                  <p className={styles.emptyText}>Coming soon.</p>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Recent Activities</h2>
                  <p className={styles.emptyText}>Coming soon.</p>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Advanced Training</h2>
                  <p className={styles.emptyText}>Coming soon.</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Renders the raw synced JSON rather than extracting specific fields — this
// is a Phase 1 shell to prove the KV read path end-to-end; once real Garmin
// sleep-response data has been seen, this becomes real stat tiles / a trend
// chart (see the dataviz skill).
function SleepSection({ data }: { data: SleepResponse }) {
  if (!data.latest && data.series.length === 0) {
    return <p className={styles.emptyText}>No sleep data synced yet.</p>;
  }

  return (
    <div>
      {data.latest && (
        <>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Latest synced date</span>
            <span className={styles.statValue}>{data.latest.date}</span>
          </div>
          <pre className={styles.jsonDump}>
            {JSON.stringify(data.latest, null, 2)}
          </pre>
        </>
      )}
      {data.series.length > 0 && (
        <ul className={styles.dayList}>
          {data.series.map(snapshot => (
            <li key={snapshot.date} className={styles.dayListItem}>
              {snapshot.date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
