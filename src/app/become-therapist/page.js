'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ArrowRight, Wallet, Banknote, UserPlus, Check } from 'lucide-react';

const CACHE_KEY_CMS = 'cms_become_therapist';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT = {
  hero: {
    el: { badge: 'Για Φυσιοθεραπευτές', hero: 'Λάβετε νέα περιστατικά φυσιοθεραπείας', heroEm: 'στην περιοχή σας', heroDesc: 'Δημιουργήστε προφίλ, δηλώστε περιοχές και διαθεσιμότητα, και συνδεθείτε με ασθενείς που χρειάζονται φυσιοθεραπεία στο σπίτι.', heroBtn: 'Γίνε συνεργάτης' },
    en: { badge: 'For Physiotherapists', hero: 'Receive new physiotherapy cases', heroEm: 'in your area', heroDesc: 'Create a profile, set your areas and availability, and connect with patients who need physiotherapy at home.', heroBtn: 'Become a partner' },
  },
  whywork: {
    el: { title: 'Γιατί οι Θεραπευτές επιλέγουν να', titleEm: 'Συνεργαστούν μαζί μας', desc: 'Γίνετε μέλος ενός αναπτυσσόμενου δικτύου.', benefits: [{ title: 'Ευέλικτο Ωράριο', desc: 'Επιλέξτε πότε εργάζεστε.' }, { title: 'Επαγγελματική Ανάπτυξη', desc: 'Ποικιλία περιστατικών.' }, { title: 'Εστίαση στη Φροντίδα', desc: 'Περισσότερος χρόνος στη θεραπεία.' }, { title: 'Εργασία στην Περιοχή σας', desc: 'Ασθενείς βάσει τοποθεσίας.' }] },
    en: { title: 'Why Therapists Choose to', titleEm: 'Work With Us', desc: 'Join a growing network.', benefits: [{ title: 'Flexible schedule', desc: 'Choose when you work.' }, { title: 'Professional growth', desc: 'Variety of cases.' }, { title: 'Focus on care', desc: 'More time treating patients.' }, { title: 'Work locally', desc: 'Matched with nearby patients.' }] },
  },
  workflow: {
    el: { title: 'Μια Απλή,', titleEm: 'Ευέλικτη Διαδικασία', desc: 'Πλήρης έλεγχος.', btn: 'Γίνε συνεργάτης', steps: [{ num: 'Βήμα 1', title: 'Εγγραφείτε στην πλατφόρμα', desc: 'Δημιουργήστε λογαριασμό σε λίγα λεπτά.' }, { num: 'Βήμα 2', title: 'Ανεβάστε δικαιολογητικά', desc: 'Άδεια, βιογραφικό, πιστοποιήσεις.' }, { num: 'Βήμα 3', title: 'Έγκριση από admin', desc: 'Ελέγχουμε τα στοιχεία σας.' }, { num: 'Βήμα 4', title: 'Ξεκινήστε να δέχεστε αιτήματα', desc: 'Ασθενείς στην περιοχή σας.' }] },
    en: { title: 'A Simple,', titleEm: 'Flexible Workflow', desc: 'Full control.', btn: 'Become a partner', steps: [{ num: 'Step 1', title: 'Sign up on the platform', desc: 'Create your account in minutes.' }, { num: 'Step 2', title: 'Upload your documents', desc: 'License, CV, certifications.' }, { num: 'Step 3', title: 'Admin approval', desc: 'We verify your credentials.' }, { num: 'Step 4', title: 'Start receiving requests', desc: 'Patients in your area.' }] },
  },
  platform: {
    el: { title: 'Μια Πλατφόρμα που', titleEm: 'Μπορείτε να Εμπιστευτείτε', desc: 'Σχεδιασμένο για εσάς.', points: [{ title: 'Ασθενείς έτοιμοι να συμμετάσχουν', desc: 'Αφοσιωμένοι στην ανάρρωση.' }, { title: 'Χωρίς γραφειοκρατία', desc: 'Εστίαση στη θεραπεία.' }, { title: 'Σύγχρονη πρακτική', desc: 'Πέρα από παραδοσιακές κλινικές.' }] },
    en: { title: 'A Platform', titleEm: 'You Can Trust', desc: 'Built to support how you work.', points: [{ title: 'Patients ready to engage', desc: 'Committed to recovery.' }, { title: 'No unnecessary admin', desc: 'Focus on treatment.' }, { title: 'Built for modern practice', desc: 'Beyond traditional clinics.' }] },
  },
};

// Value bullets κάτω από το hero (hardcoded, εκτός CMS)
const HERO_POINTS = {
  el: [
    'Λαμβάνετε αιτήματα από ασθενείς στην περιοχή σας',
    'Ορίζετε εσείς διαθεσιμότητα και περιοχές',
    'Κρατάτε ολόκληρο το ποσό της συνεδρίας',
  ],
  en: [
    'Receive requests from patients in your area',
    'You set your own availability and areas',
    'You keep the full session amount',
  ],
};

const TX = {
  el: {
    heroSecondary: 'Δες τι κοστίζει',
    ctaTitle: 'Έτοιμοι να ξεκινήσετε;',
    ctaDesc: 'Δημιουργήστε λογαριασμό φυσικοθεραπευτή και ξεκινήστε να δέχεστε αιτήματα. Η εγγραφή είναι δωρεάν.',
    ctaBtn: 'Δημιουργία Λογαριασμού',
    ctaSecondary: 'Έχετε ήδη λογαριασμό;',
    ctaSecondaryLink: 'Σύνδεση',
    benefitsList: ['Δωρεάν εγγραφή', 'Δωρεάν συνδρομή στην εκκίνηση', 'Χωρίς δέσμευση'],

    // ── ΤΙΜΟΛΟΓΗΣΗ ──
    priceBadge: 'Διαφάνεια',
    priceTitle: 'Τι κοστίζει',
    priceTitleEm: 'και πώς πληρώνεστε',
    priceDesc: 'Χωρίς αστερίσκους. Αυτά είναι όλα τα χρήματα που αλλάζουν χέρια.',
    cardCashTitle: 'Ο ασθενής σας πληρώνει απευθείας',
    cardCashDesc: 'Σε μετρητά, μετά από κάθε συνεδρία. Η πλατφόρμα δεν κρατάει τίποτα από το ποσό της συνεδρίας.',
    cardCashValue: 'Κρατάτε το 100%',
    cardSubTitle: 'Μηνιαία συνδρομή',
    cardSubFreeLabel: 'Δωρεάν στη φάση εκκίνησης',
    cardSubDescFree: 'Αυτή τη στιγμή δεν υπάρχει μηνιαία χρέωση. Αν αυτό αλλάξει, θα ενημερωθείτε εγκαίρως και δεν θα χρεωθείτε χωρίς τη συγκατάθεσή σας.',
    cardSubDescPaid: 'Χρεώνεται στην αρχή κάθε μήνα.',
    perMonth: '/μήνα',
    cardFeeTitle: 'Τέλος νέου ασθενή',
    cardFeeDesc: 'Χρεώνεστε μία φορά για κάθε νέο ασθενή που σας ανατίθεται. Στις επόμενες συνεδρίες με τον ίδιο ασθενή δεν χρεώνεστε ξανά.',
    perNewPatient: 'ανά νέο ασθενή',
    priceExample: 'Παράδειγμα:',
    priceExampleBody: (fee) => `Ασθενής με τιμή συνεδρίας 35€ σας καλεί 6 φορές. Εισπράττετε 210€ σε μετρητά και χρεώνεστε ${fee}€ συνολικά — μόνο για την πρώτη φορά.`,
    priceSetOwn: 'Την τιμή της συνεδρίας σας την ορίζετε εσείς, από 25€ έως 50€.',
    priceLoading: 'Φόρτωση...',

    // ── FAQ ──
    faqTitle: 'Συχνές ερωτήσεις',
    faqs: [
      { q: 'Πόσο κοστίζει να συμμετέχω;', a: 'Η εγγραφή είναι δωρεάν. Στη φάση εκκίνησης δεν υπάρχει μηνιαία συνδρομή — χρεώνεστε μόνο ένα τέλος για κάθε νέο ασθενή που σας ανατίθεται. Αν στο μέλλον εισαχθεί μηνιαία συνδρομή, θα ενημερωθείτε πριν ισχύσει και θα μπορείτε να αποχωρήσετε χωρίς κόστος.' },
      { q: 'Ποιος με πληρώνει και πότε;', a: 'Ο ασθενής, απευθείας σε μετρητά, στο τέλος κάθε συνεδρίας. Δεν περιμένετε εκκαθάριση από την πλατφόρμα.' },
      { q: 'Μπορώ να απορρίψω ένα αίτημα;', a: 'Ναι. Βλέπετε το περιστατικό, την περιοχή και την προτεινόμενη ώρα πριν αποφασίσετε. Αν δεν σας βολεύει, το απορρίπτετε χωρίς συνέπειες.' },
      { q: 'Τι γίνεται όταν έχω διακοπές;', a: 'Δηλώνετε τις μέρες που δεν δουλεύετε στον πίνακά σας και οι ώρες εκείνων των ημερών κλείνουν αυτόματα. Δεν λαμβάνετε αιτήματα για τότε.' },
      { q: 'Πόσο χρόνο θέλει η έγκριση;', a: 'Μόλις ανεβάσετε την άδεια ασκήσεως επαγγέλματος, την ελέγχουμε συνήθως εντός 48 ωρών. Στο μεταξύ μπορείτε να συμπληρώνετε το υπόλοιπο προφίλ σας.' },
      { q: 'Χρειάζομαι δικό μου εξοπλισμό;', a: 'Ναι. Οι επισκέψεις γίνονται στο σπίτι του ασθενή και φέρνετε τον βασικό εξοπλισμό που χρειάζεται το περιστατικό.' },
      { q: 'Δεσμεύομαι για κάποιο διάστημα;', a: 'Όχι. Δεν υπάρχει ελάχιστη διάρκεια ούτε ελάχιστος αριθμός συνεδριών. Μπορείτε να σταματήσετε να δέχεστε αιτήματα όποτε θέλετε.' },
    ],
  },
  en: {
    heroSecondary: 'See what it costs',
    ctaTitle: 'Ready to get started?',
    ctaDesc: 'Create a physiotherapist account and start receiving requests. Registration is free.',
    ctaBtn: 'Create Account',
    ctaSecondary: 'Already have an account?',
    ctaSecondaryLink: 'Log in',
    benefitsList: ['Free registration', 'Free while we launch', 'No commitment'],

    priceBadge: 'Transparency',
    priceTitle: 'What it costs',
    priceTitleEm: 'and how you get paid',
    priceDesc: 'No asterisks. This is every euro that changes hands.',
    cardCashTitle: 'Your patient pays you directly',
    cardCashDesc: 'In cash, after each session. The platform takes nothing from the session amount.',
    cardCashValue: 'You keep 100%',
    cardSubTitle: 'Monthly subscription',
    cardSubFreeLabel: 'Free while we launch',
    cardSubDescFree: 'There is no monthly charge right now. If that changes you will be told in advance, and you will never be charged without agreeing first.',
    cardSubDescPaid: 'Charged at the start of each month.',
    perMonth: '/month',
    cardFeeTitle: 'New patient fee',
    cardFeeDesc: 'Charged once for every new patient assigned to you. Follow-up sessions with the same patient are never charged again.',
    perNewPatient: 'per new patient',
    priceExample: 'Example:',
    priceExampleBody: (fee) => `A patient with a €35 session price books you 6 times. You collect €210 in cash and are charged €${fee} in total — only for the first time.`,
    priceSetOwn: 'You set your own session price, between €25 and €50.',
    priceLoading: 'Loading...',

    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What does it cost to join?', a: 'Registration is free. While we are launching there is no monthly subscription — you are only charged a fee for each new patient assigned to you. If a monthly subscription is introduced later you will be told before it applies, and you can leave at no cost.' },
      { q: 'Who pays me, and when?', a: 'The patient does, directly in cash, at the end of each session. You never wait on a platform payout.' },
      { q: 'Can I decline a request?', a: 'Yes. You see the case, the area and the proposed time before you decide. If it does not suit you, decline it with no penalty.' },
      { q: 'What happens when I go on holiday?', a: 'You mark the days you are not working in your dashboard and those hours close automatically. You receive no requests for them.' },
      { q: 'How long does approval take?', a: 'Once you upload your professional licence we usually verify it within 48 hours. In the meantime you can fill in the rest of your profile.' },
      { q: 'Do I need my own equipment?', a: 'Yes. Visits happen at the patient home and you bring the basic equipment the case requires.' },
      { q: 'Am I locked into a contract?', a: 'No. There is no minimum term and no minimum number of sessions. You can stop accepting requests whenever you like.' },
    ],
  },
};

export default function BecomeTherapistPage() {
  const { lang } = useLang();
  const tx = TX[lang];
  const heroPoints = HERO_POINTS[lang];
  const [cms, setCms] = useState(DEFAULT);

  // Η τιμολόγηση διαβάζεται από τη ΒΑΣΗ, όχι hardcoded.
  // Αν αλλάξει το πλάνο στο admin, η σελίδα ακολουθεί — αλλιώς
  // υποσχόμαστε δημόσια κάτι που δεν ισχύει.
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => { fetchCMS(); fetchPlan(); }, []);

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

  async function fetchPlan() {
    const { data } = await supabase
      .from('subscription_plans')
      .select('name_el, name_en, price_monthly, first_session_fee')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true })
      .limit(1)
      .maybeSingle();
    setPlan(data || null);
    setLoadingPlan(false);
  }

  const hero     = cms.hero?.[lang]     || DEFAULT.hero[lang];
  const whywork  = cms.whywork?.[lang]  || DEFAULT.whywork[lang];
  const workflow = cms.workflow?.[lang] || DEFAULT.workflow[lang];
  const platform = cms.platform?.[lang] || DEFAULT.platform[lang];

  const monthly = Number(plan?.price_monthly ?? 0);
  const fee = Number(plan?.first_session_fee ?? 0);
  const feeLabel = fee % 1 === 0 ? String(fee) : fee.toFixed(2);

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
        .hero-cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; align-items: center; }
        .hero-points { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 32px; }
        .hero-point { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: #475569; }
        .price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 900px) { .price-grid { grid-template-columns: 1fr; } }
        .price-card { background: #fff; border-radius: 16px; border: 1px solid #e8f0fb; padding: 26px; display: flex; flex-direction: column; }
        .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px 48px; }
        @media (max-width: 768px) { .faq-grid { grid-template-columns: 1fr; gap: 24px; } }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{hero.badge}</div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(28px, 4vw, 54px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {hero.hero} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{hero.heroEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 620, margin: '0 auto 32px' }}>{hero.heroDesc}</p>

          <div className="hero-cta-row">
            <a href={registerHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              {hero.heroBtn}
              <ArrowRight size={18} />
            </a>
            {/* Έδειχνε σε /how-it-works?tab=therapist — η σελίδα δεν
                διαβάζει καμία παράμετρο, οπότε ο θεραπευτής προσγειωνόταν
                σε οδηγίες για ασθενείς. Τώρα πάει στην τιμολόγηση, που
                είναι και αυτό που πραγματικά θέλει να δει. */}
            <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1a2e44', padding: '14px 28px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1.5px solid #cbd8e6' }}>
              {tx.heroSecondary}
            </a>
          </div>

          <div className="hero-points">
            {heroPoints.map((p, i) => (
              <span key={i} className="hero-point">
                <CheckCircle2 size={17} color="#2a6fdb" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ΤΙΜΟΛΟΓΗΣΗ ──
          Η σελίδα δεν έλεγε πουθενά τι κοστίζει. Ο φυσικοθεραπευτής
          έφτανε μέχρι την εγγραφή χωρίς να ξέρει ποιος τον πληρώνει.
          Είναι το πρώτο πράγμα που ρωτάει και το πιο πειστικό που έχουμε. */}
      <section id="pricing" style={{ background: '#fff', padding: '72px 24px', scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>{tx.priceBadge}</div>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', marginBottom: 12 }}>
              {tx.priceTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.priceTitleEm}</em>
            </h2>
            <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 540, margin: '0 auto' }}>{tx.priceDesc}</p>
          </div>

          <div className="price-grid">
            <div className="price-card" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Banknote size={20} color="#15803D" strokeWidth={2} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#15803D', marginBottom: 8 }}>{tx.cardCashTitle}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#15803D', marginBottom: 10 }}>{tx.cardCashValue}</div>
              <div style={{ fontSize: 13.5, color: '#166534', lineHeight: 1.65 }}>{tx.cardCashDesc}</div>
            </div>

            <div className="price-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eaf2fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Wallet size={20} color="#2a6fdb" strokeWidth={2} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{tx.cardSubTitle}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1a2e44', marginBottom: monthly > 0 ? 10 : 4 }}>
                {loadingPlan ? tx.priceLoading : (monthly > 0 ? `${monthly.toFixed(2)}€` : '0€')}
                {!loadingPlan && monthly > 0 && (
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#6b7a8d' }}>{tx.perMonth}</span>
                )}
              </div>
              {!loadingPlan && monthly === 0 && (
                <div style={{ fontSize: 12, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                  {tx.cardSubFreeLabel}
                </div>
              )}
              <div style={{ fontSize: 13.5, color: '#6b7a8d', lineHeight: 1.65 }}>
                {monthly > 0 ? tx.cardSubDescPaid : tx.cardSubDescFree}
              </div>
            </div>

            <div className="price-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eaf2fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <UserPlus size={20} color="#2a6fdb" strokeWidth={2} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{tx.cardFeeTitle}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1a2e44', marginBottom: 10 }}>
                {loadingPlan ? tx.priceLoading : `${feeLabel}€`}
                {!loadingPlan && (
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7a8d' }}> {tx.perNewPatient}</span>
                )}
              </div>
              <div style={{ fontSize: 13.5, color: '#6b7a8d', lineHeight: 1.65 }}>{tx.cardFeeDesc}</div>
            </div>
          </div>

          {!loadingPlan && fee > 0 && (
            <div style={{ marginTop: 24, background: '#faf9f6', border: '1px solid #e8e4dc', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                <strong style={{ color: '#1a2e44' }}>{tx.priceExample}</strong> {tx.priceExampleBody(feeLabel)}
              </div>
              <div style={{ fontSize: 13, color: '#8a9aab', marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Check size={14} color="#15803D" strokeWidth={2.6} />
                {tx.priceSetOwn}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WHY WORK WITH US */}
      <section style={{ background: '#f8fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', marginBottom: 12 }}>
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
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
                {workflow.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{workflow.titleEm}</em>
              </h2>
              <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{workflow.desc}</p>
              <a href={registerHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {workflow.btn}
                <ArrowRight size={16} />
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
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
                {platform.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{platform.titleEm}</em>
              </h2>
              <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{platform.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(platform.points || []).map((p, i) => (
                  <div key={i} className="platform-point">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={17} color="#2a6fdb" strokeWidth={2.6} />
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

      {/* FAQ — οι ερωτήσεις που κρατούν τον θεραπευτή πίσω */}
      <section style={{ background: '#f8fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(26px, 3vw, 36px)', color: '#1a2e44', marginBottom: 36, textAlign: 'center' }}>
            {tx.faqTitle}
          </h2>
          <div className="faq-grid">
            {tx.faqs.map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44', marginBottom: 7 }}>{f.q}</div>
                <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1a2e44 0%, #2a3e54 100%)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(28px, 4vw, 42px)', color: '#fff', marginBottom: 16 }}>
            {tx.ctaTitle}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 32px' }}>
            {tx.ctaDesc}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {tx.benefitsList.map((b, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 18px', borderRadius: 30, fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Check size={14} strokeWidth={2.8} />
                {b}
              </div>
            ))}
          </div>
          <a href={registerHref}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1a2e44', padding: '16px 44px', borderRadius: 30, fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}>
            {tx.ctaBtn}
            <ArrowRight size={18} />
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