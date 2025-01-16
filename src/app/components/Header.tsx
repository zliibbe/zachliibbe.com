"use client";
import Link from "next/link";
import styles from "./Header.module.css";
import { FaMountainSun, FaBars } from "react-icons/fa6";
import { PiGear } from "react-icons/pi";
import { useState, useEffect } from "react";
import PrimaryNav from "./PrimaryNav";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 769);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <header className={`${styles.header} `}>
      <div className={styles.headerLeft}>
        <Link href="/">
          <FaMountainSun className={styles.homeIcon} />
        </Link>
      </div>

      {!isDesktop && isNavOpen && (
        <nav className={styles.mobileNav} id="primaryNav">
          <PrimaryNav />
        </nav>
      )}

      {isDesktop && <PrimaryNav />}

      <div className={styles.headerRight}>
        {!isDesktop && (
          <button
            onClick={toggleNav}
            className={styles.mobileNavToggle}
            aria-controls="primaryNav"
            aria-expanded={isNavOpen}
          >
            {isNavOpen ? "✕" : <FaBars />}
          </button>
        )}
        <PiGear className={styles.gearLogo} />
      </div>
    </header>
  );
};

export default Header;
