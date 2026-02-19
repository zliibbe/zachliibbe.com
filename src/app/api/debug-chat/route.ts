import { NextResponse } from 'next/server';

export async function GET() {
  const tests = [];

  // Test 1: Anthropic API
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    const responseData = response.ok
      ? await response.json()
      : await response.text();
    tests.push({
      service: 'Anthropic',
      status: response.status,
      ok: response.ok,
      response: responseData,
    });
  } catch (e) {
    tests.push({
      service: 'Anthropic',
      error: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  // Test 2: OpenAI API (Embeddings)
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: 'test',
        dimensions: 512,
      }),
    });

    const responseData = response.ok
      ? await response.json()
      : await response.text();
    tests.push({
      service: 'OpenAI',
      status: response.status,
      ok: response.ok,
      response: response.ok ? 'Success' : responseData,
    });
  } catch (e) {
    tests.push({
      service: 'OpenAI',
      error: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  // Test 3: Pinecone connection
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });

    const indexName = process.env.PINECONE_INDEX_NAME || 'zachliibbe-knowledge';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    const index = indexHost
      ? pinecone.index(indexName, indexHost)
      : pinecone.index(indexName);

    // Test a simple query
    const queryResponse = await index.query({
      vector: new Array(512).fill(0.1),
      topK: 1,
      includeMetadata: false,
    });

    tests.push({
      service: 'Pinecone',
      status: 200,
      ok: true,
      response: `Query successful, found ${queryResponse.matches?.length || 0} matches`,
    });
  } catch (e) {
    tests.push({
      service: 'Pinecone',
      error: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  return NextResponse.json({
    tests,
    env: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasPineconeKey: !!process.env.PINECONE_API_KEY,
      pineconeIndexName: process.env.PINECONE_INDEX_NAME,
      pineconeIndexHost: process.env.PINECONE_INDEX_HOST,
    },
    timestamp: new Date().toISOString(),
  });
}
