'use client';
import { createContext, useContext, useState, useEffect, Suspense } from 'react';

// ═══════════════════════════════════════════════════════════════════
// Γλώσσα του site (EL / EN).
//
// ΓΙΑΤΙ ΔΕΝ ΥΠΑΡΧΕΙ ΠΙΑ «if (!mounted) return null»:
// Ο provider τυλίγει ΟΛΟ το site (layout.js). Όσο επέστρεφε null μέχρι
// να φορτώσει ο browser, ο server έστελνε ΚΕΝΗ σελίδα — μόνο τίτλο και
// meta, χωρίς κείμενο. Το Google έβλεπε το περιεχόμενο μόνο σε δεύτερο
// γύρο (αφού τρέξει JavaScript), και οι προεπισκοπήσεις συνδέσμων
// (Viber, Messenger, LinkedIn) καθόλου.
//
// ΠΩΣ ΑΠΟΦΕΥΓΕΤΑΙ ΤΟ «ΜΠΕΡΔΕΜΑ» ΧΩΡΙΣ ΑΥΤΟ:
// Server και πρώτη απόδοση στον browser ξεκινούν ΠΑΝΤΑ από 'el', άρα
// είναι ίδιες. Αμέσως μετά διαβάζεται η επιλογή του επισκέπτη (από τη
// διεύθυνση ?lang=en ή από την αποθηκευμένη προτίμηση) και, αν είναι
// αγγλικά, η σελίδα αλλάζει γλώσσα.
//
// Το «ready» λέει στα components (π.χ. LangSync) πότε η γλώσσα είναι η
// πραγματική — ώστε να μην αποφασίζουν με βάση το προσωρινό 'el'.
// ═══════════════════════════════════════════════════════════════════

const LanguageContext = createContext({ lang: 'el', ready: false, setLanguage: () => {}, toggleLang: () => {} });

const STORAGE_KEY = 'lang';
const SUPPORTED = ['el', 'en'];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('el');
  const [ready, setReady] = useState(false);

  // Η πραγματική γλώσσα του επισκέπτη — μόνο στον browser.
  // Προτεραιότητα: ?lang=en στη διεύθυνση (π.χ. σύνδεσμος που του
  // έστειλαν), μετά η αποθηκευμένη προτίμηση, αλλιώς ελληνικά.
  useEffect(() => {
    let next = 'el';
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('lang');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (fromUrl && SUPPORTED.includes(fromUrl)) {
        next = fromUrl;
        localStorage.setItem(STORAGE_KEY, fromUrl);
      } else if (saved && SUPPORTED.includes(saved)) {
        next = saved;
      }
    } catch (_) {}
    setLang(next);
    setReady(true);
  }, []);

  // Κρατάει το <html lang="..."> συγχρονισμένο — βοηθάει SEO + screen readers
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  // Άμεση επιλογή γλώσσας (χρησιμοποιείται από το LanguageSwitcher overlay)
  const setLanguage = (next) => {
    if (!SUPPORTED.includes(next)) return;
    if (next === lang) return;
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  };

  // Διατηρείται για συμβατότητα με υπάρχοντα components
  const toggleLang = () => {
    setLanguage(lang === 'el' ? 'en' : 'el');
  };

  return (
    <LanguageContext.Provider value={{ lang, ready, setLanguage, toggleLang }}>
      {/* ΔΙΧΤΥ ΑΣΦΑΛΕΙΑΣ: μέχρι τώρα ΤΙΠΟΤΑ κάτω από εδώ δεν αποδιδόταν
          στον server, οπότε κάποιο component μπορεί να διαβάζει π.χ.
          localStorage κατευθείαν. Αν ένα τέτοιο σπάσει στον server, το
          Suspense κάνει τη σελίδα να αποδοθεί στον browser — όπως
          ακριβώς πριν — αντί να βγάλει σφάλμα. Οι σελίδες που αποδίδονται
          κανονικά στον server δεν επηρεάζονται. */}
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
