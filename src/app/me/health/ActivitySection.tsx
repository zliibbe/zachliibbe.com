'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { themes } from '@/app/styles/themes';
import type { ActivitySnapshot } from '@/lib/garmin-health/types';
import styles from './ActivitySection.module.css';
import { ChartTooltip, StatTile } from './shared';
import shared from './shared.module.css';

interface ActivityRow {
  date: string;
  steps: number | null;
  distanceMeters: number | null;
  calories: number | null;
  floorsAscended: number | null;
}

function extractRow(snapshot: ActivitySnapshot): ActivityRow {
  const summary = (snapshot.summary ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);

  const floors = (snapshot.floors ?? {}) as Record<string, unknown>;
  const floorValues = Array.isArray(floors.floorValuesArray)
    ? (floors.floorValuesArray as unknown[])
    : [];
  const floorsAscended = floorValues.length
    ? floorValues.reduce((sum: number, row) => {
        const ascended = Array.isArray(row) ? Number(row[2]) : 0;
        return sum + (Number.isFinite(ascended) ? ascended : 0);
      }, 0)
    : null;

  return {
    date: snapshot.date,
    steps: num(summary.totalSteps),
    distanceMeters: num(summary.totalDistanceMeters),
    calories: num(summary.totalKilocalories),
    floorsAscended,
  };
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function StepsBar({
  rows,
  accentColor,
}: {
  rows: ActivityRow[];
  accentColor: string;
}) {
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const points = rows.filter(r => r.steps !== null) as (ActivityRow & {
    steps: number;
  })[];
  if (points.length < 2) return null;

  const max = Math.max(...points.map(p => p.steps));
  const hoverIndex = points.findIndex(p => p.date === hoverDate);
  const hovered = hoverIndex >= 0 ? points[hoverIndex] : null;

  return (
    <div className={styles.stepsBlock}>
      <div className={styles.stepsHeader}>
        <h3 className={styles.stepsTitle}>Steps, last {points.length} days</h3>
      </div>
      <div className={shared.chartWrapper}>
        <fieldset className={styles.stepsBars} aria-label="Daily step counts">
          {points.map(p => {
            const pct = max > 0 ? (p.steps / max) * 100 : 0;
            return (
              <button
                key={p.date}
                type="button"
                className={styles.stepsBarColumn}
                aria-label={`${p.date}: ${p.steps.toLocaleString()} steps`}
                onMouseEnter={() => setHoverDate(p.date)}
                onMouseLeave={() => setHoverDate(null)}
                onFocus={() => setHoverDate(p.date)}
                onBlur={() => setHoverDate(null)}
              >
                <span
                  className={styles.stepsBarFill}
                  data-hovered={p.date === hoverDate || undefined}
                  style={{ height: `${pct}%`, backgroundColor: accentColor }}
                />
              </button>
            );
          })}
        </fieldset>
        {hovered && (
          <ChartTooltip
            left={`${((hoverIndex + 0.5) / points.length) * 100}%`}
            top={`${100 - (hovered.steps / max) * 100}%`}
          >
            <div className={shared.tooltipRow}>
              <span
                className={shared.tooltipKey}
                style={{ backgroundColor: accentColor }}
              />
              <span className={shared.tooltipValue}>
                {hovered.steps.toLocaleString()}
              </span>
              <span className={shared.tooltipLabel}>{hovered.date}</span>
            </div>
          </ChartTooltip>
        )}
      </div>
      <table className={shared.srOnlyTable}>
        <caption>Daily steps</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Steps</th>
          </tr>
        </thead>
        <tbody>
          {points.map(p => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.steps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ActivitySection() {
  const { currentTheme } = useTheme();
  const accentColor = themes[currentTheme].colors.gradientTwo;
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/me/health/activity?range=14', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch activity data: ${response.status}`);
        }
        const json = await response.json();
        const series: ActivitySnapshot[] = json.series ?? [];
        const extracted = series
          .map(extractRow)
          .sort((a, b) => a.date.localeCompare(b.date));
        if (!cancelled) {
          setRows(extracted);
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

  const withData = (rows ?? []).filter(r => r.steps !== null);
  const mostRecent = withData[withData.length - 1] ?? null;

  return (
    <section className={shared.section}>
      <div className={shared.sectionHeader}>
        <h2>Daily Activity</h2>
        <p>
          Steps, calories, distance, and floors, synced from Garmin Connect.
        </p>
      </div>

      {loading && (
        <p className={shared.loadingText}>Loading activity data...</p>
      )}
      {error && <p className={shared.error}>Error: {error}</p>}
      {!loading && !error && !mostRecent && (
        <p className={shared.emptyText}>No activity data synced yet.</p>
      )}
      {!loading && !error && mostRecent && (
        <>
          <div className={shared.statRow}>
            <StatTile
              label={`Steps, ${mostRecent.date}`}
              value={(mostRecent.steps as number).toLocaleString()}
              sparkline={withData.map(r => r.steps as number)}
              accentColor={accentColor}
            />
            {mostRecent.distanceMeters !== null && (
              <StatTile
                label="Distance that day"
                value={formatDistance(mostRecent.distanceMeters)}
                sparkline={withData
                  .filter(r => r.distanceMeters !== null)
                  .map(r => r.distanceMeters as number)}
                accentColor={accentColor}
              />
            )}
            {mostRecent.calories !== null && (
              <StatTile
                label="Calories that day"
                value={mostRecent.calories.toLocaleString()}
                sparkline={withData
                  .filter(r => r.calories !== null)
                  .map(r => r.calories as number)}
                accentColor={accentColor}
              />
            )}
            {mostRecent.floorsAscended !== null && (
              <StatTile
                label="Floors climbed that day"
                value={String(mostRecent.floorsAscended)}
                accentColor={accentColor}
              />
            )}
          </div>

          <StepsBar rows={withData} accentColor={accentColor} />
        </>
      )}
    </section>
  );
}
