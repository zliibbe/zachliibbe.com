import styles from "../page.module.css";
import Image from "next/image";
import nextSvg from "../../../public/next.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faSpotify,
  faStrava,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

export default function Footer() {
  return (
    <footer>
      <hr className={styles.divider}></hr>
      <div className={`footer-grid, ${styles.grid}`}>
        <div className={`footer-grid, ${styles.description}`}>
          <p className="live-feed">Live Feed</p>
          <a href="https://www.strava.com/athletes/zachliibbe">
            <FontAwesomeIcon icon={faStrava} /> <p className="strava">Strava</p>
          </a>
          <a href="https://open.spotify.com/user/zliibbe86?si=NsI7mNaCSYuBRLlYryIwYw">
            <FontAwesomeIcon icon={faSpotify} />{" "}
            <p className="strava">Spotify</p>
          </a>
        </div>
        <div className="footer-social-and-byline">
          <div className="footer-social-icon">
            <a href="https://linkedin.com/in/zachliibbe">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </a>
            <a href="https://github.com/zliibbe">
              <FontAwesomeIcon icon={faGithub} />
            </a>
            <a href="/contact">
              <FontAwesomeIcon icon={faEnvelope} />
            </a>
          </div>
          <div className="footer-copywright">
            Built using
            <strong>
              <a href="https://nextjs.org">
                <span className={styles.logo}>
                  <Image
                    src="/next.svg"
                    alt="Next.js logo"
                    height={25}
                    width={25}
                  />
                </span>
              </a>
            </strong>
            and
            <strong>
              <a href="https://vercel.com/">
                <span className={styles.logo}>
                  <Image
                    src="/vercel.svg"
                    alt="Vercel logo"
                    width={25}
                    height={25}
                  />
                </span>
              </a>
            </strong>
            in
            <strong> Colorado Springs, CO</strong>
          </div>
        </div>
      </div>
    </footer>
  );
}
