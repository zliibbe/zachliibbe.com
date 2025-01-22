import { NextResponse } from "next/server";

const STRAVA_OAUTH_URL = "https://www.strava.com/oauth/token";
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

export async function POST() {
  // Log environment variables (be careful with secrets in production)
  console.log("Checking environment variables:");
  console.log("Client ID exists:", !!STRAVA_CLIENT_ID);
  console.log("Client Secret exists:", !!STRAVA_CLIENT_SECRET);
  console.log("Refresh Token exists:", !!STRAVA_REFRESH_TOKEN);

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    console.error("Missing required environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    console.log("Attempting to refresh token...");
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

    console.log("Strava response status:", response.status);
    const responseText = await response.text();
    console.log("Strava response body:", responseText);

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

// const TOKEN_PATH = path.resolve(process.cwd(), ".env.local");

// export default async function refreshToken() {
//   try {
//     const response = await fetch(STRAVA_OAUTH_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         client_id: STRAVA_CLIENT_ID,
//         client_secret: STRAVA_CLIENT_SECRET,
//         grant_type: "refresh_token",
//         refresh_token: STRAVA_REFRESH_TOKEN,
//       }),
//     });

//     console.log("Payload:", {
//       client_id: STRAVA_CLIENT_ID,
//       client_secret: STRAVA_CLIENT_SECRET,
//       grant_type: "refresh_token",
//       refresh_token: STRAVA_REFRESH_TOKEN,
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to refresh token: ${response.status}`);
//     }

//     const data = await response.json();

//     // Persist the new tokens to `.env.local`
//     const updatedEnv = `STRAVA_ACCESS_TOKEN=${data.access_token} \nSTRAVA_REFRESH_TOKEN=${data.refresh_token}`;
//     fs.writeFileSync(TOKEN_PATH, updatedEnv);
//     console.log(".env.local updated with new tokens");

//     return data.access_token; // Return the new access token
//   } catch (error) {
//     console.error("Error refreshing token:", error);
//     throw error;
//   }
// }
