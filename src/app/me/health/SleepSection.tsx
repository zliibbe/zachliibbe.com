'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { type Theme, themes } from '@/app/styles/themes';
import type { SleepSnapshot } from '@/lib/garmin-health/types';
import styles from './SleepSection.module.css';
import {
  ChartTooltip,
  formatDuration,
  StalenessIndicator,
  StatTile,
  TrendLineChart,
} from './shared';
import shared from './shared.module.css';

// gradientOne/Two/Three are the theme's 3 brand hues. In several themes two
// of those slots are identical or close enough in hue/lightness that a
// colorblind reader (and, for a few, even a normal-vision reader) can't tell
// two sleep stages apart -- confirmed by running each theme's triplet
// through the dataviz skill's validate_palette.js (CVD separation +
// normal-vision floor checks). Substitute accentPrimary for the colliding
// slot only in those themes; the rest use the brand gradient as-is.
function getStageColors(themeName: Theme['name']) {
  const c = themes[themeName].colors;
  if (themeName === 'ocean') {
    return {
      deep: c.gradientOne,
      light: c.accentPrimary,
      rem: c.gradientThree,
    };
  }
  if (
    themeName === 'evergreen' ||
    themeName === 'twilight' ||
    themeName === 'forest'
  ) {
    return { deep: c.gradientOne, light: c.gradientTwo, rem: c.accentPrimary };
  }
  if (themeName === 'sunset' || themeName === 'lotusBloom') {
    return {
      deep: c.gradientOne,
      light: c.accentPrimary,
      rem: c.gradientThree,
    };
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
  const [hoverKey, setHoverKey] = useState<string | null>(null);
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

  let cumulativePct = 0;
  const withPosition = segments.map(s => {
    const pct = (s.seconds / total) * 100;
    const centerPct = cumulativePct + pct / 2;
    cumulativePct += pct;
    return { ...s, pct, centerPct };
  });
  const hovered = withPosition.find(s => s.key === hoverKey) ?? null;

  return (
    <div className={styles.stagesBlock}>
      <div className={shared.chartWrapper}>
        <fieldset
          className={styles.stagesBar}
          aria-label="Sleep stage breakdown"
        >
          {withPosition.map(s => (
            <button
              key={s.key}
              type="button"
              className={styles.stagesSegment}
              data-hovered={s.key === hoverKey || undefined}
              style={{ flexGrow: s.pct, backgroundColor: s.colorVar }}
              aria-label={`${s.label}: ${formatDuration(s.seconds)}`}
              onMouseEnter={() => setHoverKey(s.key)}
              onMouseLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(s.key)}
              onBlur={() => setHoverKey(null)}
            >
              {s.pct >= 12 && (
                <span className={styles.stagesSegmentLabel}>
                  {formatDuration(s.seconds)}
                </span>
              )}
            </button>
          ))}
        </fieldset>
        {hovered && (
          <ChartTooltip left={`${hovered.centerPct}%`} top="0%">
            <div className={shared.tooltipRow}>
              <span
                className={shared.tooltipKey}
                style={{ backgroundColor: hovered.colorVar }}
              />
              <span className={shared.tooltipValue}>
                {formatDuration(hovered.seconds)}
              </span>
              <span className={shared.tooltipLabel}>{hovered.label}</span>
            </div>
          </ChartTooltip>
        )}
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
  // Freshness of the sync job itself, independent of which fields Garmin
  // had finished computing -- so use the raw series' latest date, not
  // mostRecent (which is filtered down to rows with sleep data present).
  const latestSyncedDate = rows?.at(-1)?.date ?? null;

  return (
    <section className={shared.section}>
      <div className={shared.sectionHeader}>
        <div className={shared.sectionHeaderTitleRow}>
          <h2>Sleep &amp; Recovery</h2>
          <StalenessIndicator latestDate={latestSyncedDate} />
        </div>
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
          <TrendLineChart
            points={withSleepData.map(r => ({
              date: r.date,
              value: (r.totalSeconds as number) / 3600,
            }))}
            accentColor={accentColor}
            title={`Sleep duration, last ${withSleepData.length} nights`}
            formatValue={v => `${v.toFixed(1)}h`}
            tableCaption="Sleep duration by night"
          />
        </>
      )}
    </section>
  );
}
