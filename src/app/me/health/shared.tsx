import styles from './shared.module.css';

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
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
