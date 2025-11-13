
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

interface ThemeContextType {
  darkMode: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  primaryColor: string;
  setPrimaryColor: (hslColor: string) => void;
  font: string;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY_COLOR = "210 100% 56%"; // Default blue
const DEFAULT_FONT = "font-cairo";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();
  const { isAdmin } = useAdmin();

  const themeDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "theme");
  }, [firestore]);

  const { data: themeData, isLoading: isThemeLoading } = useDoc(themeDocRef);
  
  const primaryColor = themeData?.primaryColor || DEFAULT_PRIMARY_COLOR;
  const font = DEFAULT_FONT; // Always use Cairo
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.style.setProperty('--primary', primaryColor);
      // Font is now applied directly on the body in layout.tsx
    }
  }, [primaryColor, isMounted]);

  useEffect(() => {
    if (isMounted) {
        const storedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(storedDarkMode);
        if (storedDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    }
  }, [isMounted]);

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
    if (isAdmin && themeDocRef) {
      document.documentElement.style.setProperty('--primary', hslColor); 
      setDoc(themeDocRef, { primaryColor: hslColor }, { merge: true }).catch(error => {
          console.error("Failed to save theme color:", error);
          document.documentElement.style.setProperty('--primary', primaryColor);
      });
    }
  }, [isAdmin, themeDocRef, primaryColor]);


  const contextValue = { darkMode, setTheme, primaryColor, setPrimaryColor, font, isMounted };

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
