import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

// Cache implementation to reduce Lambda executions
let cachedData: { [key: string]: any } = {};
let lastFetch: { [key: string]: number } = {};
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Main handler for currently reading books
export const getCurrentlyReading = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // console.log(
  //   "getCurrentlyReading Lambda function called",
  //   JSON.stringify(event.queryStringParameters),
  // );

  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit || "5", 10);
  const shelf = "currently-reading"; // Force the shelf to be "currently-reading"

  const cacheKey = `${shelf}_${limit}`;

  // Check cache first
  const now = Date.now();
  if (
    cachedData[cacheKey] &&
    now - (lastFetch[cacheKey] || 0) < CACHE_DURATION
  ) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cachedData[cacheKey]),
    };
  }

  try {
    const userId = process.env.GOODREADS_USER_ID || "24890536";

    // Use the shelf-specific RSS feed URL
    const feedUrl = `https://www.goodreads.com/review/list_rss/${userId}-zach?shelf=${shelf}`;

    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GoodreadsLambda/1.0)",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xml = await response.text();

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
    });
    const result = xmlParser.parse(xml);

    // Check if items exist in the feed
    if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      throw new Error("No books found in the RSS feed");
    }

    // Ensure items is always an array
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    // Limit the number of books returned
    const limitedItems = items.slice(0, limit);

    // Process each book
    const books = limitedItems.map((item: any) => {
      // Extract book details
      const title = item.title
        ? decodeHtmlEntities(item.title)
        : "Unknown Title";
      const author = item.author_name
        ? decodeHtmlEntities(item.author_name)
        : "Unknown Author";
      const bookUrl = item.link || null;

      // Extract cover image URL - format varies in RSS feeds
      let coverImg = null;
      if (item.book_large_image_url) {
        coverImg = item.book_large_image_url;
      } else if (item.book_medium_image_url) {
        coverImg = item.book_medium_image_url;
      } else if (item.book_small_image_url) {
        coverImg = item.book_small_image_url;
      } else if (item.description) {
        // Try to extract from description if available
        const imgMatch = item.description.match(/<img.*?src=["'](.*?)["']/i);
        if (imgMatch && imgMatch[1]) {
          coverImg = imgMatch[1];
        }
      }

      // Parse rating and date
      const rating = item.user_rating ? parseFloat(item.user_rating) : 0;
      const dateRead = item.user_read_at || null;

      return {
        title,
        author,
        coverImg,
        link: bookUrl,
        rating,
        dateRead,
      };
    });

    // Process the books data
    const processedBooks = books.map((book: any) => {
      // Extract book information
      return {
        title: book.title,
        author: book.author,
        coverImg: book.coverImg || book.image_url,
        link: book.link || book.url,
        // Add reading progress information
        currentPage: 156, // Hardcoded for now, replace with actual data when available
        totalPages: 464, // Hardcoded for now, replace with actual data when available
        lastUpdated: new Date().toISOString(), // Current timestamp
      };
    });

    // Cache and return response
    cachedData[cacheKey] = {
      books: processedBooks,
      timestamp: new Date().toISOString(),
      status: "success",
    };
    lastFetch[cacheKey] = now;

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cachedData[cacheKey]),
    };
  } catch (error) {
    console.error("Lambda error:", error);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

// Handler for read books
export const getReadBooks = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit || "5", 10);
  const shelf = "zach-read"; // Force the shelf to be "zach-read"

  const cacheKey = `${shelf}_${limit}`;

  // Check cache first
  const now = Date.now();
  if (
    cachedData[cacheKey] &&
    now - (lastFetch[cacheKey] || 0) < CACHE_DURATION
  ) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cachedData[cacheKey]),
    };
  }

  try {
    const userId = process.env.GOODREADS_USER_ID || "24890536";

    // Use the shelf-specific RSS feed URL
    const feedUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}&sort=date_read&order=d`;

    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "Cache-Control": "no-cache",
        Referer: "https://www.goodreads.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xml = await response.text();

    // Check if the response is HTML instead of XML
    if (
      xml.trim().startsWith("<!DOCTYPE html>") ||
      xml.trim().startsWith("<html")
    ) {
      console.error("Received HTML instead of XML from Goodreads");
      throw new Error(
        "Goodreads returned HTML instead of RSS feed - they may be blocking automated requests",
      );
    }

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
    });
    const result = xmlParser.parse(xml);

    // Check if items exist in the feed
    if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      throw new Error("No books found in the RSS feed");
    }

    // Ensure items is always an array
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    // Limit the number of books returned
    const limitedItems = items.slice(0, limit);

    // Process each book
    const books = limitedItems.map((item: any) => {
      // Extract book details
      const title = item.title
        ? decodeHtmlEntities(item.title)
        : "Unknown Title";
      const author = item.author_name
        ? decodeHtmlEntities(item.author_name)
        : "Unknown Author";
      const bookUrl = item.link || null;

      // Extract cover image URL - format varies in RSS feeds
      let coverImg = null;
      if (item.book_large_image_url) {
        coverImg = item.book_large_image_url;
      } else if (item.book_medium_image_url) {
        coverImg = item.book_medium_image_url;
      } else if (item.book_small_image_url) {
        coverImg = item.book_small_image_url;
      } else if (item.description) {
        // Try to extract from description if available
        const imgMatch = item.description.match(/<img.*?src=["'](.*?)["']/i);
        if (imgMatch && imgMatch[1]) {
          coverImg = imgMatch[1];
        }
      }

      // Parse rating and date
      const rating = item.user_rating ? parseFloat(item.user_rating) : 0;
      const dateRead = item.user_read_at || null;

      return {
        title,
        author,
        coverImg,
        link: bookUrl,
        rating,
        dateRead,
      };
    });

    // Cache and return response
    cachedData[cacheKey] = {
      books,
      timestamp: new Date().toISOString(),
      status: "success",
    };
    lastFetch[cacheKey] = now;

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cachedData[cacheKey]),
    };
  } catch (error) {
    console.error("Lambda error:", error);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

// Handler for audiobooks
export const getAudiobooks = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit || "5", 10);
  const shelf = "audiobooks"; // Force the shelf to be "audiobooks"

  const cacheKey = `${shelf}_${limit}`;

  // Check cache first
  const now = Date.now();
  if (
    cachedData[cacheKey] &&
    now - (lastFetch[cacheKey] || 0) < CACHE_DURATION
  ) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cachedData[cacheKey]),
    };
  }

  try {
    const userId = process.env.GOODREADS_USER_ID || "24890536";

    // Use the shelf-specific RSS feed URL with sorting parameters
    const feedUrl = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}&sort=date_read&order=d`;

    // Improved headers to mimic a real browser request
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "Cache-Control": "no-cache",
        Referer: "https://www.goodreads.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xml = await response.text();

    // Check if the response is HTML instead of XML
    if (
      xml.trim().startsWith("<!DOCTYPE html>") ||
      xml.trim().startsWith("<html")
    ) {
      console.error("Received HTML instead of XML from Goodreads");
      throw new Error(
        "Goodreads returned HTML instead of RSS feed - they may be blocking automated requests",
      );
    }

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
    });
    const result = xmlParser.parse(xml);

    // Check if items exist in the feed
    if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      throw new Error("No books found in the RSS feed");
    }

    // Ensure items is always an array
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    // Limit the number of books returned
    const limitedItems = items.slice(0, limit);

    // Process each book
    const books = limitedItems.map((item: any) => {
      // Extract book details
      const title = item.title
        ? decodeHtmlEntities(item.title)
        : "Unknown Title";
      const author = item.author_name
        ? decodeHtmlEntities(item.author_name)
        : "Unknown Author";
      const bookUrl = item.link || null;

      // Extract cover image URL - format varies in RSS feeds
      let coverImg = null;
      if (item.book_large_image_url) {
        coverImg = item.book_large_image_url;
      } else if (item.book_medium_image_url) {
        coverImg = item.book_medium_image_url;
      } else if (item.book_small_image_url) {
        coverImg = item.book_small_image_url;
      } else if (item.description) {
        // Try to extract from description if available
        const imgMatch = item.description.match(/<img.*?src=["'](.*?)["']/i);
        if (imgMatch && imgMatch[1]) {
          coverImg = imgMatch[1];
        }
      }

      // Parse rating and date
      const rating = item.user_rating ? parseFloat(item.user_rating) : 0;
      const dateRead = item.user_read_at || null;

      return {
        title,
        author,
        coverImg,
        link: bookUrl,
        rating,
        dateRead,
      };
    });

    // Cache and return response
    cachedData[cacheKey] = {
      books,
      timestamp: new Date().toISOString(),
      status: "success",
    };
    lastFetch[cacheKey] = now;

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=300",
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cachedData[cacheKey]),
    };
  } catch (error) {
    console.error("Lambda error:", error);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
