"use client";
import Link from "next/link";
import styles from "./PrimaryNav.module.css";
import { usePathname } from "next/navigation";

export default function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link
        href="/about"
        className={`${styles.navLink} ${pathname === "/about" ? styles.active : ""}`}
      >
        About
      </Link>
      <Link
        href="/work"
        className={`${styles.navLink} ${pathname === "/work" ? styles.active : ""}`}
      >
        Work
      </Link>
      <Link
        href="/live-feed"
        className={`${styles.navLink} ${pathname === "/live-feed" ? styles.active : ""}`}
      >
        Live Feed
      </Link>
      <Link
        href="/blog"
        className={`${styles.navLink} ${pathname?.startsWith("/blog") ? styles.active : ""}`}
      >
        Blog
      </Link>
      <Link
        href="/contact"
        className={`${styles.navLink} ${pathname === "/contact" ? styles.active : ""}`}
      >
        Contact
      </Link>
    </nav>
  );
}
