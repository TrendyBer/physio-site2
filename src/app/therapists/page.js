'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const CACHE_KEY_CMS = 'cms_therapists';
const CACHE_KEY_TH = 'cms_therapists_list';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT = {
  hero: {
    el: { badge: 'Για Φυσιοθεραπευτές', hero: 'Γίνετε μέλος του δικτύου μας', heroEm: 'Φυσιοθεραπευτών', heroDesc: 'Εφαρμόστε για να παρέχετε υπηρεσίες φυσιοθεραπείας στο σπίτι.', heroBtn: 'Γίνετε Θεραπευτής' },
    en: { badge: 'For Physiotherapists', hero: 'Join Our Network of', heroEm: 'Physiotherapists', heroDesc: 'Apply to provide home physiotherapy services and connect with patients in your area.', heroBtn: 'Become a Therapist' },
  },
  whywork: {
    el: { title: 'Γιατί οι Θεραπευτές επιλέγουν να', titleEm: 'Συνεργαστούν μαζί μας', desc: 'Γίνετε μέλος ενός αναπτυσσόμενου δικτύου.', benefits: [{ title: 'Ευέλικτο Ωράριο', desc: 'Επιλέξτε πότε εργάζεστε.' }, { title: 'Επαγγελματική Ανάπτυξη', desc: 'Ποικιλία περιστατικών.' }, { title: 'Εστίαση στη Φροντίδα', desc: 'Περισσότερος χρόνος στη θεραπεία.' }, { title: 'Εργασία στην Περιοχή σας', desc: 'Ασθενείς βάσει τοποθεσίας.' }] },
    en: { title: 'Why Therapists Choose to', titleEm: 'Work With Us', desc: 'Join a growing network.', benefits: [{ title: 'Flexible schedule', desc: 'Choose when you work.' }, { title: 'Professional growth', desc: 'Variety of cases.' }, { title: 'Focus on care', desc: 'More time treating patients.' }, { title: 'Work locally', desc: 'Matched with nearby patients.' }] },
  },
  workflow: {
    el: { title: 'Μια Απλή,', titleEm: 'Ευέλικτη Διαδικασία', desc: 'Πλήρης έλεγχος.', btn: 'Γίνετε Θεραπευτής', steps: [{ num: 'Βήμα 1', title: 'Λαμβάνετε αιτήματα', desc: 'Βάσει ειδικότητας.' }, { num: 'Βήμα 2', title: 'Επιλέγετε συνεδρίες', desc: 'Βάσει προγράμματος.' }, { num: 'Βήμα 3', title: 'Παρέχετε φροντίδα', desc: 'Στο σπίτι του ασθενή.' }, { num: 'Βήμα 4', title: 'Εμείς αναλαμβάνουμε τα υπόλοιπα', desc: 'Συντονισμός.' }] },
    en: { title: 'A Simple,', titleEm: 'Flexible Workflow', desc: 'Full control.', btn: 'Become a Therapist', steps: [{ num: 'Step 1', title: 'Receive requests', desc: 'Based on specialization.' }, { num: 'Step 2', title: 'Choose sessions', desc: 'Fit your schedule.' }, { num: 'Step 3', title: 'Provide care', desc: 'At patient home.' }, { num: 'Step 4', title: 'We handle the rest', desc: 'Coordination.' }] },
  },
  platform: {
    el: { title: 'Μια Πλατφόρμα που', titleEm: 'Μπορείτε να Εμπιστευτείτε', desc: 'Σχεδιασμένο για εσάς.', points: [{ title: 'Ασθενείς έτοιμοι να συμμετάσχουν', desc: 'Αφοσιωμένοι στην ανάρρωση.' }, { title: 'Χωρίς γραφειοκρατία', desc: 'Εστίαση στη θεραπεία.' }, { title: 'Σύγχρονη πρακτική', desc: 'Πέρα από παραδοσιακές κλινικές.' }] },
    en: { title: 'A Platform', titleEm: 'You Can Trust', desc: 'Built to support how you work.', points: [{ title: 'Patients ready to engage', desc: 'Committed to recovery.' }, { title: 'No unnecessary admin', desc: 'Focus on treatment.' }, { title: 'Built for modern practice', desc: 'Beyond traditional clinics.' }] },
  },
};

const FORM_TX = {
  el: {
    ourTherapists: 'Οι', ourTherapistsEm: 'Θεραπευτές μας',
    ourTherapistsDesc: 'Γνωρίστε έμπειρους, αδειοδοτημένους επαγγελματίες.',
    viewProfile: 'Δείτε Προφίλ →', bookSession: 'Κλείστε Ραντεβού', noTherapists: 'Δεν υπάρχουν ενεργοί θεραπευτές ακόμα.',
    formTitle: 'Αίτηση Συνεργασίας', formDesc: 'Συμπληρώστε τα στοιχεία σας.',
    fullName: 'Ονοματεπώνυμο', email: 'Email', phone: 'Τηλέφωνο',
    specialty: 'Ειδικότητα', specialtyPh: 'π.χ. Ορθοπαιδική',
    experience: 'Χρόνια Εμπειρίας', area: 'Πόλη', areaPh: 'π.χ. Αθήνα',
    bio: 'Περιγράψτε τον εαυτό σας', bioPh: 'Σύντομη περιγραφή...',
    upload: 'Ανεβάστε CV, Πιστοποιητικά & Άδεια', uploadDesc: 'JPEG, PNG, PDF · max 100 MB', uploadBtn: 'Επιλογή Αρχείων',
    terms: 'Αποδέχομαι τους ', termsLink: 'Όρους & Πολιτική Απορρήτου',
    submit: 'Υποβολή Αίτησης', expOptions: ['1-2 χρόνια', '3-5 χρόνια', '5-10 χρόνια', '10+ χρόνια'],
    successTitle: 'Ευχαριστούμε!', successDesc: 'Λάβαμε την αίτησή σας.', successBtn: 'Εντάξει',
    required: 'Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.',
    close: 'Κλείσιμο',
  },
  en: {
    ourTherapists: 'Our', ourTherapistsEm: 'Therapists',
    ourTherapistsDesc: 'Meet experienced, licensed professionals.',
    viewProfile: 'View Profile →', bookSession: 'Book a Session', noTherapists: 'No active therapists yet.',
    formTitle: 'Apply to Join', formDesc: 'Fill in your details.',
    fullName: 'Full Name', email: 'Email', phone: 'Phone',
    specialty: 'Specialization', specialtyPh: 'e.g. Sports Rehabilitation',
    experience: 'Years of Experience', area: 'City', areaPh: 'e.g. Athens',
    bio: 'Tell Us About Yourself', bioPh: 'Briefly describe your background...',
    upload: 'Upload CV, Certificates and License', uploadDesc: 'JPEG, PNG, PDF · max 100 MB', uploadBtn: 'Browse',
    terms: 'I accept the ', termsLink: 'Terms and Privacy Policy',
    submit: 'Submit Application', expOptions: ['1-2 years', '3-5 years', '5-10 years', '10+ years'],
    successTitle: 'Thank you!', successDesc: 'We received your application.', successBtn: 'Got it',
    required: 'Please fill in all required fields.',
    close: 'Close',
  },
};

function ImgWithSkeleton({ src, alt, style, containerStyle }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: 'relative', ...containerStyle }}>
      {!loaded && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.5s infinite', borderRadius: 'inherit' }} />}
      <img src={src} alt={alt || ''} onLoad={() => setLoaded(true)} style={{ ...style, display: loaded ? 'block' : 'none' }} />
    </div>
  );
}

function TherapistModal({ therapist, lang, tx, onClose }) {
  if (!therapist) return null;
  const bookHref = `/dashboard/patient/new-request?therapist=${encodeURIComponent(therapist.name)}`;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {therapist.photo_url ? (
            <ImgWithSkeleton src={therapist.photo_url} alt={therapist.name}
              containerStyle={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0 }}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#2a6fdb' }}>
              {therapist.name?.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>{therapist.name}</h2>
            <div style={{ fontSize: 14, color: '#6b7a8d' }}>{therapist.specialty}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: lang === 'el' ? 'Περιοχή' : 'Area', value: therapist.area || '—' },
              { label: lang === 'el' ? 'Ειδικότητα' : 'Specialty', value: therapist.specialty || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#1a2e44', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          {therapist.bio && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 10 }}>{lang === 'el' ? 'Βιογραφικό' : 'About'}</div>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '14px 16px', borderRadius: 10, borderLeft: '3px solid #dce6f0', margin: 0 }}>{therapist.bio}</p>
            </div>
          )}
          {therapist.price_per_session && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#1D4ED8', fontWeight: 600 }}>
              💰 {therapist.price_per_session}€ / {lang === 'el' ? 'συνεδρία' : 'session'}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <a href={bookHref} style={{ flex: 1, background: '#1a2e44', color: '#fff', padding: '13px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', textAlign: 'center' }}>{tx.bookSession} →</a>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: '#1a2e44', padding: '13px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: '1.5px solid #dce6f0', cursor: 'pointer', fontFamily: 'inherit' }}>{tx.close}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TherapistsPage() {
  const { lang } = useLang();
  const tx = FORM_TX[lang];
  const [cms, setCms] = useState(DEFAULT);
  const [therapists, setTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '', experience: '', area: '', bio: '' });
  const [files, setFiles] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => { fetchCMS(); fetchTherapists(); }, []);

  async function fetchCMS() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_CMS);
      if (cached) {
        const { value, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) { setCms(value); return; }
      }
    } catch (_) {}
    const { data } = await supabase.from('site_content').select('section, content_el, content_en').eq('page', 'therapists');
    if (data) {
      const merged = { ...DEFAULT };
      data.forEach(row => { merged[row.section] = { el: row.content_el, en: row.content_en }; });
      setCms(merged);
      try { sessionStorage.setItem(CACHE_KEY_CMS, JSON.stringify({ value: merged, timestamp: Date.now() })); } catch (_) {}
    }
  }

  async function fetchTherapists() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_TH);
      if (cached) {
        const { value, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) { setTherapists(value); setLoadingTherapists(false); return; }
      }
    } catch (_) {}
    const { data } = await supabase.from('therapist_profiles').select('*').eq('is_approved', true).order('created_at', { ascending: false });
    if (data) {
      setTherapists(data);
      try { sessionStorage.setItem(CACHE_KEY_TH, JSON.stringify({ value: data, timestamp: Date.now() })); } catch (_) {}
    }
    setLoadingTherapists(false);
  }

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFiles = (e) => setFiles(Array.from(e.target.files));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.specialty || !accepted) { setError(true); return; }
    setError(false); setLoading(true);
    const { error: insertError } = await supabase.from('therapist_applications').insert([{
      name: form.name, email: form.email, phone: form.phone,
      specialty: form.specialty, experience: form.experience,
      area: form.area, bio: form.bio, status: 'pending',
    }]);
    if (insertError) { alert('Σφάλμα: ' + insertError.message); setLoading(false); return; }
    setLoading(false); setSubmitted(true);
  };

  const hero     = cms.hero?.[lang]     || DEFAULT.hero[lang];
  const whywork  = cms.whywork?.[lang]  || DEFAULT.whywork[lang];
  const workflow = cms.workflow?.[lang] || DEFAULT.workflow[lang];
  const platform = cms.platform?.[lang] || DEFAULT.platform[lang];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .th-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .th-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .th-grid { grid-template-columns: 1fr; } }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
        .form-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; color: #1a2e44; outline: none; background: #fff; }
        .form-input:focus { border-color: #2a6fdb; }
        .form-label { font-size: 13px; font-weight: 600; color: #1a2e44; margin-bottom: 6px; display: block; }
        .th-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; transition: all .3s; cursor: pointer; }
        .th-card:hover { box-shadow: 0 8px 32px rgba(26,46,68,0.12); transform: translateY(-4px); }
        .benefit-card { background: #fff; border-radius: 14px; border: 1px solid #e8f0fb; padding: 24px; }
        .platform-point { background: #fff; border-radius: 12px; border: 1px solid #e8f0fb; padding: 20px 24px; display: flex; align-items: flex-start; gap: 14px; }
        .why-grid-layout { display: grid; grid-template-columns: 1fr auto 1fr; gap: 32px; align-items: center; }
        @media (max-width: 900px) { .why-grid-layout { grid-template-columns: 1fr; } .why-center-img { display: none; } }
        .workflow-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        @media (max-width: 768px) { .workflow-layout { grid-template-columns: 1fr; gap: 40px; } }
        .platform-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        @media (max-width: 768px) { .platform-layout { grid-template-columns: 1fr; gap: 40px; } }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{hero.badge}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 54px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {hero.hero} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{hero.heroEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 580, margin: '0 auto 32px' }}>{hero.heroDesc}</p>
          <a href="#apply" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{hero.heroBtn}</a>
        </div>
      </section>

      {/* OUR THERAPISTS */}
      <section style={{ background: '#f8fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', color: '#1a2e44', marginBottom: 12 }}>
              {tx.ourTherapists} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.ourTherapistsEm}</em>
            </h2>
            <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 500 }}>{tx.ourTherapistsDesc}</p>
          </div>
          {loadingTherapists ? (
            <div className="th-grid">
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.5s infinite', marginBottom: 16 }} />
                  <div style={{ height: 16, borderRadius: 8, background: 'linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.5s infinite', marginBottom: 8 }} />
                  <div style={{ height: 12, borderRadius: 8, background: 'linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.5s infinite', width: '60%' }} />
                </div>
              ))}
            </div>
          ) : therapists.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '40px 0' }}>{tx.noTherapists}</div>
          ) : (
            <div className="th-grid">
              {therapists.map(th => (
                <div key={th.id} className="th-card" onClick={() => setSelectedTherapist(th)}>
                  {th.photo_url ? (
                    <ImgWithSkeleton src={th.photo_url} alt={th.name}
                      containerStyle={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 16 }}
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#2a6fdb' }}>
                      {th.name?.charAt(0)}
                    </div>
                  )}
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>{th.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 10 }}>{th.specialty}</div>
                  {th.area && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>📍 {th.area}</div>}
                  {th.price_per_session && <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600, marginBottom: 10 }}>💰 {th.price_per_session}€/συνεδρία</div>}
                  <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{tx.viewProfile}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY WORK WITH US */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', marginBottom: 12 }}>
              {whywork.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{whywork.titleEm}</em>
            </h2>
            <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 520, margin: '0 auto' }}>{whywork.desc}</p>
          </div>
          <div className="why-grid-layout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {(whywork.benefits || []).slice(0, 2).map((b, i) => (
                <div key={i} className="benefit-card">
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              ))}
            </div>
            <div className="why-center-img" style={{ width: 300, height: 380, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>📷</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {(whywork.benefits || []).slice(2, 4).map((b, i) => (
                <div key={i} className="benefit-card">
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="workflow-layout">
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
                {workflow.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{workflow.titleEm}</em>
              </h2>
              <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{workflow.desc}</p>
              <a href="#apply" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{workflow.btn}</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {(workflow.steps || []).map((step, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{step.num}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{step.desc}</div>
                  {i < (workflow.steps.length - 1) && <div style={{ height: 1, background: '#e2e8f0', marginTop: 20 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="platform-layout">
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
                {platform.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{platform.titleEm}</em>
              </h2>
              <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{platform.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(platform.points || []).map((p, i) => (
                  <div key={i} className="platform-point">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #2a6fdb' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>{p.title}</div>
                      <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>📷</div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="apply" style={{ background: '#f8fafb', padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', color: '#1a2e44', marginBottom: 12 }}>{tx.formTitle}</h2>
            <p style={{ fontSize: 16, color: '#6b7a8d' }}>{tx.formDesc}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-row">
                <div><label className="form-label">{tx.fullName} *</label><input name="name" value={form.name} onChange={handleChange} className="form-input" /></div>
                <div><label className="form-label">{tx.email} *</label><input name="email" type="email" value={form.email} onChange={handleChange} className="form-input" /></div>
              </div>
              <div className="form-row">
                <div><label className="form-label">{tx.phone}</label><input name="phone" value={form.phone} onChange={handleChange} className="form-input" /></div>
                <div><label className="form-label">{tx.specialty} *</label><input name="specialty" value={form.specialty} onChange={handleChange} className="form-input" placeholder={tx.specialtyPh} /></div>
              </div>
              <div className="form-row">
                <div>
                  <label className="form-label">{tx.experience}</label>
                  <select name="experience" value={form.experience} onChange={handleChange} className="form-input">
                    <option value="">—</option>
                    {tx.expOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="form-label">{tx.area}</label><input name="area" value={form.area} onChange={handleChange} className="form-input" placeholder={tx.areaPh} /></div>
              </div>
              <div>
                <label className="form-label">{tx.bio}</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} className="form-input" placeholder={tx.bioPh} rows={5} style={{ resize: 'vertical' }} maxLength={300} />
                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{form.bio.length}/300</div>
              </div>
              <div>
                <label className="form-label">{tx.upload}</label>
                <div style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: '20px 24px', background: '#f8fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#2a6fdb' }}>⬆</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2e44' }}>{files.length > 0 ? files.map(f => f.name).join(', ') : 'Upload files'}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{tx.uploadDesc}</div>
                    </div>
                  </div>
                  <label style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#1a2e44', cursor: 'pointer' }}>
                    {tx.uploadBtn}
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleFiles} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="terms" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2a6fdb' }} />
                <label htmlFor="terms" style={{ fontSize: 14, color: '#1a2e44', cursor: 'pointer' }}>
                  {tx.terms}<a href="#" style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.termsLink}</a>
                </label>
              </div>
              {error && <div style={{ background: '#FFE4E6', color: '#9F1239', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>{tx.required}</div>}
              <button onClick={handleSubmit} disabled={loading} style={{ background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, alignSelf: 'center', minWidth: 220 }}>
                {loading ? '...' : tx.submit}
              </button>
            </div>
          </div>
        </div>
      </section>

      {submitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#1a2e44', marginBottom: 12 }}>{tx.successTitle}</h3>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.6, marginBottom: 28 }}>{tx.successDesc} <strong>{form.email}</strong></p>
            <button onClick={() => setSubmitted(false)} style={{ background: '#1a2e44', color: '#fff', padding: '12px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}>{tx.successBtn}</button>
          </div>
        </div>
      )}

      {selectedTherapist && <TherapistModal therapist={selectedTherapist} lang={lang} tx={tx} onClose={() => setSelectedTherapist(null)} />}
      <Footer />
    </>
  );
}