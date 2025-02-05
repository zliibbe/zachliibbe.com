"use client";

import React from "react";
import { useEffect, useState } from "react";
import styles from "./Footer.module.css";
import Image from "next/image";
import {
  FaGithub,
  FaGoodreads,
  FaStrava,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa6";
import getLatestActivity from "../api/getLatestActivity";
import moment from "moment";
import CurrentlyReading from "./CurrentlyReading";
type Book = {
  title: string;
  currentPage: number | null;
  totalPages: number | null;
};

export default function Footer() {
  const [activity, setActivity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentlyReading, setCurrentlyReading] = useState<Book[]>([]);
  const [bookLoading, setBookLoading] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

  const year = moment().year();

  // Strava Activity Fetching
  async function fetchActivity() {
    try {
      setLoading(true);
      setError(null);
      const latestActivity = await getLatestActivity();
      setActivity(latestActivity);
    } catch (err: any) {
      console.error("Footer: Error fetching activity:", err.message);
      setError("Failed to load most-recent activity");
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }

  // Goodreads Book Fetching
  async function fetchBooks() {
    try {
      setBookLoading(true);
      setBookError(null);
      const response = await fetch(
        process.env.NEXT_PUBLIC_GOODREADS_LAMBDA_URL || "",
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.status}`);
      }
      const data = await response.json();
      if (!data.books) {
        throw new Error("No books data received");
      }
      setCurrentlyReading(data.books);
    } catch (err) {
      console.error("Error fetching books:", err);
      setBookError(
        err instanceof Error ? err.message : "Failed to fetch books",
      );
      setCurrentlyReading([]); // Reset books on error
    } finally {
      setBookLoading(false);
    }
  }

  useEffect(() => {
    fetchActivity();
    fetchBooks();

    const activityInterval = setInterval(fetchActivity, 1800000); // 30 minutes
    const booksInterval = setInterval(fetchBooks, 3600000); // 60 minutes

    return () => {
      clearInterval(activityInterval);
      clearInterval(booksInterval);
    };
  }, []);

  const formatDistanceToMiles = (meters: number) => {
    if (!meters) return "0 mi";
    const miles = (meters / 1609.344).toFixed(0);
    return `${miles}-mile`;
  };

  const formatDistanceToYards = (meters: number) => {
    if (!meters) return "0 yards";
    const yards = (meters * 1.094).toFixed(0); // Convert meters to yards
    return `${yards}-yard`;
  };

  const getDaysAgo = (activity: any) => {
    const localTimeString = activity.start_date_local.replace("Z", "");
    const activityDate = moment(localTimeString);
    const now = moment();
    const hoursSince = now.diff(activityDate, "hours");

    if (hoursSince < 1) return "less than an hour ago";
    if (hoursSince < 24)
      return `${hoursSince} hour${hoursSince === 1 ? "" : "s"} ago`;
    if (hoursSince < 48) return "yesterday";
    return activityDate.fromNow();
  };

  const formatElapsedTime = (seconds: number) => {
    if (!seconds) return "0 min";

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return minutes === 1 ? "1 minute" : `${minutes} minutes`;
    }

    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const getActivityDisplay = () => {
    if (loading) return { text: "Loading activity...", isLoading: true };
    if (error) return { text: error, isLoading: false };
    if (!activity) return { text: "No recent activity", isLoading: false };

    const getActivityText = () => {
      const daysAgo = getDaysAgo(activity);
      const activityUrl = `https://www.strava.com/activities/${activity.id}`;

      switch (activity.type) {
        case "Walk":
          return (
            <>
              Recorded a{" "}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatDistanceToMiles(activity.distance)} walk
              </a>{" "}
              {daysAgo}.
            </>
          );
        case "WeightTraining":
          return (
            <>
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Lifted weights
              </a>{" "}
              for {formatElapsedTime(activity.elapsed_time)} {daysAgo}.
            </>
          );
        case "Ride":
          return (
            <>
              Recorded a{" "}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatDistanceToMiles(activity.distance)} ride
              </a>{" "}
              {daysAgo}.
            </>
          );
        case "Run":
          return (
            <>
              Recorded a{" "}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatDistanceToMiles(activity.distance)} run
              </a>{" "}
              {daysAgo}.
            </>
          );
        case "Swim":
          return (
            <>
              Recorded a{" "}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatDistanceToYards(activity.distance)} swim
              </a>{" "}
              {formatElapsedTime(activity.elapsed_time)} {daysAgo}.
            </>
          );
        default:
          return (
            <>
              Recorded{" "}
              <a
                href={activityUrl}
                className={styles.stravaLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {activity.name} - {formatDistanceToMiles(activity.distance)}
              </a>{" "}
              {daysAgo}.
            </>
          );
      }
    };

    return { text: getActivityText(), isLoading: false };
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.liveFeed}>
          <p className={styles.liveFeedHeader}>Live Feed:</p>
          <div className={styles.liveFeedList}>
            <div className={styles.liveFeedItem}>
              <a
                href="https://www.strava.com/athletes/zachliibbe"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.feedIcon}
              >
                <FaStrava className={styles.stravaIcon} size={30} />
              </a>
              <p
                className={`${styles.liveFeedText} ${
                  loading ? styles.loadingText : ""
                }`}
              >
                {getActivityDisplay().text}
              </p>
            </div>

            <div className={styles.liveFeedItem}>
              <a
                href="https://www.goodreads.com/user/show/24890536-zach-liibbe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.feedIcon}>
                  <FaGoodreads className={styles.goodreadsIcon} size={30} />
                </span>
              </a>
              <p className={styles.liveFeedText}>
                <CurrentlyReading />
              </p>
            </div>
          </div>
        </div>

        <div className={styles.socialsAndCopywrite}>
          <div className={styles.socials}>
            <a
              className={styles.socialLink}
              href="https://linkedin.com/in/zach-liibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin
                className={`${styles.socialIcon} ${styles.linkedInIcon}`}
              />
            </a>

            <a
              className={styles.socialLink}
              href="https://github.com/zliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className={styles.socialIcon} />
            </a>

            <a className={styles.socialLink} href="/contact">
              <FaEnvelope
                className={`${styles.socialIcon} ${styles.emailIcon}`}
              />
            </a>
          </div>
          <div className={styles.copywrite}>
            <span>© {year}, built using</span>
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.techLink}
            >
              <Image
                className={styles.nextVercelIcon}
                src="/next.svg"
                alt="Next.js logo"
                sizes="60"
                height={60}
                width={60}
              />
            </a>
            <span>and</span>
            <a
              className={styles.techLink}
              href="https://vercel.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className={styles.nextVercelIcon}
                src="/vercel.svg"
                alt="Vercel logo"
                width={60}
                height={60}
              />
            </a>
            <span>in Colorado Springs, CO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
