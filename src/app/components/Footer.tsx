import Layout from "../dashboard/layout";
import styles from '../page.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faLinkedin,
        faGithub,
      } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope, 
         } from '@fortawesome/free-regular-svg-icons';
import '@fortawesome/fontawesome-svg-core/styles.css'

export default  function Footer() {
  return (
    <footer>
        <hr className={styles.divider}></hr>
        <div className={`footer-grid, ${styles.grid}`}>
          <div className={`footer-grid, ${styles.description}`}>
            <p className="live-feed">Live Feed</p>
            <p className="strava">Strava</p>
            <p className="spotify">Spotify</p>
          </div>
          <div className="footer-social-and-byline">
            <div className="footer-social-icon">
              <a href="https://linkedin.com/in/zachliibbe"> <FontAwesomeIcon icon={faLinkedin} /> </a>
              <a href="https://github.com/zliibbe"> <FontAwesomeIcon icon={faGithub} /> </a>
              <a href="/contact"> <FontAwesomeIcon icon={faEnvelope} /> </a>  
            </div>
            <div className="footer-copywright">
              Built using 
              <strong><a href="https://nextjs.org"> Next.js </a></strong>
              and
              <strong><a href="https://vercel.com/"> Vercel </a></strong>
              in     
              <strong> Colorado Springs, CO</strong>
            </div>
          </div>
        </div>
    </footer>
  )
}
