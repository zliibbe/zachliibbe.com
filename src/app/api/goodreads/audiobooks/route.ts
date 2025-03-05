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

    // Return fallback data with error embedded in first item
    const fallbackAudiobooks = [
      {
        title: "Good Inside",
        author: "Dr. Becky Kennedy",
        coverImg: "https://covers.openlibrary.org/b/isbn/9780063159488-M.jpg",
        link: "https://www.goodreads.com/book/show/59912428-good-inside",
        dateRead: "2023-07-10",
        rating: 5,
        _error: `Failed to fetch audiobooks: ${error instanceof Error ? error.message : String(error)}`,
      },
      {
        title: "The Anxious Generation",
        author: "Jonathan Haidt",
        coverImg:
          "https://books.google.com/books/content?id=uCvAEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_apig",
        link: "https://www.goodreads.com/book/show/61313190-the-anxious-generation",
        dateRead: "2023-06-05",
        rating: 5,
      },
      {
        title: "How Emotions Are Made",
        author: "Lisa Feldman Barrett",
        coverImg: "https://covers.openlibrary.org/b/isbn/9780544133310-M.jpg",
        link: "https://www.goodreads.com/book/show/23719305-how-emotions-are-made",
        dateRead: "2023-05-15",
        rating: 4.5,
      },
    ];

    console.warn("Using hardcoded fallback audiobooks data");
    return NextResponse.json(fallbackAudiobooks, { status: 500 });
  }
}
