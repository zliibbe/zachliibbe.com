import { generateEmbedding } from './embeddings';
import { queryVectors } from './pinecone';

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
    // Generate embedding for user message to search knowledge base
    const queryEmbedding = await generateEmbedding(userMessage);

    // Search for relevant context from knowledge base
    const relevantChunks = await queryVectors(queryEmbedding, 5);

    // Extract context from search results
    const context = relevantChunks
      .filter(chunk => chunk.score && chunk.score > 0.4) // Use moderate-confidence matches
      .map(chunk => chunk.metadata?.content)
      .filter(Boolean)
      .slice(0, 3) // Limit to top 3 most relevant chunks
      .join('\n\n');

    const sources = relevantChunks
      .filter(chunk => chunk.score && chunk.score > 0.4)
      .map(chunk => chunk.metadata?.source)
      .filter((source): source is string => typeof source === 'string')
      .slice(0, 3);

    // Build conversation messages for Claude
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: buildPrompt(userMessage, context),
      },
    ];

    // Call Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
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

function buildPrompt(userMessage: string, context: string): string {
  const systemPrompt = `You are Zach Liibbe's AI assistant, helping visitors learn about his background, experience, and projects. You have access to information about his professional experience, personal interests, projects, and contact information.

Key guidelines:
- Be friendly, professional, and helpful
- Provide accurate information based on the context provided
- If you don't have specific information, acknowledge this and suggest contacting Zach directly
- Keep responses concise but informative
- Focus on being helpful to potential employers, collaborators, or people interested in his work

Context information about Zach:
${context}

User question: ${userMessage}

Please provide a helpful response based on the available information.`;

  return systemPrompt;
}

// Simple rate limiting for demo purposes
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

export function getRateLimitStatus(identifier: string): {
  remaining: number;
  resetTime: number;
} {
  const userLimit = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!userLimit || now > userLimit.resetTime) {
    return {
      remaining: RATE_LIMIT_REQUESTS,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  return {
    remaining: Math.max(0, RATE_LIMIT_REQUESTS - userLimit.count),
    resetTime: userLimit.resetTime,
  };
}
