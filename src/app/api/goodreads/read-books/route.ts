import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    // Determine which URL to use based on environment
    const useLocalLambda = process.env.NEXT_PUBLIC_USE_LOCAL_LAMBDA === "true";

    let lambdaUrl;
    if (useLocalLambda) {
      // Use local serverless offline URL
      lambdaUrl = "http://localhost:3003/getReadBooks";
    } else {
      // Use production URL
      lambdaUrl = process.env.GOODREADS_GETREADBOOKS_URL_PROD;
    }

    if (!lambdaUrl) {
      throw new Error("Goodreads Lambda URL is not configured");
    }

    const startTime = Date.now();

    const response = await fetch(lambdaUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[${requestId}] Lambda error: ${response.status}`,
        errorText,
      );
      throw new Error(`Lambda returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json(data.books || [], {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=1800", // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Error fetching read books:`, error);
    // Return fallback data or empty array
    return NextResponse.json([], {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
}
