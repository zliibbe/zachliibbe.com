import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getAccessToken } from '@/lib/strava/auth';

export const dynamic = 'force-dynamic';
const CACHE_KEY = 'latest_activity';
const CACHE_DURATION = 1800; // 30 minutes

// Fallback activity data in case the API fails
const fallbackActivity = {
  id: 'fallback-activity',
  name: 'Recent Run',
  type: 'Run',
  distance: 5000, // 5km
  moving_time: 1500, // 25 minutes
  elapsed_time: 1600,
  total_elevation_gain: 50,
  start_date: new Date().toISOString(),
  map: {
    summary_polyline: '',
  },
  average_speed: 3.33,
  max_speed: 4.2,
  average_heartrate: 155,
  max_heartrate: 175,
  kudos_count: 5,
};

export async function GET() {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    // Check KV cache first with error handling
    let cachedActivity = null;
    try {
      cachedActivity = await kv.get(CACHE_KEY);
      if (cachedActivity) {
        return NextResponse.json(cachedActivity);
      }
    } catch (kvError) {
      console.warn(`[${requestId}] KV cache error:`, kvError);
      // Continue execution even if KV fails
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Set a timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Fetch latest activity from Strava API
      const response = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=1',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[${requestId}] Strava API error: ${response.status}`,
          errorText
        );
        throw new Error(`Strava API returned ${response.status}: ${errorText}`);
      }

      const activities = await response.json();

      if (!activities || activities.length === 0) {
        throw new Error('No activities found');
      }

      const activity = activities[0];

      // Cache the activity
      try {
        await kv.set(CACHE_KEY, activity, { ex: CACHE_DURATION });
        // Also store as stale data with longer expiration
        await kv.set('latest_activity_stale', activity, { ex: 86400 }); // 24 hours
      } catch (kvSetError) {
        console.warn(`[${requestId}] KV set error:`, kvSetError);
        // Continue even if caching fails
      }

      return NextResponse.json(activity);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`[${requestId}] Fetch activity error:`, fetchError);

      // Try to get stale data from cache as a fallback
      try {
        const staleActivity = await kv.get('latest_activity_stale');
        if (staleActivity) {
          return NextResponse.json(staleActivity);
        }
      } catch (staleError) {
        console.warn(`[${requestId}] Stale cache error:`, staleError);
      }

      // If all else fails, return the fallback data
      return NextResponse.json(fallbackActivity);
    }
  } catch (error) {
    console.error(`[${requestId}] API Route Error:`, error);
    return NextResponse.json(
      {
        error: 'Failed to fetch activity',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
