"use client";
import Link from "next/link";
import styles from "./Header.module.css";
import { FaBars } from "react-icons/fa6";
import { LuSprout } from "react-icons/lu";
import { PiGear } from "react-icons/pi";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import PrimaryNav from "./PrimaryNav";
import { Preferences } from "./Preferences/Preferences";
import Image from "next/image";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

  const isNotHomePage = pathname !== "/";

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 500);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <header
      className={`${styles.header} ${isNotHomePage ? styles.gradientHeader : ""}`}
    >
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.homeLink}>
            <div className={styles.homeLinkContent}>
              <LuSprout className={styles.homeIcon} />
              {isNotHomePage && <h1 className={styles.name}>zach liibbe</h1>}
            </div>
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
              aria-label={
                isNavOpen ? "Close navigation menu" : "Open navigation menu"
              }
            >
              {isNavOpen ? "✕" : <FaBars className={styles.barsIcon} />}
            </button>
          )}
          <Preferences />
        </div>
      </div>
    </header>
  );
};

export default Header;
