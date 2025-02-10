import Link from "next/link";
import styles from "./page.module.css";
export default function NotFound() {
  return (
    <div className={styles.notFound}>
      <h2>That page doesn&apos;t exist! </h2>
      <Link href="/" className={styles.link}>
        Return Home
      </Link>
    </div>
  );
}
