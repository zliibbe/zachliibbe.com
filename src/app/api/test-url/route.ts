import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const testUrl = new URL("/api/refresh-token", baseUrl).toString();

    return NextResponse.json({
      baseUrl,
      constructedUrl: testUrl,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
