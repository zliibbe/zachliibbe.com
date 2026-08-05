/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/garmin-health/kv', () => ({
  getLatestSnapshot: jest.fn(),
  getSeries: jest.fn(),
  getRecentActivities: jest.fn(),
}));

import { getServerSession } from 'next-auth/next';
import {
  getLatestSnapshot,
  getRecentActivities,
  getSeries,
} from '@/lib/garmin-health/kv';

const mockGetServerSession = getServerSession as jest.Mock;
const mockGetLatestSnapshot = getLatestSnapshot as jest.Mock;
const mockGetSeries = getSeries as jest.Mock;
const mockGetRecentActivities = getRecentActivities as jest.Mock;

function makeRequest(category: string, range?: string) {
  const url = `http://localhost/api/me/health/${category}${
    range ? `?range=${range}` : ''
  }`;
  return {
    request: new NextRequest(url),
    context: { params: Promise.resolve({ category }) },
  };
}

describe('GET /api/me/health/[category]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const { request, context } = makeRequest('sleep');

    const res = await GET(request, context);

    expect(res.status).toBe(401);
    expect(mockGetLatestSnapshot).not.toHaveBeenCalled();
  });

  it('returns 401 for a session with the wrong email', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { email: 'someone-else@example.com' },
    });
    const { request, context } = makeRequest('sleep');

    const res = await GET(request, context);

    expect(res.status).toBe(401);
  });

  describe('when authenticated as the site owner', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'zliibbe@gmail.com' },
      });
    });

    it('returns 404 for an unsupported category', async () => {
      const { request, context } = makeRequest('not-a-real-category');

      const res = await GET(request, context);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toMatch(/not-a-real-category/);
    });

    it('returns latest + series for sleep', async () => {
      mockGetLatestSnapshot.mockResolvedValueOnce({ date: '2026-08-04' });
      mockGetSeries.mockResolvedValueOnce([
        { date: '2026-08-03' },
        { date: '2026-08-04' },
      ]);

      const { request, context } = makeRequest('sleep', '14');
      const res = await GET(request, context);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(mockGetLatestSnapshot).toHaveBeenCalledWith('sleep');
      expect(mockGetSeries).toHaveBeenCalledWith('sleep', 14);
      expect(body).toEqual({
        latest: { date: '2026-08-04' },
        series: [{ date: '2026-08-03' }, { date: '2026-08-04' }],
      });
    });

    it('returns a flat activities array for the activities category, not {latest, series}', async () => {
      mockGetRecentActivities.mockResolvedValueOnce([{ activityId: 1 }]);

      const { request, context } = makeRequest('activities');
      const res = await GET(request, context);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ activities: [{ activityId: 1 }] });
      expect(mockGetLatestSnapshot).not.toHaveBeenCalled();
    });

    it('defaults range to 30 days when not specified', async () => {
      mockGetLatestSnapshot.mockResolvedValueOnce(null);
      mockGetSeries.mockResolvedValueOnce([]);

      const { request, context } = makeRequest('training');
      await GET(request, context);

      expect(mockGetSeries).toHaveBeenCalledWith('training', 30);
    });

    it('returns 500 when the KV read throws', async () => {
      mockGetLatestSnapshot.mockRejectedValueOnce(new Error('kv down'));

      const { request, context } = makeRequest('activity');
      const res = await GET(request, context);

      expect(res.status).toBe(500);
    });
  });
});
