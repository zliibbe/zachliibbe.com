import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const readBooksUrl = process.env.GOODREADS_GETREADBOOKS_URL_PROD;
    const audiobooksUrl = process.env.GOODREADS_GETAUDIOBOOKS_URL_PROD;

    console.log("Testing Lambda URLs:", { readBooksUrl, audiobooksUrl });

    const readBooksResponse = await fetch(readBooksUrl!, { method: "GET" });
    const audiobooksResponse = await fetch(audiobooksUrl!, { method: "GET" });

    return NextResponse.json({
      readBooksStatus: readBooksResponse.status,
      audiobooksStatus: audiobooksResponse.status,
      env: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
