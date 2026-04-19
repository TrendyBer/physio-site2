'use client';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const CACHE_KEY = 'cms_howitworks';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT = {
  hero: {
    el: {
      badge: 'Πώς Λειτουργεί',
      heroTitle: 'Επαγγελματική Φυσιοθεραπεία,',
      heroTitleEm: 'Απλά και Γρήγορα',
      heroDesc: 'Σχεδιάσαμε κάθε βήμα της διαδικασίας με γνώμονα την άνεση και την ανάρρωσή σας — από την κράτηση μέχρι τη θεραπεία, στο σπίτι σας.',
      heroBtn: 'Κλείστε Ραντεβού',
      heroBadges: ['Ευέλικτο Πρόγραμμα', 'Εύκολη Κράτηση', 'Αδειοδοτημένοι Επαγγελματίες', 'Εξατομικευμένη Φροντίδα'],
    },
    en: {
      badge: 'How It Works',
      heroTitle: 'Professional Physiotherapy,',
      heroTitleEm: 'Made Simple',
      heroDesc: 'We\'ve designed every step of the process with your comfort and recovery in mind — from booking to treatment, all in your own home.',
      heroBtn: 'Request a Session',
      heroBadges: ['Flexible Scheduling', 'Easy Booking', 'Licensed Professionals', 'Personalized Care'],
    },
  },
  steps: {
    el: {
      stepsTitle: 'Απλά Βήματα για να', stepsTitleEm: 'Ξεκινήσετε',
      stepsDesc: 'Μια απλή, καθοδηγούμενη διαδικασία σχεδιασμένη να σας συνδέσει με τη σωστή φροντίδα.',
      stepsBtn: 'Κλείστε Ραντεβού',
      steps: [
        { num: 'Step 1', title: 'Υποβάλετε αίτημα', desc: 'Συμπληρώστε μια σύντομη φόρμα με τα στοιχεία και την κατάστασή σας.' },
        { num: 'Step 2', title: 'Αντιστοιχιστείτε με φυσιοθεραπευτή', desc: 'Η ομάδα μας ελέγχει το αίτημά σας και σας αντιστοιχίζει με έναν κατάλληλο φυσιοθεραπευτή.' },
        { num: 'Step 3', title: 'Λαμβάνετε φροντίδα στο σπίτι', desc: 'Ο φυσιοθεραπευτής σας επιβεβαιώνει τη συνεδρία και έρχεται στο σπίτι σας.' },
      ],
    },
    en: {
      stepsTitle: 'Simple Steps to', stepsTitleEm: 'Get Started',
      stepsDesc: 'A simple, guided process designed to connect you with the right care — without stress or complexity.',
      stepsBtn: 'Request a Session',
      steps: [
        { num: 'Step 1', title: 'Submit your request', desc: 'Fill out a short form with your personal details and condition.' },
        { num: 'Step 2', title: 'Get matched with a physiotherapist', desc: 'Our team reviews your request and matches you with a qualified physiotherapist.' },
        { num: 'Step 3', title: 'Receive care at home', desc: 'Your physiotherapist confirms the session and visits you at home.' },
      ],
    },
  },
  whypatients: {
    el: {
      whyTitle: 'Γιατί οι Ασθενείς', whyTitleEm: 'μας Επιλέγουν',
      whyDesc: 'Εστιάζουμε σε ό,τι πραγματικά έχει σημασία: σταθερή ανάρρωση, εξατομικευμένη προσοχή.',
      whyPoints: [
        { icon: '🎓', title: 'Πιστοποιημένοι επαγγελματίες φυσιοθεραπείας', desc: 'Έμπειροι ειδικοί που παρέχουν αξιόπιστη φροντίδα στην άνεση του σπιτιού σας.' },
        { icon: '❤️', title: 'Εξατομικευμένη φροντίδα για κάθε ασθενή', desc: 'Τα πλάνα θεραπείας προσαρμόζονται στην κατάσταση και τους στόχους κάθε ασθενή.' },
        { icon: '🛡️', title: 'Αξιόπιστη και εστιασμένη στον ασθενή υπηρεσία', desc: 'Μια επαγγελματική προσέγγιση που κάνει τη θεραπεία άνετη και αποτελεσματική.' },
      ],
    },
    en: {
      whyTitle: 'Why Patients', whyTitleEm: 'Choose Us',
      whyDesc: 'We focus on what truly matters: steady recovery, personalized attention, and a comfortable experience.',
      whyPoints: [
        { icon: '🎓', title: 'Certified physiotherapy professionals', desc: 'Experienced specialists delivering trusted care in the comfort of your home.' },
        { icon: '❤️', title: 'Personalized care for every patient', desc: 'Treatment plans are adapted to each patient\'s condition and recovery goals.' },
        { icon: '🛡️', title: 'Reliable and patient-focused service', desc: 'A professional approach designed to make treatment comfortable and effective.' },
      ],
    },
  },
  whyhome: {
    el: {
      homeTitle: 'Γιατί η Θεραπεία στο Σπίτι', homeTitleEm: 'Είναι πιο Πρακτική',
      homeDesc: 'Η υπηρεσία μας είναι σχεδιασμένη ώστε η φυσιοθεραπεία στο σπίτι να αισθάνεται απλή και επαγγελματική.',
      homePoints: [
        { title: 'Το δικό σας περιβάλλον', desc: 'Ασκήσεις και συμβουλές προσαρμοσμένες στον χώρο διαβίωσής σας.' },
        { title: 'Καθημερινό πλαίσιο κίνησης', desc: 'Η θεραπεία αντικατοπτρίζει τον τρόπο που κινείστε στην καθημερινή ζωή.' },
        { title: 'Καλύτερη συνέχεια', desc: 'Οι συνεδρίες γίνονται εκεί που η ανάρρωση έχει τη μεγαλύτερη σημασία.' },
        { title: 'Λιγότερη διαταραχή', desc: 'Μπορείτε να εστιάσετε στη θεραπεία χωρίς ταλαιπωρία μετακίνησης.' },
      ],
    },
    en: {
      homeTitle: 'Why Home-Based Treatment', homeTitleEm: 'Feels More Practical',
      homeDesc: 'Our service is designed to make physiotherapy at home feel simple, supportive, and professional.',
      homePoints: [
        { title: 'Your real environment', desc: 'Exercises and advice adapted to your actual living space.' },
        { title: 'Daily movement context', desc: 'Treatment reflects the way you move through everyday life.' },
        { title: 'Better continuity', desc: 'Sessions happen where recovery is most meaningful.' },
        { title: 'Less disruption', desc: 'You can focus on treatment without the hassle of travel.' },
      ],
    },
  },
  comparison: {
    el: {
      compTitle: 'Κλινική ή', compTitleEm: 'Φροντίδα στο Σπίτι;',
      compDesc: 'Η φυσιοθεραπεία στο σπίτι προσφέρει επιπλέον άνεση και εξατομικευμένη προσοχή.',
      compBtn: 'Κλείστε Ραντεβού', compHome: 'Φυσιοθεραπεία στο σπίτι', compClinic: 'Κλινική',
      compRows: [
        { label: 'Ευκολία', home: 'Φροντίδα στο σπίτι σας', clinic: 'Απαιτείται μετακίνηση' },
        { label: 'Ευελιξία', home: 'Ραντεβού που ταιριάζουν στο πρόγραμμά σας', clinic: 'Πιο σταθερές επιλογές' },
        { label: 'Εμπειρία ασθενή', home: 'Εξατομικευμένη υποστήριξη', clinic: 'Τυπική κλινική εμπειρία' },
        { label: 'Περιβάλλον', home: 'Ιδιωτικό και άνετο', clinic: 'Κλινική ατμόσφαιρα' },
        { label: 'Καθοδήγηση', home: 'Βασισμένη στο σπίτι σας', clinic: 'Γενική καθοδήγηση' },
      ],
    },
    en: {
      compTitle: 'Clinic Visit or', compTitleEm: 'Care at Home?',
      compDesc: 'Home physiotherapy offers added comfort and one-to-one attention.',
      compBtn: 'Request a Session', compHome: 'At-home physiotherapy', compClinic: 'Clinic-based care',
      compRows: [
        { label: 'Convenience', home: 'Care delivered to your home', clinic: 'Travel to a clinic required' },
        { label: 'Flexibility', home: 'Appointments that suit your routine', clinic: 'More fixed scheduling options' },
        { label: 'Patient experience', home: 'Personalized support in a familiar setting', clinic: 'Standard clinic-based experience' },
        { label: 'Environment', home: 'Private and comfortable', clinic: 'More clinical atmosphere' },
        { label: 'Tailored guidance', home: 'Recommendations based on your home setup', clinic: 'Guidance given in a clinic context' },
      ],
    },
  },
  cta: {
    el: { ctaTitle: 'Ξεκινήστε με μια Δωρεάν Αξιολόγηση', ctaDesc: 'Δεν είστε σίγουροι ποια υπηρεσία σας ταιριάζει; Θα αξιολογήσουμε τις ανάγκες σας.', ctaBtn: 'Δωρεάν Αξιολόγηση' },
    en: { ctaTitle: 'Start With a Free Assessment', ctaDesc: 'Not sure which service is right for you? We\'ll evaluate your needs and create a personalized treatment plan.', ctaBtn: 'Book Free Assessment' },
  },
  faq: {
    el: {
      faqTitle: 'Συχνές Ερωτήσεις', faqTitleEm: '',
      faqDesc: 'Δεν βρίσκετε αυτό που ψάχνετε; Είμαστε εδώ να βοηθήσουμε.',
      faqBtn: 'Επικοινωνήστε μαζί μας',
      faqs: [
        { q: 'Πώς ξεκινάω;', a: 'Απλά υποβάλετε αίτημα μέσω της ιστοσελίδας με τα στοιχεία επικοινωνίας, την κατάσταση και τον προτιμώμενο χρόνο.' },
        { q: 'Τι γίνεται κατά την πρώτη επίσκεψη στο σπίτι;', a: 'Ο φυσιοθεραπευτής σας θα αξιολογήσει την κατάστασή σας και θα ξεκινήσει ένα εξατομικευμένο πλάνο θεραπείας.' },
        { q: 'Ποιες παθήσεις αντιμετωπίζετε;', a: 'Αντιμετωπίζουμε πόνο στη μέση, μετεγχειρητική αποκατάσταση, νευρολογικές παθήσεις, αθλητικούς τραυματισμούς και πολλά άλλα.' },
        { q: 'Πώς κλείνω ραντεβού;', a: 'Μπορείτε να κλείσετε ραντεβού μέσω της φόρμας στη σελίδα μας.' },
        { q: 'Φέρνετε τον απαραίτητο εξοπλισμό;', a: 'Ναι! Οι φυσιοθεραπευτές μας έρχονται πλήρως εξοπλισμένοι.' },
      ],
    },
    en: {
      faqTitle: 'Frequently Asked', faqTitleEm: 'Questions',
      faqDesc: 'Can\'t find what you\'re looking for? We\'re happy to help.',
      faqBtn: 'Contact Us',
      faqs: [
        { q: 'How do I get started?', a: 'Simply submit a request through the website with your contact details, condition, and preferred timing.' },
        { q: 'What happens during the first home visit?', a: 'Your physiotherapist will assess your condition and begin a personalized treatment plan.' },
        { q: 'Which conditions do you treat?', a: 'We treat back pain, post-surgical rehabilitation, neurological conditions, sports injuries, and more.' },
        { q: 'How do I book an appointment?', a: 'You can book through the form on our website.' },
        { q: 'Do you bring the necessary equipment?', a: 'Yes! Our physiotherapists come fully equipped.' },
      ],
    },
  },
};

function ImgWithSkeleton({ src, alt, style }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.5s infinite', borderRadius: 'inherit' }} />
      )}
      <img src={src} alt={alt || ''} onLoad={() => setLoaded(true)}
        style={{ ...style, display: loaded ? 'block' : 'none' }} />
    </div>
  );
}

export default function HowItWorksPage() {
  const { lang } = useLang();
  const [cms, setCms] = useState(DEFAULT);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => { fetchCMS(); }, []);

  async function fetchCMS() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { value, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) { setCms(value); return; }
      }
    } catch (_) {}

    const { data } = await supabase.from('site_content').select('section, content_el, content_en').eq('page', 'howitworks');
    if (data) {
      const merged = { ...DEFAULT };
      data.forEach(row => {
        if (row.content_el || row.content_en) {
          merged[row.section] = { el: row.content_el || DEFAULT[row.section]?.el, en: row.content_en || DEFAULT[row.section]?.en };
        }
      });
      setCms(merged);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: merged, timestamp: Date.now() })); } catch (_) {}
    }
  }

  const hero        = cms.hero?.[lang]        || DEFAULT.hero[lang];
  const steps       = cms.steps?.[lang]       || DEFAULT.steps[lang];
  const whypatients = cms.whypatients?.[lang] || DEFAULT.whypatients[lang];
  const whyhome     = cms.whyhome?.[lang]     || DEFAULT.whyhome[lang];
  const comparison  = cms.comparison?.[lang]  || DEFAULT.comparison[lang];
  const cta         = cms.cta?.[lang]         || DEFAULT.cta[lang];
  const faq         = cms.faq?.[lang]         || DEFAULT.faq[lang];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 640px) { .home-grid { grid-template-columns: 1fr; } }
        .faq-item { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; cursor: pointer; }
        .faq-item + .faq-item { margin-top: 12px; }
        .comp-row:hover { background: #f8fafb; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{hero.badge}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 52px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {hero.heroTitle} <br /><em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{hero.heroTitleEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 580, margin: '0 auto 32px' }}>{hero.heroDesc}</p>
          <a href="/request" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{hero.heroBtn}</a>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
            {(hero.heroBadges || []).map(b => (
              <div key={b} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 30, padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#1a2e44', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {steps.stepsTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{steps.stepsTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{steps.stepsDesc}</p>
            <a href="/request" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{steps.stepsBtn}</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {(steps.steps || []).map((step, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{step.num}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{step.desc}</div>
                {i < (steps.steps.length - 1) && <div style={{ height: 1, background: '#e2e8f0', marginTop: 20 }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PATIENTS CHOOSE US */}
      <section style={{ background: '#f8fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2 }}>
              {whypatients.whyTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{whypatients.whyTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, paddingTop: 8 }}>{whypatients.whyDesc}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{(whypatients.whyPoints || [])[0]?.title}</div>
                <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{(whypatients.whyPoints || [])[0]?.desc}</div>
              </div>
            </div>
            {/* Center image με skeleton */}
            <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '3/4' }}>
              {whypatients.image_url ? (
                <ImgWithSkeleton src={whypatients.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>📷 Photo</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {(whypatients.whyPoints || []).slice(1).map((p, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY HOME BASED */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {whyhome.homeTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{whyhome.homeTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{whyhome.homeDesc}</p>
            <div className="home-grid">
              {(whyhome.homePoints || []).map((p, i) => (
                <div key={i} style={{ background: '#f8fafb', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right image με skeleton */}
          <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3' }}>
            {whyhome.image_url ? (
              <ImgWithSkeleton src={whyhome.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>📷 Photo</div>
            )}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ background: '#f8fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {comparison.compTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{comparison.compTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', maxWidth: 600, margin: '0 auto' }}>{comparison.compDesc}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f0f7ff' }}>
              <div style={{ padding: '16px 24px' }} />
              <div style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#1a2e44', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#e8f1fd' }}>{comparison.compHome}</div>
              <div style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#6b7a8d' }}>{comparison.compClinic}</div>
            </div>
            {(comparison.compRows || []).map((row, i) => (
              <div key={i} className="comp-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #e2e8f0', transition: 'background .2s' }}>
                <div style={{ padding: '16px 24px', fontWeight: 600, fontSize: 14, color: '#1a2e44' }}>{row.label}</div>
                <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 14, color: '#2a6fdb', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: 'rgba(232,241,253,0.3)' }}>{row.home}</div>
                <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 14, color: '#6b7a8d' }}>{row.clinic}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="/request" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{comparison.compBtn}</a>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: '#1a2e44', borderRadius: 20, padding: '48px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#fff', lineHeight: 1.2 }}>{cta.ctaTitle}</h2>
            <div>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }}>{cta.ctaDesc}</p>
              <a href="/free-assessment" style={{ display: 'inline-block', background: '#fff', color: '#1a2e44', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>{cta.ctaBtn}</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)', padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 36px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {faq.faqTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{faq.faqTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 28 }}>{faq.faqDesc}</p>
            <a href="#contact" style={{ display: 'inline-block', background: 'transparent', color: '#1a2e44', padding: '11px 28px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{faq.faqBtn}</a>
          </div>
          <div>
            {(faq.faqs || []).map((f, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} style={{ borderColor: openFaq === i ? '#2a6fdb' : '#e2e8f0' }}>
                <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: openFaq === i ? 700 : 500, color: '#1a2e44' }}>{f.q}</span>
                  <span style={{ fontSize: 20, color: '#2a6fdb', flexShrink: 0, transition: 'transform .2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </div>
                {openFaq === i && <div style={{ padding: '0 24px 18px', fontSize: 14, color: '#6b7a8d', lineHeight: 1.7 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}