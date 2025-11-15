
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useFirestore, useDoc, useMemoFirebase, errorEmitter } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAdmin } from "@/hooks/useAdmin";
import { FirestorePermissionError } from "@/firebase/errors";

interface ThemeContextType {
  darkMode: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  primaryColor: string;
  setPrimaryColor: (hslColor: string) => void;
  font: string;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY_COLOR = "210 100% 56%";
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

  const { data: themeData } = useDoc(themeDocRef);
  
  const primaryColor = themeData?.primaryColor || DEFAULT_PRIMARY_COLOR;
  
  useEffect(() => {
    setIsMounted(true);
    // Set font on mount, primary color is handled by server component + script
    document.body.classList.add(DEFAULT_FONT);
  }, []);

  // Update CSS variable for primary color on the client side when it changes
  useEffect(() => {
    if (isMounted) {
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--ring', primaryColor);
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
      document.documentElement.style.setProperty('--ring', hslColor);
      setDoc(themeDocRef, { primaryColor: hslColor }, { merge: true })
      .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: themeDocRef.path,
                operation: 'write',
                requestResourceData: { primaryColor: hslColor }
            });
            errorEmitter.emit('permission-error', permissionError);
            // Revert if save fails
            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--ring', primaryColor);
      });
    }
  }, [isAdmin, themeDocRef, primaryColor]);


  const contextValue = { darkMode, setTheme, primaryColor, setPrimaryColor, font: DEFAULT_FONT, isMounted };

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
