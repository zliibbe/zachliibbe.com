"use client";

import React, { useEffect, useState } from "react";
import styles from "./CurrentlyReading.module.css";
import footerStyles from "./Footer.module.css";
import moment from "moment";

type Book = {
  title: string;
  author: string;
  coverImg?: string;
  link?: string;
  currentPage?: number;
  totalPages?: number;
  lastUpdated?: string;
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

        const response = await fetch("/api/goodreads/currently-reading");
        const responseText = await response.text();

        // Store raw response for debugging
        try {
          setDebugInfo({
            status: response.status,
            statusText: response.statusText,
            rawResponse: responseText.substring(0, 500), // First 500 chars for debugging
          });
        } catch (e) {
          console.error("Error setting debug info:", e);
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch books: ${response.status}`);
        }

        // Parse the response text
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          throw new Error(
            `Invalid JSON response: ${responseText.substring(0, 100)}...`,
          );
        }

        // Check if data is an array or has a books property
        if (Array.isArray(data)) {
          setBooks(data);
        } else if (data && data.books && Array.isArray(data.books)) {
          setBooks(data.books);
        } else {
          console.error("Unexpected data format:", data);
          throw new Error("No books data received");
        }
      } catch (err) {
        console.error("Error fetching currently reading books:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        // Set a fallback empty array so the UI doesn't break
        setBooks([]);
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
    if (process.env.NODE_ENV === "development" || debugInfo) {
      console.log("Debug info:", debugInfo);
    }
    return <span>Error loading reading progress: {error}</span>;
  }
  if (!books || books.length === 0) {
    return <span>No book currently being read</span>;
  }

  // Get the first book
  const currentBook = books[0];

  return (
    <>
      Currently reading{" "}
      <strong className={styles.bookTitle}>{currentBook.title}</strong>
      {currentBook.author && <span> by {currentBook.author}</span>}
      {currentBook.currentPage && currentBook.totalPages && (
        <span className={styles.readingProgress}>
          {` (on page ${currentBook.currentPage}/${currentBook.totalPages}`}
          {currentBook.lastUpdated &&
            ` ${moment(currentBook.lastUpdated).fromNow()}`}
          {")"}
        </span>
      )}
    </>
  );
}
