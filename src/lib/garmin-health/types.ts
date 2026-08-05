// Mirrors the JSON shapes written by python-garminconnect's
// scripts/sync_to_kv.py. Field names are Garmin's native response keys,
// passed through as-is on the Python side (no remapping), so there's no
// shared schema between the two repos to keep in sync beyond this file.

export interface SleepSnapshot {
  date: string;
  sleep?: Record<string, unknown>;
  body_battery?: unknown;
  stress?: Record<string, unknown>;
  hrv?: Record<string, unknown> | null;
  resting_hr?: Record<string, unknown>;
}

// Categories are added one phase at a time on the Python side; only
// 'sleep' has data today. Extend this union as 'activity' | 'activities' |
// 'training' land.
export type GarminCategory = 'sleep';
