import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPublications } from '@/lib/blog-storage';
import { revalidatePath } from 'next/cache';

// Vercel's IP ranges for cron jobs (for security)
const VERCEL_CRON_IPS = ['76.76.19.0/24', '76.223.126.0/24'];

function isValidCronRequest(request: NextRequest): boolean {
  // Check for Vercel cron header
  const cronHeader = request.headers.get('x-vercel-cron');
  if (!cronHeader) {
    return false;
  }

  // Optional: Check for custom cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const providedSecret = request.headers.get('x-cron-secret');
    if (providedSecret !== cronSecret) {
      return false;
    }
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Log request details for debugging
    const host = request.headers.get('host');
    const userAgent = request.headers.get('user-agent');
    const cronHeader = request.headers.get('x-vercel-cron');
    
    console.log('Cron request details:', {
      host,
      userAgent,
      cronHeader,
      url: request.url,
      timestamp: new Date().toISOString()
    });

    // Validate this is a legitimate cron request
    if (!isValidCronRequest(request)) {
      console.warn('Unauthorized cron request attempt', {
        host,
        cronHeader,
        hasSecret: !!process.env.CRON_SECRET
      });
      return NextResponse.json(
        { error: 'Unauthorized cron request' },
        { status: 401 }
      );
    }

    console.log('Starting automated blog post publishing check...');

    // Process all scheduled publications
    const result = await processScheduledPublications();

    // Clear caches for updated blog content
    if (result.published.length > 0) {
      // Revalidate blog pages
      revalidatePath('/blog');
      revalidatePath('/api/feed/rss');

      // Revalidate individual post pages
      for (const post of result.published) {
        revalidatePath(`/blog/${post.slug}`);
      }

      console.log(`Successfully published ${result.published.length} posts`);
    }

    // Log any errors
    if (result.errors.length > 0) {
      console.error('Publishing errors:', result.errors);
    }

    const response = {
      success: true,
      publishedCount: result.published.length,
      published: result.published.map(post => ({
        slug: post.slug,
        title: post.title,
        publishedAt: post.publishedAt,
      })),
      errors: result.errors,
      timestamp: new Date().toISOString(),
    };

    console.log('Automated publishing complete:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in automated publishing:', error);

    return NextResponse.json(
      {
        error: 'Internal server error during automated publishing',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Basic health check - just verify the endpoint is working
    return NextResponse.json({
      status: 'healthy',
      message: 'Automated publishing cron endpoint is operational',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
