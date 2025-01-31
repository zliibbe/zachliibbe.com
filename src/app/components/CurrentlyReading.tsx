"use client";

import { useState, useEffect } from "react";
import styles from "./CurrentlyReading.module.css";
import footerStyles from "./Footer.module.css";

interface Book {
  title: string;
  author: string | null;
  coverImg: string | null;
  link: string;
  currentPage: number | null;
  totalPages: number | null;
}

export default function CurrentlyReading() {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithRetry = async (retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_GOODREADS_LAMBDA_URL || ""
        );

        if (!response.ok) {
          console.error(`Attempt ${i + 1}: HTTP error ${response.status}`);
          const errorData = await response.json().catch(() => ({}));
          console.error("Error details:", errorData);
          throw new Error(`Failed to fetch books: ${response.status}`);
        }

        const data = await response.json();
        if (!data.books) {
          throw new Error("No books data received");
        }
        return data;
      } catch (err) {
        console.error(`Attempt ${i + 1} failed:`, err);
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWithRetry();
        if (data.books && data.books.length > 0) {
          setBook(data.books[0]);
        } else {
          setBook(null);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch book");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();

    const interval = setInterval(fetchBooks, 3600000); // Refresh every 60 minutes

    return () => clearInterval(interval);
  }, []);

  if (isLoading)
    return (
      <span className={footerStyles.loadingText}>Loading reading list...</span>
    );
  if (error) return <span>Error loading reading progress: {error}</span>;
  if (!book) return <span>No book currently being read</span>;

  return (
    <>
      Currently reading{" "}
      {book && (
        <>
          <a
            href={`https://www.goodreads.com/book/show/${book.link
              .split("/")
              .pop()}`}
            className={styles.bookTitle}
            target="_blank"
            rel="noopener noreferrer"
            style={
              book.coverImg
                ? ({
                    "--cover-image": `url(${book.coverImg})`,
                  } as React.CSSProperties)
                : {}
            }
          >
            {book.title}
          </a>
          {book.author && ` by ${book.author}`}
          {book.currentPage && book.totalPages
            ? ` (pg ${book.currentPage}/${book.totalPages})`
            : ""}
        </>
      )}
    </>
  );
}
