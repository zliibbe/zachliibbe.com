"use client";

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

export default function Footer() {
  const [activity, setActivity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchActivity();

    const interval = setInterval(() => {
      fetchActivity();
    }, 300000);

    return () => clearInterval(interval);
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
    return moment(activity.start_date_local).startOf("day").fromNow();
  };

  const formatElapsedTime = (seconds: number) => {
    if (!seconds) return "0 min";

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    }

    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const getActivityDisplay = () => {
    if (loading) return "Loading...";
    if (error) return error;
    if (!activity) return "No recent activity";

    const getActivityText = () => {
      const daysAgo = getDaysAgo(activity);

      switch (activity.type) {
        case "Walk":
          return `Recorded a ${formatDistanceToMiles(
            activity.distance
          )} walk ${getDaysAgo(activity)}.`; // Recorded a *3 mile walk* six days ago TODO*link to /feed*
        case "WeightTraining":
          return `Lifted weights for ${activity.elapsed_time} ${daysAgo}.`; // Lifted weights for 30 minutes 2 days ago.
        case "Ride":
          return `Recorded a ${formatDistanceToMiles(
            activity.distance
          )} ${daysAgo}.`;
        case "Run":
          return `Recorded a ${formatDistanceToMiles(
            activity.formatDistanceToYards
          )} run ${daysAgo}.`; // Recorded a 3 mile run 2 days ago.
        case "Swim":
          return `Recorded a ${formatDistanceToYards(
            activity.distance
          )} swim in ${formatElapsedTime(activity.elapsed_time)} ${daysAgo}.`; // Recorded a 800 yard swim in 40 minutes 2 days ago.
        default:
          return `Recorded a ${activity.name} - ${formatDistanceToMiles(
            activity.distance
          )} ${daysAgo}.`;
      }
    };

    return getActivityText();
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.liveFeed}>
          <p className={styles.liveFeedHeader}>Live Feed:</p>
          <div className={styles.liveFeedList}>
            <a
              className={styles.liveFeedItem}
              href="https://www.strava.com/athletes/zachliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.feedIcon}>
                <FaStrava className={styles.stravaIcon} size={30} />
              </span>
              <p className={styles.liveFeedText}>{getActivityDisplay()}</p>
            </a>

            <a
              className={styles.liveFeedItem}
              href="https://www.goodreads.com/review/list/24890536-zach?shelf=zach-read&sort=date_read"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.feedIcon}>
                <FaGoodreads className={styles.goodreadsIcon} size={30} />
              </span>
              <p className={styles.liveFeedText}>Goodreads</p>
            </a>
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
            © 2025, built using
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
            and
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
            in Colorado Springs, CO
          </div>
        </div>
      </div>
    </footer>
  );
}
