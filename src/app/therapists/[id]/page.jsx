'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import RatingDisplay from '../../../components/RatingDisplay';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { ArrowRight, MapPin } from 'lucide-react';

const TX = {
  el: {
    breadcrumbHome: 'Αρχική',
    breadcrumbList: 'Θεραπευτές',
    verified: 'Ελεγμένο προφίλ από το PhysioHome',
    trust: [
      'Ελεγμένα στοιχεία προφίλ',
      'Αξιολογήσεις από ολοκληρωμένες συνεδρίες',
      'Εξυπηρέτηση στο σπίτι',
      'Υποστήριξη από την ομάδα PhysioHome',
    ],
    perSession: 'συνεδρία',
    yearsExp: 'χρόνια εμπειρίας',
    aboutTitle: 'Σχετικά με τον θεραπευτή',
    aboutEmpty: 'Ο θεραπευτής δεν έχει προσθέσει ακόμα αναλυτικό βιογραφικό.',
    specialtiesTitle: 'Παθήσεις & υπηρεσίες',
    specialtiesEmpty: 'Δεν έχουν δηλωθεί ακόμα συγκεκριμένες παθήσεις.',
    experienceTitle: 'Επαγγελματική εμπειρία',
    experienceEmpty: 'Δεν έχει δηλωθεί ακόμα εμπειρία.',
    experienceLine: (y) => `${y} χρόνια εμπειρίας στη φυσιοθεραπεία.`,
    educationTitle: 'Εκπαίδευση & πιστοποιήσεις',
    educationEmpty: 'Δεν έχουν προστεθεί επιπλέον πιστοποιήσεις.',
    areasTitle: 'Περιοχές εξυπηρέτησης',
    areasEmpty: 'Δεν έχουν δηλωθεί ακόμα περιοχές εξυπηρέτησης.',
    areasMicro: 'Δεν βλέπετε την περιοχή σας; Στείλτε αίτημα και θα ελέγξουμε αν μπορεί να σας εξυπηρετήσει.',
    availTitle: 'Διαθεσιμότητα',
    availEmpty: 'Η ώρα ορίζεται μετά την αποστολή αιτήματος. Επιλέγετε προτιμώμενη ώρα και ο θεραπευτής επιβεβαιώνει.',
    reviewsTitle: 'Αξιολογήσεις ασθενών',
    reviewsBasedOn: (n) => `Βάσει ${n} ${n === 1 ? 'αξιολόγησης' : 'αξιολογήσεων'} από ολοκληρωμένες συνεδρίες`,
    reviewsEmpty: 'Δεν υπάρχουν ακόμα αξιολογήσεις. Οι αξιολογήσεις εμφανίζονται μετά από ολοκληρωμένες συνεδρίες. Το προφίλ έχει ελεγχθεί από την πλατφόρμα.',
    faqTitle: 'Συχνές ερωτήσεις',
    faqs: [
      { q: 'Έρχεται με εξοπλισμό;', a: 'Ο φυσιοθεραπευτής φέρνει τον απαραίτητο βασικό εξοπλισμό για τη συνεδρία, ανάλογα με την περίπτωση.' },
      { q: 'Μπορώ να αλλάξω ώρα;', a: 'Μπορείτε να ζητήσετε αλλαγή ώρας μέσα από την πλατφόρμα ή μέσω υποστήριξης.' },
      { q: 'Χρειάζομαι παραπεμπτικό;', a: 'Σε πολλές περιπτώσεις όχι, αλλά για συγκεκριμένες παθήσεις ή μετεγχειρητικά περιστατικά μπορεί να ζητηθούν ιατρικές οδηγίες.' },
      { q: 'Πώς γίνεται η πρώτη συνεδρία;', a: 'Ο θεραπευτής αξιολογεί την κατάσταση, συζητά το ιστορικό σας και προτείνει πλάνο θεραπείας.' },
    ],
    bookTitle: (n) => `Κλείστε συνεδρία με ${n}`,
    from: 'Από',
    areaLabel: 'Περιοχή εξυπηρέτησης',
    bookCta: 'Στείλτε αίτημα συνεδρίας',
    bookMicro: [
      'Η κράτηση επιβεβαιώνεται από τον θεραπευτή.',
      'Δεν εμφανίζουμε την ακριβή σας διεύθυνση δημόσια.',
      'Υποστήριξη από την ομάδα PhysioHome.',
    ],
    notFound: 'Ο θεραπευτής δεν βρέθηκε ή δεν είναι διαθέσιμος.',
    backToList: 'Πίσω στους θεραπευτές',
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbList: 'Therapists',
    verified: 'Profile vetted by PhysioHome',
    trust: [
      'Verified profile details',
      'Reviews from completed sessions',
      'Home-visit service',
      'Support from the PhysioHome team',
    ],
    perSession: 'session',
    yearsExp: 'years of experience',
    aboutTitle: 'About the therapist',
    aboutEmpty: 'The therapist has not added a detailed bio yet.',
    specialtiesTitle: 'Conditions & services',
    specialtiesEmpty: 'No specific conditions have been listed yet.',
    experienceTitle: 'Professional experience',
    experienceEmpty: 'No experience has been listed yet.',
    experienceLine: (y) => `${y} years of experience in physiotherapy.`,
    educationTitle: 'Education & certifications',
    educationEmpty: 'No additional certifications have been added.',
    areasTitle: 'Service areas',
    areasEmpty: 'No service areas have been listed yet.',
    areasMicro: "Don't see your area? Send a request and we'll check if the therapist can serve you.",
    availTitle: 'Availability',
    availEmpty: 'The time is set after you send a request. You choose a preferred time and the therapist confirms.',
    reviewsTitle: 'Patient reviews',
    reviewsBasedOn: (n) => `Based on ${n} ${n === 1 ? 'review' : 'reviews'} from completed sessions`,
    reviewsEmpty: 'No reviews yet. Reviews appear after completed sessions. This profile has been vetted by the platform.',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Do they bring equipment?', a: 'The physiotherapist brings the necessary basic equipment for the session, depending on the case.' },
      { q: 'Can I change the time?', a: 'You can request a time change through the platform or via support.' },
      { q: 'Do I need a referral?', a: 'In many cases no, but for certain conditions or post-surgical cases medical guidance may be requested.' },
      { q: 'How does the first session work?', a: 'The therapist assesses your condition, discusses your history and proposes a treatment plan.' },
    ],
    bookTitle: (n) => `Book a session with ${n}`,
    from: 'From',
    areaLabel: 'Service area',
    bookCta: 'Send a session request',
    bookMicro: [
      'The booking is confirmed by the therapist.',
      'We do not display your exact address publicly.',
      'Support from the PhysioHome team.',
    ],
    notFound: 'Therapist not found or not available.',
    backToList: 'Back to therapists',
  },
};

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dce6f0', borderRadius: 16, padding: 28, marginBottom: 20 }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#1a2e44', marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

function EmptyText({ children }) {
  return <p style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>{children}</p>;
}

export default function TherapistProfilePage() {
  const { lang } = useLang();
  const tx = TX[lang];
  const params = useParams();
  const id = params?.id;

  const [therapist, setTherapist] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);

      const { data: th } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('id', id)
        .eq('is_approved', true)
        .single();

      if (!th) { setTherapist(null); setLoading(false); return; }

      // Reviews
      const { data: rv } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('therapist_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      const reviewsData = rv || [];

      // Conditions (via therapist_conditions -> conditions)
      let conditionNames = [];
      const { data: tc } = await supabase
        .from('therapist_conditions')
        .select('condition_id')
        .eq('therapist_id', id);
      const conditionIds = (tc || []).map(x => x.condition_id);
      if (conditionIds.length > 0) {
        const { data: cn } = await supabase
          .from('conditions')
          .select('id, name_el, name_en')
          .in('id', conditionIds);
        conditionNames = (cn || []).map(c => (lang === 'el' ? c.name_el : c.name_en)).filter(Boolean);
      }

      const count = reviewsData.length;
      const avg = count > 0 ? reviewsData.reduce((s, r) => s + r.rating, 0) / count : 0;

      setTherapist({ ...th, avg_rating: avg, review_count: count });
      setReviews(reviewsData);
      setConditions(conditionNames);
      setLoading(false);
    })();
  }, [id, lang]);

  const firstName = therapist?.name ? therapist.name.split(' ')[0] : '';
  const bookHref = therapist ? `/dashboard/patient/new-request?therapist=${encodeURIComponent(therapist.name || '')}` : '/dashboard/patient/new-request';
  const areaList = therapist?.area ? String(therapist.area).split(',').map(a => a.trim()).filter(Boolean) : [];

  // rating distribution
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    n: reviews.filter(r => Math.round(r.rating) === star).length,
  }));
  const maxDist = Math.max(1, ...dist.map(d => d.n));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }
        .prof-layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: 32px; align-items: start; }
        @media (max-width: 900px) { .prof-layout { grid-template-columns: 1fr; } .prof-book { position: static !important; } }
        .trust-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .trust-chip { background: #f0f7ff; color: #2a6fdb; border: 1px solid #d8e6fb; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
      `}</style>

      <Navbar />

      {loading ? (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ height: 200, borderRadius: 16, background: 'linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
      ) : !therapist ? (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 20 }}>{tx.notFound}</p>
          <a href="/therapists" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a2e44', color: '#fff', padding: '12px 28px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            {tx.backToList}
          </a>
        </div>
      ) : (
        <>
          {/* Breadcrumb */}
          <div style={{ background: '#faf9f6', padding: '20px 24px 0' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', fontSize: 13, color: '#94a3b8' }}>
              <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>{tx.breadcrumbHome}</a>
              {' › '}
              <a href="/therapists" style={{ color: '#94a3b8', textDecoration: 'none' }}>{tx.breadcrumbList}</a>
              {' › '}
              <span style={{ color: '#1a2e44', fontWeight: 600 }}>{therapist.name}</span>
            </div>
          </div>

          <section style={{ padding: '28px 24px 72px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="prof-layout">

                {/* LEFT COLUMN */}
                <div>
                  {/* Header card */}
                  <div style={{ background: '#fff', border: '1px solid #dce6f0', borderRadius: 16, padding: 28, marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {therapist.photo_url ? (
                        <img src={therapist.photo_url} alt={therapist.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#2a6fdb' }}>
                          {therapist.name?.charAt(0)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#1a2e44', lineHeight: 1.2, marginBottom: 4 }}>{therapist.name}</h1>
                        {therapist.specialty && <div style={{ fontSize: 15, color: '#6b7a8d', marginBottom: 10 }}>{therapist.specialty}</div>}
                        <div style={{ marginBottom: 12 }}>
                          <RatingDisplay rating={therapist.avg_rating || 0} count={therapist.review_count || 0} lang={lang} variant="stars" size={15} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: '#475569' }}>
                          {areaList.length > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <MapPin size={15} color="#94a3b8" /> {areaList.join(', ')}
                            </span>
                          )}
                          {therapist.years_experience ? <span>{therapist.years_experience} {tx.yearsExp}</span> : null}
                          {therapist.price_per_session ? <span style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.from} {therapist.price_per_session}€/{tx.perSession}</span> : null}
                        </div>
                      </div>
                    </div>

                    {/* Trust label + chips (no icons/emojis) */}
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 12 }}>{tx.verified}</div>
                      <div className="trust-chips">
                        {tx.trust.map((label, i) => (
                          <span key={i} className="trust-chip">{label}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <Section title={tx.aboutTitle}>
                    {therapist.bio && therapist.bio.trim().length > 3
                      ? <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{therapist.bio}</p>
                      : <EmptyText>{tx.aboutEmpty}</EmptyText>}
                  </Section>

                  {/* Specialties / conditions */}
                  <Section title={tx.specialtiesTitle}>
                    {conditions.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {conditions.map((c, i) => (
                          <span key={i} style={{ background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: 20, padding: '7px 16px', fontSize: 13, color: '#1a2e44', fontWeight: 500 }}>{c}</span>
                        ))}
                      </div>
                    ) : <EmptyText>{tx.specialtiesEmpty}</EmptyText>}
                  </Section>

                  {/* Experience */}
                  <Section title={tx.experienceTitle}>
                    {therapist.years_experience
                      ? <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: 0 }}>{tx.experienceLine(therapist.years_experience)}</p>
                      : <EmptyText>{tx.experienceEmpty}</EmptyText>}
                  </Section>

                  {/* Education & certifications (no fields yet -> empty state) */}
                  <Section title={tx.educationTitle}>
                    <EmptyText>{tx.educationEmpty}</EmptyText>
                  </Section>

                  {/* Service areas */}
                  <Section title={tx.areasTitle}>
                    {areaList.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                          {areaList.map((a, i) => (
                            <span key={i} style={{ background: '#f0f7ff', border: '1px solid #d8e6fb', borderRadius: 20, padding: '7px 16px', fontSize: 13, color: '#2a6fdb', fontWeight: 500 }}>{a}</span>
                          ))}
                        </div>
                        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{tx.areasMicro}</p>
                      </>
                    ) : <EmptyText>{tx.areasEmpty}</EmptyText>}
                  </Section>

                  {/* Availability */}
                  <Section title={tx.availTitle}>
                    <EmptyText>{tx.availEmpty}</EmptyText>
                  </Section>

                  {/* Reviews */}
                  <Section title={tx.reviewsTitle}>
                    {reviews.length === 0 ? (
                      <EmptyText>{tx.reviewsEmpty}</EmptyText>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: '#1a2e44', lineHeight: 1 }}>{therapist.avg_rating.toFixed(1)}</div>
                            <div style={{ marginTop: 6 }}>
                              <RatingDisplay rating={therapist.avg_rating} count={therapist.review_count} lang={lang} variant="stars-only" size={15} />
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            {dist.map(d => (
                              <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#94a3b8', width: 12 }}>{d.star}</span>
                                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${(d.n / maxDist) * 100}%`, height: '100%', background: '#F59E0B', borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: 12, color: '#94a3b8', width: 20, textAlign: 'right' }}>{d.n}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 16 }}>{tx.reviewsBasedOn(therapist.review_count)}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {reviews.map(rv => (
                            <div key={rv.id} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <RatingDisplay rating={rv.rating} count={1} variant="stars-only" size={14} />
                                <span style={{ fontSize: 11, color: '#92400E' }}>
                                  {new Date(rv.created_at).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              {rv.comment && <p style={{ fontSize: 14, color: '#78350F', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>"{rv.comment}"</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Section>

                  {/* FAQ */}
                  <Section title={tx.faqTitle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {tx.faqs.map((f, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e44', marginBottom: 5 }}>{f.q}</div>
                          <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6, margin: 0 }}>{f.a}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>

                {/* RIGHT STICKY BOOKING CARD */}
                <div className="prof-book" style={{ position: 'sticky', top: 90 }}>
                  <div style={{ background: '#fff', border: '1px solid #dce6f0', borderRadius: 16, padding: 24, boxShadow: '0 8px 32px rgba(26,46,68,0.08)' }}>
                    <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#1a2e44', lineHeight: 1.3, marginBottom: 14 }}>
                      {tx.bookTitle(firstName)}
                    </h3>

                    {therapist.price_per_session && (
                      <div style={{ fontSize: 15, color: '#1a2e44', marginBottom: 16 }}>
                        <span style={{ color: '#6b7a8d' }}>{tx.from} </span>
                        <span style={{ fontWeight: 700, color: '#2a6fdb', fontSize: 22 }}>{therapist.price_per_session}€</span>
                        <span style={{ color: '#6b7a8d' }}> / {tx.perSession}</span>
                      </div>
                    )}

                    {areaList.length > 0 && (
                      <div style={{ background: '#f8fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{tx.areaLabel}</div>
                        <div style={{ fontSize: 13, color: '#1a2e44', fontWeight: 600 }}>{areaList.join(', ')}</div>
                      </div>
                    )}

                    <a href={bookHref} style={{ display: 'inline-flex', width: '100%', boxSizing: 'border-box', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '14px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}>
                      {tx.bookCta}
                      <ArrowRight size={18} />
                    </a>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {tx.bookMicro.map((m, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{m}</div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </>
  );
}