import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processScheduledPublications } from '@/lib/blog-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processScheduledPublications();

    if (result.published.length > 0) {
      revalidatePath('/blog');
      revalidatePath('/api/feed/rss');
      for (const post of result.published) {
        revalidatePath(`/blog/${post.slug}`);
      }
    }

    return NextResponse.json({
      success: true,
      publishedCount: result.published.length,
      published: result.published.map(post => ({
        slug: post.slug,
        title: post.title,
        publishedAt: post.publishedAt,
      })),
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in manual scheduled publishing trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
