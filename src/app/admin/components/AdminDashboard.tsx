"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./AdminDashboard.module.css";

interface AdminDashboardProps {
  session: Session;
}

interface BlogStats {
  published: number;
  drafts: number;
  scheduled: number;
}

export default function AdminDashboard({ session }: AdminDashboardProps) {
  const [stats, setStats] = useState<BlogStats>({
    published: 0,
    drafts: 0,
    scheduled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/blog/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading blog stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="universal-gradient-container">
      <div className="universal-gradient-background" />
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <main className={styles.content}>
            <header className={styles.header}>
              <div className={styles.headerContent}>
                <h1>Admin Dashboard</h1>
                <div className={styles.userInfo}>
                  <span>
                    Welcome, {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className={styles.signOutButton}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </header>

            <div className={styles.dashboard}>
              <div className={styles.cardGrid}>
                <Link href="/admin/blog" className={styles.card}>
                  <div className={styles.cardIcon}>📝</div>
                  <h3>Blog Management</h3>
                  <p>Create, edit, and schedule blog posts</p>
                </Link>

                <div className={styles.card}>
                  <div className={styles.cardIcon}>📊</div>
                  <h3>Analytics</h3>
                  <p>View site traffic and engagement metrics</p>
                  <span className={styles.comingSoon}>Coming Soon</span>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardIcon}>⚙️</div>
                  <h3>Site Settings</h3>
                  <p>Configure site-wide options and preferences</p>
                  <span className={styles.comingSoon}>Coming Soon</span>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardIcon}>💬</div>
                  <h3>Chat Knowledge</h3>
                  <p>Manage AI chat knowledge base content</p>
                  <span className={styles.comingSoon}>Coming Soon</span>
                </div>
              </div>

              <div className={styles.quickStats}>
                <h2>Quick Overview</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>
                      {loading ? "..." : stats.published}
                    </div>
                    <div className={styles.statLabel}>Published Posts</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>
                      {loading ? "..." : stats.drafts}
                    </div>
                    <div className={styles.statLabel}>Draft Posts</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>
                      {loading ? "..." : stats.scheduled}
                    </div>
                    <div className={styles.statLabel}>Scheduled Posts</div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
