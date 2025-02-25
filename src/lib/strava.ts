import { kv } from "@vercel/kv";

const STRAVA_TOKEN_CACHE_KEY = "strava_access_token";

interface StravaTokenResponse {
  access_token: string;
  expires_at: number;
  refresh_token: string;
}

export async function getStravaAccessToken(): Promise<string> {
  try {
    // Check for cached token
    const cachedToken = await kv.get(STRAVA_TOKEN_CACHE_KEY);
    if (cachedToken) {
      return cachedToken as string;
    }

    // If no cached token, get a new one
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: process.env.STRAVA_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to refresh token: ${tokenResponse.status}`);
    }

    const data: StravaTokenResponse = await tokenResponse.json();

    // Cache the new token
    // Calculate time until token expires (subtract 5 minutes for safety)
    const expiresIn = data.expires_at - Math.floor(Date.now() / 1000) - 300;

    await kv.set(STRAVA_TOKEN_CACHE_KEY, data.access_token, {
      ex: expiresIn,
    });

    return data.access_token;
  } catch (error) {
    console.error("Error getting Strava access token:", error);
    throw new Error("Failed to get Strava access token");
  }
}

export async function fetchStravaActivities() {
  try {
    const accessToken = await getStravaAccessToken();

    // Get activities from the past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const response = await fetch(
      `${process.env.STRAVA_API_URL}/athlete/activities?after=${Math.floor(oneYearAgo.getTime() / 1000)}&per_page=200`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Strava activities:", error);
    throw error;
  }
}
