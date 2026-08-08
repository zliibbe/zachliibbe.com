'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { themes } from '@/app/styles/themes';
import type { TrainingSnapshot } from '@/lib/garmin-health/types';
import {
  SkeletonChart,
  SkeletonStatRow,
  StalenessIndicator,
  StatTile,
  TrendLineChart,
} from './shared';
import shared from './shared.module.css';

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
  const latestSyncedDate = rows?.at(-1)?.date ?? null;

  return (
    <section className={shared.section}>
      <div className={shared.sectionHeader}>
        <div className={shared.sectionHeaderTitleRow}>
          <h2>Advanced Training</h2>
          <StalenessIndicator latestDate={latestSyncedDate} />
        </div>
        <p>VO2 max and training load, synced from Garmin Connect.</p>
      </div>

      {loading && (
        <>
          <p className={shared.srOnly}>Loading training data...</p>
          <SkeletonStatRow count={2} />
          <SkeletonChart height={140} />
        </>
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

          <TrendLineChart
            points={allRows
              .filter(r => r.weeklyTrainingLoad !== null)
              .map(r => ({
                date: r.date,
                value: r.weeklyTrainingLoad as number,
              }))}
            accentColor={accentColor}
            title={`Weekly training load, last ${allRows.length} days`}
            tableCaption="Weekly training load by day"
          />
        </>
      )}
    </section>
  );
}
