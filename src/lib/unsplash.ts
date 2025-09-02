// Unsplash API Integration
export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
    download_location: string;
  };
  alt_description: string | null;
  description: string | null;
  width: number;
  height: number;
}

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

const UNSPLASH_API_URL = 'https://api.unsplash.com';
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Unsplash API Rate Limits
export const UNSPLASH_LIMITS = {
  DEMO: {
    requests_per_hour: 50,
    description: 'Demo applications are limited to 50 requests per hour',
  },
  PRODUCTION: {
    requests_per_hour: 5000,
    description:
      'Production applications can make up to 5,000 requests per hour',
  },
} as const;

// Current mode detection
export function getUnsplashMode(): 'demo' | 'production' | 'unconfigured' {
  if (!ACCESS_KEY) return 'unconfigured';

  // In demo mode, you'll typically see rate limit headers indicating 50/hour
  // Production apps have much higher limits
  // For now, we'll assume demo mode until you get production approval
  return 'demo';
}

// Rate limit tracking (simple in-memory counter)
let requestCount = 0;
let resetTime = Date.now() + 60 * 60 * 1000; // Reset every hour

export function getRemainingRequests(): {
  remaining: number;
  resetTime: number;
  mode: string;
} {
  const now = Date.now();
  if (now > resetTime) {
    requestCount = 0;
    resetTime = now + 60 * 60 * 1000;
  }

  const mode = getUnsplashMode();
  const limit =
    mode === 'demo'
      ? UNSPLASH_LIMITS.DEMO.requests_per_hour
      : UNSPLASH_LIMITS.PRODUCTION.requests_per_hour;

  return {
    remaining: Math.max(0, limit - requestCount),
    resetTime,
    mode,
  };
}

function incrementRequestCount() {
  requestCount++;
}

export async function searchPhotos(
  query: string,
  perPage: number = 1
): Promise<UnsplashPhoto[]> {
  if (!ACCESS_KEY) {
    console.warn('Unsplash API key not configured, returning empty results');
    return [];
  }

  // Check rate limits before making request
  const { remaining, mode } = getRemainingRequests();
  if (remaining <= 0) {
    console.warn(
      `Unsplash API rate limit exceeded for ${mode} mode. Try again later.`
    );
    return [];
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
        },
        // Cache for 1 hour to avoid hitting rate limits
        next: { revalidate: 3600 },
      }
    );

    // Track the request for rate limiting
    incrementRequestCount();

    if (!response.ok) {
      console.error(
        'Unsplash API error:',
        response.status,
        response.statusText
      );

      // Log rate limit info if available
      const rateLimitRemaining = response.headers.get('X-Ratelimit-Remaining');
      const rateLimitLimit = response.headers.get('X-Ratelimit-Limit');
      if (rateLimitRemaining && rateLimitLimit) {
        console.log(
          `Unsplash rate limit: ${rateLimitRemaining}/${rateLimitLimit} remaining`
        );
      }

      return [];
    }

    const data: UnsplashSearchResponse = await response.json();

    // Log current usage for demo mode monitoring
    if (mode === 'demo') {
      console.log(
        `Unsplash ${mode} mode: ${remaining - 1} requests remaining this hour`
      );
    }

    return data.results;
  } catch (error) {
    console.error('Error fetching Unsplash photos:', error);
    return [];
  }
}

export async function getPhotoForBlogPost(
  categories: string[],
  tags: string[],
  title: string
): Promise<UnsplashPhoto | null> {
  // Create search queries from most to least specific
  const searchQueries = [
    // Try primary category + main tag
    categories[0] && tags[0] ? `${categories[0]} ${tags[0]}` : null,
    // Try primary category
    categories[0] || null,
    // Try main tag
    tags[0] || null,
    // Fallback to generic terms based on category
    categories.includes('Development') ? 'programming code' : null,
    categories.includes('Personal') ? 'lifestyle personal' : null,
    categories.includes('Learning') ? 'education learning' : null,
    categories.includes('Projects') ? 'technology project' : null,
    // Final fallback
    'abstract minimal',
  ].filter(Boolean);

  // Try each query until we get a result
  for (const query of searchQueries) {
    if (query) {
      const photos = await searchPhotos(query as string, 1);
      if (photos.length > 0) {
        return photos[0];
      }
    }
  }

  return null;
}

// Helper function to trigger download tracking (required by Unsplash API)
export async function trackPhotoDownload(
  downloadLocation: string
): Promise<void> {
  if (!ACCESS_KEY || !downloadLocation) return;

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });
  } catch (error) {
    console.error('Error tracking photo download:', error);
  }
}

// Helper function to generate attribution text
export function getPhotoAttribution(photo: UnsplashPhoto): {
  text: string;
  photographerUrl: string;
  unsplashUrl: string;
} {
  return {
    text: `Photo by ${photo.user.name} on Unsplash`,
    photographerUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
  };
}
