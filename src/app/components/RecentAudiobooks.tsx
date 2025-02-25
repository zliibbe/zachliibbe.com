"use client";

import React, { useEffect, useState } from "react";
import styles from "./RecentBooks.module.css"; // Reusing the same styles
import moment from "moment";
import Image from "next/image";
import { PiHeadphones } from "react-icons/pi";

interface Audiobook {
  title: string;
  author: string;
  coverImg: string;
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

  useEffect(() => {
    async function fetchAudiobooks() {
      try {
        const response = await fetch("/api/feed/goodreads");
        const data = await response.json();
        setAudiobooks(data.audiobooks);
      } catch (error) {
        console.error("Error fetching audiobooks:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAudiobooks();
  }, []);

  if (isLoading) return <div>Loading recent audiobooks...</div>;

  return (
    <div className={styles.bookList}>
      {audiobooks.map((book, index) => (
        <a
          href={book.link}
          key={index}
          className={styles.bookItem}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className={styles.bookIndex}>{index + 1}.</div>
          <div className={styles.bookCover}>
            <Image
              src={book.coverImg}
              alt={`Cover of ${book.title}`}
              width={50}
              height={75}
              className={styles.coverImage}
            />
            <PiHeadphones className={styles.audioIcon} />
          </div>
          <div className={styles.bookInfo}>
            <h3 className={styles.bookTitle}>{book.title}</h3>
            <p className={styles.bookAuthor}>{book.author}</p>
            <p className={styles.dateRead}>
              Finished {moment(book.dateRead).fromNow()}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
