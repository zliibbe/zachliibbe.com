import Layout from "../dashboard/layout";
import styles from '../page.module.css';

export default  function Footer() {
  return (
    <footer className={styles.grid}>
      <h2>I'm the footer</h2>
      <div className={styles.description}>
        <p className="live-feed">Live Feed</p>
      </div>
    </footer>
  )
}
