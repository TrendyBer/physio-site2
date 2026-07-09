'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';

const CACHE_KEY = 'cms_homepage_howitworks';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT = {
  el: {
    badge: 'Πώς Λειτουργεί',
    title: 'Βρείτε φροντίδα στο σπίτι',
    titleEm: 'σε 3 απλά βήματα',
    desc: 'Από την περιγραφή της ανάγκης σας μέχρι το αίτημα συνεδρίας — μια απλή, ξεκάθαρη διαδικασία, χωρίς άγχος.',
    cta: 'Βρες φυσιοθεραπευτή',
    steps: [
      { num: 'Βήμα 1', title: 'Περιγράφετε την ανάγκη σας', desc: 'Πείτε μας τι σας ταλαιπωρεί ή επιλέξτε πάθηση, ώστε να καταλάβουμε τι χρειάζεστε.' },
      { num: 'Βήμα 2', title: 'Βλέπετε κατάλληλους φυσιοθεραπευτές', desc: 'Σας προτείνουμε επαγγελματίες με βάση την περιοχή, την εμπειρία, τη διαθεσιμότητα και τις αξιολογήσεις.' },
      { num: 'Βήμα 3', title: 'Στέλνετε αίτημα συνεδρίας', desc: 'Επιλέγετε θεραπευτή, ώρα και πακέτο. Θα ενημερωθείτε μόλις ο φυσιοθεραπευτής επιβεβαιώσει το αίτημα.' },
    ],
  },
  en: {
    badge: 'How It Works',
    title: 'Find home care',
    titleEm: 'in 3 simple steps',
    desc: 'From describing your need to sending a session request — a simple, clear process, without the stress.',
    cta: 'Find a physiotherapist',
    steps: [
      { num: 'Step 1', title: 'Describe your need', desc: 'Tell us what troubles you or pick a condition, so we understand what you need.' },
      { num: 'Step 2', title: 'See suitable physiotherapists', desc: 'We suggest professionals based on area, experience, availability and reviews.' },
      { num: 'Step 3', title: 'Send a session request', desc: 'Choose a therapist, time and package. You will be notified once the physiotherapist confirms your request.' },
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
    <section id="how-it-works" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>
            {text.badge}
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 42px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
            {text.title} <br />
            <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>{text.desc}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginBottom: 48 }} className="steps-grid">
          {(text.steps || []).map((step, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #dce6f0', position: 'relative' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a2e44', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{step.num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href={ctaHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            {text.cta}
            <ArrowRight size={18} />
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