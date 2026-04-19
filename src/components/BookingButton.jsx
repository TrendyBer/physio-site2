'use client';
import { useState } from 'react';
import { useLang } from '@/context/LanguageContext';

/**
 * BookingButton — Ενιαίο κουμπί "Κλείσε Ραντεβού"
 *
 * Χρήση:
 *   <BookingButton>Κλείστε Ραντεβού</BookingButton>
 *   <BookingButton style={{...}}>Custom text</BookingButton>
 *   <BookingButton variant="link">Κλείστε Ραντεβού →</BookingButton>
 *
 * Συμπεριφορά:
 *  - Αν είναι συνδεδεμένος patient → /dashboard/patient/new-request
 *  - Αν όχι → ανοίγει auth modal με επιλογές Σύνδεση / Εγγραφή
 *  - Μετά το login, συνεχίζει στη φόρμα (μέσω pendingRedirect στο localStorage)
 */
export default function BookingButton({ children, style, variant = 'button', className }) {
  const { lang } = useLang();
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleClick(e) {
    e.preventDefault();
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (role === 'patient') {
      window.location.href = '/dashboard/patient/new-request';
    } else {
      localStorage.setItem('pendingRedirect', '/dashboard/patient/new-request');
      setShowAuthModal(true);
    }
  }

  const t = {
    el: {
      authTitle: 'Συνδεθείτε για να συνεχίσετε',
      authDesc: 'Χρειάζεστε λογαριασμό για να κλείσετε ραντεβού.',
      login: 'Σύνδεση',
      register: 'Εγγραφή',
      cancel: 'Άκυρο',
    },
    en: {
      authTitle: 'Sign in to continue',
      authDesc: 'You need an account to book a session.',
      login: 'Sign In',
      register: 'Register',
      cancel: 'Cancel',
    },
  };
  const text = t[lang];

  // Default button styles (αν δεν έχει δοθεί style prop)
  const defaultStyle = {
    background: '#1a2e44',
    color: '#fff',
    padding: '14px 32px',
    borderRadius: 30,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const finalStyle = style || defaultStyle;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        style={finalStyle}
      >
        {children}
      </button>

      {showAuthModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuthModal(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{text.authTitle}</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.7 }}>{text.authDesc}</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <a href="/auth/login" style={{ flex: 1, padding: '13px', borderRadius: 30, background: '#1a2e44', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                {text.login}
              </a>
              <a href="/auth/register?role=patient" style={{ flex: 1, padding: '13px', borderRadius: 30, background: 'transparent', color: '#1a2e44', fontSize: 15, fontWeight: 600, textDecoration: 'none', textAlign: 'center', border: '1.5px solid #1a2e44' }}>
                {text.register}
              </a>
            </div>
            <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
              {text.cancel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}