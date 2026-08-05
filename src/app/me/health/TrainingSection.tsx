'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { themes } from '@/app/styles/themes';
import type { TrainingSnapshot } from '@/lib/garmin-health/types';
import { StatTile } from './shared';
import shared from './shared.module.css';
import styles from './TrainingSection.module.css';

interface TrainingRow {
  date: string;
  vo2Max: number | null;
  weeklyTrainingLoad: number | null;
}

function extractRow(snapshot: TrainingSnapshot): TrainingRow {
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  const status = snapshot.training_status as
    | Record<string, unknown>
    | undefined;

  const vo2Generic = (
    status?.mostRecentVO2Max as Record<string, unknown> | undefined
  )?.generic as Record<string, unknown> | undefined;
  const vo2Max =
    num(vo2Generic?.vo2MaxPreciseValue) ?? num(vo2Generic?.vo2MaxValue);

  const trainingStatusObj = status?.mostRecentTrainingStatus as
    | Record<string, unknown>
    | undefined;
  const latestData = trainingStatusObj?.latestTrainingStatusData as
    | Record<string, unknown>
    | undefined;
  const firstDevice = latestData
    ? (Object.values(latestData)[0] as Record<string, unknown> | undefined)
    : undefined;
  const weeklyTrainingLoad = num(firstDevice?.weeklyTrainingLoad);

  return { date: snapshot.date, vo2Max, weeklyTrainingLoad };
}

// Not every metric updates the same day -- find the most recent row where
// this specific field is present, independent of what's missing elsewhere.
function mostRecentValue(
  rows: TrainingRow[],
  key: 'vo2Max' | 'weeklyTrainingLoad'
) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (!row) continue;
    const v = row[key];
    if (v !== null) return { date: row.date, value: v };
  }
  return null;
}

function LoadTrendLine({
  rows,
  accentColor,
}: {
  rows: TrainingRow[];
  accentColor: string;
}) {
  const points = rows
    .filter(r => r.weeklyTrainingLoad !== null)
    .map(r => ({ date: r.date, value: r.weeklyTrainingLoad as number }));
  if (points.length < 2) return null;

  const w = 640;
  const h = 140;
  const padding = 24;
  const min = Math.min(...points.map(p => p.value), 0);
  const max = Math.max(...points.map(p => p.value));
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (w - padding * 2);
    const y = h - padding - ((p.value - min) / range) * (h - padding * 2);
    return { ...p, x, y };
  });
  const path = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');
  const last = coords.at(-1);
  if (!last) return null;

  return (
    <div className={styles.trendBlock}>
      <div className={styles.trendHeader}>
        <h3 className={styles.trendTitle}>
          Weekly training load, last {points.length} days
        </h3>
      </div>
      <svg
        className={styles.trendSvg}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`Weekly training load trend, most recent ${last.value}`}
      >
        <line
          x1={padding}
          y1={h - padding}
          x2={w - padding}
          y2={h - padding}
          stroke="var(--chart-baseline)"
          strokeWidth="1"
        />
        <path
          d={path}
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="4"
          fill={accentColor}
          stroke="var(--chart-surface)"
          strokeWidth="2"
        />
        <text
          x={last.x}
          y={last.y - 10}
          textAnchor="end"
          className={styles.trendEndLabel}
        >
          {last.value}
        </text>
      </svg>
      <table className={shared.srOnlyTable}>
        <caption>Weekly training load by day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Load</th>
          </tr>
        </thead>
        <tbody>
          {points.map(p => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrainingSection() {
  const { currentTheme } = useTheme();
  const accentColor = themes[currentTheme].colors.accentPrimary;
  const [rows, setRows] = useState<TrainingRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/me/health/training?range=30', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch training data: ${response.status}`);
        }
        const json = await response.json();
        const series: TrainingSnapshot[] = json.series ?? [];
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

  const allRows = rows ?? [];
  const vo2 = mostRecentValue(allRows, 'vo2Max');
  const load = mostRecentValue(allRows, 'weeklyTrainingLoad');
  const hasAnyData = vo2 !== null || load !== null;

  return (
    <section className={shared.section}>
      <div className={shared.sectionHeader}>
        <h2>Advanced Training</h2>
        <p>VO2 max and training load, synced from Garmin Connect.</p>
      </div>

      {loading && (
        <p className={shared.loadingText}>Loading training data...</p>
      )}
      {error && <p className={shared.error}>Error: {error}</p>}
      {!loading && !error && !hasAnyData && (
        <p className={shared.emptyText}>No training data synced yet.</p>
      )}
      {!loading && !error && hasAnyData && (
        <>
          <div className={shared.statRow}>
            {vo2 !== null && (
              <StatTile
                label={`VO2 max, ${vo2.date}`}
                value={vo2.value.toFixed(1)}
                accentColor={accentColor}
              />
            )}
            {load !== null && (
              <StatTile
                label={`Weekly training load, ${load.date}`}
                value={String(load.value)}
                sparkline={allRows
                  .filter(r => r.weeklyTrainingLoad !== null)
                  .map(r => r.weeklyTrainingLoad as number)}
                accentColor={accentColor}
              />
            )}
          </div>

          <LoadTrendLine rows={allRows} accentColor={accentColor} />
        </>
      )}
    </section>
  );
}
