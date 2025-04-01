import { NextResponse } from "next/server";
import { createClient } from "@vercel/kv";
import { XMLParser } from "fast-xml-parser";

export const dynamic = "force-dynamic";
const CACHE_KEY = "goodreads_currently_reading";
const CACHE_DURATION = 300; // 5 minutes

interface Book {
  title: string;
  author: string;
  coverImg?: string | null;
  link?: string | null;
  currentPage?: number | null;
  totalPages?: number | null;
  lastUpdated?: string | null;
}

interface RssItem {
  title: string;
  author_name?: string;
  link?: string;
  book_large_image_url?: string;
  book_medium_image_url?: string;
  book_small_image_url?: string;
  num_pages?: string;
  user_date_added?: string;
  pubDate?: string;
}

// Create KV client
const kv = createClient({
  url: process.env.KV_KV_REST_API_URL || "",
  token: process.env.KV_KV_REST_API_TOKEN || "",
});

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
    } else {
      console.log("Force refresh requested, skipping cache");
    }

    // Fetch data from both RSS feeds
    try {
      // 1. First get the updates feed to find reading progress
      const userId = process.env.GOODREADS_USER_ID || "24890536";
      const updatesUrl = `https://www.goodreads.com/user/updates_rss/${userId}`;

      const updatesResponse = await fetch(updatesUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GoodreadsApp/1.0)",
          "Cache-Control": "no-cache",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!updatesResponse.ok) {
        throw new Error(`Updates feed HTTP error: ${updatesResponse.status}`);
      }

      const updatesXml = await updatesResponse.text();
      const xmlParser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
      });

      const updatesResult = xmlParser.parse(updatesXml);

      // 2. Then get the currently-reading shelf
      const shelfUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=currently-reading&sort=date_updated&order=d`;

      const shelfResponse = await fetch(shelfUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GoodreadsApp/1.0)",
          "Cache-Control": "no-cache",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!shelfResponse.ok) {
        throw new Error(`Shelf feed HTTP error: ${shelfResponse.status}`);
      }

      const shelfXml = await shelfResponse.text();
      const shelfResult = xmlParser.parse(shelfXml);

      // 3. Process the updates feed to find reading progress
      const progressUpdates: Record<
        string,
        { currentPage: number; totalPages: number; lastUpdated: string }
      > = {};

      if (updatesResult.rss?.channel?.item) {
        const items = Array.isArray(updatesResult.rss.channel.item)
          ? updatesResult.rss.channel.item
          : [updatesResult.rss.channel.item];

        for (const item of items) {
          // Look for status updates with reading progress
          if (item.title && typeof item.title === "string") {
            const progressRegex = /is on page (\d+) of (\d+) of (.+)$/i;
            const match = item.title.match(progressRegex);

            if (match) {
              const currentPage = parseInt(match[1], 10);
              const totalPages = parseInt(match[2], 10);
              const bookTitle = match[3].trim();
              const lastUpdated = item.pubDate || new Date().toISOString();

              progressUpdates[bookTitle] = {
                currentPage,
                totalPages,
                lastUpdated,
              };
            }

            // Also look for "is X% done with" updates
            const percentRegex = /is (\d+)% done with (.+)$/i;
            const percentMatch = item.title.match(percentRegex);

            if (percentMatch && !progressUpdates[percentMatch[2].trim()]) {
              const percent = parseInt(percentMatch[1], 10);
              const bookTitle = percentMatch[2].trim();
              const lastUpdated = item.pubDate || new Date().toISOString();

              // We don't know total pages from this update, but we'll set it later
              progressUpdates[bookTitle] = {
                currentPage: -1, // Placeholder, will calculate after getting total pages
                totalPages: -1, // Placeholder
                lastUpdated,
              };
            }
          }
        }
      }

      // 4. Process the shelf feed to get book details
      let books: Book[] = [];

      if (shelfResult.rss?.channel?.item) {
        const items = Array.isArray(shelfResult.rss.channel.item)
          ? shelfResult.rss.channel.item
          : [shelfResult.rss.channel.item];

        books = items.map((item: RssItem) => {
          const title = item.title || "Unknown Title";
          const author = item.author_name || "Unknown Author";
          const link = item.link || null;

          // Get cover image
          let coverImg = null;
          if (item.book_large_image_url) {
            coverImg = item.book_large_image_url;
          } else if (item.book_medium_image_url) {
            coverImg = item.book_medium_image_url;
          } else if (item.book_small_image_url) {
            coverImg = item.book_small_image_url;
          }

          // Get total pages
          let totalPages = null;
          if (item.num_pages) {
            totalPages = parseInt(item.num_pages, 10);
          }

          // Check if we have progress data for this book
          let currentPage = null;
          let lastUpdated = item.user_date_added || null;

          if (progressUpdates[title]) {
            currentPage = progressUpdates[title].currentPage;

            // If we only had percent data, calculate pages
            if (currentPage === -1 && totalPages) {
              // Extract percent from the title
              const percentRegex = /is (\d+)% done with/i;
              const percentMatch = Object.keys(progressUpdates).find(
                (key) => key.includes(title) && percentRegex.test(key),
              );

              if (percentMatch) {
                const percent = parseInt(
                  percentMatch.match(percentRegex)![1],
                  10,
                );
                currentPage = Math.floor(totalPages * (percent / 100));
              }
            }

            // Use total pages from progress update if available
            if (progressUpdates[title].totalPages > 0) {
              totalPages = progressUpdates[title].totalPages;
            }

            lastUpdated = progressUpdates[title].lastUpdated;
          }

          // If we still don't have current page but have total pages, estimate
          if (!currentPage && totalPages) {
            currentPage = Math.floor(totalPages * 0.3); // Assume 30% through
          }

          return {
            title,
            author,
            coverImg,
            link,
            currentPage,
            totalPages,
            lastUpdated,
          };
        });
      }

      // 5. Sort books by lastUpdated (most recent first)
      if (books.length > 0) {
        books.sort((a, b) => {
          const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
      }

      // Cache the processed books
      try {
        await kv.set(CACHE_KEY, books, { ex: CACHE_DURATION });
      } catch (cacheError) {
        console.warn("Failed to cache data:", cacheError);
      }

      return NextResponse.json(books);
    } catch (fetchError) {
      console.error("Error fetching from RSS feeds:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching currently reading books:", error);

    // Try to get stale data from cache as fallback
    try {
      const staleData = await kv.get(CACHE_KEY);
      if (staleData) {
        return NextResponse.json(staleData);
      }
    } catch (fallbackError) {
      console.error("Failed to get stale data:", fallbackError);
    }

    // Return a fallback empty array
    return NextResponse.json(
      {
        error: "Failed to fetch currently reading books",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
