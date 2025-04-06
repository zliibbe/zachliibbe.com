import { NextResponse } from "next/server";
import { createClient } from "@vercel/kv";

// Create KV client with the new environment variables
const kv = createClient({
  url: process.env.KV_KV_REST_API_URL || "",
  token: process.env.KV_KV_REST_API_TOKEN || "",
});

export async function GET() {
  try {
    // List all keys for debugging
    const keys = await kv.keys("*");
    // console.log("All keys before deletion:", keys);

    // Delete the cached data
    let deletedKeys = [];

    if (keys.includes("goodreads_read_books")) {
      await kv.del("goodreads_read_books");
      deletedKeys.push("goodreads_read_books");
    }

    if (keys.includes("goodreads_audiobooks")) {
      await kv.del("goodreads_audiobooks");
      deletedKeys.push("goodreads_audiobooks");
    }

    // Check for stale keys too
    if (keys.includes("goodreads_read_books_stale")) {
      await kv.del("goodreads_read_books_stale");
      deletedKeys.push("goodreads_read_books_stale");
    }

    if (keys.includes("goodreads_audiobooks_stale")) {
      await kv.del("goodreads_audiobooks_stale");
      deletedKeys.push("goodreads_audiobooks_stale");
    }

    // Get updated keys list
    const updatedKeys = await kv.keys("*");

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      deletedKeys: deletedKeys,
      beforeKeys: keys,
      afterKeys: updatedKeys,
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
