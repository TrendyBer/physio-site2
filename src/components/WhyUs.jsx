'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const DEFAULT = {
  el: {
    title: 'Γιατί οι Ασθενείς μας', titleEm: 'Μας Επιλέγουν',
    desc: 'Εστιαζόμαστε σε ό,τι πραγματικά μετράει: σταθερή ανάρρωση, εξατομικευμένη προσοχή.',
    cards: [
      { icon: '✓', title: 'Πιστοποιημένοι Φυσιοθεραπευτές', desc: 'Έμπειροι ειδικοί που παρέχουν αξιόπιστη φροντίδα στην άνεση του σπιτιού σας.' },
      { icon: '🛡', title: 'Αξιόπιστη & Ασθενοκεντρική Υπηρεσία', desc: 'Επαγγελματική προσέγγιση σχεδιασμένη για άνετη, συνεπή θεραπεία.' },
      { icon: '♥', title: 'Εξατομικευμένη Φροντίδα για Κάθε Ασθενή', desc: 'Τα πλάνα θεραπείας προσαρμόζονται στην κατάσταση κάθε ασθενή.' },
    ],
  },
  en: {
    title: 'Why Patients', titleEm: 'Choose Us',
    desc: 'We focus on what truly matters: steady recovery, personalized attention.',
    cards: [
      { icon: '✓', title: 'Certified Physiotherapists', desc: 'Experienced specialists delivering trusted care in the comfort of your home.' },
      { icon: '🛡', title: 'Reliable & Patient-Focused Service', desc: 'A professional approach designed to make treatment comfortable and stress-free.' },
      { icon: '♥', title: 'Personalized Care for Every Patient', desc: 'Treatment plans are adapted to each patient condition and recovery goals.' },
    ],
  },
};

const CACHE_KEY = 'cms_homepage_whyus';
const CACHE_TTL = 5 * 60 * 1000;

export default function WhyUs() {
  const { lang } = useLang();
  const [data, setData] = useState(DEFAULT);

  useEffect(() => {
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
        .eq('section', 'whyus')
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
    <>
      <style>{`
        .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .why-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .why-grid { grid-template-columns: 1fr; } }
      `}</style>
      <section id="why" style={{ padding: '80px 24px', background: '#faf6ef' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
              {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
            </h2>
            <p style={{ fontSize: 16, color: '#334155', maxWidth: 560 }}>{text.desc}</p>
          </div>
          <div className="why-grid">
            {(text.cards || []).map((card, i) => (
              <div key={i} style={{ background: '#ffffff', border: '1px solid #e8dfd0', borderRadius: 16, padding: 32, transition: 'all .3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a6fdb'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(26,46,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8dfd0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eaf2fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20, color: '#2a6fdb' }}>{card.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a2e44', marginBottom: 10 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}