'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import RatingDisplay from './RatingDisplay';
import { MapPin, BadgeCheck, ShieldCheck } from 'lucide-react';

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

export default function Therapists() {
  const { lang } = useLang();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTherapists() {
      // 1. Εγκεκριμένοι ΚΑΙ με πλήρες προφίλ
      //    Το is_profile_complete υπολογίζεται από trigger στη βάση.
      //    Ελλιπή προφίλ ΔΕΝ εμφανίζονται δημόσια — ζήτημα εμπιστοσύνης.
      const { data: ths, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('is_approved', true)
        .eq('is_profile_complete', true)
        .order('is_profile_full', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error || !ths || ths.length === 0) { setLoading(false); return; }

      const therapistIds = ths.map(t => t.id);

      // 2. Reviews + παθήσεις παράλληλα
      const [{ data: reviewsData }, { data: condLinks }] = await Promise.all([
        supabase
          .from('reviews')
          .select('therapist_id, rating')
          .eq('is_published', true)
          .in('therapist_id', therapistIds),
        supabase
          .from('therapist_conditions')
          .select('therapist_id, conditions(name_el, name_en)')
          .in('therapist_id', therapistIds),
      ]);

      const ratingsMap = {};
      (reviewsData || []).forEach(rv => {
        if (!ratingsMap[rv.therapist_id]) ratingsMap[rv.therapist_id] = { sum: 0, count: 0 };
        ratingsMap[rv.therapist_id].sum += rv.rating;
        ratingsMap[rv.therapist_id].count += 1;
      });

      const condMap = {};
      (condLinks || []).forEach(c => {
        if (!c.conditions) return;
        if (!condMap[c.therapist_id]) condMap[c.therapist_id] = [];
        condMap[c.therapist_id].push(c.conditions);
      });

      // 3. Συνδυασμός
      const enriched = ths.map(t => {
        const stats = ratingsMap[t.id];
        return {
          ...t,
          avg_rating: stats ? stats.sum / stats.count : 0,
          review_count: stats ? stats.count : 0,
          conditions: condMap[t.id] || [],
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
      verified: 'Ελεγμένη άδεια',
      fullProfile: 'Πλήρες προφίλ',
      treats: 'Αντιμετωπίζει',
      more: 'ακόμα',
    },
    en: {
      title: 'Our', titleEm: 'Physiotherapists', titleEnd: '',
      desc: 'Meet experienced, licensed professionals providing personalized care at home.',
      viewAll: 'All Therapists',
      viewProfile: 'View Profile',
      experience: 'years experience',
      perSession: '€/session',
      verified: 'Verified license',
      fullProfile: 'Complete profile',
      treats: 'Treats',
      more: 'more',
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
        .th-card { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; padding: 24px; transition: all .3s; cursor: pointer; display: block; text-decoration: none; }
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
            {therapists.map(th => {
              const conds = th.conditions || [];
              const shown = conds.slice(0, 3);
              const rest = conds.length - shown.length;

              return (
                <a key={th.id} href={`/therapists/${th.id}`} className="th-card">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
                    <Avatar name={th.name} photoUrl={th.photo_url} size={60} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44' }}>{th.name || '—'}</span>
                        {th.is_profile_full && (
                          <BadgeCheck size={16} color="#2a6fdb" strokeWidth={2.2} />
                        )}
                      </div>
                      {th.specialty && <div style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 4 }}>{th.specialty}</div>}
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

                  {/* Trust row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <ShieldCheck size={12} strokeWidth={2.2} />
                      {text.verified}
                    </span>
                    {th.is_profile_full && (
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        background: '#e8f1fd', color: '#2a6fdb', border: '1px solid #c8dff9',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <BadgeCheck size={12} strokeWidth={2.2} />
                        {text.fullProfile}
                      </span>
                    )}
                  </div>

                  {th.bio && (
                    <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 14, lineHeight: 1.6 }}>
                      {th.bio.length > 140 ? th.bio.slice(0, 140) + '...' : th.bio}
                    </p>
                  )}

                  {/* Παθήσεις — αυτό ψάχνει ο ασθενής */}
                  {shown.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#8a9aab', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
                        {text.treats}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {shown.map((c, i) => (
                          <span key={i} style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 12,
                            background: '#faf9f6', color: '#1a2e44', border: '1px solid #e8e4dc',
                          }}>
                            {lang === 'el' ? (c.name_el || c.name_en) : (c.name_en || c.name_el)}
                          </span>
                        ))}
                        {rest > 0 && (
                          <span style={{ padding: '4px 10px', fontSize: 12, color: '#8a9aab' }}>
                            +{rest} {text.more}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {th.years_experience > 0 && (
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#1a2e44', color: '#fff' }}>
                        {th.years_experience}+ {text.experience}
                      </span>
                    )}
                    {th.area && (
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#e8f1fd', color: '#2a6fdb', border: '1px solid #c8dff9', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} strokeWidth={2} />
                        {th.area}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{text.viewProfile} →</div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}