import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getPostBySlug,
  updateBlogPost,
  deleteBlogPost,
} from '@/lib/blog-storage';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
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
    console.log('CSRF Headers (PUT):', { origin, referer, host });

    if (!origin || !referer || !host) {
      console.error('Missing CSRF headers:', { origin, referer, host });
      return NextResponse.json(
        { error: 'Missing required headers for CSRF protection' },
        { status: 400 }
      );
    }

    // Verify the request is coming from our domain (allow localhost for development)
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
      console.error('CSRF validation failed (PUT):', {
        origin,
        referer,
        host,
        allowedOrigins,
        originMatch: allowedOrigins.map(ao => ({ [ao]: origin === ao })),
        refererMatch: allowedOrigins.map(ao => ({
          [ao]: referer.startsWith(ao),
        })),
      });
      return NextResponse.json(
        { error: 'Invalid request origin for CSRF protection' },
        { status: 403 }
      );
    }

    console.log('CSRF validation passed (PUT):', { origin, referer });

    const { slug } = params;
    const body = await request.json();

    const updatedPost = await updateBlogPost(slug, {
      title: body.title,
      content: body.content, // markdown content
      excerpt: body.excerpt,
      categories: body.categories,
      tags: body.tags,
      series: body.series,
      status: body.status,
      scheduledFor: body.scheduledFor,
    });

    if (!updatedPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Blog post updated',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error updating blog post:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      slug: params.slug,
      timestamp: new Date().toISOString(),
    });

    // Return more specific error in development
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error:
          isDev && error instanceof Error
            ? `Internal server error: ${error.message}`
            : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
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
    console.log('CSRF Headers (DELETE):', { origin, referer, host });

    if (!origin || !referer || !host) {
      console.error('Missing CSRF headers:', { origin, referer, host });
      return NextResponse.json(
        { error: 'Missing required headers for CSRF protection' },
        { status: 400 }
      );
    }

    // Verify the request is coming from our domain (allow localhost for development)
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
      console.error('CSRF validation failed (DELETE):', {
        origin,
        referer,
        host,
        allowedOrigins,
        originMatch: allowedOrigins.map(ao => ({ [ao]: origin === ao })),
        refererMatch: allowedOrigins.map(ao => ({
          [ao]: referer.startsWith(ao),
        })),
      });
      return NextResponse.json(
        { error: 'Invalid request origin for CSRF protection' },
        { status: 403 }
      );
    }

    console.log('CSRF validation passed (DELETE):', { origin, referer });

    const { slug } = params;
    const success = await deleteBlogPost(slug);

    if (!success) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Blog post deleted',
      slug,
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
