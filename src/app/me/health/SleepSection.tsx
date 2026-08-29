'use client';

import { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { type Theme, themes } from '@/app/styles/themes';
import type { SleepSnapshot } from '@/lib/garmin-health/types';
import styles from './SleepSection.module.css';
import {
  ChartTooltip,
  formatDuration,
  SkeletonChart,
  SkeletonStatRow,
  StalenessIndicator,
  StatTile,
  TrendLineChart,
  useHealthCategoryData,
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

// Must match --chart-muted in shared.module.css, which is the same fixed
// gray in every mode -- used only to pick a readable label color for the
// Awake segment; the segment itself still renders via the CSS var.
const CHART_MUTED_HEX = '#898781';

// Segment fill colors are arbitrary theme/brand hues (not chosen for
// contrast against any one label color), so the label needs a per-segment
// light/dark choice rather than a single CSS color tied to site light/dark
// mode -- a light theme color (e.g. ocean's gold accentPrimary) needs dark
// text regardless of whether the site itself is in light or dark mode.
function getContrastTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.substring(0, 2), 16);
  const g = Number.parseInt(clean.substring(2, 4), 16);
  const b = Number.parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140 ? '#000' : '#fff';
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
    contrastHex: string;
  }[] = [
    {
      key: 'deepSeconds',
      label: 'Deep',
      colorVar: stageColors.deep,
      contrastHex: stageColors.deep,
    },
    {
      key: 'lightSeconds',
      label: 'Light',
      colorVar: stageColors.light,
      contrastHex: stageColors.light,
    },
    {
      key: 'remSeconds',
      label: 'REM',
      colorVar: stageColors.rem,
      contrastHex: stageColors.rem,
    },
    {
      key: 'awakeSeconds',
      label: 'Awake',
      colorVar: 'var(--chart-muted)',
      contrastHex: CHART_MUTED_HEX,
    },
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
                <span
                  className={styles.stagesSegmentLabel}
                  style={{ color: getContrastTextColor(s.contrastHex) }}
                >
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
  const { rows, loading, error } = useHealthCategoryData<
    SleepSnapshot,
    SleepRow
  >({
    url: '/api/me/health/sleep?range=14',
    jsonKey: 'series',
    label: 'sleep data',
    extractRow,
    sortKey: r => r.date,
  });

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

      {loading && (
        <>
          <p className={shared.srOnly}>Loading sleep data...</p>
          <SkeletonStatRow count={2} />
          <SkeletonChart height={44} />
          <SkeletonChart height={140} />
        </>
      )}
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
