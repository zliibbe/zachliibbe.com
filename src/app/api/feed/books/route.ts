import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

async function fetchGoodreadsShelf(shelf: string) {
  const userId = "24890536-zach-liibbe";
  const url = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/xml",
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Goodreads: ${response.statusText}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const result = parser.parse(xml);

    if (!result.rss?.channel?.item) {
      throw new Error("Invalid RSS feed structure");
    }

    // Handle both single item and array of items
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    return items.map((item: any) => ({
      title: item.title,
      author: item.author_name,
      coverUrl: item.book_large_image_url || item.book_image_url,
      link: item.book?.["@_id"] || item.book_id,
      dateRead: item.user_read_at,
      rating: parseInt(item.user_rating, 10) || 0,
    }));
  } catch (error) {
    console.error("Error fetching from Goodreads:", error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const shelf = type === "audiobook" ? "audiobooks" : "read";

    const books = await fetchGoodreadsShelf(shelf);
    return NextResponse.json(books);
  } catch (error) {
    console.error("Error in books API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}
