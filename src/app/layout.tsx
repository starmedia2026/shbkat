
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeContext";
import { FirebaseClientProvider } from "@/firebase";

export const metadata: Metadata = {
  title: "Shabakat",
  description: "تطبيق شبكات للتواصل والاتصال",
};

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
            const primaryColor = localStorage.getItem('primaryColor');
            if (primaryColor) {
              document.documentElement.style.setProperty('--primary', primaryColor);
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background">
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

    