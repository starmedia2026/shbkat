
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAdmin } from "@/hooks/useAdmin";

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
  const firestore = useFirestore();
  const { isAdmin } = useAdmin();

  // Firestore reference to the global theme document
  const themeDocRef = useMemoFirebase(() => {
    // We create the reference regardless of auth state now
    if (!firestore) return null;
    return doc(firestore, "settings", "theme");
  }, [firestore]);

  // Use useDoc to listen for real-time theme changes
  const { data: themeData } = useDoc(themeDocRef);
  
  // The primary color state is now driven by Firestore data
  const primaryColor = themeData?.primaryColor || DEFAULT_PRIMARY_COLOR;

  // Apply the primary color to the document root whenever it changes
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary', primaryColor);
    }
  }, [primaryColor]);


  // Initialize dark mode from localStorage (it remains a per-device setting)
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

  // setPrimaryColor now writes to Firestore if the user is an admin
  const setPrimaryColor = useCallback((hslColor: string) => {
    if (isAdmin && themeDocRef) {
        // Optimistically update the UI while the backend write happens
        document.documentElement.style.setProperty('--primary', hslColor); 
        // Write the new color to Firestore
        setDoc(themeDocRef, { primaryColor: hslColor }).catch(error => {
            console.error("Failed to save theme color:", error);
            // Optional: revert optimistic update if write fails
            document.documentElement.style.setProperty('--primary', primaryColor);
        });
    }
  }, [isAdmin, themeDocRef, primaryColor]);

  // The context value now provides the color from Firestore
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
