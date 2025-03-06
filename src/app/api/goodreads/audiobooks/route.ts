import { NextResponse } from "next/server";
import { createClient } from "@vercel/kv";

// Create KV client with the new environment variables
const kv = createClient({
  url: process.env.KV_KV_REST_API_URL || "",
  token: process.env.KV_KV_REST_API_TOKEN || "",
});

export const dynamic = "force-dynamic";
const CACHE_KEY = "goodreads_audiobooks";
const CACHE_DURATION = 3600; // 1 hour

export async function GET(request: Request) {
  // Add detailed logging
  console.log("Starting GET request for audiobooks");

  // Check for force refresh parameter
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";
  console.log(`Force refresh: ${forceRefresh}`);

  try {
    // Try to get cached data first (unless force refresh)
    if (!forceRefresh) {
      try {
        console.log("Attempting to get cached data");
        const cachedData = await kv.get(CACHE_KEY);
        if (cachedData) {
          console.log("Returning cached audiobooks data");
          return NextResponse.json(cachedData);
        }
        console.log("No cached data found");
      } catch (kvError) {
        console.warn("KV cache error:", kvError);
      }
    } else {
      console.log("Force refresh requested, skipping cache");
    }

    // Determine which URL to use based on environment
    const lambdaUrl = process.env.GOODREADS_GETAUDIOBOOKS_URL_PROD;
    console.log(`Using Lambda URL: ${lambdaUrl}`);

    if (!lambdaUrl) {
      throw new Error("Lambda URL is not defined");
    }

    // Fetch data from Lambda function with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    console.log("Fetching data from Lambda");
    const response = await fetch(lambdaUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`Lambda response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lambda error: ${response.status}`, errorText);
      throw new Error(`Lambda returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Successfully received data from Lambda");

    // Cache the data
    try {
      await kv.set(CACHE_KEY, data, { ex: CACHE_DURATION });
      console.log("Data cached successfully");
    } catch (cacheError) {
      console.warn("Failed to cache data:", cacheError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching audiobooks:", error);

    // Try to get stale data from cache as fallback
    try {
      const staleData = await kv.get(CACHE_KEY);
      if (staleData) {
        console.log("Using stale data from cache as fallback");
        return NextResponse.json(staleData);
      }
    } catch (fallbackError) {
      console.error("Failed to get stale data:", fallbackError);
    }

    // Return error response
    return NextResponse.json(
      {
        error: `Failed to fetch audiobooks: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
