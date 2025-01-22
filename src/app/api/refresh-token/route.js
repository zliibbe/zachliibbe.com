import { NextResponse } from "next/server";

const STRAVA_OAUTH_URL = "https://www.strava.com/oauth/token";
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;
const redirectUri = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST() {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(STRAVA_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: STRAVA_REFRESH_TOKEN,
      }),
      cache: "no-store",
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`Strava token refresh failed: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to refresh token: ${response.status}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
