import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    // List all keys (optional, for debugging)
    const keys = await kv.keys("*");
    console.log("All keys:", keys);

    // Delete the cached data
    await kv.del("goodreads_read_books");
    await kv.del("goodreads_audiobooks");
    await kv.del("goodreads_read_books_stale");
    await kv.del("goodreads_audiobooks_stale");

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      clearedKeys: [
        "goodreads_read_books",
        "goodreads_audiobooks",
        "goodreads_read_books_stale",
        "goodreads_audiobooks_stale",
      ],
      allKeys: keys,
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
