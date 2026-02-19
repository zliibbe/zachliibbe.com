import { NextResponse } from 'next/server';

// Fallback data in case the API fails
const fallbackBooks = {
  read: [
    {
      title: 'Jayber Crow',
      author: 'Wendell Berry',
      coverUrl: 'https://images.gr-assets.com/books/1388639328i/57460.jpg',
      link: '57460',
      dateRead: '2023-08-15',
      rating: 4.5,
    },
    {
      title: 'The Return of the King',
      author: 'J.R.R. Tolkien',
      coverUrl: 'https://images.gr-assets.com/books/1654216226i/61215384.jpg',
      link: '61215384',
      dateRead: '2023-07-20',
      rating: 5,
    },
    {
      title: 'The Two Towers',
      author: 'J.R.R. Tolkien',
      coverUrl: 'https://images.gr-assets.com/books/1654216374i/61215372.jpg',
      link: '61215372',
      dateRead: '2023-06-25',
      rating: 5,
    },
    {
      title: 'The Fellowship of the Ring',
      author: 'J.R.R. Tolkien',
      coverUrl: 'https://images.gr-assets.com/books/1654216425i/61215351.jpg',
      link: '61215351',
      dateRead: '2023-06-10',
      rating: 5,
    },
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      coverUrl: 'https://images.gr-assets.com/books/1546071216i/5907.jpg',
      link: '5907',
      dateRead: '2023-05-15',
      rating: 5,
    },
  ],
  audiobooks: [
    {
      title: 'Mindset: The New Psychology of Success',
      author: 'Carol S. Dweck',
      coverUrl: 'https://images.gr-assets.com/books/1436227012i/40745.jpg',
      link: '40745',
      dateRead: '2023-08-10',
      rating: 5,
    },
    {
      title: 'The Anxious Generation',
      author: 'Jonathan Haidt',
      coverUrl: 'https://images.gr-assets.com/books/1711573771i/171681821.jpg',
      link: '171681821',
      dateRead: '2023-07-15',
      rating: 5,
    },
    {
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      coverUrl: 'https://images.gr-assets.com/books/1581527774i/41881472.jpg',
      link: '41881472',
      dateRead: '2023-06-05',
      rating: 4.5,
    },
    {
      title: 'Good Inside: A Guide to Becoming the Parent You Want to Be',
      author: 'Dr. Becky Kennedy',
      coverUrl: 'https://images.gr-assets.com/books/1642726934i/59808037.jpg',
      link: '59808037',
      dateRead: '2023-05-20',
      rating: 4,
    },
  ],
};

// Function to fetch books from Goodreads shelf
async function fetchGoodreadsShelf(shelf: string) {
  try {
    const useLocalLambda = process.env.NEXT_PUBLIC_USE_LOCAL_LAMBDA === 'true';
    const lambdaBaseUrl = useLocalLambda
      ? process.env.NEXT_PUBLIC_GOODREADS_LAMBDA_URL_DEV
      : process.env.NEXT_PUBLIC_GOODREADS_LAMBDA_URL;

    if (lambdaBaseUrl) {
      try {
        const lambdaResponse = await fetch(
          `${lambdaBaseUrl}/currently-reading`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
          }
        );

        if (lambdaResponse.ok) {
          const data = await lambdaResponse.json();
          if (data?.books && data.books.length > 0) {
            // Transform Lambda data to match our expected format
            return data.books.map(
              (book: {
                title: string;
                author: string;
                coverImg: string;
                link: string;
                lastUpdated?: string;
              }) => ({
                title: book.title,
                author: book.author,
                coverUrl: book.coverImg,
                link: book.link,
                dateRead: book.lastUpdated || new Date().toISOString(),
                rating: 5, // Default rating for currently reading books
              })
            );
          }
        }
      } catch (lambdaError) {
        console.error('Error fetching from Lambda:', lambdaError);
      }
    }

    console.warn('Using fallback data due to API issues');
    return shelf === 'audiobooks'
      ? fallbackBooks.audiobooks
      : fallbackBooks.read;
  } catch (error) {
    console.error(`Error fetching from Goodreads (${shelf}): ${error}`);
    // Return fallback data based on the shelf
    return shelf === 'audiobooks'
      ? fallbackBooks.audiobooks
      : fallbackBooks.read;
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const type = params.get('type');
    const shelf = type === 'audiobook' ? 'audiobooks' : 'read';

    // Try to fetch from Goodreads
    const books = await fetchGoodreadsShelf(shelf);

    // If we got data, return it
    if (books && books.length > 0) {
      return NextResponse.json(books);
    }

    // If no data, return fallback
    const fallbackData =
      type === 'audiobook' ? fallbackBooks.audiobooks : fallbackBooks.read;
    return NextResponse.json(fallbackData);
  } catch (error) {
    console.error('Error in books API route:', error);
    // Return fallback data based on the type
    const url = new URL(request.url);
    const params = url.searchParams;
    const type = params.get('type');
    const fallbackData =
      type === 'audiobook' ? fallbackBooks.audiobooks : fallbackBooks.read;
    return NextResponse.json(fallbackData);
  }
}
