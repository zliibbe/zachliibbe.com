import Layout from "../dashboard/layout";
import styles from "./page.module.css";
import Footer from "../components/Footer";

export default function Work() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.overview}>
            <h2 className={styles.overviewTitle}>Overview</h2>
            <p className={styles.overviewText}>
              Experienced Front End Engineer with a passion for simple, clean
              design that deliver a clear message to users.
            </p>
            <p className={styles.overviewText}>
              I am excited about finding a team of people who I can collaborate
              with. My observation in tech, is there are often
            </p>
            <p className={styles.overviewText}>
              In the past, I was a cardiac nurse manager.
            </p>
            <p className={styles.overviewText}>
              In the past, I studied Philosophy & English in undergrad. Studying
              and discussing these subjects has filled me with a zest for life.
            </p>
          </div>
          <div className={styles.recentSection}>
            <h6 className={styles.recentTitle}>
              What I've been up to recently...
            </h6>
            <li className={styles.recentItem}>
              Studying for the AWS Certified Cloud Solutions Architect exam. 🤓
            </li>
            <li className={styles.recentItem}>
              Running and walking as much as I can (check my Strava!) to get
              back in shape following a broken scapula & clavicle after a
              mountain bike crash in June. 😅
            </li>
            <li className={styles.recentItem}>
              Spending quality time with my 3.5 & 1 year-old daughters. 🥰
            </li>
          </div>
        </div>
        <br />
        <br />
        <div className={styles.experienceSection}>
          <h2 className={styles.experienceTitle}>Experience</h2>
          <p className={styles.experienceItem}>
            Job component(s) go here (coming soon)
          </p>
          <hr />
          <p className={styles.experienceItem}>
            Job component(s) go here (coming soon)
          </p>
          <hr />
          <p className={styles.experienceItem}>
            Job component(s) go here (coming soon)
          </p>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
