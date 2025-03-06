import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../live-feed/LiveFeed.module.css";
import { PiHeadphones } from "react-icons/pi";
import { FaStar, FaStarHalf } from "react-icons/fa6";
import { formatDate, cleanGoodreadsUrl } from "@/app/utils/index";

interface Audiobook {
  title: string;
  author: string;
  coverImg?: string | null;
  coverUrl?: string;
  rating: number;
  link?: string;
  bookLink?: string;
  dateRead: string;
  _error?: string;
}

interface RecentAudiobooksProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function RecentAudiobooks({
  onLoadingChange,
}: RecentAudiobooksProps) {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    async function fetchAudiobooks() {
      setLoading(true);
      if (onLoadingChange) onLoadingChange(true);

      try {
        // Determine environment and use appropriate endpoint
        const isDevelopment = process.env.NODE_ENV === "development";
        const endpoint = isDevelopment
          ? "/api/goodreads/audiobooks"
          : "/api/goodreads/audiobooks";

        const response = await fetch(endpoint, {
          // Use SWR-like pattern with stale-while-revalidate
          cache: "force-cache",
          next: {
            revalidate: 3600, // Revalidate every hour
            tags: ["audiobooks"],
          },
        });

        if (!response.ok) {
          console.error(`HTTP error! Status: ${response.status}`);
          throw new Error(`Failed to fetch audiobooks: ${response.status}`);
        }

        const data = await response.json();

        // Check if data is an array with error information
        if (Array.isArray(data) && data.length > 0 && data[0]._error) {
          setError(data[0]._error);
          setAudiobooks(data); // Still set the audiobooks even with error
          setUsedFallback(true);
        } else if (Array.isArray(data) && data.length > 0) {
          // Process the audiobook data as normal
          const processedBooks = data.map((book: Audiobook) => ({
            ...book,
            coverImg: book.coverImg
              ? `/api/utils/image-proxy?url=${encodeURIComponent(book.coverImg)}`
              : null,
            bookLink: book.link
              ? cleanGoodreadsUrl(book.link, book.title)
              : book.title
                ? `https://www.goodreads.com/book/title?id=${encodeURIComponent(book.title)}`
                : "#",
          }));

          setAudiobooks(processedBooks);
          setUsedFallback(false);
        } else {
          console.warn("No audiobooks returned from API");
          setError("No audiobooks data received");
          setAudiobooks([]);
          setUsedFallback(true);
        }
      } catch (err) {
        console.error("Error fetching audiobooks:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch audiobooks",
        );
        // Don't set fallback audiobooks here, they should come from the API
        setUsedFallback(true);
      } finally {
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    }

    fetchAudiobooks();
  }, [onLoadingChange]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Add filled stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className={styles.starIcon} />);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<FaStarHalf key="half-star" className={styles.starIcon} />);
    }

    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaStar
          key={`empty-star-${i}`}
          className={`${styles.starIcon} ${styles.starEmpty}`}
        />,
      );
    }

    return stars;
  };

  if (loading) {
    return <p className={styles.loadingText}>Loading recent audiobooks...</p>;
  }

  if (error) {
    return (
      <>
        <p className={styles.error}>Error: {error}</p>
        <div className={styles.bookGrid}>
          {audiobooks.map((book) => (
            <div key={book.title + book.author} className={styles.bookCard}>
              <a
                href={book.bookLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bookLinkWrapper}
              >
                <div className={styles.bookCoverContainer}>
                  {book.coverImg ? (
                    <div className={styles.coverWrapper}>
                      <Image
                        src={book.coverImg}
                        alt={`Cover of ${book.title}`}
                        className={styles.bookCover}
                        width={100}
                        height={150}
                      />
                      <div className={styles.audiobookIcon}>
                        <PiHeadphones />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.noCover}>
                      <PiHeadphones size={24} />
                      <span>No Cover</span>
                    </div>
                  )}
                </div>

                <div className={styles.bookContent}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookAuthor}>{book.author}</p>
                </div>
              </a>

              <div className={styles.bookMeta}>
                <div className={styles.rating}>{renderStars(book.rating)}</div>
                <span className={styles.dateRead}>
                  Finished: {formatDate(book.dateRead)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className={styles.bookGrid}>
      {audiobooks.map((book) => (
        <div key={book.title + book.author} className={styles.bookCard}>
          <a
            href={book.bookLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookLinkWrapper}
          >
            <div className={styles.bookCoverContainer}>
              {book.coverImg ? (
                <div className={styles.coverWrapper}>
                  <Image
                    src={book.coverImg}
                    alt={`Cover of ${book.title}`}
                    className={styles.bookCover}
                    width={100}
                    height={150}
                  />
                  <div className={styles.audiobookIcon}>
                    <PiHeadphones />
                  </div>
                </div>
              ) : (
                <div className={styles.noCover}>
                  <PiHeadphones size={24} />
                  <span>No Cover</span>
                </div>
              )}
            </div>

            <div className={styles.bookContent}>
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <p className={styles.bookAuthor}>{book.author}</p>
            </div>
          </a>

          <div className={styles.bookMeta}>
            <div className={styles.rating}>{renderStars(book.rating)}</div>
            <span className={styles.dateRead}>
              Finished: {formatDate(book.dateRead)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
