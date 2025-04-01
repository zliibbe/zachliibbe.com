import { NextResponse } from "next/server";
import { createClient } from "@vercel/kv";

interface Audiobook {
  title: string;
  author: string;
  coverImg?: string | null;
  coverUrl?: string;
  rating: number;
  link?: string;
  bookLink?: string;
  dateRead: string;
  _error?: string;
}

// Create KV client with the environment variables
const kv = createClient({
  url: process.env.KV_KV_REST_API_URL || "",
  token: process.env.KV_KV_REST_API_TOKEN || "",
});

export const dynamic = "force-dynamic";
const CACHE_KEY = "goodreads_audiobooks";
const CACHE_DURATION = 300; // 5 minutes

export async function GET(request: Request) {
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
    } else {
      console.log("Force refresh requested, skipping cache");
    }

    // Use production Lambda URL from environment variables
    const lambdaUrl = process.env.GOODREADS_GETAUDIOBOOKS_URL_PROD;

    if (!lambdaUrl) {
      console.error("Lambda URL is not defined");
      throw new Error("Lambda URL is not defined in environment variables");
    }

    // Fetch data from Lambda function with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(lambdaUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
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

      // Extract and normalize audiobooks from the response
      let audiobooks: Audiobook[] = [];

      if (Array.isArray(data)) {
        audiobooks = data;
      } else if (data && data.books && Array.isArray(data.books)) {
        audiobooks = data.books;
      } else {
        console.error("Unexpected data format from Lambda:", data);
        throw new Error("Invalid data format from Lambda");
      }

      // Normalize the audiobooks data
      const normalizedAudiobooks = audiobooks.map((book) => ({
        title: book.title,
        author: book.author,
        coverImg: book.coverImg || book.coverUrl || null,
        link: book.link || book.bookLink || null,
        dateRead: book.dateRead,
        rating: book.rating,
      }));

      // Cache the processed audiobooks
      try {
        await kv.set(CACHE_KEY, normalizedAudiobooks, { ex: CACHE_DURATION });
        console.log("Data cached successfully for 5 minutes");
      } catch (cacheError) {
        console.warn("Failed to cache data:", cacheError);
      }

      return NextResponse.json(normalizedAudiobooks);
    } catch (fetchError) {
      console.error("Error fetching from Lambda:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching audiobooks:", error);

    // Try to get stale data from cache as fallback
    try {
      const staleData = await kv.get(CACHE_KEY);
      if (staleData) {
        return NextResponse.json(staleData);
      }
    } catch (fallbackError) {
      console.error("Failed to get stale data:", fallbackError);
    }

    // Return hardcoded fallback data in case the API fails
    const fallbackAudiobooks: Audiobook[] = [
      {
        title: "Good Inside",
        author: "Dr. Becky Kennedy",
        coverImg: "https://covers.openlibrary.org/b/isbn/9780063159488-M.jpg",
        bookLink: "https://www.goodreads.com/book/show/59912428-good-inside",
        dateRead: "2023-07-10",
        rating: 5,
      },
      {
        title: "The Anxious Generation",
        author: "Jonathan Haidt",
        coverImg:
          "https://books.google.com/books/content?id=uCvAEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_apig",
        bookLink:
          "https://www.goodreads.com/book/show/61313190-the-anxious-generation",
        dateRead: "2023-06-05",
        rating: 5,
      },
      {
        title: "How Emotions Are Made",
        author: "Lisa Feldman Barrett",
        coverImg: "https://covers.openlibrary.org/b/isbn/9780544133310-M.jpg",
        bookLink:
          "https://www.goodreads.com/book/show/23719305-how-emotions-are-made",
        dateRead: "2023-05-15",
        rating: 4.5,
      },
    ];

    return NextResponse.json(fallbackAudiobooks);
  }
}
