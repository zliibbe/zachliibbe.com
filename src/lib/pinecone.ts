import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME =
  process.env.PINECONE_INDEX_NAME || 'zachliibbe-knowledge';

if (!PINECONE_API_KEY) {
  console.warn('PINECONE_API_KEY not found in environment variables');
}

export const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY || '',
});

export async function getPineconeIndex() {
  try {
    const indexHost = process.env.PINECONE_INDEX_HOST;
    const index = indexHost 
      ? pinecone.index(PINECONE_INDEX_NAME, indexHost)
      : pinecone.index(PINECONE_INDEX_NAME);
    return index;
  } catch (error) {
    console.error('Error getting Pinecone index:', error);
    throw error;
  }
}

export interface KnowledgeVector {
  id: string;
  values: number[];
  metadata: {
    source: string;
    title: string;
    content: string;
    category: string;
    chunk?: number;
  };
}

export async function upsertVectors(vectors: KnowledgeVector[]) {
  try {
    const index = await getPineconeIndex();
    await index.upsert(vectors);
    console.log(`Successfully upserted ${vectors.length} vectors to Pinecone`);
  } catch (error) {
    console.error('Error upserting vectors to Pinecone:', error);
    throw error;
  }
}

export async function queryVectors(
  vector: number[],
  topK: number = 5,
  filter?: Record<string, any>
) {
  try {
    const index = await getPineconeIndex();
    const queryResponse = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter,
    });

    return queryResponse.matches || [];
  } catch (error) {
    console.error('Error querying vectors from Pinecone:', error);
    throw error;
  }
}

export async function deleteVectors(ids: string[]) {
  try {
    const index = await getPineconeIndex();
    await index.deleteOne(ids);
    console.log(`Successfully deleted ${ids.length} vectors from Pinecone`);
  } catch (error) {
    console.error('Error deleting vectors from Pinecone:', error);
    throw error;
  }
}
