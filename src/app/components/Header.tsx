import Link from "next/link";
import styles from "../page.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMountainSun, faBars } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  return (
    <nav className={`tw-flex tw-w-full tw-justify-center tw-content-center`}>
      <div className={`tw-flex tw-items-center tw-content-start`}>
        <Link href="/" className={`home-icon ${styles.description} tw-hover:text-cyan-700 hover:duration-300 tw-hover:backdrop:before:first-letter:text-white`}>
            <FontAwesomeIcon icon={faMountainSun} />
          </Link>
      </div>
      
      <ul className={`home flex`}>
        <li className={`tw-flex-initial tw-p-3 tw-hover:text-cyan-700 tw-hover:underline tw-hover:duration-500`}>
          <Link href="/"></Link>
        </li>

        <div className={`navbar tw-flex tw-items-center `}>
          <li className={`tw-p-3 tw-hover:text-cyan-700 tw-hover:underline tw-hover:duration-500`}>
            <Link href="/about" className={styles.description}>About</Link>
          </li>
          <li className={`tw-p-3 tw-hover:text-cyan-700 tw-hover:underline tw-hover:duration-500`}>
            <Link href="/work" className={styles.description}>Work</Link>
          </li>
          <li className={`tw-p-3 tw-hover:text-cyan-700 tw-hover:underline tw-hover:duration-500`}>
            <Link href="/contact" className={styles.description}>Contact</Link>
          </li>
        </div>

        <div className="prefs-menu">
          <li  className={`p-3 hover:text-cyan-100 hover:duration-500`}>
            <FontAwesomeIcon icon={faBars}/>
          </li>
        </div>
      </ul>
    </nav>
  );
};

export default Header;
