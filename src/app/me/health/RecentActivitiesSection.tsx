'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { themes } from '@/app/styles/themes';
import type { GarminActivity } from '@/lib/garmin-health/types';
import styles from './RecentActivitiesSection.module.css';
import { SkeletonList } from './shared';
import shared from './shared.module.css';

interface ActivityRow {
  id: string;
  name: string;
  typeLabel: string;
  startTimeLocal: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
  calories: number | null;
  averageHR: number | null;
}

function titleCase(s: string): string {
  return s
    .split('_')
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function extractRow(activity: GarminActivity): ActivityRow {
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  const activityType = activity.activityType as
    | Record<string, unknown>
    | undefined;
  const typeKey =
    typeof activityType?.typeKey === 'string'
      ? activityType.typeKey
      : 'activity';

  return {
    id: String(activity.activityId ?? activity.startTimeLocal ?? Math.random()),
    name:
      typeof activity.activityName === 'string'
        ? activity.activityName
        : titleCase(typeKey),
    typeLabel: titleCase(typeKey),
    startTimeLocal:
      typeof activity.startTimeLocal === 'string'
        ? activity.startTimeLocal
        : '',
    distanceMeters: num(activity.distance),
    durationSeconds: num(activity.duration),
    calories: num(activity.calories),
    averageHR: num(activity.averageHR),
  };
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function RecentActivitiesSection() {
  const { currentTheme } = useTheme();
  const accentColor = themes[currentTheme].colors.gradientThree;
  const [activities, setActivities] = useState<ActivityRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/me/health/activities', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.status}`);
        }
        const json = await response.json();
        const raw: GarminActivity[] = json.activities ?? [];
        if (!cancelled) {
          setActivities(raw.map(extractRow));
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
  }, []);

  return (
    <section className={shared.section}>
      <div className={shared.sectionHeader}>
        <h2>Recent Activities</h2>
        <p>The most recent activities logged directly in Garmin Connect.</p>
      </div>

      {loading && (
        <>
          <p className={shared.srOnly}>Loading recent activities...</p>
          <SkeletonList count={6} />
        </>
      )}
      {error && <p className={shared.error}>Error: {error}</p>}
      {!loading &&
        !error &&
        activities &&
        (activities.length === 0 ? (
          <p className={shared.emptyText}>No activities synced yet.</p>
        ) : (
          <ul className={styles.list}>
            {activities.map(a => (
              <li key={a.id} className={styles.item}>
                <span
                  className={styles.typeDot}
                  style={{ backgroundColor: accentColor }}
                  title={a.typeLabel}
                />
                <div className={styles.itemMain}>
                  <span className={styles.itemName}>{a.name}</span>
                  <span className={styles.itemMeta}>
                    {a.typeLabel}
                    {a.startTimeLocal && ` · ${a.startTimeLocal.slice(0, 10)}`}
                  </span>
                </div>
                <div className={styles.itemStats}>
                  {a.distanceMeters !== null && (
                    <span>{formatDistance(a.distanceMeters)}</span>
                  )}
                  {a.durationSeconds !== null && (
                    <span>{formatDuration(a.durationSeconds)}</span>
                  )}
                  {a.calories !== null && <span>{a.calories} cal</span>}
                  {a.averageHR !== null && <span>{a.averageHR} bpm avg</span>}
                </div>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
