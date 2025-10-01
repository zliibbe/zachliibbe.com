import { generateEmbedding } from './embeddings';
import { queryVectors } from './pinecone';
import { kv } from '@vercel/kv';

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

if (!CLAUDE_API_KEY) {
  console.warn('ANTHROPIC_API_KEY not found in environment variables');
}

export interface ChatResponse {
  message: string;
  sources?: string[];
  error?: string;
}

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }> = []
): Promise<ChatResponse> {
  try {
    // Enforce conversation limits for cost control
    const MAX_CONVERSATION_LENGTH = 10;
    if (conversationHistory.length >= MAX_CONVERSATION_LENGTH) {
      return {
        message:
          "I've reached the conversation limit to help manage costs. Feel free to start a new conversation to continue chatting about Zach!",
        error: 'Conversation limit reached',
      };
    }
    // Generate embedding for user message to search knowledge base
    const queryEmbedding = await generateEmbedding(userMessage);

    // Search for relevant context from knowledge base
    const relevantChunks = await queryVectors(queryEmbedding, 5);

    // Improved context extraction with higher confidence threshold for specificity
    const highConfidenceChunks = relevantChunks.filter(
      chunk => chunk.score && chunk.score > 0.7
    );
    const mediumConfidenceChunks = relevantChunks.filter(
      chunk => chunk.score && chunk.score > 0.4 && chunk.score <= 0.7
    );

    // Prioritize high-confidence matches, fall back to medium confidence if needed
    const selectedChunks =
      highConfidenceChunks.length >= 2
        ? highConfidenceChunks.slice(0, 3)
        : [...highConfidenceChunks, ...mediumConfidenceChunks].slice(0, 3);

    const context = selectedChunks
      .map(chunk => chunk.metadata?.content)
      .filter(Boolean)
      .join('\n\n');

    const sources = selectedChunks
      .map(chunk => chunk.metadata?.source)
      .filter((source): source is string => typeof source === 'string');

    // Determine model complexity based on query characteristics
    const isComplexQuery =
      userMessage.length > 100 ||
      userMessage.includes('explain') ||
      userMessage.includes('detailed') ||
      userMessage.includes('how') ||
      userMessage.includes('why') ||
      conversationHistory.length > 3;

    const model = isComplexQuery
      ? 'claude-3-sonnet-20241022'
      : 'claude-3-haiku-20240307';
    const maxTokens = isComplexQuery ? 1500 : 800;

    // Log model selection for cost monitoring
    console.log(
      `RAG Query - Model: ${model}, Chunks: ${selectedChunks.length}, Complex: ${isComplexQuery}`
    );

    // Build conversation messages for Claude
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: buildPrompt(userMessage, context, selectedChunks.length),
      },
    ];

    // Call Claude API with adaptive model selection
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API detailed error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        headers: Object.fromEntries(response.headers.entries()),
        url: CLAUDE_API_URL,
        hasApiKey: !!CLAUDE_API_KEY,
        apiKeyPrefix: CLAUDE_API_KEY?.substring(0, 8) + '...',
      });

      return {
        message:
          "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        error: `API Error: ${response.status}`,
      };
    }

    const data = await response.json();
    const assistantMessage =
      data.content?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    return {
      message: assistantMessage,
      sources: sources.length > 0 ? sources : undefined,
    };
  } catch (error) {
    console.error('Error generating chat response:', error);

    return {
      message:
        "I'm sorry, I encountered an error while processing your request. Please try again.",
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function buildPrompt(
  userMessage: string,
  context: string,
  contextChunks: number = 0
): string {
  const confidenceNote =
    contextChunks >= 2
      ? 'I have high-confidence information to answer this question.'
      : contextChunks === 1
        ? 'I have some relevant information, but may need to be general in my response.'
        : "I have limited specific information, so I'll provide what I can and suggest contacting Zach directly for details.";

  const systemPrompt = `You are Zach Liibbe's AI assistant on his work experience page, specifically designed to help potential employers, recruiters, and collaborators understand his professional qualifications, technical expertise, and career journey. ${confidenceNote}

CONTEXT: Users viewing this page are likely interested in Zach's professional qualifications for hiring or collaboration purposes. Prioritize information that demonstrates his capabilities, experience, and professional value.

IMPORTANT: Be highly specific about Zach's professional experience. Don't give generic software development answers - focus on HIS actual:
- Technologies he's proven proficient with (React/Next.js, TypeScript, Python, PostgreSQL, AWS, etc.)
- Companies he's worked for and his specific roles and responsibilities
- Quantifiable achievements (40% user engagement increase, 15% performance improvements, etc.)
- Specific projects he's delivered (RAG-powered chat, genomics UI, SPA optimizations)
- His unique career transition from cardiac nursing to software engineering
- His current availability and what he's seeking in his next role
- His working style, collaboration approach, and team contributions

Key guidelines:
- Be friendly, professional, and helpful
- Provide accurate information based on the context provided
- If you don't have specific information, acknowledge this and suggest contacting Zach directly
- Keep responses concise but informative
- Focus on being helpful to potential employers, collaborators, or people interested in his work

Response guidelines:
- Always reference specific details from Zach's background when available
- If the context doesn't contain specific information, acknowledge this explicitly
- For technical questions, relate answers to technologies Zach has actually used
- For career questions, reference his actual career progression and experiences
- Keep responses conversational but professionally informative
- If you lack specific details, encourage direct contact with Zach

Available context about Zach's background:
${context || 'No specific context available for this query.'}

User question: ${userMessage}

Provide a response that's specific to Zach's actual experience and background:`;

  return systemPrompt;
}

// Persistent rate limiting using Vercel KV
const RATE_LIMIT_REQUESTS = 100; // 100 requests per day per IP
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const rateLimitKey = `rate_limit:${identifier}`;
  const now = Date.now();

  try {
    const userLimit = await kv.get<{ count: number; resetTime: number }>(
      rateLimitKey
    );

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize rate limit
      await kv.set(
        rateLimitKey,
        {
          count: 1,
          resetTime: now + RATE_LIMIT_WINDOW,
        },
        {
          ex: Math.ceil(RATE_LIMIT_WINDOW / 1000), // Expire after window duration
        }
      );
      return true;
    }

    if (userLimit.count >= RATE_LIMIT_REQUESTS) {
      return false;
    }

    // Increment count
    userLimit.count++;
    await kv.set(rateLimitKey, userLimit, {
      ex: Math.ceil((userLimit.resetTime - now) / 1000), // Preserve original expiry
    });
    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if KV is down
    return true;
  }
}

export async function getRateLimitStatus(identifier: string): Promise<{
  remaining: number;
  resetTime: number;
  limit: number;
}> {
  const rateLimitKey = `rate_limit:${identifier}`;
  const now = Date.now();

  try {
    const userLimit = await kv.get<{ count: number; resetTime: number }>(
      rateLimitKey
    );

    if (!userLimit || now > userLimit.resetTime) {
      return {
        remaining: RATE_LIMIT_REQUESTS,
        resetTime: now + RATE_LIMIT_WINDOW,
        limit: RATE_LIMIT_REQUESTS,
      };
    }

    return {
      remaining: Math.max(0, RATE_LIMIT_REQUESTS - userLimit.count),
      resetTime: userLimit.resetTime,
      limit: RATE_LIMIT_REQUESTS,
    };
  } catch (error) {
    console.error('Get rate limit status error:', error);
    return {
      remaining: RATE_LIMIT_REQUESTS,
      resetTime: now + RATE_LIMIT_WINDOW,
      limit: RATE_LIMIT_REQUESTS,
    };
  }
}
