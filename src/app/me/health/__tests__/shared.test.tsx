import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  formatDuration,
  SkeletonChart,
  SkeletonList,
  SkeletonStatRow,
  StalenessIndicator,
  StatTile,
  TrendLineChart,
} from '../shared';

describe('formatDuration', () => {
  it('formats whole hours and minutes', () => {
    expect(formatDuration(27120)).toBe('7h 32m');
  });

  it('rounds partial minutes', () => {
    expect(formatDuration(90)).toBe('0h 2m');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0h 0m');
  });
});

describe('StatTile', () => {
  it('renders the label and value', () => {
    render(
      <StatTile label="Steps, 2026-08-04" value="7,275" accentColor="#2a78d6" />
    );
    expect(screen.getByText('Steps, 2026-08-04')).toBeInTheDocument();
    expect(screen.getByText('7,275')).toBeInTheDocument();
  });

  it('renders a sparkline when given at least 2 values', () => {
    render(
      <StatTile
        label="Steps"
        value="100"
        sparkline={[1, 2, 3]}
        accentColor="#2a78d6"
      />
    );
    expect(
      screen.getByRole('img', { name: /Trend sparkline/ })
    ).toBeInTheDocument();
  });

  it('renders no sparkline with fewer than 2 values', () => {
    render(
      <StatTile
        label="Steps"
        value="100"
        sparkline={[1]}
        accentColor="#2a78d6"
      />
    );
    expect(
      screen.queryByRole('img', { name: /Trend sparkline/ })
    ).not.toBeInTheDocument();
  });
});

describe('skeleton placeholders', () => {
  it('renders one placeholder tile per count and hides them from assistive tech', () => {
    const { container } = render(<SkeletonStatRow count={3} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
      3
    );
  });

  it('renders a chart placeholder at the requested height', () => {
    const { container } = render(<SkeletonChart height={44} />);
    const chart = container.querySelector('[aria-hidden="true"]');
    expect(chart).toHaveStyle({ height: '44px' });
  });

  it('renders one row per count for a list placeholder', () => {
    const { container } = render(<SkeletonList count={4} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
      1
    );
    expect(container.firstElementChild?.children).toHaveLength(4);
  });
});

describe('StalenessIndicator', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-05T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when there is no data yet', () => {
    const { container } = render(<StalenessIndicator latestDate={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the latest sync is within the threshold', () => {
    const { container } = render(
      <StalenessIndicator latestDate="2026-08-04" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a staleness warning once the latest sync is older than the threshold', () => {
    render(<StalenessIndicator latestDate="2026-08-01" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Last synced 4 days ago'
    );
  });
});

describe('TrendLineChart', () => {
  const points = [
    { date: '2026-08-01', value: 7.0 },
    { date: '2026-08-02', value: 7.5 },
    { date: '2026-08-03', value: 8.0 },
  ];

  it('renders nothing with fewer than 2 points', () => {
    const { container } = render(
      <TrendLineChart
        points={[{ date: '2026-08-01', value: 7 }]}
        accentColor="#2a78d6"
        title="Sleep"
        tableCaption="Sleep by night"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title and an accessible table with every point', () => {
    render(
      <TrendLineChart
        points={points}
        accentColor="#2a78d6"
        title="Sleep duration"
        tableCaption="Sleep duration by night"
      />
    );
    expect(screen.getByText('Sleep duration')).toBeInTheDocument();
    expect(screen.getByText('Sleep duration by night')).toBeInTheDocument();
    // header row + one row per point
    expect(screen.getAllByRole('row')).toHaveLength(points.length + 1);
  });

  it('shows the most recent value by default, before any interaction', () => {
    render(
      <TrendLineChart
        points={points}
        accentColor="#2a78d6"
        title="Sleep"
        formatValue={v => `${v}h`}
        tableCaption="caption"
      />
    );
    // "8h" appears twice by design: the visible SVG end-label and the
    // sr-only accessible table row for the same point.
    const svg = screen.getByRole('img', { name: /most recent 8h/ });
    expect(within(svg).getByText('8h')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a tooltip for the focused point on keyboard focus, matching the hover contract', () => {
    render(
      <TrendLineChart
        points={points}
        accentColor="#2a78d6"
        title="Sleep"
        formatValue={v => `${v}h`}
        tableCaption="caption"
      />
    );

    const firstHitZone = screen.getByRole('button', { name: /2026-08-01/ });
    fireEvent.focus(firstHitZone);

    const tooltip = screen.getByRole('status');
    expect(within(tooltip).getByText('7h')).toBeInTheDocument();
    expect(within(tooltip).getByText('2026-08-01')).toBeInTheDocument();
  });

  it('hides the tooltip on blur', () => {
    render(
      <TrendLineChart
        points={points}
        accentColor="#2a78d6"
        title="Sleep"
        formatValue={v => `${v}h`}
        tableCaption="caption"
      />
    );

    const firstHitZone = screen.getByRole('button', { name: /2026-08-01/ });
    fireEvent.focus(firstHitZone);
    fireEvent.blur(firstHitZone);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
