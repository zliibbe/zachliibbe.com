export default async function getLatestActivity() {
  try {
    // First refresh the token
    const refreshResponse = await fetch("/api/refresh-token", {
      method: "POST",
      cache: "no-store",
    });

    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh token: ${refreshResponse.status}`);
    }

    const tokenData = await refreshResponse.json();

    // Use the new access token
    const activitiesUrl =
      "https://www.strava.com/api/v3/athlete/activities?per_page=1";

    const response = await fetch(activitiesUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch activities: ${response.status} - ${errorText}`
      );
    }

    const activities = await response.json();

    if (!activities || activities.length === 0) {
      throw new Error("No activities found");
    }

    return activities[0];
  } catch (error) {
    console.error("9. Error in getLatestActivity:", error.message);
    throw error;
  }
}
