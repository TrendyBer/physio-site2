'use client';
import { useState } from 'react';
import { useLang } from '@/context/LanguageContext';
import { Home, CalendarClock, ShieldCheck, MapPin, Check } from 'lucide-react';
import BookingButton from './BookingButton';

export default function BookingCta() {
  const { lang } = useLang();
  const [address, setAddress] = useState('');

  const t = {
    el: {
      title: 'Εξειδικευμένη Φυσιοθεραπεία', titleEm: 'στο Σπίτι σου',
      subtitle: 'Συμπλήρωσε τη διεύθυνσή σου και κλείσε ραντεβού με έναν πιστοποιημένο θεραπευτή.',
      placeholder: 'Διεύθυνση (π.χ. Αθηνάς 12, Αθήνα)',
      btn: 'Κλείσε ραντεβού',
      trust: ['Χωρίς δέσμευση', 'Πιστοποιημένοι θεραπευτές'],
      cards: [
        { Icon: Home, title: 'Κατ’ οίκον επίσκεψη', desc: 'Ο θεραπευτής έρχεται στο σπίτι σου' },
        { Icon: CalendarClock, title: 'Ευέλικτο ωράριο', desc: 'Επιλέγεις την ώρα που σε βολεύει' },
        { Icon: ShieldCheck, title: 'Επαληθευμένοι επαγγελματίες', desc: 'Ελεγμένη άδεια και αξιολογήσεις ασθενών' },
      ],
    },
    en: {
      title: 'Expert Physiotherapy', titleEm: 'at Your Home',
      subtitle: 'Enter your address and book a session with a certified physiotherapist.',
      placeholder: 'Address (e.g. 12 Athens St, Athens)',
      btn: 'Book an appointment',
      trust: ['No commitment', 'Verified therapists'],
      cards: [
        { Icon: Home, title: 'Home visit', desc: 'The therapist comes to your home' },
        { Icon: CalendarClock, title: 'Flexible schedule', desc: 'Choose the time that suits you' },
        { Icon: ShieldCheck, title: 'Verified professionals', desc: 'Checked licence and patient reviews' },
      ],
    },
  };
  const text = t[lang];

  return (
    <>
      <style>{`
        .bcta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .bcta-input-row { display: flex; align-items: center; gap: 8; }
        @media (max-width: 900px) {
          .bcta-grid { grid-template-columns: 1fr; gap: 40px; }
        }
        @media (max-width: 520px) {
          .bcta-input-row { flex-direction: column; align-items: stretch; padding: 12px !important; }
          .bcta-input-row button { width: 100%; }
        }
      `}</style>
      <section style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #f1f5f9' }}>
        <div className="bcta-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Left */}
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 44px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {text.title}{' '}
              <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
            </h2>
            <p style={{ fontSize: 16, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              {text.subtitle}
            </p>

            <div className="bcta-input-row" style={{ background: '#fff', borderRadius: 16, border: '2px solid #e2e8f0', padding: '6px 6px 6px 16px', gap: 8, maxWidth: 480, boxShadow: '0 4px 24px rgba(26,46,68,0.08)' }}>
              <MapPin size={17} color="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }} />
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={text.placeholder}
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 15, color: '#1a2e44', fontFamily: 'inherit', background: 'transparent', padding: '10px 0' }}
              />
              <BookingButton
                address={address}
                style={{ background: '#1a2e44', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {text.btn}
              </BookingButton>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8' }}>
              {text.trust.map(item => (
                <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Check size={13} color="#15803D" strokeWidth={3} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right — visual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {text.cards.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', border: '1px solid #e2e8f0' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#eaf2fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={19} color="#2a6fdb" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}