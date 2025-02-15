import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import getLatestActivity from "@/app/api/getLatestActivity";

export const dynamic = "force-dynamic"; // Disable route caching
export const revalidate = 0; // Disable revalidation cache

export async function GET() {
  try {
    // Check KV cache first
    const cachedActivity = await kv.get("latest-activity");
    if (cachedActivity) {
      return NextResponse.json(cachedActivity);
    }

    const activity = await getLatestActivity();
    // Cache the activity for 30 minutes
    await kv.set("latest-activity", activity, { ex: 1800 });

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
