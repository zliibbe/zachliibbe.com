import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchLatestActivity } from "@/lib/strava/utils";

export const dynamic = "force-dynamic"; // Disable route caching
export const revalidate = 0; // Disable revalidation cache

export async function GET() {
  try {
    // Check KV cache first
    const cachedActivity = await kv.get("latest_activity");
    if (cachedActivity) {
      return NextResponse.json(cachedActivity);
    }

    const activity = await fetchLatestActivity();
    // Cache the activity for 30 minutes
    await kv.set("latest_activity", activity, { ex: 1800 });

    return NextResponse.json(activity);
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
