import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/app/context/ThemeContext';
import ActivitySection from '../ActivitySection';

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

describe('ActivitySection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows an empty state when there is no activity data yet', async () => {
    mockFetchOnce({ latest: null, series: [] });
    renderWithTheme(<ActivitySection />);
    await waitFor(() => {
      expect(
        screen.getByText('No activity data synced yet.')
      ).toBeInTheDocument();
    });
  });

  it('renders steps/distance/calories/floors stat tiles from the real sync data shape', async () => {
    mockFetchOnce({
      latest: null,
      series: [
        {
          date: '2026-08-03',
          summary: {
            totalSteps: 6754,
            totalDistanceMeters: 5591,
            totalKilocalories: 2402,
          },
          floors: { floorValuesArray: [] },
        },
        {
          date: '2026-08-04',
          summary: {
            totalSteps: 7275,
            totalDistanceMeters: 6223,
            totalKilocalories: 2002,
          },
          floors: {
            floorValuesArray: [
              ['2026-08-04T06:00:00.0', '2026-08-04T06:15:00.0', 3, 0],
              ['2026-08-04T06:15:00.0', '2026-08-04T06:30:00.0', 3, 0],
            ],
          },
        },
      ],
    });

    renderWithTheme(<ActivitySection />);

    await waitFor(() => {
      expect(screen.getByText('7,275')).toBeInTheDocument();
    });
    expect(screen.getByText('6.2 km')).toBeInTheDocument();
    expect(screen.getByText('2,002')).toBeInTheDocument();
    // floors ascended summed from the floorValuesArray (3 + 3)
    expect(screen.getByText('6')).toBeInTheDocument();
  });
});
