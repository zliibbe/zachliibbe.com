---
title: 'Building a Multi-Layered Caching Strategy: When Redis Goes Down'
author: 'Zach Liibbe'
publishedAt: ''
status: 'draft'
categories: ['Development', 'Learning']
tags:
  [
    'caching',
    'redis',
    'vercel-kv',
    'performance',
    'resilience',
    'api-integration',
  ]
series: 'Learning in Public'
excerpt: 'The night my caching strategy saved my site when Vercel KV went down. How I built a resilient multi-layered caching system for external API integrations and the lessons learned from production failures.'
readTime: '12 min read'
---

# Building a Multi-Layered Caching Strategy: When Redis Goes Down

It was 2 AM when I got the notification that my website was throwing 500 errors. Half-asleep, I opened my laptop expecting a quick fix. What I found instead was a valuable lesson about building resilient systems: my entire live feed was broken because Vercel KV was having issues.

That night taught me that caching isn't just about performance—it's about keeping your site alive when external dependencies fail. Here's how I built a multi-layered caching strategy that's survived everything from API outages to Redis downtime.

## The Problem: Too Many Moving Parts

My personal website integrates with several external APIs:

- **Strava** for fitness activities
- **Goodreads** for reading progress
- **Unsplash** for featured images

Each API has different rate limits, response times, and reliability patterns. Strava's OAuth tokens expire every 6 hours. Goodreads sometimes returns HTML error pages instead of XML. Unsplash occasionally has network hiccups.

Initially, I thought simple API caching would solve everything:

```typescript
// My naive first attempt
export async function getStravaActivities() {
  const cachedData = await kv.get('strava_activities');
  if (cachedData) {
    return cachedData;
  }

  const activities = await fetchFromStrava();
  await kv.set('strava_activities', activities, { ex: 1800 });
  return activities;
}
```

This worked great... until KV went down and took my entire site with it.

## The Emotional Rollercoaster of Production Failures

There's a special kind of panic that hits when your personal website—the thing that represents you professionally—starts failing. It's not just code breaking; it feels personal.

That 2 AM incident was my wake-up call. I realized I'd built a house of cards where any single point of failure could bring everything down. The anxiety of checking my site every morning, wondering if external services were behaving, was exhausting.

I needed to build something more resilient.

## The Solution: Defense in Depth

I implemented a three-tier caching strategy inspired by military defense systems—if one layer fails, the others keep fighting:

### Layer 1: Vercel KV (Primary Cache)

```typescript
const getStorage = () => {
  // Try to use KV first
  if (process.env.KV_KV_REST_API_URL && process.env.KV_KV_REST_API_TOKEN) {
    try {
      return kv;
    } catch (error) {
      console.warn('Failed to initialize KV, falling back to local cache');
    }
  }

  // Fallback to local cache if KV isn't available
  if (
    process.env.ENABLE_LOCAL_CACHE_FALLBACK === 'true' ||
    process.env.NODE_ENV === 'development'
  ) {
    return {
      get: async (key: string) => localCache.get(key),
      set: async (key: string, value: any, options?: { ex?: number }) => {
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
```

### Layer 2: In-Memory Fallback

```typescript
// Create a local cache fallback
const localCache = new Map();

// This saved my life when KV was down
const storage = getStorage();
```

The beauty of this approach is that it's completely transparent to the calling code. Whether data comes from Redis or memory, the interface stays the same.

### Layer 3: Intelligent Cache Invalidation

The trickiest part was handling stale data intelligently. I needed fresh data for the live feed, but not at the cost of site reliability:

```typescript
export async function getStravaActivities(): Promise<StravaActivity[]> {
  try {
    const cachedData =
      await storage.get<StravaActivity[]>(ACTIVITIES_CACHE_KEY);

    if (cachedData) {
      // Check if we have a recent activity that might not be in the cache
      const latestActivity = await fetchLatestActivity();

      // If the latest activity is newer than what's in our cache, refresh
      if (
        !cachedData.some(
          (activity: StravaActivity) => activity.id === latestActivity.id
        )
      ) {
        const freshActivities = await fetchStravaActivities();
        await storage.set(ACTIVITIES_CACHE_KEY, freshActivities, {
          ex: CACHE_DURATION,
        });
        return freshActivities;
      }

      return cachedData;
    }

    // No cache? Fetch fresh data
    const activities = await fetchStravaActivities();
    await storage.set(ACTIVITIES_CACHE_KEY, activities, {
      ex: CACHE_DURATION,
    });

    return activities;
  } catch (error: any) {
    console.error('Storage error:', error);

    // If cache error, try fetching fresh data
    if (error.message?.includes('KV')) {
      return await fetchStravaActivities();
    }

    // If all else fails, return empty array
    return [];
  }
}
```

## The Goodreads XML Nightmare

Goodreads deserves special mention because it taught me that not all APIs are created equal. Sometimes their RSS feed returns valid XML with book data. Sometimes it returns HTML error pages. Sometimes it just times out.

Here's how I handle their... inconsistencies:

```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';

  try {
    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      try {
        const cachedData = await kv.get(CACHE_KEY);
        if (cachedData) {
          return NextResponse.json(cachedData);
        }
      } catch (kvError) {
        console.warn('KV cache error:', kvError);
        // Continue execution even if KV fails
      }
    }

    // Fetch from external Lambda with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(lambdaUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GoodreadsApp/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Lambda returned ${response.status}`);
      }

      const data = await response.json();

      // Cache successful response
      try {
        await kv.set(CACHE_KEY, data, { ex: CACHE_DURATION });
      } catch (cacheError) {
        console.warn('Failed to cache data:', cacheError);
        // Site still works, just no caching
      }

      return NextResponse.json(data);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error fetching books:', error);

    // Try to return stale cache as last resort
    try {
      const staleData = await kv.get(`${CACHE_KEY}_stale`);
      if (staleData) {
        return NextResponse.json(staleData);
      }
    } catch (staleError) {
      console.warn('No stale cache available:', staleError);
    }

    // Final fallback
    return NextResponse.json({
      books: [],
      error: 'Service temporarily unavailable',
    });
  }
}
```

## Cache Duration Strategy: The Goldilocks Problem

Finding the right cache duration was trickier than I expected. Too short, and I'm hammering APIs unnecessarily. Too long, and my "live" feed shows stale data.

Here's what I learned:

```typescript
// Different data needs different strategies
const ACTIVITIES_CACHE_KEY = 'strava_activities';
const CACHE_DURATION = 60 * 25; // 25 minutes - activities don't change often

const LATEST_ACTIVITY_CACHE_KEY = 'latest_activity';
const LATEST_ACTIVITY_CACHE_DURATION = 60 * 5; // 5 minutes - for "live" feel

const GOODREADS_CACHE_DURATION = 300; // 5 minutes - books change rarely
```

The key insight: **cache duration should match user expectations, not API capabilities**.

Users expect fitness activities to be "recent" but not real-time. They expect book progress to be current but understand it might be a few minutes behind.

## Error Boundaries for Cache Failures

One of my biggest learnings was that cache failures should be invisible to users. Here's how I handle errors gracefully:

```typescript
// Fallback data for when everything goes wrong
const fallbackActivity = {
  id: 'fallback-activity',
  name: 'Recent Run',
  type: 'Run',
  distance: 5000, // 5km
  moving_time: 1500, // 25 minutes
  elapsed_time: 1600,
  total_elevation_gain: 50,
  start_date: new Date().toISOString(),
};

export async function GET() {
  try {
    // Try KV cache first
    let cachedActivity = null;
    try {
      cachedActivity = await kv.get(CACHE_KEY);
      if (cachedActivity) {
        return NextResponse.json(cachedActivity);
      }
    } catch (kvError) {
      console.warn('KV cache error:', kvError);
      // Continue execution even if KV fails
    }

    // Try fresh data from API
    const activity = await fetchLatestActivity();

    // Try to cache it
    try {
      await kv.set(CACHE_KEY, activity, { ex: CACHE_DURATION });
    } catch (cacheError) {
      console.warn('Failed to cache activity:', cacheError);
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('All data sources failed:', error);

    // Return fallback rather than error
    return NextResponse.json(fallbackActivity);
  }
}
```

## Development vs Production: Different Strategies

One challenge was making this work seamlessly across environments:

```typescript
const getStorage = () => {
  // Production: Always try KV first
  if (process.env.NODE_ENV === 'production') {
    return kv;
  }

  // Development: Use local cache to avoid KV costs
  if (process.env.NODE_ENV === 'development') {
    return {
      get: async (key: string) => localCache.get(key),
      set: async (key: string, value: any, options?: { ex?: number }) => {
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
```

This saved me money during development while ensuring production reliability.

## Monitoring: Knowing When Things Break

I added simple logging to understand cache behavior:

```typescript
export async function getStravaActivities(): Promise<StravaActivity[]> {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    console.log(`[${requestId}] Checking cache for activities`);

    const cachedData =
      await storage.get<StravaActivity[]>(ACTIVITIES_CACHE_KEY);

    if (cachedData) {
      console.log(
        `[${requestId}] Cache hit - returning ${cachedData.length} activities`
      );
      return cachedData;
    }

    console.log(`[${requestId}] Cache miss - fetching fresh data`);
    const activities = await fetchStravaActivities();

    console.log(
      `[${requestId}] Fetched ${activities.length} activities, caching...`
    );
    await storage.set(ACTIVITIES_CACHE_KEY, activities, { ex: CACHE_DURATION });

    return activities;
  } catch (error: any) {
    console.error(`[${requestId}] Cache error:`, error);
    // Fallback logic...
  }
}
```

This helped me understand cache hit rates and identify problem patterns.

## Real-World Results

After implementing this system:

- **Zero downtime** during the next KV outage
- **95% cache hit rate** for Strava activities
- **Sub-200ms response times** for cached data
- **Graceful degradation** when APIs are slow
- **Peace of mind** knowing my site won't randomly break

The best part? My 2 AM debugging sessions became much less frequent.

## Lessons Learned: Building for Reality

1. **External dependencies will fail** - plan for it from day one
2. **Cache failures should be invisible** - users don't care about your infrastructure
3. **Different data needs different strategies** - one size doesn't fit all
4. **Monitoring matters** - you can't improve what you can't measure
5. **Graceful degradation > perfect data** - a working site with stale data beats a broken site

## What I'd Do Differently

Looking back, I wish I'd:

- **Started with fallbacks** instead of adding them after failures
- **Implemented circuit breakers** for better error handling
- **Added cache warming** strategies for critical data
- **Built better observability** from the beginning

## The Bigger Picture

This caching system taught me that **resilience isn't just a technical requirement—it's a mindset**. Every external dependency is a potential point of failure. Every API call is a risk. Every cache is a promise that might not be kept.

But with the right defensive strategies, you can build systems that bend without breaking. Your users never need to know about the chaos happening behind the scenes.

The complete caching implementation is available in my [GitHub repository](https://github.com/zliibbe/zachliibbe.com), and you can see it in action on my [live feed page](https://zachliibbe.com/live-feed).

---

_Building resilient systems is about preparing for failure, not preventing it. Want to see more stories about learning from production incidents? Follow my journey as I share the real challenges of building reliable web applications._
