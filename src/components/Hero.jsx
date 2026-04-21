'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import BookingButton from './BookingButton';

const DEFAULT = {
  el: {
    badge: '★ Αξιόπιστη Φυσιοθεραπεία στην Αθήνα',
    title1: 'Εξειδικευμένη Φυσιοθεραπεία στην',
    title2: 'Άνεση του Σπιτιού σας',
    desc: 'Λάβετε επαγγελματική, εξατομικευμένη φυσιοθεραπεία εκεί που νιώθετε πιο άνετα.',
    cta: 'Κλείστε Ραντεβού →', how: 'Πώς Λειτουργεί',
    pills: ['✓ Πιστοποιημένοι Επαγγελματίες', '⏱ Ευέλικτο Ωράριο', '♥ Εξατομικευμένη Φροντίδα', '📅 Εύκολη Κράτηση'],
    image_url: '',
  },
  en: {
    badge: '★ Trusted Physiotherapy in Athens',
    title1: 'Expert Physiotherapy in the',
    title2: 'Comfort of Your Home',
    desc: "Receive professional, personalized physiotherapy treatment where you're most comfortable.",
    cta: 'Request a Session →', how: 'How It Works',
    pills: ['✓ Licensed Professionals', '⏱ Flexible Scheduling', '♥ Personalized Care', '📅 Easy Booking'],
    image_url: '',
  },
};

const CACHE_KEY = 'cms_homepage_hero';
const CACHE_TTL = 5 * 60 * 1000;

export default function Hero() {
  const { lang } = useLang();
  const [data, setData] = useState(DEFAULT);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [address, setAddress] = useState('');

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
        .eq('section', 'hero')
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

  const bookT = {
    el: {
      placeholder: '📍 Διεύθυνση (π.χ. Αθηνάς 12, Αθήνα)',
      btn: 'Κλείσε Ραντεβού',
      hint: '✓ Χωρίς δέσμευση · ✓ Πιστοποιημένοι θεραπευτές',
    },
    en: {
      placeholder: '📍 Address (e.g. 12 Athens St, Athens)',
      btn: 'Book a Session',
      hint: '✓ No commitment · ✓ Certified therapists',
    },
  };
  const bt = bookT[lang];

  return (
    <>
      <style>{`
        .hero-section { max-width: 1200px; margin: 0 auto; padding: 80px 24px 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-visual { position: relative; }
        .hero-book-box {
          background: #fff;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          padding: 8px 8px 8px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 520px;
          box-shadow: 0 8px 32px rgba(26,46,68,0.10);
          margin-bottom: 14px;
        }
        .hero-book-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: #1a2e44;
          font-family: inherit;
          background: transparent;
          padding: 14px 0;
        }
        .hero-book-btn {
          background: #1a2e44;
          color: #fff;
          padding: 14px 26px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
        }
        .hero-book-btn:hover { background: #0f1e30; }
        @media (max-width: 768px) {
          .hero-section { grid-template-columns: 1fr; padding: 40px 16px; gap: 32px; }
          .hero-visual { order: -1; }
          .hero-book-box { flex-direction: column; align-items: stretch; padding: 12px; }
          .hero-book-input { padding: 12px; }
          .hero-book-btn { width: 100%; }
        }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        .img-skeleton {
          background: linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%);
          background-size: 600px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 24px;
          aspect-ratio: 4/5;
          width: 100%;
        }
      `}</style>

      <section className="hero-section">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8f1fd', color: '#2a6fdb', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
            {text.badge}
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.15, color: '#1a2e44', marginBottom: 20 }}>
            {text.title1}{' '}<em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.title2}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 28, maxWidth: 460 }}>{text.desc}</p>

          {/* Address input + BookingButton */}
          <div className="hero-book-box">
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder={bt.placeholder}
              className="hero-book-input"
            />
            <BookingButton address={address} className="hero-book-btn">
              {bt.btn} →
            </BookingButton>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
            {bt.hint}
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            {(text.pills || []).map((pill) => (
              <span key={pill} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #dce6f0', padding: '7px 14px', borderRadius: 20, fontSize: 13, color: '#6b7a8d', boxShadow: '0 4px 24px rgba(26,46,68,0.08)' }}>
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          {text.image_url ? (
            <>
              {!imgLoaded && <div className="img-skeleton" />}
              <img
                src={text.image_url}
                alt="Hero"
                onLoad={() => setImgLoaded(true)}
                style={{ width: '100%', borderRadius: 24, boxShadow: '0 12px 48px rgba(26,46,68,0.14)', objectFit: 'cover', aspectRatio: '4/5', display: imgLoaded ? 'block' : 'none' }}
              />
            </>
          ) : (
            <div style={{ borderRadius: 24, boxShadow: '0 12px 48px rgba(26,46,68,0.14)', aspectRatio: '4/5', background: 'linear-gradient(135deg, #d4e8ff 0%, #b8d4f8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>
              📷 Photo
            </div>
          )}
        </div>
      </section>
    </>
  );
}