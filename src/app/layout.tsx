
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { FirebaseClientProvider } from "@/firebase";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shabakat",
  description: "تطبيق شبكات للتواصل والاتصال",
};

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

function AppBody({ children }: { children: React.ReactNode }) {
  const { font, isMounted } = useTheme();

  return (
    <body className={cn("font-tajawal", isMounted ? font : "")}>
      {children}
      <Toaster />
    </body>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&family=Cairo:wght@400;700&family=Tajawal:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <FirebaseClientProvider>
        <ThemeProvider>
          <AppBody>{children}</AppBody>
        </ThemeProvider>
      </FirebaseClientProvider>
    </html>
  );
}
