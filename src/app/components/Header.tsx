import Link from 'next/link';
import styles from '../page.module.css'

const Header = () => {
  return (    
    <nav>
      <ul className={styles.center}>
        <Link href="/" className={styles.description}>Home</Link>
        <Link href="/about" className={styles.description}>About</Link>
        <Link href="/work" className={styles.description}>Work</Link>
        <Link href="/contact" className={styles.description}>Contact</Link>
      </ul>
    </nav>
    );
}
 
export default Header;