import Link from "next/link";
import styles from "../page.module.css";
import { FaMountainSun, FaGear } from "react-icons/fa6";
import { PiGear } from "react-icons/pi";
import { IconContext } from "react-icons/lib";
import { createContext } from "react";

const Header = () => {
  return (
    <nav
      className={`tw-flex tw-w-full tw-justify-between tw-content-center tw-px-4 tw-mx-6`}
    >
      <div className={`tw-flex tw-items-center tw-content-start tw-mx-1`}>
        <span className="changeColor">
          <Link href="/" className={`home-icon tw-p-5 `}>
            <FaMountainSun
              className="home-icon "
              color="white"
              fontSize={`1.8rem`}
            />
          </Link>
        </span>
      </div>

      <ul className={`home-logo tw-flex`}>
        <div className={`navbar tw-flex tw-items-center `}>
          <span className="tw-hover:bg-slate-500">
            <li
              className={`tw-p-1 tw-hover:bg-cyan-700 tw-hover:underline tw-hover:duration-500`}
            >
              <Link
                href="/about"
                className={
                  "tw-p-3 tw-hover:tw-font-extrabold tw-hover:text-cyan-700 tw-hover:underline tw-hover:duration-500"
                }
              >
                About
              </Link>
            </li>
          </span>

          <li
            className={`tw-p-3 tw-hover:text-slate-500 w-hover:underline tw-hover:duration-500`}
          >
            <Link href="/work" className={`${styles.description}`}>
              Work
            </Link>
          </li>
          <li className={`tw-p-3`}>
            <Link href="/contact" className={styles.description}>
              Contact
            </Link>
          </li>
        </div>
      </ul>

      <div className="prefs-menu">
        <div className={`gear-logo tw-p-5`}>
          <PiGear color="white" fontSize={`1.6rem`} />
        </div>
      </div>
    </nav>
  );
};

export default Header;
