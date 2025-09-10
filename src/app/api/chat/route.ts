import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse, checkRateLimit } from '@/lib/claude-api';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Simple rate limiting based on IP
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. Please wait a moment before sending another message.',
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    // Generate response using Claude API and knowledge base
    const response = await generateChatResponse(message, conversationHistory);

    return NextResponse.json({
      success: true,
      message: response.message,
      sources: response.sources,
      error: response.error,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
