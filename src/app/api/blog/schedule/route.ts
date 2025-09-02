import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { schedulePost, getPostBySlug } from '@/lib/blog-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CSRF Protection
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Log headers for debugging in production
    console.log('CSRF Headers (SCHEDULE):', { origin, referer, host });

    if (!origin || !referer || !host) {
      console.error('Missing CSRF headers:', { origin, referer, host });
      return NextResponse.json(
        { error: 'Missing required headers for CSRF protection' },
        { status: 400 }
      );
    }

    // Handle both development (http://localhost:3000) and production (https://domain.com)
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');

    // More comprehensive origin validation for production
    const allowedOrigins = isLocalhost
      ? [`http://${host}`, `https://${host}`]
      : [
          `https://${host}`,
          `https://www.${host.replace('www.', '')}`,
          `https://${host.replace('www.', '')}`,
          // Handle edge cases for Vercel deployments
          ...(host.includes('vercel.app') ? [`https://${host}`] : []),
        ];

    const isValidOrigin = allowedOrigins.some(allowedOrigin => {
      const originMatch = origin === allowedOrigin;
      const refererMatch = referer.startsWith(allowedOrigin);
      return originMatch && refererMatch;
    });

    if (!isValidOrigin) {
      console.error('CSRF validation failed (SCHEDULE):', {
        origin,
        referer,
        host,
        allowedOrigins,
        originMatch: allowedOrigins.map(ao => ({ [ao]: origin === ao })),
        refererMatch: allowedOrigins.map(ao => ({ [ao]: referer.startsWith(ao) })),
      });
      return NextResponse.json(
        { error: 'Invalid request origin for CSRF protection' },
        { status: 403 }
      );
    }

    console.log('CSRF validation passed (SCHEDULE):', { origin, referer });

    const body = await request.json();
    const { slug, scheduledFor } = body;

    if (!slug || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, scheduledFor' },
        { status: 400 }
      );
    }

    // Validate that the post exists
    const existingPost = getPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Validate scheduled date format and future date
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid scheduledFor date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
        { status: 400 }
      );
    }

    // Schedule the post
    const scheduledPost = schedulePost(slug, scheduledFor);

    if (!scheduledPost) {
      return NextResponse.json(
        { error: 'Failed to schedule post. Post may already be published.' },
        { status: 400 }
      );
    }

    console.log(
      `Successfully scheduled post: ${scheduledPost.title} for ${scheduledFor}`
    );

    return NextResponse.json({
      success: true,
      message: 'Blog post scheduled successfully',
      post: {
        slug: scheduledPost.slug,
        title: scheduledPost.title,
        status: scheduledPost.status,
        scheduledFor: scheduledPost.scheduledFor,
      },
    });
  } catch (error) {
    console.error('Error scheduling blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
