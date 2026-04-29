import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PhysioHome – Φυσιοθεραπεία στο Σπίτι σας",
  description: "Επαγγελματική φυσιοθεραπεία στην Αθήνα & Αττική",
};

// Force light theme — αποτρέπει iOS Safari από auto dark mode invert
export const viewport = {
  themeColor: "#faf9f6",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="el" style={{ colorScheme: "light", background: "#faf9f6" }}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col`}
        style={{ background: "#faf9f6", color: "#1a2e44", margin: 0, minHeight: "100vh" }}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <CookieBanner />
      </body>
    </html>
  );
}