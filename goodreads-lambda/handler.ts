import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

// Cache implementation to reduce Lambda executions
let cachedData: any = null;
let lastFetch: number = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#x2f;": "/",
    "&ndash;": "–",
    "&mdash;": "—",
    "&nbsp;": " ",
  };

  return text.replace(/&[^;]+;/g, (entity) => {
    if (entities[entity]) {
      return entities[entity];
    }
    // For numeric entities like &#39;
    if (entity.match(/&#[0-9]+;/)) {
      const number = entity.match(/[0-9]+/)![0];
      return String.fromCharCode(parseInt(number));
    }
    // For hexadecimal entities like &#x27;
    if (entity.match(/&#x[0-9a-f]+;/i)) {
      const hex = entity.match(/[0-9a-f]+/i)![0];
      return String.fromCharCode(parseInt(hex, 16));
    }
    return entity;
  });
}

export const getCurrentlyReading = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Lambda execution started");

  // Check cache first
  const now = Date.now();
  if (cachedData && now - lastFetch < CACHE_DURATION) {
    console.log("Returning cached data");
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
      body: JSON.stringify(cachedData),
    };
  }

  try {
    const userId = process.env.GOODREADS_USER_ID;
    if (!userId) {
      throw new Error("GOODREADS_USER_ID environment variable is required");
    }

    console.log("Fetching Goodreads RSS feed");
    const response = await fetch(
      `https://www.goodreads.com/user/updates_rss/${userId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xml = await response.text();
    console.log("RSS Feed Content:", xml);

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
    });
    const result = xmlParser.parse(xml);
    const items = result.rss.channel.item;

    // Find the most recent reading progress update
    const currentlyReading = items.find((item: any) => {
      return item.title && item.title.includes("page");
    });

    if (!currentlyReading) {
      throw new Error("No currently reading book found");
    }

    // Extract book details using regex
    const titleMatch = currentlyReading.description.match(/alt="([^"]+)"/);
    if (!titleMatch) {
      throw new Error("Could not parse book title and author");
    }

    // Extract the book URL from the description
    const bookUrlMatch = currentlyReading.description.match(/href="([^"]+)"/);
    const bookUrl = bookUrlMatch
      ? `https://www.goodreads.com${bookUrlMatch[1]}`
      : null;

    const [title, author] = titleMatch[1]
      .split(" by ")
      .map((s: string) => s.trim());

    // Get page numbers from title
    const pageMatch = currentlyReading.title.match(/page (\d+) of (\d+)/);
    const currentPage = pageMatch ? parseInt(pageMatch[1]) : null;
    const totalPages = pageMatch ? parseInt(pageMatch[2]) : null;

    // Get cover image URL and upgrade the resolution
    const coverMatch = currentlyReading.description.match(/src="([^"]+)"/);
    const coverImg = coverMatch
      ? coverMatch[1]
          .replace("._SY75_", "") // Remove the size constraint
          .replace("photo.goodreads.com", "images.gr-assets.com") // Use high-res domain
          .replace("compressed.", "") // Remove compression indicator
      : null;

    // console.log("currentlyReading.link:", currentlyReading.link);

    const bookDetails = {
      title: decodeHtmlEntities(title),
      author: author ? decodeHtmlEntities(author) : null,
      coverImg: coverImg || null,
      link: bookUrl || process.env.GOODREADS_PROFILE_URL,
      currentPage: currentPage || null,
      totalPages: totalPages || null,
      lastUpdated: currentlyReading.pubDate || null,
    };

    // Cache and return response
    cachedData = {
      books: [bookDetails],
      timestamp: new Date().toISOString(),
      status: "success",
    };
    lastFetch = Date.now();

    console.log("Successfully fetched book details:", bookDetails);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
      body: JSON.stringify(cachedData),
    };
  } catch (error) {
    console.error("Lambda error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
