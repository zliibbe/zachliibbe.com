import { NextResponse } from "next/server";

const STRAVA_OAUTH_URL = "https://www.strava.com/oauth/token";
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

export async function POST() {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    console.error("Missing environment variables:", {
      clientId: !STRAVA_CLIENT_ID,
      clientSecret: !STRAVA_CLIENT_SECRET,
      refreshToken: !STRAVA_REFRESH_TOKEN,
    });
    return NextResponse.json(
      { error: "Server configuration error - missing required variables" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(STRAVA_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: STRAVA_REFRESH_TOKEN,
      }),
    });

    const data = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Token refresh failed: ${response.status} - ${data}` },
        { status: response.status }
      );
    }

    const tokenData = JSON.parse(data);
    return NextResponse.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: `Failed to refresh token: ${error.message}` },
      { status: 500 }
    );
  }
}
