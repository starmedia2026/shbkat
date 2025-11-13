
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
  setFont: (fontClass: string) => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY_COLOR = "210 100% 56%"; // Default blue
const DEFAULT_FONT = "font-tajawal";

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
  const font = themeData?.font || DEFAULT_FONT;
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (primaryColor) {
        document.documentElement.style.setProperty('--primary', primaryColor);
      }
      
      // Remove all other font classes and add the correct one
      const fontClasses = ['font-tajawal', 'font-cairo', 'font-almarai', 'font-ibm-plex-sans-arabic'];
      document.body.classList.remove(...fontClasses);
      if (font) {
        document.body.classList.add(font);
      } else {
        document.body.classList.add(DEFAULT_FONT);
      }
    }
  }, [primaryColor, font, isMounted]);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(storedDarkMode);
    if (storedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    if (isAdmin && themeDocRef) {
      document.documentElement.style.setProperty('--primary', hslColor); 
      setDoc(themeDocRef, { primaryColor: hslColor }, { merge: true }).catch(error => {
          console.error("Failed to save theme color:", error);
          document.documentElement.style.setProperty('--primary', primaryColor);
      });
    }
  }, [isAdmin, themeDocRef, primaryColor]);

  const setFont = useCallback((fontClass: string) => {
    if (isAdmin && themeDocRef) {
      setDoc(themeDocRef, { font: fontClass }, { merge: true }).catch(error => {
          console.error("Failed to save font:", error);
      });
    }
  }, [isAdmin, themeDocRef]);

  const contextValue = { darkMode, setTheme, primaryColor, setPrimaryColor, font, setFont, isMounted };

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
