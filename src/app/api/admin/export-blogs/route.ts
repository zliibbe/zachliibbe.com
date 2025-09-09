import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllDrafts, getAllScheduledPosts, getAllPublishedPosts } from '@/lib/blog-storage';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all posts from current environment (production KV or local files)
    const drafts = await getAllDrafts();
    const scheduled = await getAllScheduledPosts();
    const published = await getAllPublishedPosts();

    console.log('Export data:', {
      drafts: drafts.length,
      scheduled: scheduled.length,
      published: published.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        drafts,
        scheduled,
        published,
      },
      counts: {
        drafts: drafts.length,
        scheduled: scheduled.length,
        published: published.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error exporting blog data:', error);
    return NextResponse.json(
      {
        error: 'Failed to export blog data',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Write operation not allowed in production' },
        { status: 403 }
      );
    }

    // Get all posts from current environment
    const drafts = await getAllDrafts();
    const scheduled = await getAllScheduledPosts();
    const published = await getAllPublishedPosts();

    // Write to local JSON files
    const blogDataDir = path.join(process.cwd(), 'src', 'content', 'blog-data');
    
    // Ensure directory exists
    if (!fs.existsSync(blogDataDir)) {
      fs.mkdirSync(blogDataDir, { recursive: true });
    }

    // Write each file
    fs.writeFileSync(
      path.join(blogDataDir, 'drafts.json'),
      JSON.stringify(drafts, null, 2)
    );
    fs.writeFileSync(
      path.join(blogDataDir, 'scheduled.json'),
      JSON.stringify(scheduled, null, 2)
    );
    fs.writeFileSync(
      path.join(blogDataDir, 'published.json'),
      JSON.stringify(published, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: 'Blog data exported to local files',
      counts: {
        drafts: drafts.length,
        scheduled: scheduled.length,
        published: published.length,
      },
      files: [
        'src/content/blog-data/drafts.json',
        'src/content/blog-data/scheduled.json',
        'src/content/blog-data/published.json',
      ],
    });
  } catch (error) {
    console.error('Error writing blog data:', error);
    return NextResponse.json(
      {
        error: 'Failed to write blog data',
        details: String(error),
      },
      { status: 500 }
    );
  }
}