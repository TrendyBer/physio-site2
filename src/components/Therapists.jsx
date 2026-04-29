'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import RatingDisplay from './RatingDisplay';

function Avatar({ name, photoUrl, size = 60 }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)',
      color: '#1a2e44', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function TherapistModal({ therapist, lang, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!therapist) return;
    setLoadingReviews(true);
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, patient_id')
      .eq('therapist_id', therapist.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setReviews(data || []);
        setLoadingReviews(false);
      });
  }, [therapist]);

  if (!therapist) return null;

  const bookLabel  = lang === 'el' ? 'Κλείστε Ραντεβού' : 'Book a Session';
  const closeLabel = lang === 'el' ? 'Κλείσιμο' : 'Close';
  const bioLabel   = lang === 'el' ? 'Βιογραφικό' : 'About';
  const areaLabel  = lang === 'el' ? 'Περιοχή' : 'Area';
  const reviewsTitle = lang === 'el' ? 'Αξιολογήσεις' : 'Reviews';
  const noReviewsText = lang === 'el' ? 'Δεν υπάρχουν αξιολογήσεις ακόμα.' : 'No reviews yet.';

  const bookHref = `/dashboard/patient/new-request?therapist=${encodeURIComponent(therapist.name || '')}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar name={therapist.name} photoUrl={therapist.photo_url} size={72} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>{therapist.name}</h2>
            <div style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 8 }}>{therapist.specialty}</div>
            <div style={{ marginBottom: 6 }}>
              <RatingDisplay
                rating={therapist.avg_rating || 0}
                count={therapist.review_count || 0}
                lang={lang}
                variant="stars"
                size={14}
              />
            </div>
            {therapist.price_per_session && (
              <div style={{ fontSize: 14, color: '#2a6fdb', fontWeight: 600 }}>{therapist.price_per_session}€/{lang === 'el' ? 'συνεδρία' : 'session'}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {therapist.bio && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{bioLabel}</div>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '12px 14px', borderRadius: 8, borderLeft: '3px solid #dce6f0' }}>{therapist.bio}</p>
            </div>
          )}

          {therapist.area && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{areaLabel}</div>
              <div style={{ fontSize: 14, color: '#1a2e44', fontWeight: 500 }}>{therapist.area}</div>
            </div>
          )}

          {/* REVIEWS SECTION */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              ⭐ {reviewsTitle}
            </div>
            {loadingReviews ? (
              <div style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>...</div>
            ) : reviews.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>
                {noReviewsText}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.map(rv => (
                  <div key={rv.id} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <RatingDisplay rating={rv.rating} count={1} variant="stars-only" size={14} />
                      <span style={{ fontSize: 11, color: '#92400E' }}>
                        {new Date(rv.created_at).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {rv.comment && (
                      <p style={{ fontSize: 13, color: '#78350F', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                        "{rv.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <a href={bookHref} style={{ flex: 1, background: '#1a2e44', color: '#fff', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>{bookLabel} →</a>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: '#1a2e44', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: '1.5px solid #dce6f0', cursor: 'pointer', fontFamily: 'inherit' }}>{closeLabel}</button>
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
      // 1. Fetch approved therapists
      const { data: ths, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error || !ths) { setLoading(false); return; }

      // 2. Fetch reviews aggregates
      const therapistIds = ths.map(t => t.id);
      let ratingsMap = {};

      if (therapistIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('therapist_id, rating')
          .eq('is_published', true)
          .in('therapist_id', therapistIds);

        if (reviewsData) {
          reviewsData.forEach(rv => {
            if (!ratingsMap[rv.therapist_id]) {
              ratingsMap[rv.therapist_id] = { sum: 0, count: 0 };
            }
            ratingsMap[rv.therapist_id].sum += rv.rating;
            ratingsMap[rv.therapist_id].count += 1;
          });
        }
      }

      // 3. Combine
      const enriched = ths.map(t => {
        const stats = ratingsMap[t.id];
        return {
          ...t,
          avg_rating: stats ? stats.sum / stats.count : 0,
          review_count: stats ? stats.count : 0,
        };
      });

      setTherapists(enriched);
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
        .th-card { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; padding: 24px; transition: all .3s; cursor: pointer; }
        .th-card:hover { box-shadow: 0 4px 24px rgba(26,46,68,0.08); transform: translateY(-4px); }
      `}</style>
      <section id="therapists" style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em> {text.titleEnd}
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>{text.desc}</p>
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
                    {th.specialty && <div style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 4 }}>{th.specialty}</div>}
                    {/* Rating */}
                    <div style={{ marginBottom: 4 }}>
                      <RatingDisplay
                        rating={th.avg_rating}
                        count={th.review_count}
                        lang={lang}
                        variant="compact"
                        size={13}
                      />
                    </div>
                    {th.price_per_session && (
                      <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{th.price_per_session}{text.perSession}</div>
                    )}
                  </div>
                </div>

                {th.bio && (
                  <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 16, lineHeight: 1.6 }}>
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
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#e8f1fd', color: '#2a6fdb', border: '1px solid #c8dff9' }}>
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