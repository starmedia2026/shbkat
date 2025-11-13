import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeContext";
import { FirebaseClientProvider } from "@/firebase";
import { Tajawal } from "next/font/google";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shabakat",
  description: "تطبيق شبكات للتواصل والاتصال",
};

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

// This script now only handles dark mode, as primary color is handled by the ThemeProvider after hydration
const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            const darkMode = localStorage.getItem('darkMode') === 'true';
            if (darkMode) {
              document.documentElement.classList.add('dark');
            }
          } catch (e) {}
        })();
      `,
    }}
  />
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <ThemeScript />
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
