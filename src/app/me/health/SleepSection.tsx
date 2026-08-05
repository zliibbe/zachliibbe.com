'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { type Theme, themes } from '@/app/styles/themes';
import type { SleepSnapshot } from '@/lib/garmin-health/types';
import styles from './SleepSection.module.css';
import { formatDuration, StatTile } from './shared';
import shared from './shared.module.css';

// gradientOne/Two/Three are the theme's 3 brand hues, but two themes reuse
// the same hex across two of those slots (ocean: One===Two; evergreen:
// Two===Three), which would make two sleep stages render identically.
// Substitute accentPrimary for the colliding slot only in those themes.
function getStageColors(themeName: Theme['name']) {
  const c = themes[themeName].colors;
  if (themeName === 'ocean') {
    return {
      deep: c.gradientOne,
      light: c.accentPrimary,
      rem: c.gradientThree,
    };
  }
  if (themeName === 'evergreen') {
    return { deep: c.gradientOne, light: c.gradientTwo, rem: c.accentPrimary };
  }
  return { deep: c.gradientOne, light: c.gradientTwo, rem: c.gradientThree };
}

interface SleepRow {
  date: string;
  totalSeconds: number | null;
  deepSeconds: number | null;
  lightSeconds: number | null;
  remSeconds: number | null;
  awakeSeconds: number | null;
  stressAvg: number | null;
}

function extractRow(snapshot: SleepSnapshot): SleepRow {
  const dto = (snapshot.sleep?.dailySleepDTO ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  return {
    date: snapshot.date,
    totalSeconds: num(dto.sleepTimeSeconds),
    deepSeconds: num(dto.deepSleepSeconds),
    lightSeconds: num(dto.lightSleepSeconds),
    remSeconds: num(dto.remSleepSeconds),
    awakeSeconds: num(dto.awakeSleepSeconds),
    stressAvg: num(
      (snapshot.stress as Record<string, unknown> | undefined)?.avgStressLevel
    ),
  };
}

function SleepStagesBar({
  row,
  themeName,
}: {
  row: SleepRow;
  themeName: Theme['name'];
}) {
  const stageColors = getStageColors(themeName);
  const stageSegments: {
    key: keyof Pick<
      SleepRow,
      'deepSeconds' | 'lightSeconds' | 'remSeconds' | 'awakeSeconds'
    >;
    label: string;
    colorVar: string;
  }[] = [
    { key: 'deepSeconds', label: 'Deep', colorVar: stageColors.deep },
    { key: 'lightSeconds', label: 'Light', colorVar: stageColors.light },
    { key: 'remSeconds', label: 'REM', colorVar: stageColors.rem },
    { key: 'awakeSeconds', label: 'Awake', colorVar: 'var(--chart-muted)' },
  ];
  const segments = stageSegments
    .map(s => ({
      ...s,
      seconds: row[s.key] ?? 0,
    }))
    .filter(s => s.seconds > 0);
  const total = segments.reduce((sum, s) => sum + s.seconds, 0);
  if (total === 0) return null;

  return (
    <div className={styles.stagesBlock}>
      <div
        className={styles.stagesBar}
        role="img"
        aria-label="Sleep stage breakdown"
      >
        {segments.map(s => {
          const pct = (s.seconds / total) * 100;
          return (
            <div
              key={s.key}
              className={styles.stagesSegment}
              style={{ flexGrow: pct, backgroundColor: s.colorVar }}
              title={`${s.label}: ${formatDuration(s.seconds)}`}
            >
              {pct >= 12 && (
                <span className={styles.stagesSegmentLabel}>
                  {formatDuration(s.seconds)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.stagesLegend}>
        {segments.map(s => (
          <span key={s.key} className={styles.stagesLegendItem}>
            <span
              className={styles.stagesLegendSwatch}
              style={{ backgroundColor: s.colorVar }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SleepTrendLine({
  rows,
  accentColor,
}: {
  rows: SleepRow[];
  accentColor: string;
}) {
  const points = rows
    .filter(r => r.totalSeconds !== null)
    .map(r => ({ date: r.date, hours: (r.totalSeconds as number) / 3600 }));
  if (points.length < 2) return null;

  const w = 640;
  const h = 140;
  const padding = 24;
  const min = Math.min(...points.map(p => p.hours), 0);
  const max = Math.max(...points.map(p => p.hours));
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (w - padding * 2);
    const y = h - padding - ((p.hours - min) / range) * (h - padding * 2);
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
          Sleep duration, last {points.length} nights
        </h3>
      </div>
      <svg
        className={styles.trendSvg}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`Sleep duration trend over ${points.length} nights, most recent ${last.hours.toFixed(1)} hours`}
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
          {last.hours.toFixed(1)}h
        </text>
      </svg>
      <table className={shared.srOnlyTable}>
        <caption>Sleep duration by night</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          {points.map(p => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.hours.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SleepSection() {
  const { currentTheme } = useTheme();
  const accentColor = themes[currentTheme].colors.gradientOne;
  const [rows, setRows] = useState<SleepRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/me/health/sleep?range=14', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch sleep data: ${response.status}`);
        }
        const json = await response.json();
        const series: SleepSnapshot[] = json.series ?? [];
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

  const withSleepData = (rows ?? []).filter(r => r.totalSeconds !== null);
  const mostRecent = withSleepData[withSleepData.length - 1] ?? null;

  return (
    <section className={shared.section}>
      <div className={shared.sectionHeader}>
        <h2>Sleep &amp; Recovery</h2>
        <p>Sleep stages and stress, synced from Garmin Connect.</p>
      </div>

      {loading && <p className={shared.loadingText}>Loading sleep data...</p>}
      {error && <p className={shared.error}>Error: {error}</p>}
      {!loading && !error && !mostRecent && (
        <p className={shared.emptyText}>No sleep data synced yet.</p>
      )}
      {!loading && !error && mostRecent && (
        <>
          <div className={shared.statRow}>
            <StatTile
              label={`Sleep, ${mostRecent.date}`}
              value={formatDuration(mostRecent.totalSeconds as number)}
              sparkline={withSleepData.map(r => r.totalSeconds as number)}
              accentColor={accentColor}
            />
            {mostRecent.stressAvg !== null && (
              <StatTile
                label="Avg stress that day"
                value={String(mostRecent.stressAvg)}
                sparkline={withSleepData
                  .filter(r => r.stressAvg !== null)
                  .map(r => r.stressAvg as number)}
                accentColor={accentColor}
              />
            )}
          </div>

          <SleepStagesBar row={mostRecent} themeName={currentTheme} />
          <SleepTrendLine rows={withSleepData} accentColor={accentColor} />
        </>
      )}
    </section>
  );
}
