import Link from 'next/link';
import Footer from '@/app/components/Footer';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <>
      <main>
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.notFound}>
              <h1 className={styles.notFoundTitle}>Post Not Found</h1>
              <p className={styles.notFoundText}>
                The blog post you're looking for doesn't exist or may have been moved.
              </p>
              <Link href="/blog" className={styles.notFoundLink}>
                ← Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}