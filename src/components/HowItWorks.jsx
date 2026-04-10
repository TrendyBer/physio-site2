'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const DEFAULT = {
  el: {
    title: 'Απλά Βήματα για να', titleEm: 'Ξεκινήσετε',
    desc: 'Μια απλή, καθοδηγούμενη διαδικασία σχεδιασμένη να σας συνδέσει με τη σωστή φροντίδα.',
    cta: 'Κλείστε Ραντεβού →',
    steps: [
      { num: '1', label: 'Βήμα 1', title: 'Υποβάλτε το Αίτημά σας', desc: 'Συμπληρώστε μια σύντομη φόρμα με τα στοιχεία και την κατάστασή σας.' },
      { num: '2', label: 'Βήμα 2', title: 'Αντιστοιχηθείτε με Φυσιοθεραπευτή', desc: 'Η ομάδα μας σας αντιστοιχεί με έναν εξειδικευμένο θεραπευτή.' },
      { num: '3', label: 'Βήμα 3', title: 'Λάβετε Φροντίδα στο Σπίτι', desc: 'Ο φυσιοθεραπευτής σας θα σας επισκεφτεί στο σπίτι.' },
    ],
  },
  en: {
    title: 'Simple Steps to', titleEm: 'Get Started',
    desc: 'A simple, guided process designed to connect you with the right care.',
    cta: 'Request a Session →',
    steps: [
      { num: '1', label: 'Step 1', title: 'Submit Your Request', desc: 'Fill out a short form with your personal details and condition.' },
      { num: '2', label: 'Step 2', title: 'Get Matched with a Physiotherapist', desc: 'Our team matches you with a qualified physiotherapist.' },
      { num: '3', label: 'Step 3', title: 'Receive Care at Home', desc: 'Your physiotherapist will visit you at home for personalized treatment.' },
    ],
  },
};

const CACHE_KEY = 'cms_homepage_howitworks';
const CACHE_TTL = 5 * 60 * 1000;

export default function HowItWorks() {
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
        .eq('section', 'howitworks')
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

  return (
    <section id="how" style={{ padding: '80px 24px', background: '#f8fafb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
            {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>{text.desc}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 700 }}>
          {(text.steps || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, padding: '24px 0', borderBottom: i < (text.steps.length - 1) ? '1px solid #dce6f0' : 'none' }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: '#1a2e44', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{step.num}</div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2a6fdb', fontWeight: 600, marginBottom: 4 }}>{step.label}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1a2e44', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 32 }}>
            <a href="/request" style={{ background: '#1a2e44', color: '#fff', padding: '12px 28px', borderRadius: 30, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>{text.cta}</a>
          </div>
        </div>
      </div>
    </section>
  );
}