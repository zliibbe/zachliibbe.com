import Link from "next/link";
import styles from "../page.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMountainSun, faBars } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  return (
    <nav className={`flex w-full`}>
      <ul className={`flex text-cyan-300 `}>
        <li className={`p-3`}>
          <Link href="/" className={`home-icon ${styles.description} hover:text-cyan-700 hover:duration-300`}>
            <FontAwesomeIcon icon={faMountainSun} />
          </Link>
        </li>
        <div className={`flex items-center `}>
          <li className={`p-3 hover:text-cyan-700 hover:underline hover:duration-500`}>
            <Link href="/about" className={styles.description}>
              About
            </Link>
          </li>
          <li className={`p-3 hover:text-cyan-700 hover:underline hover:duration-500`}>
            <Link href="/work" className={styles.description}>
              Work
            </Link>
          </li>
          <li className={`p-3 hover:text-cyan-700 hover:underline hover:duration-500 `}>
            <Link href="/contact" className={styles.description}>
              Contact
            </Link>
          </li>
        </div>
        <li  className={`p-3 hover:text-cyan-700 hover:duration-500 `}>
          <FontAwesomeIcon icon={faBars}/>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
