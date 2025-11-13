
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
  font: string;
  setFont: (fontClass: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY_COLOR = "210 100% 56%"; // Default blue
const DEFAULT_FONT = "font-cairo";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const firestore = useFirestore();
  const { isAdmin } = useAdmin();
  const { user, isUserLoading } = useUser();

  // Firestore reference to the global theme document
  const themeDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "theme");
  }, [firestore]);

  // Use useDoc to listen for real-time theme changes
  const { data: themeData, isLoading: isThemeLoading } = useDoc(themeDocRef);
  
  // The primary color and font states are now driven by Firestore data
  const primaryColor = themeData?.primaryColor || DEFAULT_PRIMARY_COLOR;
  const font = themeData?.font || DEFAULT_FONT;

  // Apply the primary color and font to the document root whenever they change
  useEffect(() => {
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.body.classList.remove('font-cairo', 'font-tajawal', 'font-almarai');
      document.body.classList.add(font);
  }, [primaryColor, font]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    // Only run on client
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

  // setFont now writes to Firestore if the user is an admin
  const setFont = useCallback((fontClass: string) => {
    if (isAdmin && themeDocRef) {
        // Optimistically update the UI
        document.body.classList.remove('font-cairo', 'font-tajawal', 'font-almarai');
        document.body.classList.add(fontClass);
        // Write the new font to Firestore
        setDoc(themeDocRef, { font: fontClass }, { merge: true }).catch(error => {
            console.error("Failed to save font:", error);
            // Revert optimistic update if write fails
            document.body.classList.remove(fontClass);
            document.body.classList.add(font); 
        });
    }
  }, [isAdmin, themeDocRef, font]);


  // setPrimaryColor now writes to Firestore if the user is an admin
  const setPrimaryColor = useCallback((hslColor: string) => {
    if (isAdmin && themeDocRef) {
        // Optimistically update the UI
        document.documentElement.style.setProperty('--primary', hslColor); 
        // Write the new color to Firestore
        setDoc(themeDocRef, { primaryColor: hslColor }, { merge: true }).catch(error => {
            console.error("Failed to save theme color:", error);
            // Revert optimistic update if write fails
            document.documentElement.style.setProperty('--primary', primaryColor);
        });
    }
  }, [isAdmin, themeDocRef, primaryColor]);

  // Wait for user to be checked before rendering children to avoid permission errors
  if (isUserLoading) {
      return null;
  }

  const contextValue = { darkMode, setTheme, primaryColor, setPrimaryColor, font, setFont };

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
