---
title: 'The Live Feed Nightmare: Coordinating Multiple External APIs in Real-Time'
author: 'Zach Liibbe'
publishedAt: ''
status: 'draft'
categories: ['Development', 'Learning']
tags:
  [
    'api-integration',
    'strava',
    'goodreads',
    'real-time',
    'performance',
    'error-handling',
  ]
series: 'Learning in Public'
excerpt: 'Building a live feed that combines Strava activities, Goodreads books, and audiobooks taught me everything about API coordination, graceful degradation, and the art of managing multiple external dependencies that hate each other.'
readTime: '13 min read'
---

# The Live Feed Nightmare: Coordinating Multiple External APIs in Real-Time

"How hard could it be to show my recent activities and reading progress on one page?"

Famous last words. What started as a simple "live feed" feature turned into a masterclass in API coordination, error handling, and the dark art of making multiple external services play nicely together.

Here's the story of building my live feed page, the technical challenges that nearly broke me, and the lessons learned from orchestrating APIs that seem designed to frustrate developers.

## The Vision: A Personal Activity Dashboard

I wanted a single page that showed:

- **Recent Strava activities** (runs, bikes, hikes)
- **Currently reading books** from Goodreads
- **Recent audiobooks** with progress tracking
- All updating in real-time with smooth loading states

Simple, right? Each API would provide its data, I'd combine them, and voilà—a beautiful live feed.

Reality had other plans.

## The API Personality Disorder

Each external service had its own... quirks:

**Strava**: Generally reliable, but OAuth tokens expire every 6 hours. Rate limited. Returns 200+ activities in a single call, which sounds great until you realize that's 2MB of JSON.

**Goodreads**: Where do I even start? Sometimes returns XML. Sometimes returns HTML error pages. Sometimes times out. The RSS feeds have different structures for different shelves. Progress tracking is buried in a separate updates feed that uses a completely different format.

**Unsplash** (for book covers): Super reliable API, but their free tier has strict rate limits, and book cover images from Goodreads are often broken links.

Each API failure mode was unique and spectacular in its own way.

## The First Attempt: Naive Parallel Fetching

My initial approach was embarrassingly optimistic:

```typescript
export default function LiveFeedPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [books, setBooks] = useState([]);
  const [audiobooks, setAudiobooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch everything at once!
        const [activitiesRes, booksRes, audiobooksRes] = await Promise.all([
          fetch('/api/strava/activities'),
          fetch('/api/goodreads/currently-reading'),
          fetch('/api/goodreads/audiobooks'),
        ]);

        setActivities(await activitiesRes.json());
        setBooks(await booksRes.json());
        setAudiobooks(await audiobooksRes.json());
      } catch (error) {
        // TODO: Handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Render everything */}
    </div>
  );
}
```

This worked exactly once in development. In production, it was a disaster.

Problems with this approach:

- If any API failed, the entire page failed
- Loading states were all-or-nothing
- No way to show partial data
- Terrible user experience during outages

## The Reality Check: Independent Loading States

I learned the hard way that each data source needed its own loading state, error handling, and fallback strategy:

```typescript
export default function LiveFeedPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const [booksLoading, setBooksLoading] = useState(true);
  const [audiobooksLoading, setAudiobooksLoading] = useState(true);

  useEffect(() => {
    // Fetch activities independently
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/strava/activities?days=365', {
          cache: 'no-store', // Always fresh for live feed
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.status}`);
        }

        const data = await response.json();
        setActivities(data);
      } catch (err: unknown) {
        setActivitiesError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div>
      <section>
        <h2>Activities</h2>
        {activitiesLoading && <p>Loading activities...</p>}
        {activitiesError && <p>Error: {activitiesError}</p>}
        {!activitiesLoading && !activitiesError && activities.length > 0 && (
          <ActivityGrid activities={activities} />
        )}
      </section>

      {/* Separate sections for books and audiobooks */}
    </div>
  );
}
```

Now each section could load independently. If Strava was down, users could still see my reading progress.

## The Strava Challenge: Too Much Data

Strava's API returns incredibly detailed activity data. Each activity includes GPS coordinates, heart rate data, power metrics, weather conditions, and more. For a year's worth of activities, this quickly becomes massive.

Here's what a single activity object looks like:

```typescript
interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  elapsed_time: number;
  moving_time: number;
  total_elevation_gain?: number;
  start_date: string;
  map?: {
    summary_polyline: string;
  };
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kudos_count?: number;
  // ... and 50+ more fields
}
```

Loading 200+ activities with full detail was crushing my page performance. I needed to be smarter about data fetching.

## Solution: Intelligent Data Filtering

I modified the API to only fetch what the UI actually needed:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const activities = await getStravaActivities();

    // Filter to requested timeframe
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentActivities = activities
      .filter(activity => new Date(activity.start_date) >= cutoffDate)
      .slice(0, 100) // Reasonable limit
      .map(activity => ({
        // Only include fields the UI needs
        id: activity.id,
        name: activity.name,
        type: activity.type,
        distance: activity.distance,
        elapsed_time: activity.elapsed_time,
        moving_time: activity.moving_time,
        total_elevation_gain: activity.total_elevation_gain,
        start_date: activity.start_date,
      }));

    return NextResponse.json(recentActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
```

This reduced payload size by 80% and made the page much more responsive.

## The Goodreads XML Horror Show

Goodreads deserves special mention because their API taught me that XML parsing in 2025 is still a nightmare. Their RSS feeds are... creative:

```xml
<!-- Sometimes you get this -->
<item>
  <title>Book Title</title>
  <author_name>Author Name</author_name>
  <book_large_image_url>http://image.url</book_large_image_url>
  <user_rating>5</user_rating>
</item>

<!-- Sometimes you get this -->
<item>
  <title>Book Title</title>
  <description><![CDATA[
    <img src="http://different.image.url" />
    Author: Author Name<br/>
    Rating: 4/5 stars
  ]]></description>
</item>

<!-- Sometimes you get this -->
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>Something went wrong</body>
</html>
```

My XML parsing became increasingly defensive:

```typescript
export async function parseGoodreadsRSS(xml: string) {
  // First, check if it's actually XML
  if (
    xml.trim().startsWith('<!DOCTYPE html>') ||
    xml.trim().startsWith('<html')
  ) {
    throw new Error('Goodreads returned HTML instead of RSS feed');
  }

  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
  });

  const result = xmlParser.parse(xml);

  if (!result.rss?.channel?.item) {
    throw new Error('Invalid RSS structure');
  }

  // Goodreads returns single item as object, multiple items as array
  const items = Array.isArray(result.rss.channel.item)
    ? result.rss.channel.item
    : [result.rss.channel.item];

  return items.map(item => {
    // Extract title with fallbacks
    const title = item.title || 'Unknown Title';

    // Extract author from multiple possible locations
    let author = item.author_name || 'Unknown Author';
    if (!author && item.description) {
      const authorMatch = item.description.match(/Author:\s*([^<\n]+)/);
      if (authorMatch) {
        author = authorMatch[1].trim();
      }
    }

    // Extract image with multiple fallbacks
    let coverImg = null;
    if (item.book_large_image_url) {
      coverImg = item.book_large_image_url;
    } else if (item.book_medium_image_url) {
      coverImg = item.book_medium_image_url;
    } else if (item.description) {
      const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch) {
        coverImg = imgMatch[1];
      }
    }

    return {
      title: decodeHtmlEntities(title),
      author: decodeHtmlEntities(author),
      coverImg,
      rating: item.user_rating ? parseFloat(item.user_rating) : null,
    };
  });
}
```

## Performance Optimization: The Activity Grid Challenge

The activity grid was my biggest performance challenge. Rendering 100+ activity cards with images, maps, and detailed information was causing serious lag.

My first optimization was virtualization:

```typescript
// Only render visible activities
const ActivityGrid = ({ activities }: { activities: StravaActivity[] }) => {
  const [visibleActivities, setVisibleActivities] = useState(activities.slice(0, 20));
  const [hasMore, setHasMore] = useState(activities.length > 20);

  const loadMore = useCallback(() => {
    const currentLength = visibleActivities.length;
    const nextActivities = activities.slice(currentLength, currentLength + 20);

    setVisibleActivities(prev => [...prev, ...nextActivities]);
    setHasMore(currentLength + 20 < activities.length);
  }, [activities, visibleActivities.length]);

  return (
    <div className={styles.grid}>
      {visibleActivities.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}

      {hasMore && (
        <button onClick={loadMore} className={styles.loadMore}>
          Load More Activities
        </button>
      )}
    </div>
  );
};
```

Second optimization was image lazy loading:

```typescript
const ActivityCard = ({ activity }: { activity: StravaActivity }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        {!imageLoaded && <div className={styles.imagePlaceholder} />}
        <img
          src={`/api/utils/image-proxy?url=${encodeURIComponent(activity.map?.summary_polyline || '')}`}
          alt={`Map for ${activity.name}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
      </div>

      <div className={styles.content}>
        <h3>{activity.name}</h3>
        <p>{formatDistance(activity.distance)} • {formatDuration(activity.elapsed_time)}</p>
      </div>
    </div>
  );
};
```

## Error Boundaries: When Everything Goes Wrong

Each section needed its own error boundary to prevent cascading failures:

```typescript
const ActivitySection = () => {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/strava/activities?days=365');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setActivities(data);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className={styles.section}>
        <h2>Activities</h2>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <h2>Activities</h2>
        <div className={styles.error}>
          <p>Unable to load activities: {error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h2>Activities</h2>
      <ActivityGrid activities={activities} />
    </div>
  );
};
```

## Real-Time Updates: The Polling Strategy

Users expected the "live" feed to actually be live. I implemented intelligent polling:

```typescript
const useLiveData = <T>(
  fetcher: () => Promise<T>,
  initialData: T,
  intervalMs: number = 300000 // 5 minutes default
) => {
  const [data, setData] = useState<T>(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const updateData = async () => {
      try {
        const newData = await fetcher();
        setData(newData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to update live data:', error);
      }
    };

    // Update immediately on mount
    updateData();

    // Set up polling interval
    const interval = setInterval(updateData, intervalMs);

    return () => clearInterval(interval);
  }, [fetcher, intervalMs]);

  return { data, lastUpdated };
};

// Usage
const { data: activities, lastUpdated } = useLiveData(
  () => fetch('/api/strava/activities').then(r => r.json()),
  [],
  300000 // Update every 5 minutes
);
```

## Mobile Responsiveness: The Grid Nightmare

The activity grid looked great on desktop but was a disaster on mobile. I needed responsive grids that worked across different screen sizes:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.5rem;
  }
}

.card {
  background: var(--background-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}
```

## Performance Results and Lessons

After optimizing the live feed:

- **Initial load time**: 2.3s → 800ms
- **Time to interactive**: 4.1s → 1.2s
- **Error recovery**: Graceful degradation instead of white screen
- **Mobile performance**: 60fps scrolling on most devices

## Key Lessons Learned

1. **Independent failure domains**: Each data source should fail independently
2. **Progressive loading**: Show what you can, when you can
3. **Defensive parsing**: Assume external APIs will return garbage
4. **Performance budgets**: Limit data fetching to what the UI actually needs
5. **Error boundaries everywhere**: Failures should be contained and recoverable

## What I'd Do Differently

Looking back, I would:

- **Implement service workers** for better offline experience
- **Add retry logic with exponential backoff** for failed requests
- **Use React Query** for more sophisticated caching and synchronization
- **Implement proper loading skeletons** instead of generic spinners

## The Bigger Picture

Building a live feed taught me that **real-time web applications are fundamentally about managing uncertainty**. External APIs will fail. Networks will be slow. Users will have poor connections.

The goal isn't to prevent these problems—it's to design systems that work gracefully despite them.

The complete live feed implementation is available in my [GitHub repository](https://github.com/zliibbe/zachliibbe.com), and you can see it in action at [zachliibbe.com/live-feed](https://zachliibbe.com/live-feed).

---

_Building real-time features means embracing chaos and designing for failure. Want to see more stories about coordinating external APIs? Follow my journey as I share the real challenges of building resilient data integrations._
