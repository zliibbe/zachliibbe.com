import { type NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  generateChatResponse,
  getRateLimitStatus,
} from '@/lib/claude-api';
import {
  ApiErrorCodes,
  createApiError,
  handleApiError,
  validateArray,
  validateRequired,
  validateString,
} from '@/lib/error-handling';

interface ChatRequestBody {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch {
      throw createApiError(
        'Invalid JSON in request body',
        ApiErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    const { message, conversationHistory } = body;

    // Validate required fields
    validateRequired(message, 'message');
    validateString(message, 'message');

    // Validate conversation history if provided
    if (conversationHistory !== undefined) {
      validateArray(conversationHistory, 'conversationHistory');
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit (now async with KV storage)
    const rateLimitAllowed = await checkRateLimit(clientIP);
    const rateLimitStatus = await getRateLimitStatus(clientIP);

    if (!rateLimitAllowed) {
      const resetDate = new Date(rateLimitStatus.resetTime);
      throw createApiError(
        `Rate limit exceeded. You've reached the maximum of ${rateLimitStatus.limit} requests per day. Please try again after ${resetDate.toLocaleString()}.`,
        ApiErrorCodes.RATE_LIMIT_EXCEEDED,
        429,
        { clientIP, rateLimited: true, resetTime: rateLimitStatus.resetTime }
      );
    }

    // Generate response using Claude API and knowledge base
    const response = await generateChatResponse(message, conversationHistory);

    // Check if the external service returned an error
    if (response.error) {
      throw createApiError(
        'Failed to generate chat response',
        ApiErrorCodes.EXTERNAL_SERVICE_ERROR,
        500,
        { externalError: response.error }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: response.message,
        sources: response.sources,
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
          'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
          'X-RateLimit-Reset': new Date(
            rateLimitStatus.resetTime
          ).toISOString(),
        },
      }
    );
  } catch (error) {
    return handleApiError(error as Error, {
      endpoint: '/api/chat',
      method: 'POST',
      userAgent: request.headers.get('user-agent'),
      clientIP: getClientIP(request),
    });
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
