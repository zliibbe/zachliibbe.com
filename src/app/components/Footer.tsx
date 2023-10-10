// import styles from "../page.module.css";
import styles from "./Footer.module.css";
import Image from "next/image";
import nextSvg from "../../../public/next.svg";
import {
  FaGithub,
  FaSpotify,
  FaStrava,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa6";

const liveFeedIcon = {
  color: "#000",
  fontSize: "2rem",
};

const socialIcons = {
  color: "--theme-complement",
  fontSize: "2rem",
  cursor: "pointer",
};

export default function Footer() {
  return (
    <footer className="footer tw-absolute tw-bottom-0 tw-w-screen">
      <div className="tw-flex tw-justify-between tw-mx-5">
        <div className={`live_feed tw-flex tw-flex-col tw-m-3 tw-py-4`}>
          <h4 className="live_feed_header tw-flex">Live Feed</h4>

          <div className="tw-flex tw-my-3">
            <a
              className="feed_icon tw-flex"
              href="https://www.strava.com/athletes/zachliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.feed_icon}>
                <FaStrava style={liveFeedIcon} />
              </span>
              <p className="strava_text tw-ml-2">Strava: api integration</p>
            </a>
          </div>

          <div className="tw-flex tw-gap-1">
            <a
              className="feed_icon tw-flex"
              href="https://open.spotify.com/user/zliibbe86?si=NsI7mNaCSYuBRLlYryIwYw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={`tw-flex ${styles.feed_icon}`}>
                <FaSpotify style={liveFeedIcon} />
              </span>
              <p className="spotify_text tw-ml-2">Spotify: api integration</p>
            </a>
          </div>
        </div>

        <div
          className={`social_and_byline tw-flex tw-flex-col tw-m-3 tw-py-4 tw-justify-items-center tw-align-middle`}
        >
          <div
            className={`social_icons tw-flex tw-flex-row-reverse tw-mx-4 tw-mb-4 `}
          >
            <a
              className="social_link linkedin tw-mx-4"
              href="https://linkedin.com/in/zachliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin style={socialIcons} />
            </a>

            <a
              className="social_link tw-mx-4"
              href="https://github.com/zliibbe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub style={socialIcons} />
            </a>

            <a className="social_link tw-mx-4" href="/contact">
              <FaEnvelope style={socialIcons} />
            </a>
          </div>
          <div className={`copywrite tw-flex tw-space-x-2 tw-py-4`}>
            © 2023, built using
            <a
              className="tw-mx-1 tw-items-center tw-justify-center tw-mt-2"
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/next.svg"
                alt="Next.js logo"
                height={60}
                width={60}
              />
            </a>
            and
            <a
              className="vercel_logo tw-mr-2  tw-items-center tw-justify-center tw-mt-2 tw-hover:bg-violet-600"
              href="https://vercel.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="tw-hover:bg-violet-600 tw-mr-2"
                src="/vercel.svg"
                alt="Vercel logo"
                width={60}
                height={60}
              />
            </a>
            in
            <strong> Colorado Springs, CO</strong>
          </div>
        </div>
      </div>
    </footer>
  );
}
