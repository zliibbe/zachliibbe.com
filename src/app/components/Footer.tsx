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
      <div className={`footer-grid, grid`}>
        <div className={`footer-grid, ${styles.description}`}>
          <p className="live-feed">Live Feed</p>
          
          <div className="flex">
            <a
              href="https://www.strava.com/athletes/zachliibbe"
              target="_blank"
              rel="noopener noreferrer"
              className={`row-auto`}
            >
              <FontAwesomeIcon icon={faStrava} /> <p className="strava">Strava</p>
            </a>
          </div>
          

          <a
            href="https://open.spotify.com/user/zliibbe86?si=NsI7mNaCSYuBRLlYryIwYw"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faSpotify} className="p-2"/>{" "}
            <p className="strava">Spotify</p>
          </a>

        </div>
        <div className={`footer-social-and-byline, flex, px-4`}>
          <div className={`footer-social-icon, px-3`}>
            <a
              href="https://linkedin.com/in/zachliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faLinkedinIn} className="w-7 p-2 m-2"/>
            </a>

            <a
              href="https://github.com/zliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faGithub} className="w-7 p-2 m-2"/>
            </a>

            <a href="/contact">
              <FontAwesomeIcon icon={faEnvelope} className="w-7 p-2 m-2"/>
            </a>
          </div>
          <div className={`footer-copywright, `}>
            Built using
            <strong>
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={`${styles.logo}, px-3`}>
                  <Image
                    src="/next.svg"
                    alt="Next.js logo"
                    height={44}
                    width={44}
                  />
                </span>
              </a>
            </strong>
            and
            <strong>
              <a
                href="https://vercel.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.logo}>
                  <Image
                    src="/vercel.svg"
                    alt="Vercel logo"
                    width={44}
                    height={44}
                  />
                </span>
              </a>
            </strong>
            in 
            <strong>Colorado Springs, CO</strong>
          </div>
        </div>
      </div>
    </footer>
  );
}
