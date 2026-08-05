import { kv } from '@vercel/kv';
import type { GarminCategory } from './types';

function dayKey(category: GarminCategory, date: string): string {
  return `garmin:${category}:day:${date}`;
}

function seriesKey(category: GarminCategory): string {
  return `garmin:${category}:series`;
}

function latestKey(category: GarminCategory): string {
  return `garmin:${category}:latest`;
}

function scoreForDate(date: Date): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return Number(`${y}${m}${d}`);
}

export async function getLatestSnapshot<T>(
  category: GarminCategory
): Promise<T | null> {
  return kv.get<T>(latestKey(category));
}

/**
 * Reads the last `days` days of a category's history: a ZRANGEBYSCORE over
 * the date index followed by an MGET of the matching day blobs, matching
 * the write side's index-then-blob key schema.
 */
export async function getSeries<T>(
  category: GarminCategory,
  days: number
): Promise<T[]> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - days);

  const dates = await kv.zrange<string[]>(
    seriesKey(category),
    scoreForDate(start),
    scoreForDate(today),
    { byScore: true }
  );

  if (dates.length === 0) {
    return [];
  }

  const keys = dates.map(date => dayKey(category, date));
  const blobs = await kv.mget<(T | null)[]>(...keys);
  return blobs.filter((blob): blob is T => blob !== null);
}

/**
 * The 'activities' category has no per-day series -- it's a flat "latest
 * N" list wholesale-replaced each sync run, matching latestKey('activities').
 */
export async function getRecentActivities<T>(): Promise<T[]> {
  const result = await kv.get<T[]>(latestKey('activities'));
  return result ?? [];
}
