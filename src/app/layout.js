import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import CookieBanner from "@/components/CookieBanner";
import TherapistGuard from "@/components/TherapistGuard";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

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

        {/* GOOGLE CONSENT MODE v2 — ΠΡΕΠΕΙ να τρέξει ΠΡΙΝ το GA script.
            Ορίζει τα πάντα σε 'denied' μέχρι ο χρήστης να αποφασίσει.

            Χωρίς αυτό:
            · Παράνομο στην ΕΕ — τα cookies GA δεν είναι «απαραίτητα»
              και θέλουν συγκατάθεση ΠΡΙΝ φορτώσουν.
            · Από τον Μάρτιο 2024 το Google Ads ΔΕΝ καταγράφει
              conversions από χρήστες ΕΟΧ χωρίς Consent Mode v2.
              Δηλαδή θα πλήρωνες για κλικ και δεν θα έβλεπες αποτέλεσμα.

            Το 'wait_for_update' δίνει 500ms στο banner να απαντήσει,
            ώστε να μη χαθεί το pageview όσων έχουν ήδη δεχτεί. */}
        <Script id="consent-mode" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });
            // Επαναφορά προηγούμενης επιλογής. Το CookieBanner
            // αποθηκεύει ΞΕΧΩΡΙΣΤΑ analytics και marketing, οπότε
            // διαβάζουμε το ίδιο σχήμα και όχι ένα ενιαίο ναι/όχι.
            try {
              var raw = localStorage.getItem('physiohome_cookie_prefs');
              if (raw) {
                var p = JSON.parse(raw);
                gtag('consent', 'update', {
                  analytics_storage:  p.analytics ? 'granted' : 'denied',
                  ad_storage:         p.marketing ? 'granted' : 'denied',
                  ad_user_data:       p.marketing ? 'granted' : 'denied',
                  ad_personalization: p.marketing ? 'granted' : 'denied'
                });
              }
            } catch (e) {}
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col`}
        style={{ background: "#faf9f6", color: "#1a2e44", margin: 0, minHeight: "100vh" }}
      >
        <LanguageProvider>
          <TherapistGuard />
          {children}
        </LanguageProvider>
        <CookieBanner />

        {/* GA4 — φορτώνει πάντα, αλλά το Consent Mode ελέγχει τι
            καταγράφει. Έτσι μετράμε ανώνυμα pageviews ακόμα κι όταν ο
            χρήστης αρνηθεί, χωρίς cookies και χωρίς παρακολούθηση. */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                  // Τα UTM διαβάζονται αυτόματα από το URL — δεν χρειάζεται
                  // χειροκίνητο πέρασμα.
                  send_page_view: true
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}