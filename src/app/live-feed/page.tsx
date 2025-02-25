"use client";

import React, { useEffect, useState } from "react";
import styles from "./LiveFeed.module.css";
import ActivityGrid from "../components/ActivityGrid";
import RecentBooks from "../components/RecentBooks";
import RecentAudiobooks from "../components/RecentAudiobooks";
import { getStravaActivities } from "@/lib/strava/utils";
import { StravaActivity } from "@/lib/strava/types";

export default function LiveFeedPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getStravaActivities();
        setActivities(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Feed</h1>
      <p className={styles.subtitle}>
        A live feed of my recent activity in the real world.
      </p>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Activities</h2>
          <p>
            A collection of my (mostly) outdoor activities tracked through the{" "}
            <a href="https://developers.strava.com/" className={styles.apiLink}>
              Strava API
            </a>
            .
          </p>
        </div>

        {isLoading && <p>Loading activities...</p>}
        {error && <p className={styles.error}>Error: {error}</p>}
        {!isLoading && !error && activities.length > 0 && (
          <ActivityGrid activities={activities} />
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Reading</h2>
          <p>
            Recent books from my{" "}
            <a
              href="https://www.goodreads.com/user/show/24890536-zach-liibbe"
              className={styles.apiLink}
            >
              Goodreads
            </a>{" "}
            shelf.
          </p>
        </div>
        <RecentBooks />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Audiobooks</h2>
          <p>Latest audiobooks I&apos;ve listened to.</p>
        </div>
        <RecentAudiobooks />
      </section>
    </main>
  );
}
