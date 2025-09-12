import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateEmbedding } from '@/lib/embeddings';
import { queryVectors } from '@/lib/pinecone';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'zliibbe@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for relevant context from knowledge base
    const relevantChunks = await queryVectors(queryEmbedding, 5);

    // Format the context chunks for the response
    const contextChunks = relevantChunks.map(chunk => ({
      content: chunk.metadata?.content || '',
      source: chunk.metadata?.source || 'unknown',
      score: chunk.score || 0,
      metadata: {
        filename: chunk.metadata?.source || 'unknown',
        chunkIndex: chunk.metadata?.chunkIndex || 0,
      },
    }));

    // Generate a simple response based on context (simplified version)
    const hasHighConfidenceContext = contextChunks.some(
      chunk => chunk.score > 0.7
    );

    let response = '';
    if (hasHighConfidenceContext) {
      response = `Based on the knowledge base, here's what I can tell you about "${query}": `;
      const topChunk = contextChunks[0];
      if (
        topChunk &&
        topChunk.content &&
        typeof topChunk.content === 'string'
      ) {
        response += topChunk.content.slice(0, 200);
        if (topChunk.content.length > 200) {
          response += '...';
        }
      }
      response += `\n\n(This response was generated from ${contextChunks.length} knowledge chunks with relevance scores ranging from ${Math.min(...contextChunks.map(c => c.score)).toFixed(2)} to ${Math.max(...contextChunks.map(c => c.score)).toFixed(2)})`;
    } else {
      response = `I found some potentially relevant information about "${query}", but the confidence scores are relatively low. The search returned ${contextChunks.length} chunks with scores between ${Math.min(...contextChunks.map(c => c.score)).toFixed(2)} and ${Math.max(...contextChunks.map(c => c.score)).toFixed(2)}. You may want to refine your query or check if the knowledge base contains information on this topic.`;
    }

    return NextResponse.json({
      query,
      response,
      contextChunks,
      metadata: {
        totalChunks: contextChunks.length,
        highConfidenceChunks: contextChunks.filter(c => c.score > 0.7).length,
        mediumConfidenceChunks: contextChunks.filter(
          c => c.score > 0.4 && c.score <= 0.7
        ).length,
        lowConfidenceChunks: contextChunks.filter(c => c.score <= 0.4).length,
        averageScore:
          contextChunks.reduce((sum, c) => sum + c.score, 0) /
          contextChunks.length,
      },
    });
  } catch (error) {
    console.error('Error in test-query API:', error);
    return NextResponse.json(
      { error: 'Failed to process test query' },
      { status: 500 }
    );
  }
}
