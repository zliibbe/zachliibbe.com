'use client';

import { useEffect, useState } from 'react';
import type {
  ActivitySnapshot,
  SleepSnapshot,
} from '@/lib/garmin-health/types';
import styles from './HealthDashboard.module.css';

interface Snapshot {
  date: string;
}

interface CategoryResponse<T> {
  latest: T | null;
  series: T[];
}

function useCategoryData<T extends Snapshot>(category: string, range = 30) {
  const [data, setData] = useState<CategoryResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/me/health/${category}?range=${range}`,
          { cache: 'no-store' }
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${category} data: ${response.status}`
          );
        }
        const json = await response.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'An unknown error occurred'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [category, range]);

  return { data, loading, error };
}

// Renders the raw synced JSON rather than extracting specific fields -- this
// is a Phase 1-3 shell to prove the KV read path end-to-end for each
// category; becomes real stat tiles / trend charts once the dashboard
// redesign (dataviz skill) lands.
function CategorySection<T extends Snapshot>({
  category,
  title,
  description,
}: {
  category: string;
  title: string;
  description: string;
}) {
  const { data, loading, error } = useCategoryData<T>(category);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {loading && (
        <p className={styles.loadingText}>Loading {title.toLowerCase()}...</p>
      )}
      {error && <p className={styles.error}>Error: {error}</p>}
      {!loading && !error && data && (
        <>
          {!data.latest && data.series.length === 0 && (
            <p className={styles.emptyText}>No data synced yet.</p>
          )}
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
        </>
      )}
    </section>
  );
}

export default function HealthDashboard() {
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

              <CategorySection<SleepSnapshot>
                category="sleep"
                title="Sleep & Recovery"
                description="Sleep, body battery, stress, HRV, and resting heart rate."
              />

              <CategorySection<ActivitySnapshot>
                category="activity"
                title="Daily Activity"
                description="Steps, calories, distance, and floors."
              />

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
