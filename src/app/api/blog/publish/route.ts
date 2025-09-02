import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  publishDraft,
  getPostBySlug,
  updateBlogPost,
} from '@/lib/blog-storage';
import { revalidatePath } from 'next/cache';

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

    if (!origin || !referer || !host) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Verify the request is coming from our domain (allow localhost for development)
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');

    // Allow both with and without www for production
    const allowedOrigins = isLocalhost
      ? [`http://${host}`]
      : [
          `https://${host}`,
          `https://www.${host.replace('www.', '')}`,
          `https://${host.replace('www.', '')}`,
        ];

    const isValidOrigin = allowedOrigins.some(
      allowedOrigin =>
        origin === allowedOrigin && referer.startsWith(allowedOrigin)
    );

    if (!isValidOrigin) {
      console.error('CORS validation failed:', {
        origin,
        referer,
        host,
        allowedOrigins,
      });
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required field: slug' },
        { status: 400 }
      );
    }

    // Check if post exists and what status it has
    const existingPost = getPostBySlug(slug);
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
    const publishedPost = updateBlogPost(slug, {
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
