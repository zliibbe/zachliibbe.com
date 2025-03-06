import { NextResponse } from "next/server";
import { createClient } from "@vercel/kv";

// Create KV client with the new environment variables
const kv = createClient({
  url: process.env.KV_KV_REST_API_URL || "",
  token: process.env.KV_KV_REST_API_TOKEN || "",
});

export async function GET() {
  try {
    // Try to set a test value
    await kv.set("test_key", "test_value");

    // Try to get the test value
    const value = await kv.get("test_key");

    // List all keys
    const keys = await kv.keys("*");

    return NextResponse.json({
      success: true,
      message: "KV connection successful",
      value,
      keys,
      env: {
        kv_url: process.env.KV_KV_REST_API_URL ? "Set" : "Not set",
        kv_token: process.env.KV_KV_REST_API_TOKEN ? "Set" : "Not set",
        lambda_url: process.env.GOODREADS_GETREADBOOKS_URL_PROD
          ? "Set"
          : "Not set",
      },
    });
  } catch (error) {
    console.error("KV connection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        env: {
          kv_url: process.env.KV_KV_REST_API_URL ? "Set" : "Not set",
          kv_token: process.env.KV_KV_REST_API_TOKEN ? "Set" : "Not set",
          lambda_url: process.env.GOODREADS_GETREADBOOKS_URL_PROD
            ? "Set"
            : "Not set",
        },
      },
      { status: 500 },
    );
  }
}
