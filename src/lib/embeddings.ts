import crypto from 'node:crypto';
import OpenAI from 'openai';
import { kv } from './kv';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not found in environment variables');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || '',
});

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 512;

function createEmbeddingKey(text: string): string {
  // Create a stable hash for the text to use as cache key
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  return `embedding:${EMBEDDING_MODEL}:${hash}`;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.replace(/\n/g, ' ').trim();
  const cacheKey = createEmbeddingKey(normalizedText);

  try {
    // Try to get from KV cache first
    const cached = await kv.get<number[]>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (error) {
    // If cache fails, continue to generate new embedding
    console.warn('KV cache read failed, generating new embedding:', error);
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: normalizedText,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI');
    }

    const embedding = response.data[0]!.embedding;

    // Cache the result in KV store (expires in 7 days)
    try {
      await kv.setex(cacheKey, 7 * 24 * 60 * 60, embedding);
    } catch (error) {
      // If cache fails, still return the embedding
      console.warn('KV cache write failed:', error);
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  const uncachedTexts: { text: string; index: number }[] = [];

  // Check cache for each text
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text) continue;
    const normalizedText = text.replace(/\n/g, ' ').trim();
    const cacheKey = createEmbeddingKey(normalizedText);

    try {
      const cached = await kv.get<number[]>(cacheKey);
      if (cached) {
        results[i] = cached;
        continue;
      }
    } catch (error) {
      console.warn('KV cache read failed for batch embedding:', error);
    }

    uncachedTexts.push({ text: normalizedText, index: i });
  }

  // Generate embeddings for uncached texts
  if (uncachedTexts.length > 0) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: uncachedTexts.map(item => item.text),
        dimensions: EMBEDDING_DIMENSIONS,
      });

      if (!response.data || response.data.length !== uncachedTexts.length) {
        throw new Error('Mismatch in embedding response data length');
      }

      // Store results and cache them
      for (let i = 0; i < uncachedTexts.length; i++) {
        const embeddingData = response.data[i];
        const uncachedText = uncachedTexts[i];
        if (!embeddingData || !uncachedText) continue;
        const embedding = embeddingData.embedding;
        const { text, index } = uncachedText;
        results[index] = embedding;

        // Cache the result
        try {
          const cacheKey = createEmbeddingKey(text);
          await kv.setex(cacheKey, 7 * 24 * 60 * 60, embedding);
        } catch (error) {
          console.warn('KV cache write failed for batch embedding:', error);
        }
      }
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  return results;
}

export function chunkText(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    const testChunk = currentChunk
      ? `${currentChunk}. ${trimmedSentence}`
      : trimmedSentence;

    if (testChunk.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk);

      // Create overlap by taking the last few sentences
      const overlapText = currentChunk
        .split(/[.!?]+/)
        .slice(-2)
        .join('. ');
      currentChunk = overlapText
        ? `${overlapText}. ${trimmedSentence}`
        : trimmedSentence;
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter(chunk => chunk.trim().length > 0);
}

export async function getCachedEmbedding(text: string): Promise<number[]> {
  // Use the same caching logic as generateEmbedding
  return generateEmbedding(text);
}

// KV-based cache management
export async function clearEmbeddingCache(): Promise<void> {
  try {
    // Note: KV doesn't have a pattern-based delete, so we rely on TTL expiration
    // For manual cache clearing, we'd need to track keys separately
    console.log('KV embedding cache relies on TTL expiration (7 days)');
  } catch (error) {
    console.error('Error clearing embedding cache:', error);
  }
}
