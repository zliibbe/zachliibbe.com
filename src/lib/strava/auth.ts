import { kv } from '@vercel/kv';

const STRAVA_TOKEN_KEY = 'strava_token';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export async function getStravaToken(): Promise<TokenData | null> {
  try {
    return await kv.get(STRAVA_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token from KV:', error);
    return null;
  }
}

export async function refreshStravaToken(): Promise<string> {
  // console.log("Refreshing Strava token...");

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Strava credentials in environment variables');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Strava token refresh failed: ${response.status}`,
        errorText
      );
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data = await response.json();

    // Store the new token data
    const tokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Keep old refresh token if not provided
      expires_at: data.expires_at,
    };

    try {
      await kv.set(STRAVA_TOKEN_KEY, tokenData);
    } catch (error) {
      console.warn('Failed to cache token in KV, continuing anyway:', error);
    }

    return data.access_token;
  } catch (error) {
    console.error(`Error refreshing Strava token: ${error}`);
    throw new Error(
      `Failed to refresh Strava token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getAccessToken(): Promise<string> {
  try {
    // Try to get token from KV
    const tokenData = (await kv.get(STRAVA_TOKEN_KEY)) as TokenData;

    // If we have a token and it's not expired (with 5 min buffer), use it
    if (tokenData?.access_token) {
      const now = Math.floor(Date.now() / 1000);
      if (tokenData.expires_at > now + 300) {
        return tokenData.access_token;
      }
    }

    // Instead of using the API route, call refreshStravaToken directly
    return await refreshStravaToken();
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Failed to get Strava access token');
  }
}
