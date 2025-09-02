'use client';

import React, { useEffect, useState } from 'react';
import styles from './CurrentlyReading.module.css';
import footerStyles from './Footer.module.css';
import { getTimeAgo } from '@/app/utils/index';

type Book = {
  title: string;
  author: string;
  coverImg?: string;
  link?: string;
  currentPage?: number;
  totalPages?: number;
  lastUpdated?: string;
  isPercentage?: boolean;
};

export default function CurrentlyReading() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/goodreads/currently-reading');
        const responseText = await response.text();

        // Store raw response for debugging
        try {
          setDebugInfo({
            status: response.status,
            statusText: response.statusText,
            rawResponse: responseText.substring(0, 500), // First 500 chars for debugging
          });
        } catch (e) {
          console.error('Error setting debug info:', e);
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch books: ${response.status}`);
        }

        // Parse the response text
        let data;
        try {
          data = JSON.parse(responseText);
          // console.log("Received data from API:", data);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          throw new Error(
            `Invalid JSON response: ${responseText.substring(0, 100)}...`
          );
        }

        // Check if data is an array or has a books property
        let booksArray = [];
        if (Array.isArray(data)) {
          booksArray = data;
        } else if (data && data.books && Array.isArray(data.books)) {
          booksArray = data.books;
        } else {
          console.error('Unexpected data format:', data);
          throw new Error('No books data received');
        }

        // Normalize the data to ensure consistent property names
        const normalizedBooks = booksArray.map((book: any) => {
          // console.log("Processing book:", book);
          return {
            title: book.title,
            author: book.author,
            coverImg: book.coverImg || book.cover_url || null,
            link: book.link || book.url || null,
            currentPage: book.currentPage || book.current_page || null,
            totalPages: book.totalPages || book.total_pages || null,
            lastUpdated: book.lastUpdated || book.last_updated || null,
            isPercentage: book.isPercentage || false,
          };
        });

        // console.log("normalizedBooks:", normalizedBooks);

        // Sort books by lastUpdated (most recent first)
        if (normalizedBooks.length > 0) {
          normalizedBooks.sort((a: Book, b: Book) => {
            const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
            const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
            return dateB - dateA; // Most recent first
          });
        }

        setBooks(normalizedBooks);
      } catch (err) {
        console.error('Error fetching currently reading books:', err);
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );

        // Set fallback data for testing
        const fallbackBook: Book = {
          title: 'The Four Winds',
          author: 'Kristin Hannah',
          currentPage: 156,
          totalPages: 464,
          lastUpdated: new Date().toISOString(),
        };

        setBooks([fallbackBook]);
        // Comment line below to use fallback data instead of showing error
        // setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  if (loading)
    return (
      <span className={footerStyles.loadingText}>Loading reading list...</span>
    );
  if (error) {
    // In development, show debug info
    if (process.env.NODE_ENV === 'development' || debugInfo) {
      // console.log("Debug info:", debugInfo);
    }
    return <span>Error loading reading progress: {error}</span>;
  }
  if (!books || books.length === 0) {
    return <span>No book currently being read</span>;
  }

  // Get the first book
  const currentBook = books[0];

  // console.log("currentBook:", currentBook);

  return (
    <>
      Currently reading{' '}
      {currentBook.link ? (
        <a
          href={currentBook.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.bookTitle}
        >
          <strong>{currentBook.title}</strong>
        </a>
      ) : (
        <strong className={styles.bookTitle}>{currentBook.title}</strong>
      )}
      {currentBook.author && <span> by {currentBook.author}</span>}
      {currentBook.currentPage && currentBook.totalPages && (
        <span className={styles.readingProgress}>
          {currentBook.isPercentage
            ? ` (${currentBook.currentPage}% complete`
            : ` (on page ${currentBook.currentPage}/${currentBook.totalPages}`}
          {currentBook.lastUpdated && ` ${getTimeAgo(currentBook.lastUpdated)}`}
          {')'}
        </span>
      )}
    </>
  );
}
