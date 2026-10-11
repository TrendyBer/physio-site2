'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';

/*
  LangSync
  --------
  Γέφυρα ανάμεσα στο LanguageContext (localStorage, client) και σε server
  components που διαβάζουν τη γλώσσα από το URL (?lang=en).

  Χωρίς αυτό, ο switcher του header δεν έχει καμία επίδραση σε σελίδες
  όπως το /find-help, γιατί το server component δεν ξαναγράφεται.

  Χρήση σε server component:
    <LangSync urlLang={lang} />

  Δεν αποδίδει τίποτα — μόνο κάνει router.replace όταν χρειάζεται.

  ΠΕΡΙΜΕΝΕΙ ΤΟ «ready»: η γλώσσα ξεκινά προσωρινά ως 'el' (ίδια σε
  server και browser) και παίρνει την πραγματική τιμή αμέσως μετά. Αν
  το LangSync αποφάσιζε πριν από αυτό, θα έσβηνε το ?lang=en από έναν
  αγγλικό σύνδεσμο πριν προλάβει να διαβαστεί.
*/

export default function LangSync({ urlLang }) {
  const { lang, ready } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !lang || lang === urlLang) return;

    // Χρησιμοποιούμε window.location αντί για useSearchParams επίτηδες:
    // το useSearchParams απαιτεί Suspense boundary σε στατικά rendered
    // routes (όπως το /find-help με revalidate) και σπάει το build.
    const url = new URL(window.location.href);
    if (lang === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');

    router.replace(url.pathname + url.search, { scroll: false });
  }, [lang, ready, urlLang, router]);

  return null;
}
