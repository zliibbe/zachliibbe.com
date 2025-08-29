import { NextRequest, NextResponse } from 'next/server';

// Specify Edge runtime
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shelf = searchParams.get('shelf') || 'read';

  try {
    // Use the deployed Lambda URL
    const lambdaUrl = `https://goodreads-lambda.netlify.app/.netlify/functions/goodreads-lambda?shelf=${shelf}`;

    const response = await fetch(lambdaUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Goodreads Lambda:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
      },
      { status: 500 }
    );
  }
}
// INCORRECT LAMBDA URL. IS THIS STILL USED? DELETE?
