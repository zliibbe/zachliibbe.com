import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/app/context/ThemeContext';
import RecentActivitiesSection from '../RecentActivitiesSection';

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

describe('RecentActivitiesSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows an empty state when there are no activities yet', async () => {
    mockFetchOnce({ activities: [] });
    renderWithTheme(<RecentActivitiesSection />);
    await waitFor(() => {
      expect(screen.getByText('No activities synced yet.')).toBeInTheDocument();
    });
  });

  it('renders a formatted activity from the real Garmin response shape', async () => {
    mockFetchOnce({
      activities: [
        {
          activityId: 123,
          activityName: 'Teller County Mountain Biking',
          activityType: { typeKey: 'mountain_biking' },
          startTimeLocal: '2026-08-02 08:54:14',
          distance: 7892.17,
          duration: 7440.23,
          calories: 817,
          averageHR: 114,
        },
      ],
    });

    renderWithTheme(<RecentActivitiesSection />);

    await waitFor(() => {
      expect(
        screen.getByText('Teller County Mountain Biking')
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('Mountain Biking · 2026-08-02')
    ).toBeInTheDocument();
    expect(screen.getByText('7.9 km')).toBeInTheDocument();
    expect(screen.getByText('2h 4m')).toBeInTheDocument();
    expect(screen.getByText('817 cal')).toBeInTheDocument();
    expect(screen.getByText('114 bpm avg')).toBeInTheDocument();
  });

  it('falls back to a title-cased type label when activityName is missing', async () => {
    mockFetchOnce({
      activities: [
        {
          activityId: 456,
          activityType: { typeKey: 'trail_running' },
          startTimeLocal: '2026-08-01 07:00:00',
          distance: null,
          duration: null,
          calories: null,
          averageHR: null,
        },
      ],
    });

    renderWithTheme(<RecentActivitiesSection />);

    await waitFor(() => {
      expect(screen.getByText('Trail Running')).toBeInTheDocument();
    });
  });
});
