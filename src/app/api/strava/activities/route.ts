import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchStravaActivities } from "@/lib/strava/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0; // TODO: use elsewhere in this file

const CACHE_KEY = "strava_activities";
const CACHE_DURATION = 300; // 5 minutes

export async function GET() {
  try {
    console.log("KV Config:", {
      url: process.env.UPSTASH_REDIS_REST_URL ? "Set" : "Missing",
      token: process.env.UPSTASH_REDIS_REST_TOKEN ? "Set" : "Missing",
    });

    // Try to get cached data first
    const cachedData = await kv.get(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const activities = await fetchStravaActivities();

    // Cache the activities
    await kv.set(CACHE_KEY, activities, {
      ex: CACHE_DURATION,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Detailed error in activities route:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      env: {
        hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      },
    });
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}
