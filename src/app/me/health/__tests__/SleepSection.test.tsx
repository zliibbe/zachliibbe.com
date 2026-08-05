import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/app/context/ThemeContext';
import SleepSection from '../SleepSection';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function mockFetchOnce(body: unknown, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  });
}

describe('SleepSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state before data arrives', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithTheme(<SleepSection />);
    expect(screen.getByText('Loading sleep data...')).toBeInTheDocument();
  });

  it('shows an empty state when there is no sleep data yet', async () => {
    mockFetchOnce({ latest: null, series: [] });
    renderWithTheme(<SleepSection />);
    await waitFor(() => {
      expect(screen.getByText('No sleep data synced yet.')).toBeInTheDocument();
    });
  });

  it('shows an error state when the fetch fails', async () => {
    mockFetchOnce(null, false);
    renderWithTheme(<SleepSection />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('renders the latest sleep duration and stage breakdown from the real sync data shape', async () => {
    mockFetchOnce({
      latest: null,
      series: [
        {
          date: '2026-08-04',
          sleep: {
            dailySleepDTO: {
              sleepTimeSeconds: 27120,
              deepSleepSeconds: 5340,
              lightSleepSeconds: 17400,
              remSleepSeconds: 4380,
              awakeSleepSeconds: 60,
            },
          },
          stress: { avgStressLevel: 22 },
        },
      ],
    });

    renderWithTheme(<SleepSection />);

    await waitFor(() => {
      expect(screen.getByText('7h 32m')).toBeInTheDocument();
    });
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('Deep')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('REM')).toBeInTheDocument();
  });
});
