"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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
    document.documentElement.style.setProperty(
      "--gradient-timing",
      isAnimated ? "10s" : "0s",
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
    document.documentElement.style.setProperty(
      "--gradient-timing",
      newValue ? "10s" : "0s",
    );
  };

  const setTheme = useCallback((newTheme: Theme["name"]) => {
    setCurrentTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }, []);

  // Also need to apply theme on initial load
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    localStorage.setItem("darkMode", JSON.stringify(newValue));
    document.documentElement.setAttribute(
      "data-theme",
      newValue ? "dark" : "light",
    );
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
