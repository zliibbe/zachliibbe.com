import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./RecentBooks.module.css";
import moment from "moment";
import { PiHeadphones } from "react-icons/pi";
import { FaStar, FaStarHalf } from "react-icons/fa";

interface Audiobook {
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  link: string;
  dateRead: string;
}

interface RecentAudiobooksProps {
  onLoadingChange: (loading: boolean) => void;
}

export default function RecentAudiobooks({
  onLoadingChange,
}: RecentAudiobooksProps) {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudiobooks() {
      setIsLoading(true);
      onLoadingChange(true);

      try {
        const response = await fetch("/api/feed/books?type=audiobook");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received");
        }

        setAudiobooks(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching audiobooks:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch audiobooks",
        );
      } finally {
        setIsLoading(false);
        onLoadingChange(false);
      }
    }

    fetchAudiobooks();
  }, [onLoadingChange]);

  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar
          key={`star-${i}`}
          className={styles.starIcon}
          aria-hidden="true"
        />,
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FaStarHalf
          key="half-star"
          className={styles.starIcon}
          aria-hidden="true"
        />,
      );
    }

    return (
      <div className={styles.rating} aria-label={`Rating: ${rating} stars`}>
        {stars}
      </div>
    );
  };

  if (isLoading) {
    return <div className={styles.loadingText}>Loading audiobooks...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>Error loading audiobooks: {error}</div>
    );
  }

  if (!audiobooks || audiobooks.length === 0) {
    return <div className={styles.noBooks}>No recent audiobooks found</div>;
  }

  return (
    <div className={styles.bookList}>
      {audiobooks.map((book, index) => (
        <div key={`${book.title}-${index}`} className={styles.bookListItem}>
          <div className={styles.bookIndexWrapper}>
            <span className={styles.bookIndex}>{index + 1}.</span>
          </div>
          <div className={styles.bookContent}>
            <div className={styles.mainContent}>
              <a
                href={`https://www.goodreads.com/book/show/${book.link}`}
                className={styles.bookTitleLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={styles.bookCover}>
                  <Image
                    src={book.coverUrl}
                    alt={`Cover of ${book.title}`}
                    width={60}
                    height={90}
                    className={styles.coverImage}
                  />
                  <PiHeadphones
                    className={styles.audioIcon}
                    aria-label="Audiobook"
                  />
                </div>
                <div className={styles.titleAuthorWrapper}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookAuthor}>By {book.author}</p>
                </div>
              </a>
              <div className={styles.rightContent}>
                {renderRating(book.rating)}
                <p className={styles.dateRead}>
                  Finished {moment(book.dateRead).format("MMMM D, YYYY")}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
