import { kv } from "@vercel/kv";
import { StravaActivity } from "./types";

const ACTIVITIES_CACHE_KEY = "strava_activities";
const CACHE_DURATION = 60 * 25; // 25 minutes
const LATEST_ACTIVITY_CACHE_KEY = "latest_activity";
const LATEST_ACTIVITY_CACHE_DURATION = 60 * 5; // 5 minutes (more frequent updates for latest)

// Create a local cache fallback
const localCache = new Map();

const getStorage = () => {
  // Try to use KV first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      return kv;
    } catch (error) {
      console.warn("Failed to initialize KV, falling back to local cache");
    }
  }

  // Fallback to local cache if KV isn't available or we're in development
  if (
    process.env.ENABLE_LOCAL_CACHE_FALLBACK === "true" ||
    process.env.NODE_ENV === "development"
  ) {
    return {
      get: async (key: string) => localCache.get(key),
      set: async (key: string, value: any, options?: { ex?: number }) => {
        localCache.set(key, value);
        if (options?.ex) {
          setTimeout(() => localCache.delete(key), options.ex * 1000);
        }
        return true;
      },
      del: async (key: string) => localCache.delete(key),
    };
  }

  throw new Error("No storage mechanism available");
};

// Use this instead of direct kv references
const storage = getStorage();

async function getAccessToken(): Promise<string> {
  const refreshTokenUrl = new URL(
    "/api/refresh-token",
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ).toString();

  const refreshResponse = await fetch(refreshTokenUrl, {
    method: "POST",
    cache: "no-store",
  });

  if (!refreshResponse.ok) {
    throw new Error(`Failed to refresh token: ${refreshResponse.status}`);
  }

  const tokenData = await refreshResponse.json();
  return tokenData.access_token;
}

export async function fetchStravaActivities(): Promise<StravaActivity[]> {
  const accessToken = await getAccessToken();

  // Get activities from the past year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const activitiesUrl = `https://www.strava.com/api/v3/athlete/activities?after=${Math.floor(oneYearAgo.getTime() / 1000)}&per_page=200`;

  const response = await fetch(activitiesUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch activities: ${response.status} - ${errorText}`,
    );
  }

  const activities = await response.json();
  if (!activities) {
    throw new Error("No activities found");
  }

  return activities;
}

export async function getStravaActivities(): Promise<StravaActivity[]> {
  try {
    const cachedData =
      await storage.get<StravaActivity[]>(ACTIVITIES_CACHE_KEY);

    if (cachedData) {
      // Check if we have a recent activity that might not be in the cache
      const latestActivity = await fetchLatestActivity();

      // If the latest activity is newer than what's in our cache, refresh the cache
      if (
        !cachedData.some(
          (activity: StravaActivity) => activity.id === latestActivity.id,
        )
      ) {
        const freshActivities = await fetchStravaActivities();
        await storage.set(ACTIVITIES_CACHE_KEY, freshActivities, {
          ex: CACHE_DURATION,
        });
        return freshActivities;
      }

      return cachedData;
    }

    const activities = await fetchStravaActivities();

    // Cache the response
    await storage.set(ACTIVITIES_CACHE_KEY, activities, {
      ex: CACHE_DURATION,
    });

    return activities;
  } catch (error: any) {
    console.error("Storage error:", error);

    // If cache error, try fetching fresh data
    if (error.message?.includes("KV")) {
      return await fetchStravaActivities();
    }

    // If all else fails, return empty array
    return [];
  }
}

export async function fetchLatestActivity(): Promise<StravaActivity> {
  try {
    // Try to get cached latest activity first
    const cachedLatest = await storage.get<StravaActivity>(
      LATEST_ACTIVITY_CACHE_KEY,
    );

    if (cachedLatest) {
      return cachedLatest;
    }

    const accessToken = await getAccessToken();
    const activitiesUrl =
      "https://www.strava.com/api/v3/athlete/activities?per_page=1";

    const response = await fetch(activitiesUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest activity: ${response.status}`);
    }

    const activities = await response.json();
    if (!activities || activities.length === 0) {
      throw new Error("No activities found");
    }

    // Cache the latest activity
    await storage.set(LATEST_ACTIVITY_CACHE_KEY, activities[0], {
      ex: LATEST_ACTIVITY_CACHE_DURATION,
    });

    return activities[0];
  } catch (error) {
    console.error("Error fetching latest activity:", error);
    throw error;
  }
}
