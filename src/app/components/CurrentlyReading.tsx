"use client";

import { useState, useEffect } from "react";
import styles from "./currentlyReading.module.css";

interface Book {
  title: string;
  author: string | null;
  coverImg: string | null;
  link: string;
  currentPage: number | null;
  totalPages: number | null;
  lastReadHours: number | null;
}

export default function CurrentlyReading() {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_GOODREADS_LAMBDA_URL || ""
        );
        if (!response.ok) throw new Error("Failed to fetch books");
        const data = await response.json();

        // Log the full response to debug
        console.log("Full response:", data);

        // Access the books array from the response
        if (data.books && data.books.length > 0) {
          setBook(data.books[0]);
          console.log("First book:", data.books[0]);
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

    const interval = setInterval(fetchBooks, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <span>Loading reading list...</span>;
  if (error) return <span>Error loading reading progress: {error}</span>;
  if (!book) return <span>No books currently being read</span>;

  // Create the style object with the background image
  const coverStyle = book.coverImg
    ? ({
        "--cover-image": `url(${book.coverImg})`,
      } as React.CSSProperties)
    : {};

  const formatTimeAgo = (hours: number | null) => {
    if (!hours) return "recently";
    if (hours < 1) return "less than an hour ago";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  };

  return (
    <span className={styles.currentlyReading} style={coverStyle}>
      Currently reading {book.title}
      {book.author && ` by ${book.author}`}
      {book.currentPage &&
        book.totalPages &&
        ` (page ${book.currentPage}/${book.totalPages})`}
      . Updated {formatTimeAgo(book.lastReadHours)}.
    </span>
  );
}
