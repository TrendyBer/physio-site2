'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BookingButton from '../../components/BookingButton';
import { useLang } from '@/context/LanguageContext';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const CONTENT = {
  el: {
    badge: 'Πώς Λειτουργεί',
    heroTitle: 'Πώς λειτουργεί το',
    heroTitleEm: 'PhysioHome',
    heroDesc: 'Το PhysioHome συνδέει ασθενείς που χρειάζονται φυσιοθεραπεία στο σπίτι με ελεγμένους φυσιοθεραπευτές στην περιοχή τους. Διαλέξτε τον ρόλο σας για να δείτε τη διαδικασία.',
    tabPatient: 'Για ασθενείς',
    tabTherapist: 'Για φυσιοθεραπευτές',
    patient: {
      title: 'Βρείτε φροντίδα σε 3 βήματα',
      desc: 'Μια απλή, καθοδηγούμενη διαδικασία — από την ανάγκη σας μέχρι το αίτημα συνεδρίας.',
      steps: [
        { title: 'Περιγράφετε την ανάγκη σας', desc: 'Πείτε μας τι σας ταλαιπωρεί ή επιλέξτε πάθηση, ώστε να καταλάβουμε τι χρειάζεστε.' },
        { title: 'Σας προτείνουμε κατάλληλους φυσιοθεραπευτές', desc: 'Βλέπετε επαγγελματίες με βάση την περιοχή, την εμπειρία, τη διαθεσιμότητα και τις αξιολογήσεις.' },
        { title: 'Στέλνετε αίτημα συνεδρίας', desc: 'Επιλέγετε θεραπευτή, ώρα και πακέτο. Θα ενημερωθείτε μόλις ο φυσιοθεραπευτής επιβεβαιώσει το αίτημα.' },
      ],
      whyTitle: 'Γιατί να το χρησιμοποιήσω;',
      why: [
        'Δεν ψάχνω μόνος μου φυσιοθεραπευτή.',
        'Βλέπω επαγγελματίες που εξυπηρετούν την περιοχή μου.',
        'Επιλέγω με βάση πάθηση, τιμή και αξιολογήσεις.',
        'Η συνεδρία γίνεται στο σπίτι μου.',
        'Έχω υποστήριξη αν χρειαστώ βοήθεια.',
      ],
      cta: 'Ξεκινήστε τώρα',
    },
    therapist: {
      title: 'Λάβετε νέα περιστατικά με απλή διαδικασία',
      desc: 'Δηλώνετε εσείς περιοχές και διαθεσιμότητα, και λαμβάνετε σχετικά αιτήματα.',
      steps: [
        { title: 'Δημιουργείτε προφίλ', desc: 'Προσθέτετε ειδικότητα, εμπειρία, περιοχές και τιμή. Το προφίλ σας είναι αυτό που βλέπουν οι ασθενείς.' },
        { title: 'Υποβάλλετε τα απαραίτητα στοιχεία', desc: 'Ανεβάζετε άδεια ασκήσεως για έλεγχο και έγκριση. Βιογραφικό και πιστοποιήσεις είναι προαιρετικά.' },
        { title: 'Ορίζετε τη διαθεσιμότητά σας', desc: 'Επιλέγετε ημέρες, ώρες και περιοχές εξυπηρέτησης. Έτσι σας εμφανίζουμε μόνο σε σχετικά αιτήματα.' },
        { title: 'Διαχειρίζεστε αιτήματα και συνεδρίες', desc: 'Λαμβάνετε σχετικά αιτήματα και παρακολουθείτε ραντεβού, έσοδα και αξιολογήσεις.' },
      ],
      whyTitle: 'Γιατί να συνεργαστώ;',
      why: [
        'Λαμβάνω σχετικά αιτήματα.',
        'Ορίζω εγώ τις περιοχές μου.',
        'Ορίζω εγώ τη διαθεσιμότητά μου.',
        'Έχω οργανωμένη εικόνα ραντεβού και εσόδων.',
        'Χτίζω αξιολογήσεις και online παρουσία.',
      ],
      cta: 'Κάντε αίτηση συνεργασίας',
    },
  },
  en: {
    badge: 'How It Works',
    heroTitle: 'How',
    heroTitleEm: 'PhysioHome works',
    heroDesc: 'PhysioHome connects patients who need physiotherapy at home with vetted physiotherapists in their area. Choose your role to see the process.',
    tabPatient: 'For patients',
    tabTherapist: 'For physiotherapists',
    patient: {
      title: 'Find care in 3 steps',
      desc: 'A simple, guided process — from your need to a session request.',
      steps: [
        { title: 'Describe your need', desc: 'Tell us what troubles you or pick a condition, so we understand what you need.' },
        { title: 'We suggest suitable physiotherapists', desc: 'You see professionals based on area, experience, availability and reviews.' },
        { title: 'Send a session request', desc: 'Choose a therapist, time and package. You will be notified once the physiotherapist confirms your request.' },
      ],
      whyTitle: 'Why use it?',
      why: [
        'I don\u2019t have to search for a physiotherapist on my own.',
        'I see professionals who serve my area.',
        'I choose based on condition, price and reviews.',
        'The session takes place in my home.',
        'I have support if I need help.',
      ],
      cta: 'Get started now',
    },
    therapist: {
      title: 'Receive new cases with a simple process',
      desc: 'You set your areas and availability, and receive relevant requests.',
      steps: [
        { title: 'Create your profile', desc: 'Add your specialty, experience, areas and price. Your profile is what patients see.' },
        { title: 'Submit the required documents', desc: 'Upload your professional license for review and approval. CV and certifications are optional.' },
        { title: 'Set your availability', desc: 'Choose days, hours and service areas. This way we only show you on relevant requests.' },
        { title: 'Manage requests and sessions', desc: 'Receive relevant requests and track appointments, earnings and reviews.' },
      ],
      whyTitle: 'Why join?',
      why: [
        'I receive relevant requests.',
        'I set my own service areas.',
        'I set my own availability.',
        'I get an organized view of appointments and earnings.',
        'I build reviews and an online presence.',
      ],
      cta: 'Apply to partner',
    },
  },
};

const REGISTER_THERAPIST_HREF = '/auth/register?role=therapist';

export default function HowItWorksPage() {
  const { lang } = useLang();
  const t = CONTENT[lang] || CONTENT.el;
  const [tab, setTab] = useState('patient');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('tab');
    if (q === 'therapist' || q === 'patient') setTab(q);
  }, []);

  const isPatient = tab === 'patient';
  const panel = isPatient ? t.patient : t.therapist;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }
        .hiw-steps { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 720px) { .hiw-steps { grid-template-columns: 1fr; } }
        .hiw-body { display: grid; grid-template-columns: 1.4fr 1fr; gap: 48px; align-items: start; }
        @media (max-width: 900px) { .hiw-body { grid-template-columns: 1fr; gap: 32px; } }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '72px 24px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{t.badge}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 50px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 18 }}>
            {t.heroTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{t.heroTitleEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.7 }}>{t.heroDesc}</p>

          {/* TAB SWITCHER */}
          <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid #dce6f0', borderRadius: 30, padding: 5, gap: 4, boxShadow: '0 4px 24px rgba(26,46,68,0.08)' }}>
            {[
              { key: 'patient', label: t.tabPatient },
              { key: 'therapist', label: t.tabTherapist },
            ].map(item => {
              const active = tab === item.key;
              return (
                <button key={item.key} onClick={() => setTab(item.key)}
                  style={{
                    padding: '10px 24px', borderRadius: 30, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    border: 'none', fontFamily: 'inherit',
                    background: active ? '#1a2e44' : 'transparent',
                    color: active ? '#fff' : '#6b7a8d',
                    transition: 'all .2s',
                  }}>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* PANEL */}
      <section style={{ padding: '64px 24px 72px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 40, maxWidth: 640 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
              {panel.title}
            </h2>
            <p style={{ fontSize: 16, color: '#6b7a8d', lineHeight: 1.7 }}>{panel.desc}</p>
          </div>

          <div className="hiw-body">
            {/* Steps */}
            <div className="hiw-steps">
              {panel.steps.map((step, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #dce6f0', borderRadius: 16, padding: 24 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a2e44', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                    {lang === 'el' ? `Βήμα ${i + 1}` : `Step ${i + 1}`}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Why + CTA */}
            <div style={{ background: '#fff', border: '1px solid #dce6f0', borderRadius: 16, padding: 28, position: 'sticky', top: 90 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#1a2e44', marginBottom: 18 }}>{panel.whyTitle}</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
                {panel.why.map((point, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                    <CheckCircle2 size={18} color="#2a6fdb" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                    {point}
                  </li>
                ))}
              </ul>

              {isPatient ? (
                <BookingButton style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', background: '#1a2e44', color: '#fff', padding: '14px 28px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {panel.cta} →
                </BookingButton>
              ) : (
                <a href={REGISTER_THERAPIST_HREF} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', background: '#1a2e44', color: '#fff', padding: '14px 28px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box' }}>
                  {panel.cta}
                  <ArrowRight size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}