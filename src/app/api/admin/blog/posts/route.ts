import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAllPostsWithImagesForAdmin } from '@/lib/blog-with-images';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all posts with images for admin interface
    const posts = await getAllPostsWithImagesForAdmin();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts for admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
