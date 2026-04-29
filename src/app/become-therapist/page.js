'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const CACHE_KEY_CMS = 'cms_become_therapist';
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
    el: { title: 'Μια Απλή,', titleEm: 'Ευέλικτη Διαδικασία', desc: 'Πλήρης έλεγχος.', btn: 'Γίνετε Θεραπευτής', steps: [{ num: 'Βήμα 1', title: 'Εγγραφείτε στην πλατφόρμα', desc: 'Δημιουργήστε λογαριασμό σε λίγα λεπτά.' }, { num: 'Βήμα 2', title: 'Ανεβάστε δικαιολογητικά', desc: 'Άδεια, βιογραφικό, πιστοποιήσεις.' }, { num: 'Βήμα 3', title: 'Έγκριση από admin', desc: 'Ελέγχουμε τα στοιχεία σας.' }, { num: 'Βήμα 4', title: 'Ξεκινήστε να δέχεστε αιτήματα', desc: 'Ασθενείς στην περιοχή σας.' }] },
    en: { title: 'A Simple,', titleEm: 'Flexible Workflow', desc: 'Full control.', btn: 'Become a Therapist', steps: [{ num: 'Step 1', title: 'Sign up on the platform', desc: 'Create your account in minutes.' }, { num: 'Step 2', title: 'Upload your documents', desc: 'License, CV, certifications.' }, { num: 'Step 3', title: 'Admin approval', desc: 'We verify your credentials.' }, { num: 'Step 4', title: 'Start receiving requests', desc: 'Patients in your area.' }] },
  },
  platform: {
    el: { title: 'Μια Πλατφόρμα που', titleEm: 'Μπορείτε να Εμπιστευτείτε', desc: 'Σχεδιασμένο για εσάς.', points: [{ title: 'Ασθενείς έτοιμοι να συμμετάσχουν', desc: 'Αφοσιωμένοι στην ανάρρωση.' }, { title: 'Χωρίς γραφειοκρατία', desc: 'Εστίαση στη θεραπεία.' }, { title: 'Σύγχρονη πρακτική', desc: 'Πέρα από παραδοσιακές κλινικές.' }] },
    en: { title: 'A Platform', titleEm: 'You Can Trust', desc: 'Built to support how you work.', points: [{ title: 'Patients ready to engage', desc: 'Committed to recovery.' }, { title: 'No unnecessary admin', desc: 'Focus on treatment.' }, { title: 'Built for modern practice', desc: 'Beyond traditional clinics.' }] },
  },
};

const TX = {
  el: {
    ctaTitle: 'Έτοιμοι να ξεκινήσετε;',
    ctaDesc: 'Δημιουργήστε λογαριασμό φυσιοθεραπευτή και ξεκινήστε να συνεργάζεστε μαζί μας. Η εγγραφή είναι δωρεάν.',
    ctaBtn: 'Δημιουργία Λογαριασμού',
    ctaSecondary: 'Έχετε ήδη λογαριασμό;',
    ctaSecondaryLink: 'Σύνδεση',
    benefitsList: ['✓ Δωρεάν εγγραφή', '✓ Ευέλικτο ωράριο', '✓ Πληρωμή ανά συνεδρία'],
  },
  en: {
    ctaTitle: 'Ready to get started?',
    ctaDesc: 'Create a physiotherapist account and start working with us. Registration is free.',
    ctaBtn: 'Create Account',
    ctaSecondary: 'Already have an account?',
    ctaSecondaryLink: 'Log in',
    benefitsList: ['✓ Free registration', '✓ Flexible schedule', '✓ Per-session payment'],
  },
};

export default function BecomeTherapistPage() {
  const { lang } = useLang();
  const tx = TX[lang];
  const [cms, setCms] = useState(DEFAULT);

  useEffect(() => { fetchCMS(); }, []);

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

  const hero     = cms.hero?.[lang]     || DEFAULT.hero[lang];
  const whywork  = cms.whywork?.[lang]  || DEFAULT.whywork[lang];
  const workflow = cms.workflow?.[lang] || DEFAULT.workflow[lang];
  const platform = cms.platform?.[lang] || DEFAULT.platform[lang];

  // Direct register link με preselected role
  const registerHref = '/auth/register?role=therapist';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }
        .benefit-card { background: #fff; border-radius: 14px; border: 1px solid #e8f0fb; padding: 24px; }
        .platform-point { background: #fff; border-radius: 12px; border: 1px solid #e8f0fb; padding: 20px 24px; display: flex; align-items: flex-start; gap: 14px; }
        .why-grid-layout { display: grid; grid-template-columns: 1fr auto 1fr; gap: 32px; align-items: center; }
        @media (max-width: 900px) { .why-grid-layout { grid-template-columns: 1fr; } .why-center-img { display: none; } }
        .workflow-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        @media (max-width: 768px) { .workflow-layout { grid-template-columns: 1fr; gap: 40px; } }
        .platform-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        @media (max-width: 768px) { .platform-layout { grid-template-columns: 1fr; gap: 40px; } }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{hero.badge}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 54px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {hero.hero} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{hero.heroEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 580, margin: '0 auto 32px' }}>{hero.heroDesc}</p>
          <a href={registerHref} style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            {hero.heroBtn} →
          </a>
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
            <div className="why-center-img" style={{ width: 300, height: 380, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)' }} />
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
              <a href={registerHref} style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {workflow.btn} →
              </a>
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
            <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)' }} />
          </div>
        </div>
      </section>

      {/* CTA — replaces the form */}
      <section style={{ background: 'linear-gradient(135deg, #1a2e44 0%, #2a3e54 100%)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', color: '#fff', marginBottom: 16 }}>
            {tx.ctaTitle}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' }}>
            {tx.ctaDesc}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {tx.benefitsList.map((b, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 18px', borderRadius: 30, fontSize: 13, fontWeight: 500 }}>
                {b}
              </div>
            ))}
          </div>
          <a href={registerHref}
            style={{ display: 'inline-block', background: '#fff', color: '#1a2e44', padding: '16px 44px', borderRadius: 30, fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}>
            {tx.ctaBtn} →
          </a>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            {tx.ctaSecondary} <a href="/auth/login" style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline' }}>{tx.ctaSecondaryLink}</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}