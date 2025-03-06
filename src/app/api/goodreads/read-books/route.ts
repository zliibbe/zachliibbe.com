import { NextResponse } from "next/server";
import { createClient } from "@vercel/kv";
interface Book {
  title: string;
  author: string;
  coverImg?: string | null;
  coverUrl?: string;
  link: string;
  bookLink?: string;
  dateRead: string;
  rating: number;
  _error?: string;
}

// Create KV client with the new environment variables
const kv = createClient({
  url: process.env.KV_KV_REST_API_URL || "",
  token: process.env.KV_KV_REST_API_TOKEN || "",
});

export const dynamic = "force-dynamic";
const CACHE_KEY = "goodreads_read_books";
const CACHE_DURATION = 3600; // 1 hour

export async function GET(request: Request) {
  // Check for force refresh parameter
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";

  try {
    // Try to get cached data first (unless force refresh)
    if (!forceRefresh) {
      try {
        const cachedData = await kv.get(CACHE_KEY);
        if (cachedData) {
          return NextResponse.json(cachedData);
        }
      } catch (kvError) {
        console.warn("KV cache error:", kvError);
      }
    }

    // Determine which URL to use based on environment
    const lambdaUrl = process.env.GOODREADS_GETREADBOOKS_URL_PROD;

    if (!lambdaUrl) {
      throw new Error("Lambda URL is not defined");
    }

    // Fetch data from Lambda function with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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

    const data = await response.json();

    // Cache the data
    try {
      await kv.set(CACHE_KEY, data, { ex: CACHE_DURATION });
    } catch (cacheError) {
      console.warn("Failed to cache data:", cacheError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching read books:", error);

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

    // Return hardcoded fallback data
    const fallbackBooks: Book[] = [
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        coverImg: "https://covers.openlibrary.org/b/id/12003329-M.jpg",
        link: "https://www.goodreads.com/book/show/5907.The_Hobbit",
        dateRead: "2023-06-15",
        rating: 5,
      },
      {
        title: "Jayber Crow",
        author: "Wendell Berry",
        coverImg: "https://covers.openlibrary.org/b/isbn/9781582431604-M.jpg",
        link: "https://www.goodreads.com/book/show/57460.Jayber_Crow",
        dateRead: "2023-05-20",
        rating: 5,
      },
      {
        title: "The Orchardist",
        author: "Amanda Coplin",
        coverImg: "https://covers.openlibrary.org/b/isbn/9780062188502-M.jpg",
        link: "https://www.goodreads.com/book/show/13540351-the-orchardist",
        dateRead: "2023-04-10",
        rating: 5,
      },
    ];

    console.log("Using hardcoded fallback books data");
    return NextResponse.json(fallbackBooks);
  }
}
