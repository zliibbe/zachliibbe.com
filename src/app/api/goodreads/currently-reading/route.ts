import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export const runtime = "edge";

interface UserStatus {
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  link: string;
  coverImg: string | null;
  lastUpdated: string;
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export async function GET() {
  try {
    // Determine which URL to use based on environment
    const useLocalLambda = process.env.NEXT_PUBLIC_USE_LOCAL_LAMBDA === "true";

    let lambdaUrl;
    if (useLocalLambda) {
      // Use local serverless offline URL
      lambdaUrl = "http://localhost:3003/getCurrentlyReading";
    } else {
      // Use production URL
      lambdaUrl = process.env.GOODREADS_GETCURRENTLYREADING_URL_PROD;
    }

    if (!lambdaUrl) {
      throw new Error("Goodreads Lambda URL is not configured");
    }

    const response = await fetch(lambdaUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Lambda returned ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error fetching Goodreads data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Goodreads data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }
}
