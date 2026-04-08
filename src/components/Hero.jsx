'use client';
import { useLang } from '@/context/LanguageContext';

export default function Hero() {
  const { lang } = useLang();
  const t = {
    el: {
      badge: '★ Αξιόπιστη Φυσιοθεραπεία στην Αθήνα',
      title1: 'Εξειδικευμένη Φυσιοθεραπεία στην',
      title2: 'Άνεση του Σπιτιού σας',
      desc: 'Λάβετε επαγγελματική, εξατομικευμένη φυσιοθεραπεία εκεί που νιώθετε πιο άνετα. Οι αδειοδοτημένοι θεραπευτές μας φέρνουν την εξειδικευμένη φροντίδα κατευθείαν σε εσάς.',
      cta: 'Κλείστε Ραντεβού →', how: 'Πώς Λειτουργεί',
      pills: ['✓ Πιστοποιημένοι Επαγγελματίες', '⏱ Ευέλικτο Ωράριο', '♥ Εξατομικευμένη Φροντίδα', '📅 Εύκολη Κράτηση'],
      photo: 'Φωτογραφία Θεραπείας',
    },
    en: {
      badge: '★ Trusted Physiotherapy in Athens',
      title1: 'Expert Physiotherapy in the',
      title2: 'Comfort of Your Home',
      desc: 'Receive professional, personalized physiotherapy treatment where you\'re most comfortable. Our licensed therapists bring expert care directly to you.',
      cta: 'Request a Session →', how: 'How It Works',
      pills: ['✓ Licensed Professionals', '⏱ Flexible Scheduling', '♥ Personalized Care', '📅 Easy Booking'],
      photo: 'Therapy Photo',
    },
  };
  const text = t[lang];

  return (
    <>
      <style>{`
        .hero-section { max-width: 1200px; margin: 0 auto; padding: 80px 24px 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-visual { position: relative; }
        @media (max-width: 768px) {
          .hero-section { grid-template-columns: 1fr; padding: 40px 16px; gap: 32px; }
          .hero-visual { order: -1; }
        }
      `}</style>
      <section className="hero-section">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8f1fd', color: '#2a6fdb', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>{text.badge}</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.15, color: '#1a2e44', marginBottom: 20 }}>
            {text.title1}{' '}<em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.title2}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>{text.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href="/request" style={{ background: '#1a2e44', color: '#fff', padding: '12px 28px', borderRadius: 30, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>{text.cta}</a>
            <a href="/how-it-works" style={{ background: 'transparent', color: '#1a2e44', padding: '12px 28px', borderRadius: 30, fontSize: 15, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.how}</a>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 36 }}>
            {text.pills.map((pill) => (
              <span key={pill} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #dce6f0', padding: '7px 14px', borderRadius: 20, fontSize: 13, color: '#6b7a8d', boxShadow: '0 4px 24px rgba(26,46,68,0.08)' }}>{pill}</span>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div style={{ borderRadius: 24, boxShadow: '0 12px 48px rgba(26,46,68,0.14)', aspectRatio: '4/5', background: 'linear-gradient(135deg, #d4e8ff 0%, #b8d4f8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>
            📷 {text.photo}
          </div>
        </div>
      </section>
    </>
  );
}