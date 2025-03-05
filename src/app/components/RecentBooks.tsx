import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../live-feed/LiveFeed.module.css";
import { FaStar, FaStarHalf } from "react-icons/fa6";
import { formatDate, cleanGoodreadsUrl } from "@/app/utils/index";

interface Book {
  title: string;
  author: string;
  coverImg?: string | null;
  coverUrl?: string;
  link: string;
  bookLink?: string;
  dateRead: string;
  rating: number;
}

// Fallback data with Open Library covers
const fallbackBooks: Book[] = [
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    coverImg: "https://covers.openlibrary.org/b/id/12003329-M.jpg",
    link: "https://www.goodreads.com/book/show/5907.The_Hobbit",
    dateRead: "2023-06-15",
    rating: 5,
  },
  {
    title: "Jayber Crow",
    author: "Wendell Berry",
    coverImg: "https://covers.openlibrary.org/b/isbn/9781582431604-M.jpg",
    link: "https://www.goodreads.com/book/show/57460.Jayber_Crow",
    dateRead: "2023-05-20",
    rating: 5,
  },
  {
    title: "The Orchardist",
    author: "Amanda Coplin",
    coverImg: "https://covers.openlibrary.org/b/isbn/9780062188502-M.jpg",
    link: "https://www.goodreads.com/book/show/13540351-the-orchardist",
    dateRead: "2023-04-10",
    rating: 5,
  },
];

interface RecentBooksProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function RecentBooks({ onLoadingChange }: RecentBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      if (onLoadingChange) onLoadingChange(true);

      try {
        // Determine environment and use appropriate endpoint
        const isDevelopment = process.env.NODE_ENV === "development";
        const endpoint = isDevelopment
          ? "/api/goodreads/read-books"
          : "/api/goodreads/read-books";

        // console.log(
        //   `Fetching books from ${endpoint} (${isDevelopment ? "development" : "production"} environment)`,
        // );

        const response = await fetch(endpoint, {
          // Use SWR-like pattern with stale-while-revalidate
          cache: "force-cache",
          next: {
            revalidate: 3600, // Revalidate every hour
            tags: ["books"],
          },
        });

        if (!response.ok) {
          console.error(`HTTP error! Status: ${response.status}`);
          throw new Error(`Failed to fetch books: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          // Process the book data
          const processedBooks = data.map((book: Book) => ({
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

          setBooks(processedBooks);
          setUsedFallback(false);
        } else {
          console.warn("No books returned from API, using fallback data");
          setBooks(fallbackBooks);
          setUsedFallback(true);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch books");
        setBooks(fallbackBooks);
        setUsedFallback(true);
      } finally {
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    }

    fetchBooks();
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
    return <p className={styles.loadingText}>Loading recent books...</p>;
  }

  if (error) {
    return (
      <>
        <p className={styles.error}>Error: {error}</p>
        <div className={styles.bookGrid}>
          {books.map((book) => (
            <div key={book.title + book.author} className={styles.bookCard}>
              <a
                href={book.bookLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bookLinkWrapper}
              >
                <div className={styles.bookCoverContainer}>
                  <Image
                    src={book.coverImg || "/images/no-cover.svg"}
                    alt={`Cover of ${book.title}`}
                    className={styles.bookCover}
                    width={100}
                    height={150}
                    onError={() => {
                      const updatedBooks = [...books];
                      const bookIndex = updatedBooks.findIndex(
                        (b) =>
                          b.title === book.title && b.author === book.author,
                      );
                      if (bookIndex !== -1) {
                        updatedBooks[bookIndex] = {
                          ...updatedBooks[bookIndex],
                          coverImg: null,
                        };
                        setBooks(updatedBooks);
                      }
                    }}
                  />
                </div>

                <div className={styles.bookContent}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookAuthor}>{book.author}</p>
                </div>
              </a>

              <div className={styles.bookMeta}>
                {book.rating > 0 && (
                  <div className={styles.rating}>
                    {renderStars(book.rating)}
                  </div>
                )}
                {book.dateRead && (
                  <p className={styles.bookDate}>
                    Finished: {formatDate(book.dateRead)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className={styles.bookGrid}>
      {books.map((book) => (
        <div key={book.title + book.author} className={styles.bookCard}>
          <a
            href={book.bookLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookLinkWrapper}
          >
            <div className={styles.bookCoverContainer}>
              <Image
                src={book.coverImg || "/images/no-cover.png"}
                alt={`Cover of ${book.title}`}
                className={styles.bookCover}
                width={100}
                height={150}
                onError={() => {
                  const updatedBooks = [...books];
                  const bookIndex = updatedBooks.findIndex(
                    (b) => b.title === book.title && b.author === book.author,
                  );
                  if (bookIndex !== -1) {
                    updatedBooks[bookIndex] = {
                      ...updatedBooks[bookIndex],
                      coverImg: null,
                    };
                    setBooks(updatedBooks);
                  }
                }}
              />
            </div>

            <div className={styles.bookContent}>
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <p className={styles.bookAuthor}>{book.author}</p>
            </div>
          </a>

          <div className={styles.bookMeta}>
            {book.rating > 0 && (
              <div className={styles.rating}>{renderStars(book.rating)}</div>
            )}
            {book.dateRead && (
              <p className={styles.bookDate}>
                Finished: {formatDate(book.dateRead)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
