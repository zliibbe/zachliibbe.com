"use client";

import { Session } from "next-auth";
import Link from "next/link";
import styles from "./BlogAdmin.module.css";

interface BlogAdminProps {
  session: Session;
}

export default function BlogAdmin({ session }: BlogAdminProps) {
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <main className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div>
                <Link href="/admin" className={styles.backLink}>
                  ← Admin Dashboard
                </Link>
                <h1>Blog Management</h1>
              </div>
              <button className={styles.newPostButton}>New Post</button>
            </div>
          </header>

          <div className={styles.blogAdmin}>
            <div className={styles.tabsContainer}>
              <div className={styles.tabs}>
                <button className={`${styles.tab} ${styles.tabActive}`}>
                  All Posts
                </button>
                <button className={styles.tab}>Published</button>
                <button className={styles.tab}>Drafts</button>
                <button className={styles.tab}>Scheduled</button>
              </div>
            </div>

            <div className={styles.postsContainer}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📝</div>
                <h3>No posts yet</h3>
                <p>Create your first blog post to get started.</p>
                <button className={styles.createFirstPostButton}>
                  Create First Post
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
