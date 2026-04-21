'use client';
import { useState } from 'react';
import { useLang } from '@/context/LanguageContext';
import BookingButton from './BookingButton';

export default function BookingCta() {
  const { lang } = useLang();
  const [address, setAddress] = useState('');

  const t = {
    el: {
      title: 'Εξειδικευμένη Φυσιοθεραπεία', titleEm: 'στο Σπίτι σου',
      subtitle: 'Συμπλήρωσε τη διεύθυνσή σου και κλείσε ραντεβού με έναν πιστοποιημένο θεραπευτή.',
      placeholder: '📍 Διεύθυνση (π.χ. Αθηνάς 12, Αθήνα)',
      btn: 'Κλείσε Ραντεβού',
    },
    en: {
      title: 'Expert Physiotherapy', titleEm: 'at Your Home',
      subtitle: 'Enter your address and book a session with a certified physiotherapist.',
      placeholder: '📍 Address (e.g. 12 Athens St, Athens)',
      btn: 'Book a Session',
    },
  };
  const text = t[lang];

  return (
    <section style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        {/* Left */}
        <div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 44px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
            {text.title}{' '}
            <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
            {text.subtitle}
          </p>

          {/* Input + Button */}
          <div style={{ background: '#fff', borderRadius: 16, border: '2px solid #e2e8f0', padding: '6px 6px 6px 20px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 480, boxShadow: '0 4px 24px rgba(26,46,68,0.08)' }}>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder={text.placeholder}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#1a2e44', fontFamily: 'inherit', background: 'transparent', padding: '10px 0' }}
            />
            <BookingButton
              address={address}
              style={{ background: '#1a2e44', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {text.btn} →
            </BookingButton>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
            {lang === 'el' ? '✓ Χωρίς δέσμευση · ✓ Πιστοποιημένοι θεραπευτές' : '✓ No commitment · ✓ Certified therapists'}
          </div>
        </div>

        {/* Right — visual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🏠', title: lang === 'el' ? 'Κατ\' οίκον επίσκεψη' : 'Home visit', desc: lang === 'el' ? 'Ο θεραπευτής έρχεται στο σπίτι σου' : 'Therapist comes to your home' },
            { icon: '📅', title: lang === 'el' ? 'Ευέλικτο ωράριο' : 'Flexible schedule', desc: lang === 'el' ? 'Επιλέγεις την ώρα που σε βολεύει' : 'Choose the time that suits you' },
            { icon: '⭐', title: lang === 'el' ? 'Πιστοποιημένοι επαγγελματίες' : 'Certified professionals', desc: lang === 'el' ? 'Ελεγμένοι και αξιολογημένοι θεραπευτές' : 'Verified and rated therapists' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}