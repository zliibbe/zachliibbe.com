import { useEffect, useState } from 'react';
import styles from './shared.module.css';

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

// Every /me/health section fetches one category's series on mount, extracts
// rows from the raw JSON, and tracks loading/error/cancelled state the same
// way -- the only real differences are the URL, which JSON array key holds
// the raw rows, how to extract a row, and whether the result needs sorting
// by date (Recent Activities arrives pre-ordered from Garmin; sorting by
// date string would scramble same-day entries).
export function useHealthCategoryData<TRaw, TRow>({
  url,
  jsonKey,
  label,
  extractRow,
  sortKey,
}: {
  url: string;
  jsonKey: string;
  label: string;
  extractRow: (raw: TRaw) => TRow;
  // Omit for data that arrives pre-ordered (e.g. Recent Activities) --
  // sorting by a same-day date string would scramble same-day entries.
  sortKey?: (row: TRow) => string;
}): { rows: TRow[] | null; loading: boolean; error: string | null } {
  const [rows, setRows] = useState<TRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch ${label}: ${response.status}`);
        }
        const json = await response.json();
        const raw: TRaw[] = json[jsonKey] ?? [];
        const extracted = raw.map(extractRow);
        if (sortKey) {
          extracted.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
        }
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
  }, [url, jsonKey, label]);

  return { rows, loading, error };
}

export function Sparkline({
  values,
  accentColor,
}: {
  values: number[];
  accentColor: string;
}) {
  if (values.length < 2) return null;
  const w = 80;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const last = points.at(-1);
  if (!last) return null;
  const [lastX, lastY] = last;

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={`Trend sparkline, ${values.length} points`}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--chart-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="4"
        fill={accentColor}
        stroke="var(--chart-surface)"
        strokeWidth="2"
      />
    </svg>
  );
}

// Positioned as a percentage of its nearest `position: relative` ancestor
// (the chart wrapper), so callers can place it from SVG viewBox coordinates
// without needing a ref/getBoundingClientRect -- the wrapper scales 1:1 with
// the viewBox since the chart is its only content.
export function ChartTooltip({
  left,
  top,
  children,
}: {
  left: string;
  top: string;
  children: React.ReactNode;
}) {
  return (
    <output className={styles.tooltip} style={{ left, top }} aria-live="polite">
      {children}
    </output>
  );
}

interface TrendPoint {
  date: string;
  value: number;
}

// Line charts get a crosshair that snaps to the nearest data position (per
// the dataviz skill's interaction spec), not a per-mark hover -- one hit
// zone per point, each roughly half the distance to its neighbors, so the
// pointer only has to be closest, not dead-center. Keyboard focus (Tab
// through the hit zones) shows the same tooltip as hover.
export function TrendLineChart({
  points,
  accentColor,
  title,
  formatValue = (v: number) => String(v),
  tableCaption,
}: {
  points: TrendPoint[];
  accentColor: string;
  title: string;
  formatValue?: (v: number) => string;
  tableCaption: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
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

  const hitZones = coords.map((c, i) => {
    const prev = coords[i - 1];
    const next = coords[i + 1];
    const hitStart = i === 0 || !prev ? 0 : (prev.x + c.x) / 2;
    const hitEnd = i === coords.length - 1 || !next ? w : (c.x + next.x) / 2;
    return { ...c, hitStart, hitEnd };
  });

  const active = hoverIndex !== null ? (coords[hoverIndex] ?? last) : last;
  const isHovering = hoverIndex !== null;

  return (
    <div className={styles.trendBlock}>
      <div className={styles.trendHeader}>
        <h3 className={styles.trendTitle}>{title}</h3>
      </div>
      <div className={styles.chartWrapper}>
        <svg
          className={styles.trendSvg}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`${title}, most recent ${formatValue(last.value)}`}
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
          {hitZones.map((z, i) => (
            // biome-ignore lint/a11y/useSemanticElements: rect is an SVG shape, <button> isn't valid SVG content
            <rect
              key={z.date}
              x={z.hitStart}
              y={0}
              width={z.hitEnd - z.hitStart}
              height={h}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${z.date}: ${formatValue(z.value)}`}
              onPointerEnter={() => setHoverIndex(i)}
              onPointerLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
            />
          ))}
          {isHovering && (
            <line
              x1={active.x}
              y1={padding}
              x2={active.x}
              y2={h - padding}
              stroke="var(--chart-muted)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          )}
          <circle
            cx={active.x}
            cy={active.y}
            r="4"
            fill={accentColor}
            stroke="var(--chart-surface)"
            strokeWidth="2"
          />
          {!isHovering && (
            <text
              x={last.x}
              y={last.y - 10}
              textAnchor="end"
              className={styles.trendEndLabel}
            >
              {formatValue(last.value)}
            </text>
          )}
        </svg>
        {isHovering && (
          <ChartTooltip
            left={`${(active.x / w) * 100}%`}
            top={`${(active.y / h) * 100}%`}
          >
            <div className={styles.tooltipRow}>
              <span
                className={styles.tooltipKey}
                style={{ backgroundColor: accentColor }}
              />
              <span className={styles.tooltipValue}>
                {formatValue(active.value)}
              </span>
              <span className={styles.tooltipLabel}>{active.date}</span>
            </div>
          </ChartTooltip>
        )}
      </div>
      <div className={styles.srOnly}>
        <table>
          <caption>{tableCaption}</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {points.map(p => (
              <tr key={p.date}>
                <td>{p.date}</td>
                <td>{formatValue(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STALE_THRESHOLD_DAYS = 2;

// Days between the most recent date present in KV (regardless of which
// fields Garmin had populated by sync time) and today. A gap here means the
// sync job itself didn't run/write -- not that Garmin hasn't finished
// computing a slow-to-arrive metric yet, which is why callers should pass
// the latest date from the raw series, not from a metric-filtered "most
// recent value" lookup.
function daysSinceDate(dateStr: string): number | null {
  const latest = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(latest.getTime())) return null;
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return Math.floor((todayUtc - latest.getTime()) / (1000 * 60 * 60 * 24));
}

// A reserved status color, not a theme color -- per the dataviz skill,
// status (state) and categorical (identity) colors are different jobs and
// must never share a hue. Ships with an icon and text, never color alone.
export function StalenessIndicator({
  latestDate,
}: {
  latestDate: string | null;
}) {
  if (!latestDate) return null;
  const days = daysSinceDate(latestDate);
  if (days === null || days <= STALE_THRESHOLD_DAYS) return null;

  return (
    <output className={styles.staleness}>
      <svg
        className={styles.stalenessIcon}
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path
          d="M8 1.5 1 14h14L8 1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <line
          x1="8"
          y1="6"
          x2="8"
          y2="9.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.8" r="0.9" fill="currentColor" />
      </svg>
      Last synced {days} days ago
    </output>
  );
}

// Initial-load-only placeholders -- per the dataviz skill, a refetch should
// hold the previous render at reduced opacity instead, never re-show a
// skeleton. These sections only fetch once on mount, so that distinction
// doesn't come up yet, but don't reuse these for a future refetch/filter.
export function SkeletonStatTile() {
  return (
    <div className={styles.statTile} aria-hidden="true">
      <span className={`${styles.skeletonBar} ${styles.skeletonLabel}`} />
      <span className={`${styles.skeletonBar} ${styles.skeletonValue}`} />
    </div>
  );
}

export function SkeletonStatRow({ count }: { count: number }) {
  return (
    <div className={styles.statRow}>
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
        <SkeletonStatTile key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 140 }: { height?: number }) {
  return (
    <div
      className={styles.skeletonChart}
      style={{ height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonList({ count }: { count: number }) {
  return (
    <div className={styles.skeletonList} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
        <div key={i} className={styles.skeletonListRow} />
      ))}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sparkline,
  accentColor,
}: {
  label: string;
  value: string;
  sparkline?: number[];
  accentColor: string;
}) {
  return (
    <div className={styles.statTile}>
      <span className={styles.statTileLabel}>{label}</span>
      <div className={styles.statTileRow}>
        <span className={styles.statTileValue}>{value}</span>
        {sparkline && (
          <Sparkline values={sparkline} accentColor={accentColor} />
        )}
      </div>
    </div>
  );
}
