'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const CACHE_KEY = 'cms_homepage_howitworks';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT = {
  el: {
    badge: 'Πώς Λειτουργεί',
    title: 'Επαγγελματική Φυσιοθεραπεία,',
    titleEm: 'Απλά και Γρήγορα',
    desc: 'Σχεδιάσαμε κάθε βήμα της διαδικασίας με γνώμονα την άνεση και την ανάρρωσή σας — από την κράτηση μέχρι τη θεραπεία, στο σπίτι σας.',
    cta: 'Κλείστε Ραντεβού',
    steps: [
      { num: 'Βήμα 1', title: 'Υποβάλετε αίτημα', desc: 'Συμπληρώστε μια σύντομη φόρμα με τα στοιχεία και την κατάστασή σας. Αυτό μας βοηθά να κατανοήσουμε τις ανάγκες σας.' },
      { num: 'Βήμα 2', title: 'Αντιστοιχιστείτε με φυσιοθεραπευτή', desc: 'Η ομάδα μας ελέγχει το αίτημά σας και σας αντιστοιχίζει με έναν κατάλληλο φυσιοθεραπευτή.' },
      { num: 'Βήμα 3', title: 'Λαμβάνετε φροντίδα στο σπίτι', desc: 'Ο φυσιοθεραπευτής σας επιβεβαιώνει τη συνεδρία και έρχεται στο σπίτι σας για εξατομικευμένη θεραπεία.' },
    ],
  },
  en: {
    badge: 'How It Works',
    title: 'Professional Physiotherapy,',
    titleEm: 'Made Simple',
    desc: 'We\'ve designed every step of the process with your comfort and recovery in mind — from booking to treatment, all in your own home.',
    cta: 'Request a Session',
    steps: [
      { num: 'Step 1', title: 'Submit your request', desc: 'Fill out a short form with your personal details and condition. This helps us understand your needs.' },
      { num: 'Step 2', title: 'Get matched with a physiotherapist', desc: 'Our team reviews your request and matches you with a qualified physiotherapist.' },
      { num: 'Step 3', title: 'Receive care at home', desc: 'Your physiotherapist confirms the session and visits you at home for personalized treatment.' },
    ],
  },
};

export default function HowItWorks() {
  const { lang } = useLang();
  const [data, setData] = useState(DEFAULT);
  const [ctaHref, setCtaHref] = useState('/dashboard/patient/new-request');

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (role === 'therapist') setCtaHref('/dashboard/therapist');
    else setCtaHref('/dashboard/patient/new-request');

    async function fetchData() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) { setData(value); return; }
        }
      } catch (_) {}

      const { data: row } = await supabase
        .from('site_content')
        .select('content_el, content_en')
        .eq('page', 'homepage')
        .eq('section', 'howitworks')
        .single();

      if (row) {
        const value = { el: row.content_el, en: row.content_en };
        setData(value);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value, timestamp: Date.now() })); } catch (_) {}
      }
    }
    fetchData();
  }, []);

  const text = data[lang] || DEFAULT[lang];

  return (
    <section id="how-it-works" style={{ background: '#fff8eb', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>
            {text.badge}
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 42px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
            {text.title} <br />
            <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
          </h2>
          <p style={{ fontSize: 16, color: '#334155', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>{text.desc}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginBottom: 48 }} className="steps-grid">
          {(text.steps || []).map((step, i) => (
            <div key={i} style={{ background: '#ffffff', borderRadius: 16, padding: '28px 24px', border: '1px solid #f0e2bf', position: 'relative' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a2e44', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{step.num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href={ctaHref} style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', transition: 'background .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0f1d2c'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a2e44'}
          >
            {text.cta} →
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}