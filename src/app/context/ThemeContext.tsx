"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Initial setup
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("selectedTheme") as Theme["name"];
    const savedDarkMode = localStorage.getItem("darkMode");
    const savedAnimation = localStorage.getItem("gradientAnimation");

    // Check system dark mode preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    // Set initial dark mode
    const initialDarkMode =
      savedDarkMode !== null ? JSON.parse(savedDarkMode) : prefersDark;
    setIsDarkMode(initialDarkMode);

    // Set the theme on the html element
    document.documentElement.setAttribute(
      "data-theme",
      initialDarkMode ? "dark" : "light",
    );

    // Set initial theme
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      setCurrentTheme("default");
      applyTheme("default");
    }

    // Set initial animation state and apply it
    const initialAnimationState = savedAnimation
      ? JSON.parse(savedAnimation)
      : true;
    setIsAnimated(initialAnimationState);

    // Add this line to set the CSS variable on initial load
    document.documentElement.style.setProperty(
      "--gradient-timing",
      initialAnimationState ? "10s" : "0s",
    );
  }, []);

  // Handle dark mode changes
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light",
    );
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Handle theme changes
  const setTheme = (theme: Theme["name"]) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem("selectedTheme", theme);
  };

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;

      // Set theme attribute
      document.documentElement.setAttribute(
        "data-theme",
        newValue ? "dark" : "light",
      );

      // Update localStorage
      localStorage.setItem("darkMode", JSON.stringify(newValue));

      return newValue;
    });
  };

  // Handle animation toggle
  const toggleAnimation = () => {
    const newValue = !isAnimated;
    setIsAnimated(newValue);
    localStorage.setItem("gradientAnimation", JSON.stringify(newValue));
    document.documentElement.style.setProperty(
      "--gradient-timing",
      newValue ? "10s" : "0s",
    );
  };

  // Listen for system dark mode changes
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light",
    );
  }, [isDarkMode]);

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
