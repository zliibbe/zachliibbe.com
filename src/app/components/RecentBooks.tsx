"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../live-feed/LiveFeed.module.css";
import { PiStar, PiStarFill } from "react-icons/pi";
import moment from "moment";

interface Book {
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  link: string;
  dateRead: string;
}

interface RecentBooksProps {
  onLoadingChange: (loading: boolean) => void;
}

export default function RecentBooks({ onLoadingChange }: RecentBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch("/api/feed/books");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Ensure we're getting an array of books
        const booksArray = Array.isArray(data) ? data : data.books || [];
        console.log("Fetched books:", booksArray); // Debug log
        setBooks(booksArray);
      } catch (error) {
        console.error("Error fetching books:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch books",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooks();
  }, []);

  if (isLoading) return <div>Loading books...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!books.length) return <div>No books found</div>;

  return (
    <div className={styles.bookGrid}>
      {books.map((book) => (
        <a
          key={book.link}
          href={book.link}
          className={styles.bookCard}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className={styles.bookCover}>
            <Image
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              fill
              sizes="100px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className={styles.bookInfo}>
            <h3 className={styles.bookTitle}>{book.title}</h3>
            <p className={styles.bookAuthor}>{book.author}</p>
            <div className={styles.bookMeta}>
              <div className={styles.rating}>
                {[...Array(5)].map((_, i) =>
                  i < book.rating ? (
                    <PiStarFill key={i} className={styles.starIcon} />
                  ) : (
                    <PiStar key={i} className={styles.starIcon} />
                  ),
                )}
              </div>
              <span className={styles.dateRead}>
                Finished {moment(book.dateRead).format("MMMM D, YYYY")}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
