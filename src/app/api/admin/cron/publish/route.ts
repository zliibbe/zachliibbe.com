import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { processScheduledPublications } from '@/lib/blog-storage';

// No IP allowlist: Vercel IPs can change. Use secret-based auth only.

function isValidCronRequest(request: NextRequest): boolean {
  // Require CRON_SECRET via either header form
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const providedSecret = request.headers.get('x-cron-secret');
  if (providedSecret === cronSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length).trim();
    if (token === cronSecret) {
      return true;
    }
  }

  return false;
}

// No domain validation: rely on secret-based auth only.

export async function POST(request: NextRequest) {
  try {
    // Log request details for debugging
    const host = request.headers.get('host');
    const userAgent = request.headers.get('user-agent');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const hasAuthHeader = !!request.headers.get('authorization');
    const hasCronSecretHeader = !!request.headers.get('x-cron-secret');

    console.log('Cron request details:', {
      host,
      userAgent,
      forwarded,
      realIP,
      url: request.url,
      hasAuthHeader,
      hasCronSecretHeader,
      timestamp: new Date().toISOString(),
    });

    // Validate this is a legitimate cron request
    if (!isValidCronRequest(request)) {
      console.warn('Unauthorized cron request attempt', {
        host,
        hasSecret: !!process.env.CRON_SECRET,
        hasAuthHeader,
        hasCronSecretHeader,
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
