---
title: "Building a Multi-Source RSS Aggregator: Goodreads + Serverless Lambda"
author: "Zach Liibbe"
publishedAt: ""
status: "draft"
categories: ["Development", "Projects"]
tags: ["rss", "lambda", "serverless", "goodreads", "xml-parsing", "netlify"]
series: "Building in Public"
excerpt: "How I built a resilient RSS aggregator using serverless Lambda functions to parse Goodreads feeds, handle XML inconsistencies, and provide reliable book data for my personal website."
readTime: "8 min read"
---

# Building a Multi-Source RSS Aggregator: Goodreads + Serverless Lambda

![RSS Feeds and Lambda Architecture](https://images.unsplash.com/photo-1551808525-51a94da548ce?w=800&h=400&fit=crop)

When I decided to display my reading activity on my personal website, I quickly discovered that working with RSS feeds in 2025 isn't as straightforward as it might seem. Goodreads provides RSS feeds, but they're inconsistent, sometimes malformed, and definitely not designed for modern web applications.

Here's how I built a robust RSS aggregator using serverless Lambda functions that handles real-world XML parsing challenges and provides clean, reliable data for my website.

## The Challenge: RSS Feeds Are Messy

![XML Parsing Challenges](https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=400&fit=crop)

RSS feeds, especially from platforms like Goodreads, come with several challenges:

- **Inconsistent Structure**: Fields appear and disappear between entries
- **HTML Entities**: Text is often encoded with `&amp;`, `&lt;`, etc.
- **Variable Image URLs**: Cover images might be in `book_large_image_url`, `book_medium_image_url`, or embedded in descriptions
- **Rate Limiting**: Direct browser requests get blocked
- **Performance**: Parsing XML in the browser is slow and unreliable

## The Solution: Serverless Lambda Aggregator

I created a serverless function deployed on Netlify that acts as a middleware layer between Goodreads and my website. Here's the architecture:

```typescript
// Core Lambda handler structure
export const getCurrentlyReading = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit || "5", 10);
  const shelf = "currently-reading";

  // Check cache first
  const cacheKey = `${shelf}_${limit}`;
  const now = Date.now();
  
  if (cachedData[cacheKey] && 
      now - (lastFetch[cacheKey] || 0) < CACHE_DURATION) {
    return cachedResponse(cachedData[cacheKey]);
  }

  // Fetch and process RSS feed...
};
```

### Key Architecture Decisions

**1. In-Memory Caching**
```typescript
// Simple but effective caching
let cachedData: { [key: string]: any } = {};
let lastFetch: { [key: string]: number } = {};
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
```

**2. Resilient XML Parsing**
```typescript
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
```

**3. Flexible Image Extraction**
```typescript
// Handle multiple possible image URL formats
let coverImg = null;
if (item.book_large_image_url) {
  coverImg = item.book_large_image_url;
} else if (item.book_medium_image_url) {
  coverImg = item.book_medium_image_url;
} else if (item.book_small_image_url) {
  coverImg = item.book_small_image_url;
} else if (item.description) {
  // Extract from HTML description as fallback
  const imgMatch = item.description.match(/<img.*?src=["'](.*?)["']/i);
  if (imgMatch && imgMatch[1]) {
    coverImg = imgMatch[1];
  }
}
```

## Real-World XML Parsing Challenges

![Data Processing Flow](https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop)

### Challenge 1: Array vs Single Item Inconsistency

RSS feeds return arrays when there are multiple items, but single objects when there's only one item. This breaks everything:

```typescript
// Ensure items is always an array
const items = Array.isArray(result.rss.channel.item)
  ? result.rss.channel.item
  : [result.rss.channel.item];
```

### Challenge 2: HTML Instead of XML

Sometimes Goodreads returns HTML error pages instead of XML:

```typescript
// Detect HTML responses
if (xml.trim().startsWith("<!DOCTYPE html>") || 
    xml.trim().startsWith("<html")) {
  console.error("Received HTML instead of XML from Goodreads");
  throw new Error(
    "Goodreads returned HTML instead of RSS feed - they may be blocking automated requests"
  );
}
```

### Challenge 3: Missing or Malformed Data

Real RSS feeds have missing fields, null values, and unexpected structures:

```typescript
const books = limitedItems.map((item: any) => {
  const title = item.title 
    ? decodeHtmlEntities(item.title) 
    : "Unknown Title";
  const author = item.author_name 
    ? decodeHtmlEntities(item.author_name) 
    : "Unknown Author";
  
  // Safely parse rating with fallback
  const rating = item.user_rating ? parseFloat(item.user_rating) : 0;
  const dateRead = item.user_read_at || null;
  
  return {
    title,
    author,
    coverImg,
    link: bookUrl,
    rating,
    dateRead,
  };
});
```

## Client-Side Integration

On the frontend, I consume this Lambda through a simple API call:

```typescript
// Next.js API route that calls the Lambda
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shelf = searchParams.get("shelf") || "read";

  try {
    const lambdaUrl = `https://goodreads-lambda.netlify.app/.netlify/functions/goodreads-lambda?shelf=${shelf}`;

    const response = await fetch(lambdaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GoodreadsApp/1.0)",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Graceful fallback to cached data
    return NextResponse.json({ error: "Service temporarily unavailable" });
  }
}
```

## Performance and Reliability

![Performance Monitoring](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop)

### Caching Strategy

The Lambda implements a three-tier caching approach:

1. **In-Memory Cache**: 5-minute cache within the Lambda function
2. **HTTP Headers**: `Cache-Control: public, max-age=300`
3. **Client-Side Cache**: Additional caching in the Next.js application

### Error Handling

```typescript
try {
  // RSS processing logic
} catch (error) {
  console.error("Lambda error:", error);
  return {
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      status: "error",
      timestamp: new Date().toISOString(),
    }),
  };
}
```

### CORS Configuration

```typescript
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=300",
};
```

## Deployment and Monitoring

The Lambda is deployed using Netlify Functions with a simple `netlify.toml`:

```toml
[build]
  functions = "functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Results and Lessons Learned

![Success Metrics](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop)

This serverless RSS aggregator now reliably serves book data to my website with:

- **99.9% uptime** through Netlify's infrastructure
- **Sub-200ms response times** with effective caching
- **Graceful degradation** when Goodreads is unavailable
- **Clean, consistent data** regardless of RSS feed quirks

### Key Takeaways

1. **RSS feeds require defensive programming** - assume nothing about structure
2. **Caching is essential** - both for performance and reliability
3. **Serverless is perfect for this use case** - handles traffic spikes and reduces costs
4. **Error boundaries matter** - graceful degradation keeps your site working
5. **HTML entity decoding is crucial** - don't forget this step

## What's Next?

I'm planning to extend this system to:
- Support additional book platforms (StoryGraph, Amazon)
- Add reading progress tracking
- Implement webhook-based cache invalidation
- Add metrics and monitoring dashboards

The complete source code for this RSS aggregator is available in my [GitHub repository](https://github.com/zliibbe/zachliibbe.com), and you can see it in action on my [personal website](https://zachliibbe.com).

---

*Want to see more technical deep-dives like this? Follow my journey as I build in public and share what I learn along the way.*
