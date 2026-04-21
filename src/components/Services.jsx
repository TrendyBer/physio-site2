'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import BookingButton from './BookingButton';

const DEFAULT = {
  el: {
    title: 'Υπηρεσίες', titleEm: 'Φυσιοθεραπείας',
    desc: 'Εξατομικευμένη φροντίδα για ένα εύρος παθήσεων.',
    viewAll: 'Όλες οι Υπηρεσίες', cta: 'Κλείστε Ραντεβού →',
    services: [
      { title: 'Μυοσκελετική Φυσιοθεραπεία', desc: 'Θεραπεία για πόνο στη μέση, αυχένα, αρθρώσεις.', price: '€30', image_url: '' },
      { title: 'Μετεγχειρητική Αποκατάσταση', desc: 'Εξατομικευμένη υποστήριξη μετά το χειρουργείο.', price: '€40', image_url: '' },
      { title: 'Αποκατάσταση Αθλητικών Τραυματισμών', desc: 'Εστιασμένη αποκατάσταση για αθλητικούς τραυματισμούς.', price: '€20', image_url: '' },
    ],
  },
  en: {
    title: 'Physiotherapy', titleEm: 'Services We Offer',
    desc: 'Personalized care for a range of conditions.',
    viewAll: 'View All Services', cta: 'Request a Session →',
    services: [
      { title: 'Musculoskeletal Physiotherapy', desc: 'Treatment for back pain, neck pain, joint issues.', price: '€30', image_url: '' },
      { title: 'Post-Surgery Rehabilitation', desc: 'Personalized support to restore strength after surgery.', price: '€40', image_url: '' },
      { title: 'Sports Injury Recovery', desc: 'Focused rehabilitation for sports injuries.', price: '€20', image_url: '' },
    ],
  },
};

export default function Services() {
  const { lang } = useLang();
  const [data, setData] = useState(DEFAULT);

  useEffect(() => {
    async function fetchData() {
      const { data: row } = await supabase
        .from('site_content')
        .select('content_el, content_en')
        .eq('page', 'homepage')
        .eq('section', 'services')
        .single();
      if (row) setData({ el: row.content_el, en: row.content_en });
    }
    fetchData();
  }, []);

  const text = data[lang] || DEFAULT[lang];

  return (
    <>
      <style>{`
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .services-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .services-grid { grid-template-columns: 1fr; } }
        .service-card { border-radius: 16px; overflow: hidden; border: 1px solid #dce6f0; background: #ffffff; transition: all .3s; }
        .service-card:hover { box-shadow: 0 12px 48px rgba(26,46,68,0.14); transform: translateY(-4px); border-color: #c9ddf4; }
      `}</style>
      {/* Warm off-white */}
      <section id="services" style={{ padding: '80px 24px', background: '#faf9f6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              {/* Italic accent signature */}
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#334155', maxWidth: 560 }}>{text.desc}</p>
            </div>
            <a href="/services" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.viewAll}</a>
          </div>
          <div className="services-grid">
            {(text.services || []).map((s, i) => (
              <div key={i} className="service-card">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.title} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover' }} />
                ) : (
                  <div style={{ aspectRatio: '16/10', background: 'linear-gradient(135deg, #eaf2fc, #c9ddf4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 13 }}>📷</div>
                )}
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>{s.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <BookingButton style={{ fontSize: 13, padding: '7px 14px', borderRadius: 20, background: '#1a2e44', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                      {text.cta}
                    </BookingButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}