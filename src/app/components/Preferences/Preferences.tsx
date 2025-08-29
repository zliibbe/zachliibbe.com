'use client';

import { useState } from 'react';
import styles from './Preferences.module.css';
import headerSyles from '../Header.module.css';
import { Modal } from '../Modal/Modal';
import {
  PiGear,
  PiX,
  PiCheck,
  PiMoon,
  PiSun,
  PiLightning,
} from 'react-icons/pi';
import { useTheme } from '@/app/context/ThemeContext';
import { themes } from '@/app/styles/themes';
import { formatThemeName } from '@/app/utils/index';

export function Preferences() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentTheme,
    setTheme,
    isDarkMode,
    toggleDarkMode,
    isAnimated,
    toggleAnimation,
  } = useTheme();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${headerSyles.gearIcon} ${styles.gearIcon}`}
        aria-label="Open preferences"
      >
        <PiGear className={`${headerSyles.gearIcon} ${styles.gearIcon}`} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className={styles.preferences}>
          <div className={styles.header}>
            <h2>Preferences</h2>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              aria-label="Close preferences"
            >
              <PiX />
            </button>
          </div>

          <div className={styles.section}>
            <span className={styles.themeNameRow}>
              <h3>{'Gradient: '}</h3>
              <span className={styles.themeName}>
                {formatThemeName(currentTheme) || 'Default'}
              </span>
            </span>

            <div className={styles.gradientGrid}>
              {Object.values(themes).map(theme => (
                <button
                  key={theme.name}
                  onClick={() => setTheme(theme.name)}
                  className={`${styles.gradientButton} ${
                    currentTheme === theme.name ? styles.active : ''
                  }`}
                  aria-label={`Select ${theme.label} theme`}
                  aria-pressed={currentTheme === theme.name}
                  style={{
                    background: `linear-gradient(45deg, 
                      ${theme.colors.gradientOne}, 
                      ${theme.colors.gradientTwo}, 
                      ${theme.colors.gradientThree}
                    )`,
                  }}
                >
                  {currentTheme === theme.name && (
                    <PiCheck className={styles.checkmark} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.toggleSection}>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Gradient animation</span>
              <div className={styles.toggleContainer}>
                <span className={styles.toggleLabel}>
                  {isAnimated ? 'On' : 'Off'}
                </span>
                <button
                  onClick={toggleAnimation}
                  className={`${styles.toggleButton} ${styles.animationToggle} ${
                    isAnimated ? styles.active : ''
                  }`}
                  aria-pressed={isAnimated}
                  aria-label={`Gradient animation ${isAnimated ? 'on' : 'off'}`}
                >
                  <PiLightning />
                </button>
              </div>
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Dark mode</span>
              <div className={styles.toggleContainer}>
                <span className={styles.toggleLabel}>
                  {isDarkMode ? 'On' : 'Off'}
                </span>
                <button
                  onClick={toggleDarkMode}
                  className={`${styles.toggleButton} ${isDarkMode ? styles.active : ''}`}
                  aria-pressed={isDarkMode}
                  aria-label={`Dark mode ${isDarkMode ? 'on' : 'off'}`}
                >
                  {isDarkMode ? <PiSun /> : <PiMoon />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
