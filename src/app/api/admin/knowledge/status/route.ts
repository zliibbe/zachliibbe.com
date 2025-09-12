import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'src/data/knowledge');

// This would ideally be stored in a database or cache
// For now, we'll simulate the data
function generateMockCacheStats() {
  return {
    totalRequests: 450,
    cacheHits: 320,
    cacheMisses: 130,
    hitRate: 0.711, // 71.1%
    totalEmbeddings: 81,
    averageResponseTime: 245,
  };
}

async function generateFileStatuses() {
  const files = await fs.readdir(KNOWLEDGE_DIR);
  const markdownFiles = files.filter(f => f.endsWith('.md'));
  const fileStatuses = [];

  for (const filename of markdownFiles) {
    const filepath = path.join(KNOWLEDGE_DIR, filename);
    const stats = await fs.stat(filepath);
    const content = await fs.readFile(filepath, 'utf-8');

    // Estimate chunk count
    const chunkCount = Math.ceil(content.length / 1000);

    // Mock embedding status (in real implementation, check against Pinecone)
    const statuses: Array<'current' | 'outdated' | 'missing'> = [
      'current',
      'current',
      'outdated',
      'current',
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Mock last embedded time
    const lastEmbedded =
      status === 'missing'
        ? null
        : new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString();

    fileStatuses.push({
      filename,
      status,
      chunkCount,
      lastEmbedded,
      fileSize: content.length,
      processingTime:
        status === 'missing'
          ? undefined
          : Math.floor(Math.random() * 2000) + 500,
    });
  }

  return fileStatuses;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'zliibbe@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheStats = generateMockCacheStats();
    const fileStatuses = await generateFileStatuses();

    return NextResponse.json({
      cacheStats,
      fileStatuses,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in knowledge status API:', error);
    return NextResponse.json(
      { error: 'Failed to load embedding status' },
      { status: 500 }
    );
  }
}
