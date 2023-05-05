import Link from "next/link";
import styles from "../page.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMountainSun, faBars } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  return (
    <nav className={styles.flex}>
      <ul className={styles.flex}>
        <li>
          <Link href="/" className={`home-icon ${styles.description}`}>
            <FontAwesomeIcon icon={faMountainSun} />
          </Link>
        </li>
        <li>
          <Link href="/about" className={styles.description}>
            About
          </Link>
        </li>
        <li>
          <Link href="/work" className={styles.description}>
            Work
          </Link>
        </li>
        <li>
          <Link href="/contact" className={styles.description}>
            Contact
          </Link>
        </li>
        <FontAwesomeIcon icon={faBars} />
      </ul>
    </nav>
  );
};

export default Header;
