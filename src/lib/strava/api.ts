import { getStravaAccessToken } from '@/app/utils/index';

export async function getActivities(limit = 200, after?: number) {
  try {
    const token = await getStravaAccessToken();

    let url = `https://www.strava.com/api/v3/athlete/activities?per_page=${limit}`;

    // Add the 'after' parameter if provided
    if (after) {
      url += `&after=${after}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strava API error: ${response.status}`, errorText);
      throw new Error(`Strava API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error in getActivities:', error);
    throw error;
  }
}
