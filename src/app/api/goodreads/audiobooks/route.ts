import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";
const CACHE_KEY = "goodreads_audiobooks";
const CACHE_DURATION = 3600; // 1 hour

export async function GET() {
  try {
    // Try to get cached data first
    let cachedData = null;
    try {
      cachedData = await kv.get(CACHE_KEY);
      if (cachedData) {
        console.log("Returning cached audiobooks data");
        return NextResponse.json(cachedData);
      }
    } catch (kvError) {
      console.warn("KV cache error:", kvError);
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

    try {
      const response = await fetch(lambdaUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lambda error: ${response.status}`, errorText);
        throw new Error(`Lambda returned ${response.status}: ${errorText}`);
      }

      const rawData = await response.text();
      console.log("Raw Lambda response:", rawData.substring(0, 200) + "...");

      // Parse the JSON data
      const data = JSON.parse(rawData);

      // Extract the books array
      const books = data.books || [];

      // Cache the books array
      try {
        await kv.set(CACHE_KEY, books, { ex: CACHE_DURATION });
        // Also set a stale copy that doesn't expire for fallback
        await kv.set("goodreads_audiobooks_stale", books);
      } catch (kvSetError) {
        console.warn("KV set error:", kvSetError);
      }

      return NextResponse.json(books);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching audiobooks:", error);

    // Try to get stale data as fallback
    try {
      const staleData = await kv.get("goodreads_audiobooks_stale");
      if (staleData) {
        console.log("Using stale audiobooks data as fallback");
        return NextResponse.json(staleData);
      }
    } catch (staleError) {
      console.warn("Stale cache error:", staleError);
    }

    // Return a fallback empty array with a 500 status
    return NextResponse.json(
      {
        error: "Failed to fetch audiobooks",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
