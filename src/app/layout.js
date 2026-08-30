import { Geist, Geist_Mono, Manrope } from "next/font/google";
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

// ── ΜΙΑ ΓΡΑΜΜΑΤΟΣΕΙΡΑ, ΠΑΝΤΟΥ ──
//
// ΤΟ ΠΡΟΒΛΗΜΑ ΠΟΥ ΛΥΝΕΙ:
// Το DM Serif Display ΔΕΝ έχει ελληνικούς χαρακτήρες. Στα ελληνικά ο
// browser έπεφτε σιωπηλά στη Georgia — άλλο ύφος, άλλο βάρος. Γι' αυτό
// τα αγγλικά φαίνονταν τελείως διαφορετικά από τα ελληνικά.
//
// Το Manrope έχει πλήρη ελληνική στήριξη και είναι γεωμετρικό sans:
// στρογγυλές φόρμες, καθαρές γραμμές, δυνατά βάρη στους τίτλους.
// ΕΝΑ οικογένεια για τίτλους και σώμα — χωρίς serif πουθενά.
const display = Manrope({
  variable: "--font-serif",   // κρατάει το όνομα ώστε να μη σπάσει ό,τι το χρησιμοποιεί
  subsets: ["latin", "greek"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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

        {/* Το next/font κατεβάζει τα αρχεία και τα σερβίρει από το δικό
            μας domain — χωρίς αίτημα στη Google σε κάθε επίσκεψη, και
            χωρίς το «flash of unstyled text» που βλέπεις με @import. */}
        {/* Το next/font κατεβάζει τα αρχεία και τα σερβίρει από το δικό
            μας domain — χωρίς αίτημα στη Google σε κάθε επίσκεψη.

            Τα !important είναι σκόπιμα: δεκαπέντε components γράφουν
            fontFamily μέσα σε inline style, που κανονικά υπερισχύει.
            Χωρίς αυτά, η αλλαγή θα έπιανε μόνο όπου δεν υπάρχει inline. */}
        <style>{`
          body,
          body * {
            font-family: var(--font-sans), system-ui, sans-serif;
          }
          h1, h2, h3, .serif,
          [style*="Serif"], [style*="serif"], [style*="Georgia"] {
            font-family: var(--font-serif), system-ui, sans-serif !important;
            letter-spacing: -0.02em;
          }
          h1, h2 { font-weight: 700; }
          h3 { font-weight: 600; }

          /* Το Manrope ΔΕΝ έχει πλάγια. Οι τίτλοι χρησιμοποιούν <em>
             για το μπλε μέρος· χωρίς αυτό ο browser θα τα έγερνε
             τεχνητά και θα φαινόταν στραβό.
             Η έμφαση περνάει στο βάρος — το χρώμα το δίνει ήδη το
             inline style κάθε τίτλου. */
          h1 em, h2 em, h3 em, .serif em {
            font-style: normal !important;
            font-weight: 800;
          }
        `}</style>

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
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${sans.variable} min-h-full flex flex-col`}
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