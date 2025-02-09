"use client";

import { useState } from "react";
import styles from "./Preferences.module.css";
import { Modal } from "../Modal/Modal";
import { PiGear } from "react-icons/pi";

interface GradientTheme {
  name: string;
  themeColor: string;
  gradientOne: string;
  gradientTwo: string;
  gradientThree: string;
  accentPrimary: string;
  accentSecondary: string;
}

const gradientThemes: GradientTheme[] = [
  {
    name: "Ocean",
    themeColor: "#2795ba",
    gradientOne: "#67c6b5",
    gradientTwo: "#2795ba",
    gradientThree: "#3178b4",
    accentPrimary: "#ffd700",
    accentSecondary: "#fff3b0",
  },
  // Add more themes here
];

export function Preferences() {
  const [isOpen, setIsOpen] = useState(false);

  const updateTheme = (theme: GradientTheme) => {
    const root = document.documentElement;
    root.style.setProperty("--theme-color", theme.themeColor);
    root.style.setProperty("--gradientOne", theme.gradientOne);
    root.style.setProperty("--gradientTwo", theme.gradientTwo);
    root.style.setProperty("--gradientThree", theme.gradientThree);
    root.style.setProperty("--clr-accent-400", theme.accentPrimary);
    root.style.setProperty("--clr-accent-300", theme.accentSecondary);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={styles.gearIcon}
        aria-label="Open preferences"
      >
        <PiGear className={styles.gearIcon} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className={styles.preferences}>
          <h2>Preferences</h2>
          <div className={styles.section}>
            <h3>Gradient</h3>
            <div className={styles.gradientGrid}>
              {gradientThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => updateTheme(theme)}
                  className={styles.gradientButton}
                  style={{
                    background: `linear-gradient(45deg, ${theme.gradientOne}, ${theme.gradientTwo})`,
                  }}
                  aria-label={`Select ${theme.name} theme`}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
