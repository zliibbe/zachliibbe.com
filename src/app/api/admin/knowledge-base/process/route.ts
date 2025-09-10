import { NextRequest, NextResponse } from 'next/server';
import { processKnowledgeBase } from '@/lib/knowledge-base';

export async function POST(request: NextRequest) {
  try {
    // Add basic authentication for admin endpoints
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const expectedToken = process.env.ADMIN_API_TOKEN;

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('Starting knowledge base processing...');
    await processKnowledgeBase();

    return NextResponse.json({
      success: true,
      message: 'Knowledge base processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Knowledge base processing error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple status check endpoint
    return NextResponse.json({
      status: 'Knowledge base processing endpoint available',
      timestamp: new Date().toISOString(),
      env: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        hasAdminToken: !!process.env.ADMIN_API_TOKEN,
        indexName: process.env.PINECONE_INDEX_NAME || 'zachliibbe-knowledge',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
