import React from "react";
import styles from "./Header.module.css";
import Link from "next/link";

export default function PrimaryNav() {
  return (
    <ul id="primaryNav" className={styles.nav}>
      <li>
        <Link href="/about" className={styles.navLink}>
          About
        </Link>
      </li>
      <li>
        <Link href="/work" className={styles.navLink}>
          Work
        </Link>
      </li>
      <li>
        <Link href="/contact" className={styles.navLink}>
          Contact
        </Link>
      </li>
    </ul>
  );
}
