import { render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@/app/context/ThemeContext';
import TrainingSection from '../TrainingSection';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function mockFetchOnce(body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

describe('TrainingSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows an empty state when nothing is synced yet', async () => {
    mockFetchOnce({ latest: null, series: [] });
    renderWithTheme(<TrainingSection />);
    await waitFor(() => {
      expect(
        screen.getByText('No training data synced yet.')
      ).toBeInTheDocument();
    });
  });

  it('finds the most recent value for each metric independently, since Garmin does not populate every metric every day', async () => {
    mockFetchOnce({
      latest: null,
      series: [
        {
          date: '2026-08-02',
          training_status: {
            mostRecentVO2Max: { generic: { vo2MaxPreciseValue: 48.4 } },
            mostRecentTrainingStatus: {
              latestTrainingStatusData: { '123': { weeklyTrainingLoad: 421 } },
            },
          },
        },
        {
          date: '2026-08-03',
          training_status: {
            // VO2 max not present this day -- should not overwrite 08-02's value
            mostRecentVO2Max: { generic: null },
            mostRecentTrainingStatus: {
              latestTrainingStatusData: { '123': { weeklyTrainingLoad: 411 } },
            },
          },
        },
      ],
    });

    renderWithTheme(<TrainingSection />);

    await waitFor(() => {
      expect(screen.getByText('48.4')).toBeInTheDocument();
    });
    // VO2 max is labeled with the day it was actually present (08-02) ...
    const vo2Tile = screen.getByText('VO2 max, 2026-08-02').closest('div');
    expect(vo2Tile).not.toBeNull();
    expect(
      within(vo2Tile as HTMLElement).getByText('48.4')
    ).toBeInTheDocument();

    // ... while training load is labeled with the most recent day overall (08-03).
    // "411" also legitimately appears in the trend chart's SVG label and
    // sr-only table for the same value, so scope to the stat tile.
    const loadTile = screen
      .getByText('Weekly training load, 2026-08-03')
      .closest('div');
    expect(loadTile).not.toBeNull();
    expect(
      within(loadTile as HTMLElement).getByText('411')
    ).toBeInTheDocument();
  });
});
