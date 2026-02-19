import { promises as fs } from 'node:fs';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chunkText, generateEmbedding } from '@/lib/embeddings';
import { upsertVector } from '@/lib/pinecone';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'src/data/knowledge');

async function reprocessFile(filename: string): Promise<number> {
  const filepath = path.join(KNOWLEDGE_DIR, filename);
  const content = await fs.readFile(filepath, 'utf-8');

  // Extract title from filename or content
  const title = filename
    .replace('.md', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  // Chunk the content
  const chunks = chunkText(content);
  let processedChunks = 0;

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const chunkId = `${filename}-chunk-${i}`;

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk);

      // Upsert to Pinecone
      await upsertVector(chunkId, embedding, {
        content: chunk,
        source: filename,
        title: title,
        chunkIndex: i,
        totalChunks: chunks.length,
      });

      processedChunks++;
    } catch (error) {
      console.error(`Error processing chunk ${i} of ${filename}:`, error);
      throw error;
    }
  }

  return processedChunks;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'zliibbe@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { filename } = body;

    // Get list of knowledge files
    const files = await fs.readdir(KNOWLEDGE_DIR);
    const markdownFiles = files.filter(f => f.endsWith('.md'));

    const filesToProcess = filename ? [filename] : markdownFiles;
    const results = [];

    for (const file of filesToProcess) {
      if (!markdownFiles.includes(file)) {
        results.push({
          filename: file,
          success: false,
          error: 'File not found',
        });
        continue;
      }

      try {
        const startTime = Date.now();
        const chunksProcessed = await reprocessFile(file);
        const processingTime = Date.now() - startTime;

        results.push({
          filename: file,
          success: true,
          chunksProcessed,
          processingTime,
        });

        console.log(
          `Reprocessed ${file}: ${chunksProcessed} chunks in ${processingTime}ms`
        );
      } catch (error) {
        console.error(`Error reprocessing ${file}:`, error);
        results.push({
          filename: file,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Reprocessing complete: ${successful} successful, ${failed} failed`,
      results,
      summary: {
        totalFiles: results.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error('Error in reprocess API:', error);
    return NextResponse.json(
      { error: 'Failed to reprocess embeddings' },
      { status: 500 }
    );
  }
}
