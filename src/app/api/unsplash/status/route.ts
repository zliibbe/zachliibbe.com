import { NextResponse } from "next/server";
import {
  getUnsplashMode,
  getRemainingRequests,
  UNSPLASH_LIMITS,
} from "@/lib/unsplash";

export async function GET() {
  try {
    const mode = getUnsplashMode();
    const { remaining, resetTime } = getRemainingRequests();

    const status = {
      mode,
      configured: mode !== "unconfigured",
      limits: UNSPLASH_LIMITS[mode === "demo" ? "DEMO" : "PRODUCTION"],
      usage: {
        remaining,
        resetTime: new Date(resetTime).toISOString(),
        resetIn: Math.max(0, Math.ceil((resetTime - Date.now()) / 1000 / 60)), // minutes
      },
      productionRequirements: {
        needed: mode === "demo",
        criteria: [
          "Demonstrate proper attribution to photographers and Unsplash",
          "Show that images are being used in a way that drives value",
          "Provide examples of how the API is being used",
          "Explain the expected usage volume",
          "Confirm compliance with Unsplash API Guidelines",
        ],
        applicationUrl: "https://unsplash.com/developers",
        guidelines:
          "https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines",
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting Unsplash status:", error);
    return NextResponse.json(
      { error: "Failed to get Unsplash status" },
      { status: 500 },
    );
  }
}
