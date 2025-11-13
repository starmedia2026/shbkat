
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface ThemeContextType {
  darkMode: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  primaryColor: string;
  setPrimaryColor: (hslColor: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY_COLOR = "210 100% 56%"; // Default blue

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY_COLOR);

  useEffect(() => {
    // Initialize theme from localStorage
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    const storedPrimaryColor = localStorage.getItem('primaryColor') || DEFAULT_PRIMARY_COLOR;

    setDarkMode(storedDarkMode);
    if (storedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setPrimaryColorState(storedPrimaryColor);
    document.documentElement.style.setProperty('--primary', storedPrimaryColor);
  }, []);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    const isDark = theme === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, []);

  const setPrimaryColor = useCallback((hslColor: string) => {
    setPrimaryColorState(hslColor);
    document.documentElement.style.setProperty('--primary', hslColor);
    localStorage.setItem('primaryColor', hslColor);
  }, []);

  const contextValue = { darkMode, setTheme, primaryColor, setPrimaryColor };

  return (
    <ThemeContext.Provider value={contextValue}>
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

    