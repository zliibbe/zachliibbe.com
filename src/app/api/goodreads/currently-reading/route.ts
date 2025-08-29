import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { XMLParser } from 'fast-xml-parser';

export const dynamic = 'force-dynamic';
const CACHE_KEY = 'goodreads_currently_reading';
const CACHE_DURATION = 300; // 5 minutes

// Helper function to normalize book titles for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Helper function to find matching progress update for a book
function findProgressUpdate(
  bookTitle: string,
  progressUpdates: Record<string, any>
) {
  const normalizedBookTitle = normalizeTitle(bookTitle);

  // First try exact match
  if (progressUpdates[bookTitle]) {
    return progressUpdates[bookTitle];
  }

  // Then try normalized matching
  for (const [updateTitle, progress] of Object.entries(progressUpdates)) {
    const normalizedUpdateTitle = normalizeTitle(updateTitle);
    if (normalizedBookTitle === normalizedUpdateTitle) {
      return progress;
    }
  }

  // Finally try partial matching (for cases where titles are truncated)
  for (const [updateTitle, progress] of Object.entries(progressUpdates)) {
    const normalizedUpdateTitle = normalizeTitle(updateTitle);
    if (
      normalizedBookTitle.includes(normalizedUpdateTitle) ||
      normalizedUpdateTitle.includes(normalizedBookTitle)
    ) {
      return progress;
    }
  }

  return null;
}

interface Book {
  title: string;
  author: string;
  coverImg?: string | null;
  link?: string | null;
  currentPage?: number | null;
  totalPages?: number | null;
  lastUpdated?: string | null;
  isPercentage?: boolean;
}

interface RssItem {
  title: string;
  author_name?: string;
  link?: string;
  book_id?: number;
  book_large_image_url?: string;
  book_medium_image_url?: string;
  book_small_image_url?: string;
  num_pages?: string;
  user_date_added?: string;
  pubDate?: string;
}

// KV client is imported above

export async function GET(request: Request) {
  // Check for force refresh parameter
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';

  try {
    // Try to get cached data first (unless force refresh)
    if (!forceRefresh) {
      try {
        const cachedData = await kv.get(CACHE_KEY);
        if (cachedData) {
          return NextResponse.json(cachedData);
        }
      } catch (kvError) {
        console.warn('KV cache error:', kvError);
      }
    } else {
      console.log('Force refresh requested, skipping cache');
    }

    // Fetch data from both RSS feeds
    try {
      // 1. First get the updates feed to find reading progress
      const userId = process.env.GOODREADS_USER_ID || '24890536';
      const updatesUrl = `https://www.goodreads.com/user/updates_rss/${userId}`;

      const updatesResponse = await fetch(updatesUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GoodreadsApp/1.0)',
          'Cache-Control': 'no-cache',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes (same as KV cache)
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
      // console.log("Updates feed result:", JSON.stringify(updatesResult, null, 2));

      // 2. Then get the currently-reading shelf
      const shelfUrl = `https://www.goodreads.com/review/list_rss/${userId}-zach?shelf=currently-reading&sort=date_updated&order=d`;

      const shelfResponse = await fetch(shelfUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GoodreadsApp/1.0)',
          'Cache-Control': 'no-cache',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes (same as KV cache)
      });

      if (!shelfResponse.ok) {
        throw new Error(`Shelf feed HTTP error: ${shelfResponse.status}`);
      }

      const shelfXml = await shelfResponse.text();
      const shelfResult = xmlParser.parse(shelfXml);
      // console.log("Shelf feed result:", JSON.stringify(shelfResult, null, 2));

      // 3. Process the updates feed to find reading progress
      const progressUpdates: Record<
        string,
        {
          currentPage: number;
          totalPages: number;
          lastUpdated: string;
          isPercentage?: boolean;
        }
      > = {};

      if (updatesResult.rss?.channel?.item) {
        const items = Array.isArray(updatesResult.rss.channel.item)
          ? updatesResult.rss.channel.item
          : [updatesResult.rss.channel.item];

        for (const item of items) {
          // Look for status updates with reading progress
          if (item.title && typeof item.title === 'string') {
            // Clean up the title by removing extra whitespace and newlines
            const cleanTitle = item.title.replace(/\s+/g, ' ').trim();

            // Updated regex to handle the actual format: "Zach is on page X of Y of BookTitle"
            const progressRegex =
              /Zach\s+is\s+on\s+page\s+(\d+)\s+of\s+(\d+)\s+of\s+(.+)$/i;
            const match = cleanTitle.match(progressRegex);

            if (match) {
              const currentPage = parseInt(match[1], 10);
              const totalPages = parseInt(match[2], 10);
              const bookTitle = match[3].trim();
              const lastUpdated = item.pubDate || new Date().toISOString();

              // console.log(
              //   `Found page progress: ${currentPage}/${totalPages} for "${bookTitle}"`,
              // );

              progressUpdates[bookTitle] = {
                currentPage,
                totalPages,
                lastUpdated,
              };
              // console.log(
              //   `Progress timestamp for "${bookTitle}": ${lastUpdated}`,
              // );
            }

            // Also look for "Zach is X% done with BookTitle" updates
            const percentRegex = /Zach\s+is\s+(\d+)%\s+done\s+with\s+(.+)$/i;
            const percentMatch = cleanTitle.match(percentRegex);

            if (percentMatch && !progressUpdates[percentMatch[2].trim()]) {
              const percent = parseInt(percentMatch[1], 10);
              const bookTitle = percentMatch[2].trim();
              const lastUpdated = item.pubDate || new Date().toISOString();

              // console.log(
              //   `Found percent progress: ${percent}% for "${bookTitle}"`,
              // );

              // For audiobooks, store the percentage as a special marker
              progressUpdates[bookTitle] = {
                currentPage: percent, // Store percentage as currentPage for audiobooks
                totalPages: 100, // Total is always 100% for audiobooks
                lastUpdated,
                isPercentage: true, // Flag to indicate this is percentage data
              };
              // console.log(
              //   `Progress timestamp for "${bookTitle}": ${lastUpdated}`,
              // );
            }
          }
        }
      }

      // console.log("Progress updates:", progressUpdates);

      // 4. Process the shelf feed to get book details
      let books: Book[] = [];

      if (shelfResult.rss?.channel?.item) {
        const items = Array.isArray(shelfResult.rss.channel.item)
          ? shelfResult.rss.channel.item
          : [shelfResult.rss.channel.item];

        books = items.map((item: RssItem) => {
          const title = item.title || 'Unknown Title';
          const author = item.author_name || 'Unknown Author';

          // Construct proper book URL using book_id if available
          let link = null;
          if (item.book_id) {
            // Create a URL-friendly version of the title for the book URL
            const urlTitle = title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '') // Remove special characters
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/-+/g, '-') // Replace multiple hyphens with single
              .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

            link = `https://www.goodreads.com/book/show/${item.book_id}.${urlTitle}`;
          } else {
            // Fallback to original link if book_id not available
            link = item.link || null;
          }

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

          const progress = findProgressUpdate(title, progressUpdates);
          if (progress) {
            currentPage = progress.currentPage;
            totalPages = progress.totalPages;
            lastUpdated = progress.lastUpdated;

            // console.log(`Matched progress for "${title}":`, progress);
          } else {
            // console.log(`No progress found for "${title}"`);
          }

          // If we still don't have current page but have total pages, estimate
          if (!currentPage && totalPages) {
            currentPage = Math.floor(totalPages * 0.3); // Assume 30% through
          }

          const book = {
            title,
            author,
            coverImg,
            link,
            currentPage,
            totalPages,
            lastUpdated,
            isPercentage: progress?.isPercentage,
          };

          // console.log(`Processed book:`, book);

          return book;
        });
      }

      // console.log("Processed books:", books);

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
        console.warn('Failed to cache data:', cacheError);
      }

      return NextResponse.json(books);
    } catch (fetchError) {
      console.error('Error fetching from RSS feeds:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching currently reading books:', error);

    // Try to get stale data from cache as fallback
    try {
      const staleData = await kv.get(CACHE_KEY);
      if (staleData) {
        return NextResponse.json(staleData);
      }
    } catch (fallbackError) {
      console.error('Failed to get stale data:', fallbackError);
    }

    // Return a fallback empty array
    return NextResponse.json(
      {
        error: 'Failed to fetch currently reading books',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
