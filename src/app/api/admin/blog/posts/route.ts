import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAllPosts } from '@/lib/blog-storage';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all posts directly from storage (includes stored featuredImage data)
    const posts = await getAllPosts();

    // Sort by creation/update date (most recent first)
    const sortedPosts = posts.sort((a, b) => {
      // Use publishedAt if available, otherwise use updatedAt, otherwise use id
      const dateA = a.publishedAt || a.updatedAt || a.id;
      const dateB = b.publishedAt || b.updatedAt || b.id;
      return dateB.localeCompare(dateA);
    });

    return NextResponse.json({ posts: sortedPosts });
  } catch (error) {
    console.error('Error fetching blog posts for admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
