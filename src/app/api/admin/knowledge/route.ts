import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'src/data/knowledge');

async function getKnowledgeFiles() {
  try {
    const files = await fs.readdir(KNOWLEDGE_DIR);
    const knowledgeFiles = [];

    for (const filename of files) {
      if (filename.endsWith('.md')) {
        const filepath = path.join(KNOWLEDGE_DIR, filename);
        const stats = await fs.stat(filepath);
        const content = await fs.readFile(filepath, 'utf-8');

        // Basic chunk count estimation (simplified)
        const chunkCount = Math.ceil(content.length / 1000);

        knowledgeFiles.push({
          filename,
          content,
          lastModified: stats.mtime.toISOString(),
          embeddingStatus: 'current', // This would be determined by checking against embeddings
          chunkCount,
        });
      }
    }

    return knowledgeFiles.sort((a, b) => a.filename.localeCompare(b.filename));
  } catch (error) {
    console.error('Error reading knowledge files:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'zliibbe@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const files = await getKnowledgeFiles();
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in knowledge API:', error);
    return NextResponse.json(
      { error: 'Failed to load knowledge files' },
      { status: 500 }
    );
  }
}
