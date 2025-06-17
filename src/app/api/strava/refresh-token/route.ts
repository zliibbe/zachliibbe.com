import { NextResponse } from "next/server";

const STRAVA_OAUTH_URL = "https://www.strava.com/oauth/token";
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

export interface TokenResponse {
  token_type: string;
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
}

export async function POST() {
  try {
    const tokenResponse = await fetch(STRAVA_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: STRAVA_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: `Failed to refresh token: ${tokenResponse.status}` },
        { status: tokenResponse.status },
      );
    }

    const data = (await tokenResponse.json()) as TokenResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error refreshing Strava token:", error);
    return NextResponse.json(
      { error: "Failed to refresh Strava token" },
      { status: 500 },
    );
  }
}
