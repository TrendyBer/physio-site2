'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const STORAGE_KEY = 'lang';
const SUPPORTED = ['el', 'en'];

function getInitialLang() {
  if (typeof window === 'undefined') return 'el';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch (_) {}
  return 'el';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}