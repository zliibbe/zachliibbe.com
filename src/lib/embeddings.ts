import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not found in environment variables');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || '',
});

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.replace(/\n/g, ' ').trim(),
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map(text => text.replace(/\n/g, ' ').trim()),
    });

    if (!response.data || response.data.length !== texts.length) {
      throw new Error('Mismatch in embedding response data length');
    }

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
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

export interface EmbeddingCache {
  [key: string]: {
    embedding: number[];
    timestamp: number;
  };
}

const embeddingCache: EmbeddingCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedEmbedding(text: string): Promise<number[]> {
  const key = `embed_${text.slice(0, 100)}_${text.length}`;
  const cached = embeddingCache[key];

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.embedding;
  }

  const embedding = await generateEmbedding(text);
  embeddingCache[key] = {
    embedding,
    timestamp: Date.now(),
  };

  return embedding;
}

export function clearEmbeddingCache(): void {
  Object.keys(embeddingCache).forEach(key => delete embeddingCache[key]);
}
