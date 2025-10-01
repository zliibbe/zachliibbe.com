import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getAccessToken } from '@/lib/strava/auth';

export const dynamic = 'force-dynamic';
const CACHE_KEY = 'strava_activities';
const CACHE_DURATION = 300; // 5 minutes

export async function GET(request: Request) {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await kv.get(CACHE_KEY);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    } catch (kvError) {
      console.warn(`[${requestId}] KV cache error: ${kvError}`);
      // Continue execution even if KV fails
    }

    // Get parameters from the request
    const url = new URL(request.url);
    const days = url.searchParams.get('days')
      ? parseInt(url.searchParams.get('days')!)
      : 365;

    // Calculate the timestamp for 'days' ago
    const after = Math.floor(Date.now() / 1000) - days * 86400;

    try {
      // Get access token
      const accessToken = await getAccessToken();

      // Fetch activities from Strava API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Fetch activities with pagination to handle > 200 activities
      // Strava returns newest first by default
      let allActivities: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 3) { // Limit to 3 pages (600 activities) for performance
        const pageResponse = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          }
        );

        if (!pageResponse.ok) {
          const errorText = await pageResponse.text();
          console.error(
            `[${requestId}] Strava API error: ${pageResponse.status} - ${errorText}`
          );
          throw new Error(`Strava API returned ${pageResponse.status}: ${errorText}`);
        }

        const pageActivities = await pageResponse.json();

        if (pageActivities.length === 0) {
          hasMore = false;
          break;
        }

        // Check if the oldest activity in this page is before our cutoff date
        const oldestActivity = pageActivities[pageActivities.length - 1];
        const oldestTimestamp = new Date(oldestActivity.start_date).getTime() / 1000;

        allActivities = allActivities.concat(pageActivities);

        // If the oldest activity in this page is before our 'after' date, we can stop
        if (oldestTimestamp < after) {
          hasMore = false;
        } else {
          page++;
        }
      }

      clearTimeout(timeoutId);

      // Filter activities to only include those after the 'after' timestamp
      const activities = allActivities.filter((activity: any) => {
        const activityTimestamp = new Date(activity.start_date).getTime() / 1000;
        return activityTimestamp >= after;
      });

      // Cache the activities
      try {
        await kv.set(CACHE_KEY, activities, { ex: CACHE_DURATION });
      } catch (kvSetError) {
        console.warn(`[${requestId}] KV set error: ${kvSetError}`);
        // Continue even if caching fails
      }

      return NextResponse.json(activities, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes
        },
      });
    } catch (innerError) {
      console.error(`[${requestId}] Inner error: ${innerError}`);

      // Try to get stale data as fallback
      try {
        const staleData = await kv.get('strava_activities_stale');
        if (staleData) {
          return NextResponse.json(staleData);
        }
      } catch (staleError) {
        console.warn(`[${requestId}] Stale cache error: ${staleError}`);
      }

      // Re-throw the error to be caught by the outer catch
      throw innerError;
    }
  } catch (error) {
    console.error(`[${requestId}] Error fetching Strava activities: ${error}`);
    console.error(
      `[${requestId}] Error details: ${JSON.stringify({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      })}`
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch activities',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
