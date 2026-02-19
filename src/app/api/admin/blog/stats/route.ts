import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getAllDrafts,
  getAllPublishedPosts,
  getAllScheduledPosts,
} from '@/lib/blog-storage';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== 'zliibbe@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all blog posts
    const published = await getAllPublishedPosts();
    const drafts = await getAllDrafts();
    const scheduled = await getAllScheduledPosts();

    // Calculate stats
    const stats = {
      published: published.length,
      drafts: drafts.length,
      scheduled: scheduled.length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
