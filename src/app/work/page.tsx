import React from 'react';
import styles from './page.module.css';
import Footer from '../components/Footer';
import { Metadata } from 'next';
import { Jobs } from '../components/Jobs';

export default function Work() {
  return (
    <>
      <main data-page="work">
        <div className="universal-gradient-container">
          <div className="universal-gradient-background"></div>
          <div className={styles.container}>
            <div className={styles.contentWrapper}>
              <div className={styles.content}>
                <div className={styles.overviewSection}>
                  <h2 className={styles.overviewTitle}>Overview</h2>
                  <p className={styles.overviewText}>
                    Full-stack Software Engineer with a frontend focus and a
                    background in cardiac nursing. I build clean, intuitive
                    interfaces and thrive on collaborative teams where diverse
                    perspectives drive better solutions.
                  </p>
                  <p className={styles.overviewText}>
                    My path from patient transporter to nurse manager to
                    developer taught me pattern recognition, clear
                    communication, and the value of building tools that
                    genuinely help people.
                  </p>
                </div>
                <br />
                <div className={styles.experienceSection}>
                  <h2 className={styles.experienceTitle}>Experience</h2>
                  <Jobs />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: 'Work Experience | Zach Liibbe - Full Stack Developer',
  description:
    'Full-stack Software Engineer with frontend focus. Former cardiac nurse manager turned web developer. Passionate about clean design, collaborative teamwork, and meaningful user experiences.',
  keywords: [
    'full stack developer',
    'software engineer',
    'web developer',
    'frontend developer',
    'React',
    'Next.js',
    'nurse manager',
    'healthcare tech',
  ],
  authors: [{ name: 'Zach Liibbe' }],
  creator: 'Zach Liibbe',
  openGraph: {
    title: 'Work Experience | Zach Liibbe - Full Stack Developer',
    description:
      'Full-stack Software Engineer with frontend focus. Former cardiac nurse manager turned web developer. Passionate about clean design, collaborative teamwork, and meaningful user experiences.',
    url: 'https://zachliibbe.com/work',
    siteName: 'Zach Liibbe',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Work Experience | Zach Liibbe - Full Stack Developer',
    description:
      'Full-stack Software Engineer with frontend focus. Former cardiac nurse manager turned web developer.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://zachliibbe.com/work',
  },
};
