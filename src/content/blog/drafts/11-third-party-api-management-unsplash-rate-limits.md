---
title: 'Third-Party API Nightmares: Managing Unsplash Rate Limits and API Keys'
author: 'Zach Liibbe'
publishedAt: ''
status: 'draft'
categories: ['Development', 'Learning']
tags:
  [
    'api-management',
    'rate-limiting',
    'unsplash',
    'third-party-apis',
    'environment-variables',
    'production-deployment',
  ]
series: 'Learning in Public'
excerpt: 'From demo to production API limits, managing API keys across environments, and building resilient integrations when third-party services have their own agenda. How I learned to work with APIs that don't always play nice.'
readTime: '12 min read'
---

# Third-Party API Nightmares: Managing Unsplash Rate Limits and API Keys

"Your application has exceeded its rate limit." Seven words that can ruin your day, especially when they appear in production with paying customers waiting. My integration with Unsplash's API taught me everything about rate limiting, API key management, and building systems that gracefully handle the unpredictable nature of third-party services.

Here's how I went from blowing through API limits in development to building a production-ready system that works within constraints I didn't know existed.

## The Innocent Beginning: "Just Add Some Images"

I wanted featured images for my blog posts, automatically sourced based on content categories and tags. Unsplash seemed perfect—millions of high-quality photos, a clean API, and generous free limits. What could go wrong?

My first implementation was embarrassingly naive:

```typescript
// This was a disaster waiting to happen
export async function getImageForPost(title: string) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${title}`,
    {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    }
  );

  const data = await response.json();
  return data.results[0]; // First result is good enough, right?
}

// Called this everywhere without thinking
const blogImage = await getImageForPost('Building APIs');
const aboutImage = await getImageForPost('Software Engineer');
const projectImage = await getImageForPost('Next.js Project');
```

During development, this worked perfectly. I was getting beautiful, relevant images for every piece of content. Then I deployed to production and learned about the real world.

## The Rude Awakening: Rate Limits Are Real

Within hours of launching, I hit my first rate limit. Unsplash's demo tier allows 50 requests per hour. My site was making image requests on:

- Every page load (no caching)
- Every preview in my admin panel
- Every time I tested content locally
- Every build during deployment (static generation)

I was burning through my monthly allowance in a single day.

## Understanding the API Landscape

I dove deep into Unsplash's documentation and discovered the complex reality of their API tiers:

```typescript
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

  // Demo vs production is determined by Unsplash approval
  // You can't just flip a switch—you need manual approval
  return 'demo'; // Assume demo until proven otherwise
}
```

Getting production access required:

1. **Application review** by Unsplash
2. **Detailed usage description** of how images would be used
3. **Attribution implementation** following their guidelines
4. **Wait time** of several weeks for approval

I needed a solution that worked immediately, not eventually.

## Building Rate Limit Awareness

My first step was making the application aware of its constraints:

```typescript
// Rate limit tracking (simple in-memory counter)
let requestCount = 0;
let resetTime = Date.now() + 3600000; // 1 hour from now

function getRemainingRequests() {
  const now = Date.now();

  // Reset counter if an hour has passed
  if (now >= resetTime) {
    requestCount = 0;
    resetTime = now + 3600000;
  }

  const mode = getUnsplashMode();
  const limit = UNSPLASH_LIMITS[mode.toUpperCase()].requests_per_hour;

  return {
    remaining: Math.max(0, limit - requestCount),
    mode,
    resetTime,
  };
}

function incrementRequestCount() {
  requestCount++;
}
```

This gave me visibility into my usage, but I needed to actually respect the limits.

## Smart Request Management

I rebuilt the image fetching with rate limit awareness:

```typescript
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
```

## Intelligent Caching Strategy

Rate limits made caching essential, not optional. I implemented multiple levels of caching:

```typescript
// 1. HTTP caching with Next.js
const response = await fetch(apiUrl, {
  next: { revalidate: 3600 }, // Cache for 1 hour
});

// 2. Application-level caching
const imageCache = new Map<string, UnsplashPhoto>();

export async function getCachedPhoto(
  query: string
): Promise<UnsplashPhoto | null> {
  // Check cache first
  if (imageCache.has(query)) {
    return imageCache.get(query)!;
  }

  // Only make API call if we have rate limit budget
  const { remaining } = getRemainingRequests();
  if (remaining <= 0) {
    return null; // Graceful fallback
  }

  const photos = await searchPhotos(query);
  if (photos.length > 0) {
    imageCache.set(query, photos[0]);
    return photos[0];
  }

  return null;
}

// 3. Persistent caching for production
import { kv } from '@vercel/kv';

export async function getPersistentlyCachedPhoto(
  query: string
): Promise<UnsplashPhoto | null> {
  try {
    // Check persistent cache first
    const cached = await kv.get(`unsplash:${query}`);
    if (cached) {
      return cached as UnsplashPhoto;
    }

    // Fall back to API if not cached
    const photo = await getCachedPhoto(query);
    if (photo) {
      // Cache for 24 hours
      await kv.set(`unsplash:${query}`, photo, { ex: 86400 });
    }

    return photo;
  } catch (error) {
    console.error('Cache error:', error);
    return await getCachedPhoto(query); // Direct API fallback
  }
}
```

## Smart Query Generation

I needed to be strategic about what searches I made, since each one counted against my limit:

```typescript
export async function getPhotoForBlogPost(
  categories: string[],
  tags: string[],
  title: string
): Promise<UnsplashPhoto | null> {
  // Try searches in order of specificity and likelihood of good results
  const searchQueries = [
    // Most specific: combine category and primary tag
    categories.length > 0 && tags.length > 0
      ? `${categories[0]} ${tags[0]}`
      : null,

    // Fallback to category
    categories.length > 0 ? categories[0] : null,

    // Fallback to primary tag
    tags.length > 0 ? tags[0] : null,

    // Last resort: extract key words from title
    extractKeywordsFromTitle(title),

    // Final fallback: generic tech image
    'technology computer',
  ].filter(Boolean);

  // Try each query until we get a result or run out of budget
  for (const query of searchQueries) {
    const { remaining } = getRemainingRequests();

    // Reserve at least 5 requests for critical functionality
    if (remaining <= 5) {
      console.warn('Rate limit budget low, skipping image search');
      break;
    }

    const photo = await getPersistentlyCachedPhoto(query!);
    if (photo) {
      return photo;
    }
  }

  return null; // No image found within rate limit budget
}

function extractKeywordsFromTitle(title: string): string {
  // Extract meaningful keywords from blog post titles
  const stopWords = [
    'the',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
  ];

  return title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 2) // Take only first 2 keywords
    .join(' ');
}
```

## Environment Variable Hell

Managing API keys across different environments became its own challenge:

```bash
# Development (.env.local)
UNSPLASH_ACCESS_KEY=demo_key_with_50_requests_per_hour

# Production (Vercel environment variables)
UNSPLASH_ACCESS_KEY=production_key_with_5000_requests_per_hour

# Testing (.env.test)
UNSPLASH_ACCESS_KEY=mock_key_for_testing
```

I needed to handle missing or invalid keys gracefully:

```typescript
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export function validateUnsplashConfig(): {
  isValid: boolean;
  mode: 'demo' | 'production' | 'unconfigured';
  message: string;
} {
  if (!ACCESS_KEY) {
    return {
      isValid: false,
      mode: 'unconfigured',
      message: 'Unsplash API key not configured',
    };
  }

  if (ACCESS_KEY.startsWith('demo_')) {
    return {
      isValid: true,
      mode: 'demo',
      message: 'Running in demo mode (50 requests/hour)',
    };
  }

  return {
    isValid: true,
    mode: 'production',
    message: 'Running in production mode (5000 requests/hour)',
  };
}

// Use in application startup
const config = validateUnsplashConfig();
if (!config.isValid) {
  console.warn(`Unsplash integration disabled: ${config.message}`);
}
```

## Admin Dashboard for Monitoring

I built an admin interface to monitor API usage in real-time:

```typescript
export default function UnsplashAdminPage() {
  const [status, setStatus] = useState<UnsplashStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/unsplash/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Unsplash status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Unsplash API Status</h1>

      <div className={styles.statusCard}>
        <h2>Current Mode</h2>
        <div
          className={styles.modeIndicator}
          style={{ backgroundColor: getModeColor(status?.mode) }}
        >
          {status?.mode?.toUpperCase() || 'UNKNOWN'}
        </div>
      </div>

      <div className={styles.statusCard}>
        <h2>Rate Limits</h2>
        <p>
          Requests remaining this hour:{' '}
          <strong>{status?.rateLimit.remaining}</strong> /{' '}
          {status?.rateLimit.limit}
        </p>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${(status?.rateLimit.remaining / status?.rateLimit.limit) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className={styles.statusCard}>
        <h2>Cache Statistics</h2>
        <p>Cache hit rate: <strong>{status?.cache.hitRate}%</strong></p>
        <p>Cached images: <strong>{status?.cache.totalImages}</strong></p>
      </div>
    </div>
  );
}
```

## Attribution Requirements

Unsplash requires proper attribution for all images. I needed to implement this correctly:

```typescript
interface UnsplashAttribution {
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
  downloadLocation: string; // Required for tracking
}

export function generateAttribution(photo: UnsplashPhoto): UnsplashAttribution {
  return {
    photographerName: photo.user.name,
    photographerUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
    downloadLocation: photo.links.download_location,
  };
}

// Track download for Unsplash analytics
export async function trackPhotoDownload(
  downloadLocation: string
): Promise<void> {
  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });
  } catch (error) {
    console.error('Failed to track photo download:', error);
    // Non-blocking error - don't fail the user experience
  }
}

// Attribution component
export function UnsplashAttribution({ photo }: { photo: UnsplashPhoto }) {
  const attribution = generateAttribution(photo);

  // Track download when image is displayed
  useEffect(() => {
    trackPhotoDownload(attribution.downloadLocation);
  }, [attribution.downloadLocation]);

  return (
    <div className={styles.attribution}>
      Photo by{' '}
      <a
        href={attribution.photographerUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {attribution.photographerName}
      </a>{' '}
      on{' '}
      <a href={attribution.unsplashUrl} target="_blank" rel="noopener noreferrer">
        Unsplash
      </a>
    </div>
  );
}
```

## Fallback Strategies

When API limits are exhausted or the service is down, I needed graceful fallbacks:

```typescript
// Fallback image sources
const FALLBACK_IMAGES = {
  development: '/images/fallback-development.jpg',
  technology: '/images/fallback-technology.jpg',
  personal: '/images/fallback-personal.jpg',
  default: '/images/fallback-default.jpg',
};

export async function getImageWithFallback(
  query: string,
  category: string = 'default'
): Promise<{ url: string; attribution?: UnsplashAttribution }> {
  try {
    // Try Unsplash first
    const photo = await getPersistentlyCachedPhoto(query);
    if (photo) {
      return {
        url: photo.urls.regular,
        attribution: generateAttribution(photo),
      };
    }
  } catch (error) {
    console.warn('Unsplash API failed, using fallback:', error);
  }

  // Fallback to local images
  const fallbackUrl =
    FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES] ||
    FALLBACK_IMAGES.default;

  return { url: fallbackUrl };
}
```

## Testing with Mock APIs

For development and testing, I created a mock Unsplash service:

```typescript
// Mock Unsplash service for development
export class MockUnsplashService {
  private mockPhotos: UnsplashPhoto[] = [
    {
      id: 'mock-1',
      urls: {
        regular: '/images/mock-photo-1.jpg',
        small: '/images/mock-photo-1-small.jpg',
      },
      user: {
        name: 'Mock Photographer',
        username: 'mock_user',
        links: { html: 'https://unsplash.com/@mock_user' },
      },
      links: {
        html: 'https://unsplash.com/photos/mock-1',
        download_location: 'https://api.unsplash.com/photos/mock-1/download',
      },
      alt_description: 'Mock photo for development',
      description: 'A beautiful mock photo',
      width: 1920,
      height: 1080,
    },
    // ... more mock photos
  ];

  async searchPhotos(query: string): Promise<UnsplashPhoto[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return relevant mock photo based on query
    return this.mockPhotos.filter(photo =>
      photo.alt_description?.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Use mock service in development
const unsplashService =
  process.env.NODE_ENV === 'development'
    ? new MockUnsplashService()
    : new RealUnsplashService();
```

## Real-World Results

After implementing comprehensive API management:

- **Zero rate limit violations** in production
- **95% cache hit rate** for image requests
- **Successful production approval** from Unsplash
- **Graceful degradation** during API outages
- **Clear monitoring** of API usage and costs

## Lessons Learned

1. **Read the fine print**: API limits aren't suggestions—they're hard walls
2. **Cache aggressively**: Third-party APIs are expensive and unreliable
3. **Plan for approval delays**: Production access takes time
4. **Monitor usage religiously**: You can't manage what you don't measure
5. **Build fallbacks from day one**: External services will fail
6. **Respect attribution requirements**: Legal compliance isn't optional

## What I'd Do Differently

Looking back, I would:

- **Start with rate limit awareness**: Build constraints into the design
- **Implement caching first**: Don't treat it as an optimization
- **Plan the approval process**: Start production applications early
- **Build better monitoring**: Real-time dashboards from the beginning

## The Bigger Picture

Managing third-party APIs taught me that **external dependencies are both powerful and dangerous**. They can transform your application's capabilities, but they can also bring it to its knees if not handled properly.

The key is building systems that assume failure, respect constraints, and degrade gracefully when the outside world doesn't cooperate.

The complete Unsplash integration is available in my [GitHub repository](https://github.com/zliibbe/zachliibbe.com), and you can see it in action throughout my [blog posts](https://zachliibbe.com/blog) with beautiful, properly attributed images.

---

_Third-party APIs are a relationship, not a tool. Want to see more stories about building resilient integrations? Follow my journey as I share the real challenges of depending on services you don't control._
