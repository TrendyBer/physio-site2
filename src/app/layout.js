import { Geist, Geist_Mono, EB_Garamond, DM_Sans } from "next/font/google";
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

// ── ΓΡΑΜΜΑΤΟΣΕΙΡΕΣ ΜΕ ΕΛΛΗΝΙΚΑ ──
//
// ΤΟ ΠΡΟΒΛΗΜΑ ΠΟΥ ΛΥΝΕΙ:
// Το EB Garamond ΔΕΝ έχει ελληνικούς χαρακτήρες. Όταν το κείμενο
// ήταν ελληνικό, ο browser έπεφτε σιωπηλά στη Georgia — άλλη γραμματοσειρά,
// άλλο ύφος, άλλο βάρος. Γι' αυτό τα αγγλικά φαίνονταν τελείως
// διαφορετικά: εκεί έβλεπες το πραγματικό DM Serif, στα ελληνικά ποτέ.
//
// Το EB Garamond έχει πλήρη ελληνική στήριξη, οπότε ΤΟ ΙΔΙΟ σχήμα
// εμφανίζεται και στις δύο γλώσσες.
const serif = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Το ίδιο ισχύει για το σώμα κειμένου: χωρίς το greek subset, τα
// ελληνικά έπαιρναν system font.
const sans = DM_Sans({
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
        <style>{`
          body { font-family: var(--font-sans), system-ui, sans-serif; }
          h1, h2, h3, .serif { font-family: var(--font-serif), Georgia, serif; }
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
        className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} ${sans.variable} min-h-full flex flex-col`}
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