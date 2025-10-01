import moment from 'moment';
import { kv } from '@vercel/kv';

// Create a local cache fallback for storage
const localCache = new Map();

/**
 * UI UTILITIES
 * Functions for UI interactions and display formatting
 */

/**
 * Scrolls the window to the top with smooth animation
 */
export function scrollToTop() {
  const isBrowser = () => typeof window !== 'undefined';

  if (!isBrowser()) return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Formats a theme name from kebab-case to Title Case
 * @param str - Theme name in kebab-case format
 * @returns Formatted theme name in Title Case
 */
export function formatThemeName(str: string) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converts a number to its word representation (for numbers under 100)
 * @param num - Number to convert
 * @returns Word representation of the number
 */
export function numberToWords(num: number): string {
  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
  ];
  const teens = [
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  if (num < 10) return ones[num]!;
  if (num < 20) return teens[num - 10]!;

  const ten = Math.floor(num / 10);
  const one = num % 10;

  return one ? `${tens[ten]!}-${ones[one]!}` : tens[ten]!;
}

/**
 * DATE AND TIME FORMATTING UTILITIES
 * Functions for formatting dates, times, and durations
 */

/**
 * Formats a date string into a readable format
 * @param dateString - ISO date string or any date format that moment can parse
 * @returns Formatted date string (e.g., "Aug 15, 2023")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown date';

  try {
    // Parse the date using moment
    const date = moment(dateString);

    // Check if the date is valid
    if (!date.isValid()) {
      return 'Invalid date';
    }

    // Format the date (e.g., "Aug 15, 2023")
    return date.format('MMM D, YYYY');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
}

/**
 * Formats a duration in seconds to a readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 30m")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }

  return `${minutes}m`;
}

/**
 * Formats elapsed time in seconds to a human-readable format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "5 minutes" or "2h 30m")
 */
export function formatElapsedTime(seconds: number): string {
  if (!seconds) return '0 min';

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Gets a human-readable time ago string from a timestamp
 * @param timestamp - Unix timestamp in seconds or ISO date string
 * @returns Human-readable time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(timestamp: number | string): string {
  if (!timestamp) return 'Unknown time';

  try {
    const now = moment();
    let activityTime;

    // Handle different timestamp formats
    if (typeof timestamp === 'number') {
      activityTime = moment.unix(timestamp);
    } else if (
      typeof timestamp === 'object' &&
      (timestamp as { start_date?: string }).start_date
    ) {
      // Handle case where an entire activity object was passed
      activityTime = moment((timestamp as { start_date: string }).start_date);
    } else {
      // ISO date string or other format
      activityTime = moment(timestamp);
    }

    if (!activityTime.isValid()) {
      console.error('Invalid timestamp:', timestamp);
      return 'recently';
    }

    // Check if the activity was yesterday by comparing calendar dates
    const isYesterday =
      activityTime.format('YYYY-MM-DD') ===
      moment().subtract(1, 'days').format('YYYY-MM-DD');

    const diffMinutes = now.diff(activityTime, 'minutes');
    const diffHours = now.diff(activityTime, 'hours');
    const diffDays = now.diff(activityTime, 'days');

    // Format based on how long ago
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24 && !isYesterday) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (isYesterday || diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return activityTime.format('MMM D');
    }
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'recently';
  }
}

/**
 * DISTANCE AND MEASUREMENT UTILITIES
 * Functions for formatting and converting distance measurements
 */

/**
 * Formats a distance in meters to a readable format in miles
 * @param meters - Distance in meters
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted distance string (e.g., "5.2 mi")
 */
export function formatDistance(meters: number, decimals: number = 1): string {
  if (!meters || meters <= 0) return '0 mi';

  // Convert meters to miles (1 meter = 0.000621371 miles)
  const miles = meters * 0.000621371;

  // Round to specified decimal places
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Formats a distance in meters to miles with hyphen for display
 * @param meters - Distance in meters
 * @returns Formatted distance string (e.g., "5-mile")
 */
export function formatDistanceToMiles(meters: number): string {
  if (!meters) return '0 mi';
  const miles = (meters / 1609.344).toFixed(0);
  return `${miles}-mile`;
}

/**
 * Formats a distance in meters to yards with hyphen for display
 * @param meters - Distance in meters
 * @returns Formatted distance string (e.g., "500-yard")
 */
export function formatDistanceToYards(meters: number): string {
  if (!meters) return '0 yards';
  const yards = (meters * 1.094).toFixed(0); // Convert meters to yards
  return `${yards}-yard`;
}

/**
 * Calculates intensity level based on distance
 * @param distance - Distance in meters
 * @returns Intensity level (1-3)
 */
export function calculateIntensity(distance: number): 1 | 2 | 3 {
  if (distance < 5000) return 1; // Less than 5km
  if (distance < 10000) return 2; // 5-10km
  return 3; // More than 10km
}

/**
 * STORAGE AND CACHING UTILITIES
 * Functions for managing data storage and caching
 */

/**
 * Gets the appropriate storage mechanism (KV or local cache)
 * @returns Storage interface with get, set, and del methods
 */
export const getStorage = () => {
  // Try to use KV first
  if (process.env.KV_KV_REST_API_URL && process.env.KV_KV_REST_API_TOKEN) {
    try {
      return kv;
    } catch (error) {
      console.warn('Failed to initialize KV, falling back to local cache');
    }
  }

  // Fallback to local cache if KV isn't available or we're in development
  if (
    process.env.ENABLE_LOCAL_CACHE_FALLBACK === 'true' ||
    process.env.NODE_ENV === 'development'
  ) {
    return {
      get: async (key: string) => localCache.get(key),
      set: async (key: string, value: unknown, options?: { ex?: number }) => {
        localCache.set(key, value);
        if (options?.ex) {
          setTimeout(() => localCache.delete(key), options.ex * 1000);
        }
        return true;
      },
      del: async (key: string) => localCache.delete(key),
    };
  }

  throw new Error('No storage mechanism available');
};

/**
 * STRAVA API UTILITIES
 * Functions for interacting with the Strava API
 */

// Strava cache constants
const ACTIVITIES_CACHE_KEY = 'strava_activities';
const CACHE_DURATION = 60 * 25; // 25 minutes
const LATEST_ACTIVITY_CACHE_KEY = 'latest_activity';
const LATEST_ACTIVITY_CACHE_DURATION = 60 * 5; // 5 minutes

/**
 * Gets a Strava access token using the API route instead of direct fetch
 * @returns Promise with the access token
 */
export async function getStravaAccessToken(): Promise<string> {
  try {
    const storage = getStorage();
    const STRAVA_TOKEN_CACHE_KEY = 'strava_access_token';

    // Check for cached token
    const cachedToken = await storage.get(STRAVA_TOKEN_CACHE_KEY);
    if (cachedToken) {
      return cachedToken as string;
    }

    // If no cached token, use the API route to get a new one
    const refreshTokenUrl = new URL(
      '/api/refresh-token',
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    ).toString();

    const refreshResponse = await fetch(refreshTokenUrl, {
      method: 'POST',
      cache: 'no-store',
    });

    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh token: ${refreshResponse.status}`);
    }

    const tokenData = await refreshResponse.json();
    const accessToken = tokenData.access_token;

    // Cache the new token if we have an expiration time
    if (tokenData.expires_at) {
      // Calculate time until token expires (subtract 5 minutes for safety)
      const expiresIn =
        tokenData.expires_at - Math.floor(Date.now() / 1000) - 300;

      await storage.set(STRAVA_TOKEN_CACHE_KEY, accessToken, {
        ex: expiresIn,
      });
    }

    return accessToken;
  } catch (error) {
    console.error('Error getting Strava access token:', error);
    throw new Error('Failed to get Strava access token');
  }
}

/**
 * Fetches Strava activities directly from the API
 * @returns Promise with array of Strava activities
 */
export async function fetchStravaActivities(): Promise<unknown[]> {
  const accessToken = await getStravaAccessToken();

  // Get activities from the past year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const activitiesUrl = `https://www.strava.com/api/v3/athlete/activities?after=${Math.floor(oneYearAgo.getTime() / 1000)}&per_page=200`;

  const response = await fetch(activitiesUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch activities: ${response.status} - ${errorText}`
    );
  }

  const activities = await response.json();
  if (!activities) {
    throw new Error('No activities found');
  }

  return activities;
}

/**
 * Gets Strava activities with caching
 * @returns Promise with array of Strava activities
 */
export async function getStravaActivities(): Promise<unknown[]> {
  try {
    const storage = getStorage();
    const cachedData = await storage.get(ACTIVITIES_CACHE_KEY);

    if (cachedData) {
      // Check if we have a recent activity that might not be in the cache
      const latestActivity = await fetchLatestActivity();

      // If the latest activity is newer than what's in our cache, refresh the cache
      if (
        !cachedData.some(
          (activity: { id: number }) => activity.id === latestActivity.id
        )
      ) {
        const freshActivities = await fetchStravaActivities();
        await storage.set(ACTIVITIES_CACHE_KEY, freshActivities, {
          ex: CACHE_DURATION,
        });
        return freshActivities;
      }

      return cachedData as unknown[];
    }

    const activities = await fetchStravaActivities();

    // Cache the response
    await storage.set(ACTIVITIES_CACHE_KEY, activities, {
      ex: CACHE_DURATION,
    });

    return activities;
  } catch (error: unknown) {
    console.error('Storage error:', error);

    // If cache error, try fetching fresh data
    if (error instanceof Error && error.message?.includes('KV')) {
      return await fetchStravaActivities();
    }

    // If all else fails, return empty array
    return [];
  }
}

/**
 * Fetches the latest Strava activity
 * @param signal - Optional AbortSignal for timeout handling
 * @returns Promise with the latest Strava activity
 */
export async function fetchLatestActivity(signal?: AbortSignal): Promise<{
  id: number;
  type: string;
  name: string;
  distance: number;
  elapsed_time: number;
  start_date: string;
}> {
  // Get a fresh access token
  const accessToken = await getStravaAccessToken();

  // Fetch the latest activity with timeout signal
  const response = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=1',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal, // Pass the AbortSignal for timeout handling
    }
  );

  if (!response.ok) {
    throw new Error(
      `Strava API error: ${response.status} ${response.statusText}`
    );
  }

  const activities = await response.json();

  if (!activities || activities.length === 0) {
    throw new Error('No activities found');
  }

  return activities[0];
}

/**
 * Cleans and normalizes Goodreads URLs to ensure they point to the correct book page
 * @param url The Goodreads URL to clean
 * @param title Optional book title to use for constructing a better URL
 * @returns A properly formatted Goodreads URL
 */
export function cleanGoodreadsUrl(url: string, title?: string): string {
  if (!url) return '#';

  // Case 1: Handle review URLs from RSS feeds
  if (url.includes('goodreads.com/review/show/')) {
    // Extract the review ID from the URL
    const reviewIdMatch = url.match(/\/review\/show\/(\d+)/);
    if (reviewIdMatch && reviewIdMatch[1]) {
      // Option 1: Use the Goodreads search API with the title
      if (title) {
        // Create a search URL that will redirect to the book page
        return `https://www.goodreads.com/book/title?id=${encodeURIComponent(title)}`;
      }
    }
  }

  // Case 2: Handle book URLs that already have the correct format
  if (url.includes('goodreads.com/book/show/')) {
    // Extract just the book ID and slug part, removing query parameters
    const match = url.match(/\/book\/show\/([^?]+)/);
    if (match) {
      return `https://www.goodreads.com/book/show/${match[1]}`;
    }
  }

  // If we couldn't parse it properly, return a search URL for the title
  if (title) {
    return `https://www.goodreads.com/book/title?id=${encodeURIComponent(title)}`;
  }

  // Last resort: return the original URL
  return url;
}
