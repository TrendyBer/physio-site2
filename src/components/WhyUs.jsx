'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Shield, Heart } from 'lucide-react';

const ICON_MAP = {
  CheckCircle2: CheckCircle2,
  Shield: Shield,
  Heart: Heart,
};

const DEFAULT = {
  el: {
    title: 'Γιατί οι Ασθενείς μας', titleEm: 'Μας Επιλέγουν',
    desc: 'Εστιαζόμαστε σε ό,τι πραγματικά μετράει: σταθερή ανάρρωση, εξατομικευμένη προσοχή.',
    cards: [
      { icon: 'CheckCircle2', title: 'Πιστοποιημένοι Φυσιοθεραπευτές', desc: 'Έμπειροι ειδικοί που παρέχουν αξιόπιστη φροντίδα στην άνεση του σπιτιού σας.' },
      { icon: 'Shield', title: 'Αξιόπιστη & Ασθενοκεντρική Υπηρεσία', desc: 'Επαγγελματική προσέγγιση σχεδιασμένη για άνετη, συνεπή θεραπεία.' },
      { icon: 'Heart', title: 'Εξατομικευμένη Φροντίδα για Κάθε Ασθενή', desc: 'Τα πλάνα θεραπείας προσαρμόζονται στην κατάσταση κάθε ασθενή.' },
    ],
  },
  en: {
    title: 'Why Patients', titleEm: 'Choose Us',
    desc: 'We focus on what truly matters: steady recovery, personalized attention.',
    cards: [
      { icon: 'CheckCircle2', title: 'Certified Physiotherapists', desc: 'Experienced specialists delivering trusted care in the comfort of your home.' },
      { icon: 'Shield', title: 'Reliable & Patient-Focused Service', desc: 'A professional approach designed to make treatment comfortable and stress-free.' },
      { icon: 'Heart', title: 'Personalized Care for Every Patient', desc: 'Treatment plans are adapted to each patient condition and recovery goals.' },
    ],
  },
};

const CACHE_KEY = 'cms_homepage_whyus';
const CACHE_TTL = 5 * 60 * 1000;

// Backward compatibility — αν τα DB cards έχουν emoji icons (παλιά format), χρησιμοποιούμε defaults
function normalizeCards(cards, defaultCards) {
  if (!Array.isArray(cards) || cards.length === 0) return defaultCards;
  const firstIcon = cards[0]?.icon;
  if (firstIcon && !ICON_MAP[firstIcon]) return defaultCards;
  return cards;
}

export default function WhyUs() {
  const { lang } = useLang();
  const [data, setData] = useState(DEFAULT);

  useEffect(() => {
    async function fetchData() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setData(value);
            return;
          }
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
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value, timestamp: Date.now() }));
        } catch (_) {}
      }
    }
    fetchData();
  }, []);

  const text = data[lang] || DEFAULT[lang];
  const cards = normalizeCards(text.cards, DEFAULT[lang].cards);

  return (
    <>
      <style>{`
        .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .why-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .why-grid { grid-template-columns: 1fr; } }
      `}</style>
      <section id="why" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
              {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
            </h2>
            <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>{text.desc}</p>
          </div>
          <div className="why-grid">
            {cards.map((card, i) => {
              const IconComp = ICON_MAP[card.icon] || CheckCircle2;
              return (
                <div key={i} style={{ background: '#f8fafb', border: '1px solid #dce6f0', borderRadius: 16, padding: 32, transition: 'all .3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a6fdb'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(26,46,68,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#dce6f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <IconComp size={24} color="#2a6fdb" strokeWidth={2.2} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a2e44', marginBottom: 10 }}>{card.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}