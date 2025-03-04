import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../live-feed/LiveFeed.module.css";
import { PiHeadphones } from "react-icons/pi";
import { FaStar, FaStarHalf } from "react-icons/fa6";
import { formatDate, cleanGoodreadsUrl } from "@/app/utils";

interface Audiobook {
  title: string;
  author: string;
  coverImg?: string;
  coverUrl?: string;
  rating: number;
  link?: string;
  bookLink?: string;
  dateRead: string;
}

// Fallback data in case the API fails
const fallbackAudiobooks: Audiobook[] = [
  {
    title: "Good Inside",
    author: "Dr. Becky Kennedy",
    coverImg: "https://covers.openlibrary.org/b/id/12953057-M.jpg",
    bookLink: "https://www.goodreads.com/book/show/59912428-good-inside",
    dateRead: "2023-07-10",
    rating: 5,
  },
  {
    title: "The Anxious Generation",
    author: "Jonathan Haidt",
    coverImg: "https://covers.openlibrary.org/b/id/14438175-M.jpg",
    bookLink:
      "https://www.goodreads.com/book/show/61313190-the-anxious-generation",
    dateRead: "2023-06-05",
    rating: 5,
  },
  {
    title: "How Emotions Are Made",
    author: "Lisa Feldman Barrett",
    coverImg: "https://covers.openlibrary.org/b/id/8242255-M.jpg",
    bookLink:
      "https://www.goodreads.com/book/show/23719305-how-emotions-are-made",
    dateRead: "2023-05-15",
    rating: 4.5,
  },
];

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
        // Use local API route in development, direct Lambda in production
        const isDevelopment = process.env.NODE_ENV === "development";
        const useLocalLambda =
          process.env.NEXT_PUBLIC_USE_LOCAL_LAMBDA === "true";

        let endpoint;
        if (isDevelopment && useLocalLambda) {
          endpoint = `${process.env.GOODREADS_GETAUDIOBOOKS_URL_LOCAL}`;
        } else {
          endpoint = `${process.env.GOODREADS_GETAUDIOBOOKS_URL_PROD}`;
        }

        const response = await fetch(endpoint, {
          // Add cache control to prevent stale data
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.books && data.books.length > 0) {
          // Process the book data to ensure image URLs use the proxy
          const processedBooks = data.books.map((book: Audiobook) => ({
            ...book,
            coverImg: book.coverImg
              ? `/api/image-proxy?url=${encodeURIComponent(book.coverImg)}`
              : book.coverUrl
                ? `/api/image-proxy?url=${encodeURIComponent(book.coverUrl)}`
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
          console.warn("No audiobooks returned from API, using fallback data");
          setAudiobooks(fallbackAudiobooks);
          setUsedFallback(true);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching audiobooks:", err);
        setError("Failed to load audiobooks. Using fallback data instead.");
        setAudiobooks(fallbackAudiobooks);
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
