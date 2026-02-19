'use client';

import { useEffect, useState } from 'react';
import styles from './ReadingProgress.module.css';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      // Get the article content element to measure actual reading progress
      const article = document.querySelector('article');
      if (!article) return;

      // Calculate scroll progress based on article position
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Calculate progress: 0% at article start, 100% when article end reaches viewport top
      const scrollableDistance = articleHeight + articleTop - windowHeight;
      const scrollProgress = Math.max(0, scrollTop - articleTop);
      const progressPercentage = Math.min(
        100,
        (scrollProgress / scrollableDistance) * 100
      );

      setProgress(progressPercentage);
    };

    // Update on scroll
    window.addEventListener('scroll', updateProgress);
    // Update on resize
    window.addEventListener('resize', updateProgress);
    // Initial calculation
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div className={styles.progressContainer}>
      <div
        className={styles.progressBar}
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />
    </div>
  );
}
