import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchLatestActivity } from "@/lib/strava/utils";

export const dynamic = "force-dynamic"; // Disable route caching
export const revalidate = 0; // Disable revalidation cache

// Fallback activity data in case the API fails
const fallbackActivity = {
  id: "fallback-activity",
  name: "Recent Run",
  type: "Run",
  distance: 5000, // 5km
  moving_time: 1500, // 25 minutes
  elapsed_time: 1600,
  total_elevation_gain: 50,
  start_date: new Date().toISOString(),
  map: {
    summary_polyline: "",
  },
  average_speed: 3.33,
  max_speed: 4.2,
  average_heartrate: 155,
  max_heartrate: 175,
  kudos_count: 5,
};

export async function GET() {
  try {
    // Check KV cache first with error handling
    let cachedActivity = null;
    try {
      cachedActivity = await kv.get("latest_activity");
    } catch (kvError) {
      console.warn("KV cache error:", kvError);
      // Continue execution even if KV fails
    }

    if (cachedActivity) {
      return NextResponse.json(cachedActivity);
    }

    // Set a timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const activity = await fetchLatestActivity(controller.signal);
      clearTimeout(timeoutId);

      // Cache the activity for 30 minutes (only if KV is working)
      try {
        await kv.set("latest_activity", activity, { ex: 1800 });
      } catch (kvSetError) {
        console.warn("KV set error:", kvSetError);
        // Continue even if caching fails
      }

      return NextResponse.json(activity);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch activity error:", fetchError);

      // Try to get stale data from cache as a fallback
      try {
        const staleActivity = await kv.get("latest_activity_stale");
        if (staleActivity) {
          return NextResponse.json(staleActivity);
        }
      } catch (staleError) {
        console.warn("Stale cache error:", staleError);
      }

      // If all else fails, return the fallback data
      return NextResponse.json(fallbackActivity);
    }
  } catch (error: any) {
    console.error("API Route Error Details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch activity",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
