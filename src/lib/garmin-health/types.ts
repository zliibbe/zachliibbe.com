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

export interface ActivitySnapshot {
  date: string;
  summary?: Record<string, unknown>;
  steps?: unknown;
  floors?: Record<string, unknown>;
}

// A single Garmin-logged activity, from get_activities(). Loosely typed
// (Garmin's native response shape, unmapped) rather than guessed at --
// rendered as raw JSON until the dashboard redesign.
export type GarminActivity = Record<string, unknown>;

// Categories are added one phase at a time on the Python side. Extend this
// union as 'training' lands.
export type GarminCategory = 'sleep' | 'activity' | 'activities';
