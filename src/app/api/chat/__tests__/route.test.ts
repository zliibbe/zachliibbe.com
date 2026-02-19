/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { OPTIONS, POST } from '../route';

jest.mock('@/lib/claude-api', () => ({
  checkRateLimit: jest.fn(),
  generateChatResponse: jest.fn(),
  getRateLimitStatus: jest.fn(),
}));

jest.mock('@/lib/error-handling', () => {
  const actual = jest.requireActual('@/lib/error-handling');
  return {
    ...actual,
  };
});

import {
  checkRateLimit,
  generateChatResponse,
  getRateLimitStatus,
} from '@/lib/claude-api';

const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockGenerateChatResponse = generateChatResponse as jest.Mock;
const mockGetRateLimitStatus = getRateLimitStatus as jest.Mock;

const defaultRateLimitStatus = {
  limit: 50,
  remaining: 49,
  resetTime: Date.now() + 86400000,
};

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    mockCheckRateLimit.mockResolvedValue(true);
    mockGetRateLimitStatus.mockResolvedValue(defaultRateLimitStatus);
    mockGenerateChatResponse.mockResolvedValue({
      message: 'Hello from AI',
      sources: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with message on valid request', async () => {
    const res = await POST(makeRequest({ message: 'Tell me about Zach' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Hello from AI');
  });

  it('passes message and conversationHistory to generateChatResponse', async () => {
    const history = [{ role: 'user' as const, content: 'Earlier message' }];
    await POST(
      makeRequest({ message: 'Follow up', conversationHistory: history })
    );

    expect(mockGenerateChatResponse).toHaveBeenCalledWith('Follow up', history);
  });

  it('returns rate limit headers on success', async () => {
    const res = await POST(makeRequest({ message: 'Hi' }));

    expect(res.headers.get('X-RateLimit-Limit')).toBe('50');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('49');
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('returns 400 when message field is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is not a string', async () => {
    const res = await POST(makeRequest({ message: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue(false);
    mockGetRateLimitStatus.mockResolvedValue({
      ...defaultRateLimitStatus,
      remaining: 0,
    });

    const res = await POST(makeRequest({ message: 'Hi' }));
    expect(res.status).toBe(429);
  });

  it('returns 429 body with rate limit info', async () => {
    mockCheckRateLimit.mockResolvedValue(false);
    mockGetRateLimitStatus.mockResolvedValue({
      limit: 50,
      remaining: 0,
      resetTime: Date.now() + 86400000,
    });

    const res = await POST(makeRequest({ message: 'Hi' }));
    const data = await res.json();
    expect(data.error).toMatch(/rate limit/i);
  });

  it('returns 500 when generateChatResponse returns an error', async () => {
    mockGenerateChatResponse.mockResolvedValue({
      message: '',
      error: 'Claude API failed',
    });

    const res = await POST(makeRequest({ message: 'Hi' }));
    expect(res.status).toBe(500);
  });

  it('uses x-forwarded-for header for client IP', async () => {
    await POST(
      makeRequest({ message: 'Hi' }, { 'x-forwarded-for': '1.2.3.4' })
    );
    expect(mockCheckRateLimit).toHaveBeenCalledWith('1.2.3.4');
  });
});

describe('OPTIONS /api/chat', () => {
  it('returns 200 with CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
