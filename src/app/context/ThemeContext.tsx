'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Theme, themes, applyTheme } from '@/app/styles/themes';

interface ThemeContextType {
  currentTheme: Theme['name'];
  setTheme: (theme: Theme['name']) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isAnimated: boolean;
  toggleAnimation: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook for localStorage with SSR safety
function useLocalStorage<T>(key: string, defaultValue: T) {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      setStoredValue(defaultValue);
    }
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue] as const;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme['name']>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAnimated, setIsAnimated] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const [savedTheme, setSavedTheme] = useLocalStorage<Theme['name'] | null>(
    'selectedTheme',
    null
  );
  const [savedDarkMode, setSavedDarkMode] = useLocalStorage<boolean | null>(
    'darkMode',
    null
  );
  const [savedAnimation, setSavedAnimation] = useLocalStorage(
    'gradientAnimation',
    true
  );

  // Memoized theme application
  const applyDocumentTheme = useCallback((darkMode: boolean) => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light'
    );
  }, []);

  const applyAnimationTiming = useCallback((animated: boolean) => {
    document.documentElement.style.setProperty(
      '--gradient-timing',
      animated ? '10s' : '0s'
    );
  }, []);

  // Initial setup - runs once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check system dark mode preference
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    // Initialize values
    const initialDarkMode =
      savedDarkMode !== null ? savedDarkMode : prefersDark;
    const initialTheme =
      savedTheme && themes[savedTheme] ? savedTheme : 'default';
    const initialAnimation = savedAnimation;

    // Set states
    setIsDarkMode(initialDarkMode);
    setCurrentTheme(initialTheme);
    setIsAnimated(initialAnimation);

    // Apply to DOM
    applyDocumentTheme(initialDarkMode);
    applyTheme(initialTheme);
    applyAnimationTiming(initialAnimation);

    setIsInitialized(true);
  }, [
    savedTheme,
    savedDarkMode,
    savedAnimation,
    applyDocumentTheme,
    applyAnimationTiming,
  ]);

  // Update DOM when dark mode changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    applyDocumentTheme(isDarkMode);
  }, [isDarkMode, isInitialized, applyDocumentTheme]);

  // Listen for system dark mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const darkModeMediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      if (savedDarkMode === null) {
        setIsDarkMode(e.matches);
      }
    };

    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    return () =>
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
  }, [savedDarkMode]);

  // Optimized handlers with useCallback
  const setTheme = useCallback(
    (theme: Theme['name']) => {
      setCurrentTheme(theme);
      applyTheme(theme);
      setSavedTheme(theme);
    },
    [setSavedTheme]
  );

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      setSavedDarkMode(newValue);
      return newValue;
    });
  }, [setSavedDarkMode]);

  const toggleAnimation = useCallback(() => {
    setIsAnimated(prev => {
      const newValue = !prev;
      setSavedAnimation(newValue);
      applyAnimationTiming(newValue);
      return newValue;
    });
  }, [setSavedAnimation, applyAnimationTiming]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentTheme,
      setTheme,
      isDarkMode,
      toggleDarkMode,
      isAnimated,
      toggleAnimation,
    }),
    [
      currentTheme,
      setTheme,
      isDarkMode,
      toggleDarkMode,
      isAnimated,
      toggleAnimation,
    ]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
