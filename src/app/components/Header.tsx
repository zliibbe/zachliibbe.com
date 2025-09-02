'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { FaBars } from 'react-icons/fa6';
import { LuSprout } from 'react-icons/lu';
import { PiGear } from 'react-icons/pi';
import { useState, useEffect } from 'react';
import PrimaryNav from './PrimaryNav';
import { Preferences } from './Preferences/Preferences';
import Image from 'next/image';

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

  const isNotHomePage = pathname !== '/';

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 500);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.homeLink}>
            <div className={styles.homeLinkContent}>
              <LuSprout className={styles.homeIcon} />
              {isNotHomePage && <h1 className={styles.name}>zach liibbe</h1>}
            </div>
          </Link>
        </div>

        {/* Always show nav - horizontal scrollable on mobile */}
        <PrimaryNav />

        <div className={styles.headerRight}>
          <Preferences />
        </div>
      </div>
    </header>
  );
};

export default Header;
