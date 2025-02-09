import { kv } from "@vercel/kv";

const CACHE_KEY = "latest_strava_activity";
const CACHE_DURATION = 60 * 25; // 25 minutes in seconds

interface StravaActivity {
  id: number;
  type: string;
  distance: number;
  elapsed_time: number;
  name: string;
  start_date: string;
}

export default async function getLatestActivity(): Promise<StravaActivity | null> {
  try {
    // Try to get cached data first
    const cachedData = await kv.get(CACHE_KEY);
    if (cachedData) {
      return cachedData as StravaActivity;
    }

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

    // Use the new access token
    const activitiesUrl =
      "https://www.strava.com/api/v3/athlete/activities?per_page=1";

    const response = await fetch(activitiesUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
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

    if (!activities || activities.length === 0) {
      throw new Error("No activities found");
    }

    const activity = activities[0];

    // Cache the response
    await kv.set(CACHE_KEY, activity, {
      ex: CACHE_DURATION, // expires in 25 minutes
    });

    return activity;
  } catch (error: any) {
    console.error("Error in getLatestActivity:", {
      error,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      message: error.message,
    });
    throw error;
  }
}
