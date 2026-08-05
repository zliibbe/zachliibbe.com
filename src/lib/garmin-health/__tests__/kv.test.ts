import { kv } from '@vercel/kv';
import { getLatestSnapshot, getRecentActivities, getSeries } from '../kv';

jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    zrange: jest.fn(),
    mget: jest.fn(),
  },
}));

const mockKv = kv as jest.Mocked<typeof kv>;

describe('garmin-health/kv', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLatestSnapshot', () => {
    it('reads garmin:{category}:latest', async () => {
      mockKv.get.mockResolvedValueOnce({ date: '2026-08-04' });
      const result = await getLatestSnapshot('sleep');
      expect(mockKv.get).toHaveBeenCalledWith('garmin:sleep:latest');
      expect(result).toEqual({ date: '2026-08-04' });
    });

    it('returns null when nothing is synced yet', async () => {
      mockKv.get.mockResolvedValueOnce(null);
      const result = await getLatestSnapshot('activity');
      expect(result).toBeNull();
    });
  });

  describe('getSeries', () => {
    it('queries the date index then batch-gets the day blobs', async () => {
      mockKv.zrange.mockResolvedValueOnce(['2026-08-03', '2026-08-04']);
      mockKv.mget.mockResolvedValueOnce([
        { date: '2026-08-03' },
        { date: '2026-08-04' },
      ]);

      const result = await getSeries('sleep', 30);

      expect(mockKv.zrange).toHaveBeenCalledWith(
        'garmin:sleep:series',
        expect.any(Number),
        expect.any(Number),
        { byScore: true }
      );
      expect(mockKv.mget).toHaveBeenCalledWith(
        'garmin:sleep:day:2026-08-03',
        'garmin:sleep:day:2026-08-04'
      );
      expect(result).toEqual([{ date: '2026-08-03' }, { date: '2026-08-04' }]);
    });

    it('returns an empty array without calling mget when the date index is empty', async () => {
      mockKv.zrange.mockResolvedValueOnce([]);
      const result = await getSeries('training', 30);
      expect(result).toEqual([]);
      expect(mockKv.mget).not.toHaveBeenCalled();
    });

    it('filters out null day blobs (e.g. trimmed by retention after the index read)', async () => {
      mockKv.zrange.mockResolvedValueOnce(['2026-08-03', '2026-08-04']);
      mockKv.mget.mockResolvedValueOnce([null, { date: '2026-08-04' }]);

      const result = await getSeries('sleep', 30);
      expect(result).toEqual([{ date: '2026-08-04' }]);
    });

    it('scores the date range as YYYYMMDD integers matching the write side', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T12:00:00'));
      mockKv.zrange.mockResolvedValueOnce([]);

      await getSeries('activity', 10);

      expect(mockKv.zrange).toHaveBeenCalledWith(
        'garmin:activity:series',
        20260805,
        20260815,
        { byScore: true }
      );

      jest.useRealTimers();
    });
  });

  describe('getRecentActivities', () => {
    it('reads garmin:activities:latest', async () => {
      mockKv.get.mockResolvedValueOnce([{ activityId: 1 }]);
      const result = await getRecentActivities();
      expect(mockKv.get).toHaveBeenCalledWith('garmin:activities:latest');
      expect(result).toEqual([{ activityId: 1 }]);
    });

    it('returns an empty array when nothing is synced yet', async () => {
      mockKv.get.mockResolvedValueOnce(null);
      const result = await getRecentActivities();
      expect(result).toEqual([]);
    });
  });
});
