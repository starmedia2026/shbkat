import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeContext";
import { FirebaseClientProvider } from "@/firebase";
import { Tajawal } from "next/font/google";
import { cn } from "@/lib/utils";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";


export const metadata: Metadata = {
  title: "Shabakat",
  description: "تطبيق شبكات للتواصل والاتصال",
};

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

const DEFAULT_PRIMARY_COLOR = "142 76% 36%";

async function getThemeSettings() {
    try {
        const { firestore } = initializeFirebase();
        const themeDocRef = doc(firestore, "settings", "theme");
        const themeDoc = await getDoc(themeDocRef);
        if (themeDoc.exists()) {
            return themeDoc.data();
        }
    } catch (error) {
        // This can happen during build time or if firebase isn't configured, it's safe to ignore.
    }
    return { primaryColor: DEFAULT_PRIMARY_COLOR };
}


// This script now only handles dark mode, as primary color is handled by the ThemeProvider after hydration
const ThemeScript = ({ primaryColor }: { primaryColor: string }) => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            const darkMode = localStorage.getItem('darkMode') === 'true';
            if (darkMode) {
              document.documentElement.classList.add('dark');
            }
            document.documentElement.style.setProperty('--primary', '${primaryColor}');
            document.documentElement.style.setProperty('--ring', '${primaryColor}');
          } catch (e) {}
        })();
      `,
    }}
  />
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeData = await getThemeSettings();
  const primaryColor = themeData?.primaryColor || DEFAULT_PRIMARY_COLOR;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <ThemeScript primaryColor={primaryColor} />
      </head>
      <body className={cn("font-sans", tajawal.variable)}>
        <FirebaseClientProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
