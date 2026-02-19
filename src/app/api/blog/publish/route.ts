import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPostBySlug, updateBlogPost } from '@/lib/blog-storage';

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
    console.log('CSRF Headers (PUBLISH):', { origin, referer, host });

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
      console.error('CSRF validation failed (PUBLISH):', {
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

    console.log('CSRF validation passed (PUBLISH):', { origin, referer });

    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required field: slug' },
        { status: 400 }
      );
    }

    // Check if post exists and what status it has
    const existingPost = await getPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    if (existingPost.status === 'published') {
      return NextResponse.json(
        { error: 'Blog post is already published' },
        { status: 400 }
      );
    }

    // Publish the post (works for both draft and scheduled posts)
    const publishedPost = await updateBlogPost(slug, {
      status: 'published',
      publishedAt: new Date().toISOString().split('T')[0],
    });

    if (!publishedPost) {
      return NextResponse.json(
        { error: 'Failed to publish blog post' },
        { status: 500 }
      );
    }

    // Clear relevant caches
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/api/feed/rss');

    console.log(`Successfully published post: ${publishedPost.title}`);

    return NextResponse.json({
      success: true,
      message: 'Blog post published successfully',
      post: {
        slug: publishedPost.slug,
        title: publishedPost.title,
        status: publishedPost.status,
        publishedAt: publishedPost.publishedAt,
      },
    });
  } catch (error) {
    console.error('Error publishing blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
