'use client';
import { useState, useEffect } from 'react';

export default function CtaBanner() {
  const [ctaHref, setCtaHref] = useState('/dashboard/patient/new-request');

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (role === 'therapist') setCtaHref('/dashboard/therapist');
    else setCtaHref('/dashboard/patient/new-request');
  }, []);

  return (
    <section style={{ background: '#1a2e44', padding: '60px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#fff', marginBottom: 16 }}>
          Έτοιμοι να Ξεκινήσετε το{' '}
          <em style={{ fontStyle: 'italic', color: '#4a8ff5' }}>Ταξίδι Ανάρρωσής σας</em>;
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 32, fontSize: 16 }}>
          Κλείστε την πρώτη σας συνεδρία σήμερα και ζήστε τη διαφορά της εξατομικευμένης φυσιοθεραπείας στο σπίτι.
        </p>
        <a href={ctaHref} style={{ background: '#fff', color: '#1a2e44', padding: '14px 32px', borderRadius: 30, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
          Κλείστε Ραντεβού →
        </a>
      </div>
    </section>
  );
}