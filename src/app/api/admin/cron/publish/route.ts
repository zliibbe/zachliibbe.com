import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPublications } from '@/lib/blog-storage';
import { revalidatePath } from 'next/cache';

// Vercel's IP ranges for cron jobs (for security)
const VERCEL_CRON_IPS = ['76.76.19.0/24', '76.223.126.0/24'];

function isValidCronRequest(request: NextRequest): boolean {
  // Check for Vercel cron header (automatic cron jobs)
  const cronHeader = request.headers.get('x-vercel-cron');
  if (cronHeader) {
    // This is a legitimate Vercel cron job - no additional auth needed
    return true;
  }

  // For manual cron triggers, require the secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const providedSecret = request.headers.get('x-cron-secret');
    if (providedSecret === cronSecret) {
      return true;
    }

    // Also support Authorization: Bearer <CRON_SECRET>
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length).trim();
      if (token === cronSecret) {
        return true;
      }
    }
  }

  // Neither automatic cron header nor valid secret found
  return false;
}

function isValidDomain(host: string | null): boolean {
  if (!host) return false;

  // Accept both zachliibbe.com and www.zachliibbe.com
  const allowedDomains = [
    'zachliibbe.com',
    'www.zachliibbe.com',
    'localhost:3000', // for local development
  ];

  return allowedDomains.includes(host);
}

export async function POST(request: NextRequest) {
  try {
    // Log request details for debugging
    const host = request.headers.get('host');
    const userAgent = request.headers.get('user-agent');
    const cronHeader = request.headers.get('x-vercel-cron');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cronSecret = request.headers.get('x-cron-secret');

    const isAutomaticCron = !!cronHeader;
    const isManualTrigger = !!cronSecret;

    console.log('Cron request details:', {
      host,
      userAgent,
      cronHeader,
      forwarded,
      realIP,
      url: request.url,
      requestType: isAutomaticCron
        ? 'AUTOMATIC_VERCEL_CRON'
        : isManualTrigger
          ? 'MANUAL_TRIGGER'
          : 'UNKNOWN',
      hasCronSecret: !!cronSecret,
      timestamp: new Date().toISOString(),
    });

    // Validate domain (accept both zachliibbe.com and www.zachliibbe.com)
    if (!isValidDomain(host)) {
      console.warn('Invalid domain for cron request', {
        host,
        expectedDomains: ['zachliibbe.com', 'www.zachliibbe.com'],
      });
    }

    // Validate this is a legitimate cron request
    if (!isValidCronRequest(request)) {
      console.warn('Unauthorized cron request attempt', {
        host,
        cronHeader: !!cronHeader,
        hasSecret: !!process.env.CRON_SECRET,
        providedSecret: !!cronSecret,
        requestType: isAutomaticCron
          ? 'AUTOMATIC_VERCEL_CRON'
          : 'MANUAL_OR_UNAUTHORIZED',
      });
      return NextResponse.json(
        { error: 'Unauthorized cron request' },
        { status: 401 }
      );
    }

    const response = await runPublishingWorkflow();
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
    // If authorized (e.g., from Vercel Cron via GET), run the publishing workflow
    if (isValidCronRequest(request)) {
      const response = await runPublishingWorkflow();
      return NextResponse.json(response);
    }

    // Otherwise, basic health check
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

async function runPublishingWorkflow() {
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

  return response;
}
