'use client';
import { useState } from 'react';

const CONTENT = {
  el: {
    title: 'Πολιτική Cookies',
    lastUpdated: 'Τελευταία ενημέρωση: 29 Απριλίου 2026',
    intro: 'Η παρούσα Πολιτική Cookies εξηγεί πώς χρησιμοποιούμε cookies και παρόμοιες τεχνολογίες στην πλατφόρμα PhysioHome.',
    sections: [
      {
        h: '1. Τι είναι τα Cookies',
        p: [
          'Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας όταν επισκέπτεστε έναν ιστότοπο. Επιτρέπουν στον ιστότοπο να αναγνωρίζει τη συσκευή σας και να αποθηκεύει πληροφορίες σχετικά με τις προτιμήσεις σας ή προηγούμενες ενέργειες.',
        ],
      },
      {
        h: '2. Είδη Cookies που Χρησιμοποιούμε',
        cards: [
          {
            tag: 'Αυστηρώς Απαραίτητα',
            color: '#15803D',
            bg: '#F0FDF4',
            border: '#BBF7D0',
            req: 'Υποχρεωτικά',
            desc: 'Απαραίτητα για τη λειτουργία της Πλατφόρμας. Χωρίς αυτά δεν μπορείτε να συνδεθείτε ή να χρησιμοποιήσετε βασικές λειτουργίες.',
            examples: ['Authentication tokens (Supabase session)', 'Session cookies', 'Security/CSRF tokens'],
          },
          {
            tag: 'Λειτουργικά',
            color: '#1D4ED8',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            req: 'Προαιρετικά',
            desc: 'Επιτρέπουν την απομνημόνευση επιλογών για βελτιωμένη εμπειρία (π.χ. προτιμώμενη γλώσσα).',
            examples: ['Language preference', 'UI preferences', 'Cookie consent storage'],
          },
          {
            tag: 'Αναλυτικά',
            color: '#A16207',
            bg: '#FFFBEB',
            border: '#FDE68A',
            req: 'Προαιρετικά (consent required)',
            desc: 'Μας βοηθούν να καταλάβουμε πώς χρησιμοποιείται η Πλατφόρμα ώστε να τη βελτιώσουμε. Δεν χρησιμοποιούμε ακόμα analytics, αλλά όταν τα ενεργοποιήσουμε, θα ζητήσουμε τη συγκατάθεσή σας.',
            examples: ['Google Analytics (μελλοντικά)', 'Vercel Analytics (όταν ενεργοποιηθεί)'],
          },
          {
            tag: 'Marketing',
            color: '#9F1239',
            bg: '#FFF1F2',
            border: '#FECDD3',
            req: 'Προαιρετικά (consent required)',
            desc: 'Δεν χρησιμοποιούμε αυτή τη στιγμή marketing/tracking cookies. Σε περίπτωση που τα ενεργοποιήσουμε στο μέλλον, θα ενημερωθείτε και θα ζητηθεί η συγκατάθεσή σας.',
            examples: ['Δεν χρησιμοποιούνται προς το παρόν'],
          },
        ],
      },
      {
        h: '3. Πώς να Διαχειριστείτε τα Cookies',
        p: ['Έχετε τις εξής επιλογές:'],
        list: [
          'Στο cookies banner κατά την πρώτη επίσκεψη: επιλέξτε "Αποδοχή", "Απόρριψη" ή "Προσαρμογή"',
          'Στις ρυθμίσεις του browser σας: μπορείτε να μπλοκάρετε ή να διαγράψετε cookies',
          'Διαγραφή υπαρχόντων cookies: Settings → Privacy → Clear browsing data',
        ],
        p2: ['Σημείωση: Η απόρριψη των αυστηρώς απαραίτητων cookies θα εμποδίσει τη λειτουργία της Πλατφόρμας (π.χ. δεν θα μπορείτε να συνδεθείτε).'],
      },
      {
        h: '4. Cookies Τρίτων',
        p: [
          'Χρησιμοποιούμε υπηρεσίες τρίτων που μπορεί να εγκαθιστούν δικά τους cookies:',
        ],
        list: [
          'Supabase (αυθεντικοποίηση και βάση δεδομένων)',
          'Vercel (hosting)',
          'Google Fonts (αν φορτώνονται γραμματοσειρές)',
        ],
        p2: ['Αυτές οι υπηρεσίες έχουν τις δικές τους πολιτικές απορρήτου.'],
      },
      {
        h: '5. Επικοινωνία',
        p: [
          'Για ερωτήσεις: support@physiohome.gr',
        ],
      },
    ],
  },
  en: {
    title: 'Cookie Policy',
    lastUpdated: 'Last updated: April 29, 2026',
    intro: 'This Cookie Policy explains how we use cookies and similar technologies on the PhysioHome platform.',
    sections: [
      {
        h: '1. What are Cookies',
        p: [
          'Cookies are small text files stored on your device when you visit a website. They allow the website to recognize your device and store information about your preferences or previous actions.',
        ],
      },
      {
        h: '2. Types of Cookies We Use',
        cards: [
          {
            tag: 'Strictly Necessary',
            color: '#15803D',
            bg: '#F0FDF4',
            border: '#BBF7D0',
            req: 'Required',
            desc: 'Necessary for the operation of the Platform. Without them you cannot log in or use basic functionality.',
            examples: ['Authentication tokens (Supabase session)', 'Session cookies', 'Security/CSRF tokens'],
          },
          {
            tag: 'Functional',
            color: '#1D4ED8',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            req: 'Optional',
            desc: 'Allow remembering choices for an improved experience (e.g., preferred language).',
            examples: ['Language preference', 'UI preferences', 'Cookie consent storage'],
          },
          {
            tag: 'Analytics',
            color: '#A16207',
            bg: '#FFFBEB',
            border: '#FDE68A',
            req: 'Optional (consent required)',
            desc: 'Help us understand how the Platform is used so we can improve it. We do not yet use analytics, but when we enable them, we will request your consent.',
            examples: ['Google Analytics (future)', 'Vercel Analytics (when enabled)'],
          },
          {
            tag: 'Marketing',
            color: '#9F1239',
            bg: '#FFF1F2',
            border: '#FECDD3',
            req: 'Optional (consent required)',
            desc: 'We do not currently use marketing/tracking cookies. If we enable them in the future, you will be informed and your consent will be requested.',
            examples: ['Not currently in use'],
          },
        ],
      },
      {
        h: '3. How to Manage Cookies',
        p: ['You have the following options:'],
        list: [
          'In the cookies banner on first visit: choose "Accept", "Reject" or "Customize"',
          'In your browser settings: you can block or delete cookies',
          'Delete existing cookies: Settings → Privacy → Clear browsing data',
        ],
        p2: ['Note: Rejecting strictly necessary cookies will prevent the Platform from functioning (e.g., you will not be able to log in).'],
      },
      {
        h: '4. Third-Party Cookies',
        p: ['We use third-party services that may install their own cookies:'],
        list: [
          'Supabase (authentication and database)',
          'Vercel (hosting)',
          'Google Fonts (if fonts are loaded)',
        ],
        p2: ['These services have their own privacy policies.'],
      },
      {
        h: '5. Contact',
        p: ['For questions: support@physiohome.gr'],
      },
    ],
  },
};

export default function CookiePolicyPage() {
  const [lang, setLang] = useState('el');
  const c = CONTENT[lang];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
        </a>
        <a href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← {lang === 'el' ? 'Επιστροφή' : 'Back'}</a>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 24 }}>
          {['el', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding: '6px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#0F172A' : '#64748B', textTransform: 'uppercase' }}>
              {l}
            </button>
          ))}
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a2e44', marginBottom: 8, fontFamily: 'Georgia, serif' }}>{c.title}</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>{c.lastUpdated}</p>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24, fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
          {c.intro}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '32px 28px' }}>
          {c.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: i === c.sections.length - 1 ? 0 : 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 12 }}>{s.h}</h2>
              {s.p && s.p.map((p, j) => (
                <p key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 8 }}>{p}</p>
              ))}
              {s.cards && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {s.cards.map((card, j) => (
                    <div key={j} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ background: card.color, color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{card.tag}</span>
                        <span style={{ fontSize: 11, color: card.color, fontWeight: 600 }}>{card.req}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>{card.desc}</p>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>
                        {lang === 'el' ? 'Παραδείγματα:' : 'Examples:'}
                      </div>
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {card.examples.map((ex, k) => (
                          <li key={k} style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{ex}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {s.list && (
                <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
                  ))}
                </ul>
              )}
              {s.p2 && s.p2.map((p, j) => (
                <p key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginTop: 8 }}>{p}</p>
              ))}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          <a href="/privacy" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Πολιτική Απορρήτου' : 'Privacy Policy'}</a>
          •
          <a href="/terms" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Όροι Χρήσης' : 'Terms of Service'}</a>
        </div>
      </div>
    </div>
  );
}