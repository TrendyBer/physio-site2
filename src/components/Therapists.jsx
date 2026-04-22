'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

function Avatar({ name, photoUrl, size = 60 }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', color: '#1a2e44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.32, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function TherapistModal({ therapist, lang, onClose }) {
  if (!therapist) return null;
  const bookLabel  = lang === 'el' ? 'Κλείστε Ραντεβού' : 'Book a Session';
  const closeLabel = lang === 'el' ? 'Κλείσιμο' : 'Close';
  const bioLabel   = lang === 'el' ? 'Βιογραφικό' : 'About';
  const areaLabel  = lang === 'el' ? 'Περιοχή' : 'Area';

  const bookHref = `/dashboard/patient/new-request?therapist=${encodeURIComponent(therapist.name || '')}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar name={therapist.name} photoUrl={therapist.photo_url} size={72} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>{therapist.name}</h2>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}>{therapist.specialty}</div>
            {therapist.price_per_session && (
              <div style={{ fontSize: 14, color: '#2a6fdb', fontWeight: 600 }}>{therapist.price_per_session}€/{lang === 'el' ? 'συνεδρία' : 'session'}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {therapist.bio && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{bioLabel}</div>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, background: '#faf6ef', padding: '12px 14px', borderRadius: 8, borderLeft: '3px solid #e8dfd0' }}>{therapist.bio}</p>
            </div>
          )}

          {therapist.area && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{areaLabel}</div>
              <div style={{ fontSize: 14, color: '#1a2e44', fontWeight: 500 }}>{therapist.area}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <a href={bookHref} style={{ flex: 1, background: '#1a2e44', color: '#fff', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>{bookLabel} →</a>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: '#1a2e44', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: '1.5px solid #e8dfd0', cursor: 'pointer', fontFamily: 'inherit' }}>{closeLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Therapists() {
  const { lang } = useLang();
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTherapists() {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (!error && data) setTherapists(data);
      setLoading(false);
    }
    fetchTherapists();
  }, []);

  const t = {
    el: {
      title: 'Οι', titleEm: 'Φυσιοθεραπευτές', titleEnd: 'μας',
      desc: 'Γνωρίστε έμπειρους, αδειοδοτημένους επαγγελματίες που παρέχουν εξατομικευμένη φροντίδα στο σπίτι σας.',
      viewAll: 'Όλοι οι Θεραπευτές',
      viewProfile: 'Δείτε Προφίλ',
      experience: 'χρόνια εμπειρίας',
      perSession: '€/συνεδρία',
    },
    en: {
      title: 'Our', titleEm: 'Physiotherapists', titleEnd: '',
      desc: 'Meet experienced, licensed professionals providing personalized care at home.',
      viewAll: 'All Therapists',
      viewProfile: 'View Profile',
      experience: 'years experience',
      perSession: '€/session',
    },
  };
  const text = t[lang];

  if (loading) return null;
  if (therapists.length === 0) return null;

  return (
    <>
      <style>{`
        .therapists-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        @media (max-width: 640px) { .therapists-grid { grid-template-columns: 1fr; } }
        .th-card { background: #fff; border-radius: 16px; border: 1px solid #e8dfd0; padding: 24px; transition: all .3s; cursor: pointer; }
        .th-card:hover { box-shadow: 0 4px 24px rgba(26,46,68,0.08); transform: translateY(-4px); border-color: #2a6fdb; }
      `}</style>
      <section id="therapists" style={{ padding: '80px 24px', background: '#f5ede0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em> {text.titleEnd}
              </h2>
              <p style={{ fontSize: 16, color: '#334155', maxWidth: 560 }}>{text.desc}</p>
            </div>
            <a href="/therapists" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.viewAll}</a>
          </div>

          <div className="therapists-grid">
            {therapists.map(th => (
              <div key={th.id} className="th-card" onClick={() => setSelectedTherapist(th)}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                  <Avatar name={th.name} photoUrl={th.photo_url} size={60} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44' }}>{th.name || '—'}</div>
                    {th.specialty && <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{th.specialty}</div>}
                    {th.price_per_session && (
                      <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{th.price_per_session}{text.perSession}</div>
                    )}
                  </div>
                </div>

                {th.bio && (
                  <p style={{ fontSize: 14, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                    {th.bio.length > 140 ? th.bio.slice(0, 140) + '...' : th.bio}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {th.years_experience && (
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#1a2e44', color: '#fff' }}>
                      {th.years_experience}+ {text.experience}
                    </span>
                  )}
                  {th.area && (
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#faf6ef', color: '#94785a', border: '1px solid #e8dfd0' }}>
                      📍 {th.area}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{text.viewProfile} →</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <TherapistModal therapist={selectedTherapist} lang={lang} onClose={() => setSelectedTherapist(null)} />
    </>
  );
}