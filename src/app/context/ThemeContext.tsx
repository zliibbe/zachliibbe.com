"use client";

import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { Theme, themes, applyTheme } from "@/app/styles/themes";

interface ThemeContextType {
  currentTheme: Theme["name"];
  setTheme: (theme: Theme["name"]) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isAnimated: boolean;
  toggleAnimation: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme["name"]>("default");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAnimated, setIsAnimated] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load saved preferences or use system defaults
    const savedTheme = localStorage.getItem("theme") as Theme["name"];
    const savedDarkMode = localStorage.getItem("darkMode");
    const savedAnimation = localStorage.getItem("gradientAnimation");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }

    setIsDarkMode(savedDarkMode ? JSON.parse(savedDarkMode) : prefersDark);
    setIsAnimated(savedAnimation ? JSON.parse(savedAnimation) : true);

    // Apply initial theme
    document.documentElement.classList.toggle("dark-mode", isDarkMode);
    document.documentElement.style.setProperty(
      "--animationRunning",
      isAnimated ? "true" : "false",
    );

    setIsInitialized(true);

    // Listen for system dark mode changes
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("darkMode")) {
        setIsDarkMode(e.matches);
      }
    };

    darkModeMediaQuery.addEventListener("change", handleDarkModeChange);
    return () =>
      darkModeMediaQuery.removeEventListener("change", handleDarkModeChange);
  }, [isAnimated, isDarkMode]);

  const toggleAnimation = () => {
    const newValue = !isAnimated;
    setIsAnimated(newValue);
    localStorage.setItem("gradientAnimation", JSON.stringify(newValue));
    document.documentElement.style.setProperty(
      "--animationRunning",
      newValue ? "true" : "false",
    );
  };

  const setTheme = (theme: Theme["name"]) => {
    // Remove previous theme class
    document.documentElement.classList.remove(currentTheme);
    // Add new theme class
    document.documentElement.classList.add(theme);

    // Apply the theme colors immediately using CSS custom properties
    const selectedTheme = themes[theme];
    const root = document.documentElement;

    root.style.setProperty("--theme-color", selectedTheme.colors.themeColor);
    root.style.setProperty("--gradient-one", selectedTheme.colors.gradientOne);
    root.style.setProperty("--gradient-two", selectedTheme.colors.gradientTwo);
    root.style.setProperty(
      "--gradient-three",
      selectedTheme.colors.gradientThree,
    );
    root.style.setProperty(
      "--clr-accent-400",
      selectedTheme.colors.accentPrimary,
    );
    root.style.setProperty(
      "--clr-accent-300",
      selectedTheme.colors.accentSecondary,
    );

    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
  };

  // Also need to apply theme on initial load
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode));

    if (newDarkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        isDarkMode,
        toggleDarkMode,
        isAnimated,
        toggleAnimation,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
