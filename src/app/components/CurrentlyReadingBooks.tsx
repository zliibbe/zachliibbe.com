'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import styles from '../live-feed/LiveFeed.module.css';

interface CurrentlyReadingBook {
  title: string;
  author: string;
  coverImg?: string | null;
  link?: string | null;
  currentPage?: number | null;
  totalPages?: number | null;
  lastUpdated?: string | null;
  isPercentage?: boolean;
}

export default function CurrentlyReadingBooks() {
  const [books, setBooks] = useState<CurrentlyReadingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch('/api/goodreads/currently-reading', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const processedBooks = data
            .slice(0, 3)
            .map((book: CurrentlyReadingBook) => ({
              ...book,
              coverImg: book.coverImg
                ? `/api/utils/image-proxy?url=${encodeURIComponent(book.coverImg)}`
                : null,
            }));
          setBooks(processedBooks);
        } else {
          setBooks([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  const getProgress = (book: CurrentlyReadingBook): number | null => {
    if (book.isPercentage && book.currentPage != null) {
      return book.currentPage;
    }
    if (book.currentPage != null && book.totalPages) {
      return Math.round((book.currentPage / book.totalPages) * 100);
    }
    return null;
  };

  const getProgressLabel = (book: CurrentlyReadingBook): string | null => {
    if (book.isPercentage && book.currentPage != null) {
      return `${Math.min(book.currentPage, 100)}% complete`;
    }
    if (book.currentPage != null && book.totalPages) {
      return `Page ${book.currentPage} of ${book.totalPages}`;
    }
    if (book.currentPage != null) {
      return `Page ${book.currentPage}`;
    }
    return null;
  };

  if (loading) {
    return <p className={styles.loadingText}>Loading currently reading...</p>;
  }

  if (error || books.length === 0) {
    return (
      <p className={styles.emptyText}>
        Nothing in the queue right now. ¯\_(ツ)_/¯{' '}
      </p>
    );
  }

  return (
    <div className={styles.bookGrid}>
      {books.map(book => {
        const progress = getProgress(book);
        const progressLabel = getProgressLabel(book);

        return (
          <div key={`${book.title}||${book.author}`} className={styles.bookCard}>
            <a
              href={book.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bookLinkWrapper}
            >
              <div className={styles.bookCoverContainer}>
                <Image
                  src={book.coverImg || '/images/no-cover.png'}
                  alt={`Cover of ${book.title}`}
                  className={styles.bookCover}
                  width={100}
                  height={150}
                />
              </div>
              <div className={styles.bookContent}>
                <h3 className={styles.bookTitle}>{book.title}</h3>
                <p className={styles.bookAuthor}>{book.author}</p>
              </div>
            </a>
            {progressLabel && (
              <div className={styles.bookMeta}>
                {progress !== null && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}
                <p className={styles.progressText}>{progressLabel}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
