import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const CACHE_KEY = "recent_books";
const CACHE_DURATION = 60 * 30; // 30 minutes

interface Book {
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  link: string;
  dateRead: string;
}

export async function GET() {
  try {
    // Check cache first
    const cachedBooks = await kv.get(CACHE_KEY);
    if (cachedBooks) {
      return NextResponse.json(cachedBooks);
    }

    const goodreadsUrl = process.env.GOODREADS_LAMBDA_URL;
    if (!goodreadsUrl) {
      throw new Error("Goodreads Lambda URL not configured");
    }

    const response = await fetch(goodreadsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }

    const data = await response.json();

    // Process and format the books data
    const books: Book[] = data.books
      .filter((book: any) => !book.shelves?.includes("audiobooks"))
      .slice(0, 5)
      .map((book: any) => ({
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        rating: book.rating,
        link: book.link,
        dateRead: book.dateRead,
      }));

    // Cache the processed books
    await kv.set(CACHE_KEY, books, {
      ex: CACHE_DURATION,
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}
