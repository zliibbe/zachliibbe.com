import React from "react";
import styles from "./page.module.css";
import Footer from "../components/Footer";
import { Metadata } from "next";
import { Jobs } from "../components/Jobs";

export default function Work() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <div className={styles.overviewAndRecent}>
              <div className={styles.overviewSection}>
                <h2 className={styles.overviewTitle}>Overview</h2>
                <p className={styles.overviewText}>
                  I&apos;m an experienced Full-stack Software Engineer and
                  Frontend-focused Web Developer with a passion for simple,
                  clean design that delivers clear messages and intuitive user
                  experiences.
                </p>
                <p className={styles.overviewText}>
                  I love being part of a collaborative team where I can
                  contribute meaningful work and grow. In my experience, the
                  best tech solutions come from diverse perspectives and strong
                  teamwork.
                </p>
                <p className={styles.overviewText}>
                  Before transitioning to tech, I was a cardiac nurse manager. I
                  started my career transporting patients, then worked my way up
                  to CNA, RN, and eventually Nurse Manager. Along the way, I
                  discovered web development while creating tools to support my
                  cardiac team, which inspired me to pursue it full-time.
                </p>
                <p className={styles.overviewText}>
                  With a background in Philosophy and English, I bring strong
                  analytical, pattern recognition, and communication skills to
                  software engineering, helping me build clear, well-structured
                  systems.
                </p>
              </div>
              <div className={styles.recentSection}>
                <h6 className={styles.recentTitle}>
                  What I&apos;ve been up to recently...
                </h6>
                <li className={styles.recentItem}>
                  Consulting and working with my therapeutic clients (typically
                  therapists) to improve their websites and digital marketing
                  tactics in order to generate more clients with less effort.
                </li>
                <li className={styles.recentItem}>
                  Spending quality time with my 5 & 2.5 year-old daughters. 🥰
                </li>
                <li className={styles.recentItem}>
                  Lifting weights at the gym in the early morning (I&apos;m
                  really enjoying the progressive overload of{" "}
                  <a
                    className={styles.link}
                    href="https://stronglifts.com/5x5/"
                  >
                    Stronglifts 5x5
                  </a>
                  ) 🏋🏼
                </li>
              </div>
            </div>
            <br />
            <div className={styles.experienceSection}>
              <h2 className={styles.experienceTitle}>Experience</h2>
              <Jobs />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: "Work | zachliibbe.com",
};
