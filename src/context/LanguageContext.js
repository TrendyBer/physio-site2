'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

function getInitialLang() {
  if (typeof window === 'undefined') return 'el';
  return localStorage.getItem('lang') || 'el';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'el' ? 'en' : 'el';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}