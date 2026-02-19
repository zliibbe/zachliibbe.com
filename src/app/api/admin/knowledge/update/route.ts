import { promises as fs } from 'node:fs';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'src/data/knowledge');

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'zliibbe@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, content } = body;

    if (!filename || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      );
    }

    // Validate filename (only allow .md files and no path traversal)
    if (
      !filename.endsWith('.md') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = path.join(KNOWLEDGE_DIR, filename);

    // Ensure the file exists before updating
    try {
      await fs.access(filepath);
    } catch {
      return NextResponse.json(
        { error: 'File does not exist' },
        { status: 404 }
      );
    }

    // Write the updated content
    await fs.writeFile(filepath, content, 'utf-8');

    // TODO: Trigger embedding regeneration here
    console.log(
      `Knowledge file updated: ${filename}, triggering embedding regeneration...`
    );

    return NextResponse.json({
      success: true,
      message: 'File updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating knowledge file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}
