'use client';
// src/app/auth/email-verified/page.jsx
// Αποτέλεσμα του link «Επιβεβαίωση email» (το στέλνει εδώ το
// /api/auth/verify-email με ?s=ok|already|invalid|error&r=therapist|patient).

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import Logo from '@/components/Logo';
import { C, R, F, btn } from '@/lib/tokens';

const TX = {
  el: {
    okTitle: 'Το email επιβεβαιώθηκε',
    okTherapist: 'Ευχαριστούμε! Μόλις ολοκληρώσεις το προφίλ σου και ανεβάσεις την άδεια άσκησης επαγγέλματος, η ομάδα μας θα το ελέγξει για έγκριση.',
    okPatient: 'Ευχαριστούμε! Θα λαμβάνετε εδώ τις ενημερώσεις για τα ραντεβού σας.',
    alreadyTitle: 'Το email είναι ήδη επιβεβαιωμένο',
    alreadyText: 'Δεν χρειάζεται κάτι άλλο.',
    badTitle: 'Το link δεν είναι έγκυρο',
    badText: 'Ίσως είναι παλιό ή αντιγράφηκε λάθος. Συνδεθείτε και πατήστε «Επαναποστολή» στον πίνακά σας για νέο email.',
    errTitle: 'Κάτι πήγε στραβά',
    errText: 'Δεν καταφέραμε να ολοκληρώσουμε την επιβεβαίωση. Δοκιμάστε ξανά σε λίγο ή στείλτε μας μήνυμα στη φόρμα επικοινωνίας.',
    toDashboard: 'Μετάβαση στον πίνακα',
    toLogin: 'Σύνδεση',
  },
  en: {
    okTitle: 'Your email is confirmed',
    okTherapist: 'Thank you! Once you complete your profile and upload your licence to practise, our team will review it for approval.',
    okPatient: 'Thank you! You will receive updates about your appointments here.',
    alreadyTitle: 'Your email is already confirmed',
    alreadyText: 'There is nothing else you need to do.',
    badTitle: 'This link is not valid',
    badText: 'It may be old or copied incorrectly. Sign in and press "Resend" on your dashboard to get a new email.',
    errTitle: 'Something went wrong',
    errText: 'We could not complete the confirmation. Please try again shortly or contact us through the contact form.',
    toDashboard: 'Go to my dashboard',
    toLogin: 'Sign in',
  },
};

export default function EmailVerifiedPage() {
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;
  const [state, setState] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setState({ s: q.get('s') || 'invalid', r: q.get('r') });
  }, []);

  if (!state) return <div style={{ minHeight: '100vh', background: C.page }} />;

  const good = state.s === 'ok' || state.s === 'already';
  const title = state.s === 'ok' ? tx.okTitle
    : state.s === 'already' ? tx.alreadyTitle
    : state.s === 'error' ? tx.errTitle : tx.badTitle;
  const text = state.s === 'ok' ? (state.r === 'therapist' ? tx.okTherapist : tx.okPatient)
    : state.s === 'already' ? tx.alreadyText
    : state.s === 'error' ? tx.errText : tx.badText;
  const dash = state.r === 'therapist' ? '/dashboard/therapist'
    : state.r === 'patient' ? '/dashboard/patient' : '/auth/login';

  return (
    <div style={{ minHeight: '100vh', background: C.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: F.sans }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.modal, padding: '36px 28px', width: '100%', maxWidth: 460, textAlign: 'center', boxShadow: '0 8px 40px rgba(26,46,68,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <a href="/" aria-label="Theralivo"><Logo variant="primary" tone="dark" size={30} /></a>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: good ? C.successBg : C.warnBg }}>
          {good ? <CheckCircle2 size={28} color={C.success} /> : <AlertTriangle size={28} color={C.warn} />}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 10 }}>{title}</h1>
        <p style={{ fontSize: 15, color: C.textBody, lineHeight: 1.65, marginBottom: 24 }}>{text}</p>
        <a href={dash} style={{ ...btn('primary'), textDecoration: 'none' }}>
          {state.r ? tx.toDashboard : tx.toLogin}
        </a>
      </div>
    </div>
  );
}
