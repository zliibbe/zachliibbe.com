'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LuSprout } from 'react-icons/lu';
import styles from './Header.module.css';
import { Preferences } from './Preferences/Preferences';
import PrimaryNav from './PrimaryNav';

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
