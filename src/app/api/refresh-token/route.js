import { NextResponse } from "next/server";

const STRAVA_OAUTH_URL = "https://www.strava.com/oauth/token";
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;
const redirectUri = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST() {
  console.log("Starting token refresh...");
  console.log("Environment check:", {
    hasClientId: !!STRAVA_CLIENT_ID,
    hasClientSecret: !!STRAVA_CLIENT_SECRET,
    hasRefreshToken: !!STRAVA_REFRESH_TOKEN,
  });

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    console.error("Missing required environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const payload = {
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: STRAVA_REFRESH_TOKEN,
  };

  try {
    console.log("Sending refresh request...");
    const response = await fetch(STRAVA_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    console.log("Strava response status:", response.status);
    const responseText = await response.text();
    console.log("Strava response body:", responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Token refresh failed: ${response.status} - ${responseText}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: `Failed to refresh token: ${error.message}` },
      { status: 500 }
    );
  }
}
