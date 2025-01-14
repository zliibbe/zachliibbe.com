"use client";
import styles from "./Footer.module.css";
import Image from "next/image";
import {
  FaGithub,
  FaSpotify,
  FaStrava,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.liveFeed}>
          <p className={styles.liveFeedHeader}>See What I've Been Up To:</p>
          <div className={styles.liveFeedList}>
            <a
              className={styles.liveFeedItem}
              href="https://www.strava.com/athletes/zachliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.feedIcon}>
                <FaStrava className={styles.stravaIcon} size={30} />
              </span>
              <p className={styles.liveFeedText}>Strava</p>
            </a>

            <a
              className={styles.liveFeedItem}
              href="https://open.spotify.com/user/zliibbe86?si=NsI7mNaCSYuBRLlYryIwYw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.feedIcon}>
                <FaSpotify className={styles.spotifyIcon} size={30} />
              </span>
              <p className={styles.liveFeedText}>Spotify</p>
            </a>
          </div>
        </div>

        <div className={styles.socialsAndCopywrite}>
          <div className={styles.socials}>
            <a
              className={styles.socialLink}
              href="https://linkedin.com/in/zach-liibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin
                className={`${styles.socialIcon} ${styles.linkedinIcon}`}
              />
            </a>

            <a
              className={styles.socialLink}
              href="https://github.com/zliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className={styles.socialIcon} />
            </a>

            <a className={styles.socialLink} href="/contact">
              <FaEnvelope className={styles.socialIcon} />
            </a>
          </div>
          <div className={styles.copywrite}>
            © 2024, built using
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.techLink}
            >
              <Image
                className={styles.nextVercelIcon}
                src="/next.svg"
                alt="Next.js logo"
                sizes="60"
                height={60}
                width={60}
              />
            </a>
            and
            <a
              className={styles.techLink}
              href="https://vercel.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className={styles.nextVercelIcon}
                src="/vercel.svg"
                alt="Vercel logo"
                width={60}
                height={60}
              />
            </a>
            in Colorado Springs, CO
          </div>
        </div>
      </div>
    </footer>
  );
}
