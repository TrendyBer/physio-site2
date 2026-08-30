'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VerifiedBadge from '@/components/VerifiedBadge';
import {
  ShieldCheck, Target, MapPin, Tag, ArrowRight, Search,
  Star, Lock, Stethoscope, Clock, CreditCard,
} from 'lucide-react';

/**
 * ΑΡΧΙΚΗ — κλάδος redesign
 *
 * ΔΟΜΗ: Hero → Trust strip → ΓΙΑΤΙ → ΤΙ → ΠΩΣ → Επαλήθευση →
 *       Περιστατικά → Αρχές → Περιοχές → Τελικό CTA
 *
 * Το «Τι σας ταλαιπωρεί;» ανοίγει και κλείνει τη σελίδα: όποιος διάβασε
 * τα πάντα δεν πρέπει να ψάχνει πού να πατήσει.
 *
 * ΔΙΓΛΩΣΣΟ. Η πρώτη έκδοση είχε τα ελληνικά γραμμένα μέσα στον κώδικα,
 * οπότε ο διακόπτης γλώσσας άλλαζε μόνο το Navbar και η σελίδα έμενε
 * μισή στα ελληνικά — χειρότερο από καθόλου μετάφραση.
 */

const AREAS_FALLBACK = [
  'Παγκράτι', 'Νέα Σμύρνη', 'Γλυφάδα', 'Κολωνάκι',
  'Χαλάνδρι', 'Παλαιό Φάληρο', 'Μαρούσι', 'Ζωγράφου',
];

const FALLBACK_CHIPS = {
  el: ['Οσφυαλγία', 'Αυχενικό σύνδρομο', 'Πόνος ώμου', 'Πόνος γόνατος', 'Ισχιαλγία'],
  en: ['Low back pain', 'Neck pain', 'Shoulder pain', 'Knee pain', 'Sciatica'],
};

// Ίδιος μετασχηματισμός με τα SEO routes, ώστε τα links να ταιριάζουν.
function slugify(s) {
  const map = {
    α:'a',ά:'a',β:'v',γ:'g',δ:'d',ε:'e',έ:'e',ζ:'z',η:'i',ή:'i',θ:'th',
    ι:'i',ί:'i',ϊ:'i',ΐ:'i',κ:'k',λ:'l',μ:'m',ν:'n',ξ:'x',ο:'o',ό:'o',
    π:'p',ρ:'r',σ:'s',ς:'s',τ:'t',υ:'y',ύ:'y',ϋ:'y',ΰ:'y',φ:'f',χ:'ch',
    ψ:'ps',ω:'o',ώ:'o',
  };
  return String(s || '').toLowerCase().split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── ΚΑΘΑΡΙΣΜΟΣ ΠΕΡΙΟΧΩΝ ──
// Γράφονται ελεύθερα από τους θεραπευτές, οπότε μαζεύονται δοκιμαστικές
// εγγραφές, διπλότυπα με άλλα κεφαλαία και λάθος τονισμοί. Δύο γραφές
// της ίδιας περιοχής σημαίνουν δύο SEO σελίδες που ανταγωνίζονται.
function areaKey(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanAreas(list) {
  const seen = new Map();
  (list || []).forEach(raw => {
    const name = String(raw || '').trim();
    if (name.length < 4) return;
    if (!/[α-ωΑ-Ω]/.test(name)) return;
    const key = areaKey(name);
    const prev = seen.get(key);
    const score = (name.match(/[άέήίόύώΐΰ]/g) || []).length * 2
                + (name.match(/[Α-Ω]/g) || []).length;
    if (!prev || score > prev.score) seen.set(key, { name, score });
  });
  return [...seen.values()].map(v => v.name).sort((a, b) => a.localeCompare(b, 'el'));
}

const C = {
  navy: '#1a2e44', accent: '#2a6fdb', soft: '#eaf2fc', off: '#faf9f6',
  muted: '#6b7a8d', faint: '#94a3b8', border: '#e5eaf0', line: '#f1f5f9',
  green: '#15803d', greenBg: '#f0fdf4', greenBr: '#bbf7d0',
};
const SERIF = "'DM Serif Display', Georgia, serif";

function Section({ children, bg, style, id }) {
  return (
    <section id={id} style={{ padding: '72px 24px', background: bg || '#fff', ...style }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function Eyebrow({ children }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function H2({ children, style }) {
  return (
    <h2 className="pv-h2" style={{ fontFamily: SERIF, fontSize: 'clamp(23px, 3.4vw, 40px)', color: C.navy, lineHeight: 1.24, margin: 0, fontWeight: 400, ...style }}>
      {children}
    </h2>
  );
}

function Lead({ children, style }) {
  return (
    <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.75, margin: '16px 0 0', maxWidth: 620, ...style }}>
      {children}
    </p>
  );
}

// ─── ΚΕΙΜΕΝΑ ────────────────────────────────────────────────────────────
const TX = {
  el: {
    heroTitle1: 'Εξειδικευμένη Φυσιοθεραπεία στην',
    heroTitle2: 'Άνεση του Σπιτιού σας',
    heroDesc: 'Φυσικοθεραπευτές με επαληθευμένη επαγγελματική άδεια, που έρχονται σε εσάς στην Αθήνα και την Αττική.',
    searchLabel: 'Τι σας ταλαιπωρεί;',
    searchPh: 'π.χ. πόνος στη μέση, αυχενικό, εγχείρηση γόνατου',
    searchBtn: 'Βρες φυσικοθεραπευτή',
    searchMicro: 'Δεν χρειάζεται να γνωρίζετε ακριβή διάγνωση · Η περιοχή ζητείται στο επόμενο βήμα',
    popular: 'Δημοφιλείς αναζητήσεις',

    stripTitle: 'Βρείτε τον κατάλληλο φυσικοθεραπευτή με μεγαλύτερη σιγουριά',
    strip: [
      'Επαληθευμένη επαγγελματική άδεια',
      'Αντιστοίχιση με το περιστατικό σας',
      'Εξυπηρέτηση στην περιοχή σας',
      'Ξεκάθαρη τιμή πριν το αίτημα',
    ],

    whyEyebrow: 'Γιατί',
    whyTitle1: 'Γιατί δημιουργήσαμε το',
    whyTitle2: 'PhysioHome',
    whyLead: 'Η επιλογή φυσικοθεραπευτή για το σπίτι δεν θα έπρεπε να γίνεται στα τυφλά.',
    whyP1: 'Όταν χρειάζεστε φυσιοθεραπεία, θέλετε να γνωρίζετε ότι ο επαγγελματίας που θα έρθει στον χώρο σας είναι επαληθευμένος, αναλαμβάνει το συγκεκριμένο περιστατικό και εξυπηρετεί την περιοχή σας.',
    whyP2: 'Γι’ αυτό δημιουργήσαμε έναν πιο απλό και ξεκάθαρο τρόπο να βρίσκετε τον κατάλληλο φυσικοθεραπευτή για εσάς.',

    whatEyebrow: 'Τι κάνουμε διαφορετικά',
    whatTitle: 'Φυσικοθεραπεία που ταιριάζει πραγματικά στην ανάγκη σας',
    whatLead: 'Δεν εμφανίζουμε απλώς έναν κατάλογο φυσικοθεραπευτών. Με βάση το πρόβλημα που αντιμετωπίζετε και την περιοχή σας, βλέπετε επαγγελματίες που μπορούν πραγματικά να σας εξυπηρετήσουν.',
    what: [
      { title: 'Κατάλληλος για το περιστατικό σας', desc: 'Βλέπετε φυσικοθεραπευτές που έχουν δηλώσει ότι αναλαμβάνουν την ανάγκη που επιλέξατε.' },
      { title: 'Εξυπηρετεί την περιοχή σας', desc: 'Δεν χρειάζεται να ψάχνετε ποιος πραγματοποιεί κατ’ οίκον συνεδρίες στην περιοχή σας.' },
      { title: 'Ξέρετε τι να περιμένετε', desc: 'Βλέπετε τιμή, εμπειρία, επαγγελματική επαλήθευση και διαθέσιμες ώρες πριν στείλετε αίτημα.' },
    ],

    howEyebrow: 'Πώς λειτουργεί',
    howTitle: 'Από αυτό που σας ενοχλεί, στον κατάλληλο φυσικοθεραπευτή',
    how: [
      { title: 'Πείτε μας τι σας ταλαιπωρεί', desc: 'Περιγράψτε με απλά λόγια το πρόβλημά σας. Δεν χρειάζεται να γνωρίζετε την ακριβή διάγνωση.' },
      { title: 'Δείτε ποιοι φυσικοθεραπευτές ταιριάζουν', desc: 'Εμφανίζονται επαγγελματίες που αναλαμβάνουν το περιστατικό σας και εξυπηρετούν την περιοχή σας.' },
      { title: 'Επιλέξτε ημέρα και ώρα', desc: 'Δείτε τις διαθέσιμες ώρες του θεραπευτή και επιλέξτε αυτή που σας εξυπηρετεί.' },
      { title: 'Στείλτε το αίτημά σας', desc: 'Ο φυσικοθεραπευτής το επιβεβαιώνει και το ραντεβού σας κλείνεται.' },
    ],
    noCard: 'Δεν χρειάζεται κάρτα για να κλείσετε ραντεβού. Η πληρωμή γίνεται απευθείας στον φυσικοθεραπευτή μετά τη συνεδρία.',

    verifyEyebrow: 'Επαλήθευση',
    verifyTitle: 'Ποιος έρχεται στο σπίτι σας έχει σημασία.',
    verifyLead: 'Κάθε φυσικοθεραπευτής που εμφανίζεται στην πλατφόρμα έχει υποβάλει την επαγγελματική του άδεια προς επαλήθευση.',
    verifyBtn: 'Δες φυσικοθεραπευτές',
    handles: 'Αναλαμβάνει',
    yearsExp: (n) => `${n} χρόνια εμπειρίας`,
    sampleName: 'Μαρία Παπαδοπούλου',
    sampleSpec: 'Φυσικοθεραπεύτρια',
    sampleConds: ['Οσφυαλγία', 'Μετεγχειρητική αποκατάσταση', 'Πόνος γόνατος'],

    condEyebrow: 'Περιστατικά',
    condTitle: 'Δεν είστε σίγουροι τι είδους φυσικοθεραπεία χρειάζεστε;',
    condLead: 'Δεν πειράζει. Ξεκινήστε από αυτό που σας ενοχλεί.',
    condAll: 'Δες όλα τα περιστατικά',

    prinEyebrow: 'Οι αρχές μας',
    prinTitle: 'Χτίζουμε μια πιο αξιόπιστη εμπειρία φυσιοθεραπείας στο σπίτι',
    principles: [
      { title: 'Επαγγελματική επαλήθευση', desc: 'Ελέγχουμε την άδεια άσκησης επαγγέλματος πριν ενεργοποιηθεί το δημόσιο προφίλ.' },
      { title: 'Αξιολογήσεις από πραγματικές συνεδρίες', desc: 'Μόνο ασθενείς που πραγματοποίησαν συνεδρία μέσω της πλατφόρμας μπορούν να αφήσουν αξιολόγηση.' },
      { title: 'Τα στοιχεία σας παραμένουν προστατευμένα', desc: 'Τα προσωπικά στοιχεία επικοινωνίας δεν εμφανίζονται δημόσια στους χρήστες της πλατφόρμας.' },
    ],

    areaEyebrow: 'Περιοχές',
    areaTitle: 'Φυσικοθεραπεία στο σπίτι κοντά σας',
    areaAll: 'Δες όλες τις περιοχές',

    finalTitle: 'Η φροντίδα είναι προσωπική. Η επιλογή της δεν πρέπει να είναι τυχαία.',
    finalDesc: 'Βρείτε τον κατάλληλο επαγγελματία με περισσότερη σιγουριά και ξεκάθαρη πληροφόρηση.',
  },

  en: {
    heroTitle1: 'Specialised Physiotherapy in the',
    heroTitle2: 'Comfort of Your Home',
    heroDesc: 'Physiotherapists with a verified professional licence, coming to you across Athens and Attica.',
    searchLabel: 'What is troubling you?',
    searchPh: 'e.g. back pain, neck pain, knee surgery',
    searchBtn: 'Find a physiotherapist',
    searchMicro: "You don't need to know an exact diagnosis · Your area is asked in the next step",
    popular: 'Popular searches',

    stripTitle: 'Find the right physiotherapist with more confidence',
    strip: [
      'Verified professional licence',
      'Matched to your condition',
      'Serves your area',
      'Clear price before you request',
    ],

    whyEyebrow: 'Why',
    whyTitle1: 'Why we built',
    whyTitle2: 'PhysioHome',
    whyLead: 'Choosing a physiotherapist for your home should not be done blindly.',
    whyP1: 'When you need physiotherapy, you want to know that the professional coming into your space is verified, handles your specific condition and serves your area.',
    whyP2: "That's why we built a simpler, clearer way to find the right physiotherapist for you.",

    whatEyebrow: 'What we do differently',
    whatTitle: 'Physiotherapy that genuinely matches your need',
    whatLead: "We don't just show a directory of physiotherapists. Based on your problem and your area, you see professionals who can actually serve you.",
    what: [
      { title: 'Right for your condition', desc: 'You see physiotherapists who have stated they handle the need you selected.' },
      { title: 'Serves your area', desc: "You don't have to work out who does home visits where you live." },
      { title: 'You know what to expect', desc: 'You see price, experience, professional verification and available hours before you send a request.' },
    ],

    howEyebrow: 'How it works',
    howTitle: 'From what troubles you, to the right physiotherapist',
    how: [
      { title: 'Tell us what troubles you', desc: "Describe your problem in simple words. You don't need to know an exact diagnosis." },
      { title: 'See which physiotherapists match', desc: 'You see professionals who handle your condition and serve your area.' },
      { title: 'Pick a day and time', desc: "See the therapist's available hours and choose what suits you." },
      { title: 'Send your request', desc: 'The physiotherapist confirms it and your appointment is booked.' },
    ],
    noCard: 'No card needed to book. Payment goes directly to the physiotherapist after the session.',

    verifyEyebrow: 'Verification',
    verifyTitle: 'Who comes into your home matters.',
    verifyLead: 'Every physiotherapist on the platform has submitted their professional licence for verification.',
    verifyBtn: 'See physiotherapists',
    handles: 'Handles',
    yearsExp: (n) => `${n} years of experience`,
    sampleName: 'Maria Papadopoulou',
    sampleSpec: 'Physiotherapist',
    sampleConds: ['Low back pain', 'Post-surgery rehabilitation', 'Knee pain'],

    condEyebrow: 'Conditions',
    condTitle: 'Not sure what kind of physiotherapy you need?',
    condLead: "That's fine. Start from what bothers you.",
    condAll: 'See all conditions',

    prinEyebrow: 'Our principles',
    prinTitle: 'Building a more trustworthy home physiotherapy experience',
    principles: [
      { title: 'Professional verification', desc: 'We check the professional licence before a public profile goes live.' },
      { title: 'Reviews from real sessions', desc: 'Only patients who completed a session through the platform can leave a review.' },
      { title: 'Your details stay protected', desc: 'Personal contact details are never shown publicly to platform users.' },
    ],

    areaEyebrow: 'Areas',
    areaTitle: 'Home physiotherapy near you',
    areaAll: 'See all areas',

    finalTitle: 'Care is personal. Choosing it should not be down to chance.',
    finalDesc: 'Find the right professional with more confidence and clear information.',
  },
};

// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;

  const [problem, setProblem] = useState('');
  const [conditions, setConditions] = useState([]);
  const [areas, setAreas] = useState(AREAS_FALLBACK);
  const [therapist, setTherapist] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: conds } = await supabase
        .from('conditions')
        .select('id, slug, name_el, name_en')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(12);
      if (conds?.length) setConditions(conds);

      const { data: ths } = await supabase
        .from('v_public_therapists')
        .select('id, name, specialty, photo_url, years_experience, area, service_areas, license_verified')
        .eq('is_publicly_visible', true);

      if (ths?.length) {
        // Πλήθος ΟΡΑΤΩΝ θεραπευτών ανά περιοχή. Δείχνουμε μόνο όσες
        // έχουν τουλάχιστον έναν — αλλιώς ο επισκέπτης πατάει και
        // βρίσκει κενό, που είναι χειρότερο από το να μη δει τίποτα.
        const tally = new Map();
        ths.forEach(t => {
          const names = [t.area, ...(t.service_areas || [])].filter(Boolean);
          new Set(names.map(n => String(n).trim())).forEach(n => {
            tally.set(n, (tally.get(n) || 0) + 1);
          });
        });
        const withTherapists = [...tally.keys()];
        const cleaned = cleanAreas(withTherapists);
        if (cleaned.length >= 3) setAreas(cleaned.slice(0, 12));

        // Πραγματικός επαληθευμένος θεραπευτής, όχι mock.
        // Ένα ψεύτικο προφίλ θα ήταν ακριβώς το «social proof» που
        // αποφεύγουμε σε όλη τη σελίδα.
        const verified = ths.find(t => t.license_verified) || ths[0];
        if (verified) {
          const { data: tc } = await supabase
            .from('therapist_conditions')
            .select('conditions(name_el, name_en)')
            .eq('therapist_id', verified.id)
            .limit(3);
          setTherapist({
            ...verified,
            conditionNames: (tc || [])
              .map(x => lang === 'en' ? (x.conditions?.name_en || x.conditions?.name_el) : x.conditions?.name_el)
              .filter(Boolean),
          });
        }
      }
    })();
  }, [lang]);

  // ── ΑΝΑΖΗΤΗΣΗ ──
  // Ίδια συμπεριφορά με το παλιό Hero: κουμπί, Enter, και chips που
  // οδηγούν σε φιλτραρισμένους θεραπευτές. Η πρώτη έκδοση είχε μόνο
  // πεδίο χωρίς κουμπί — μισή λειτουργία.
  const searchHref = problem.trim()
    ? `/find-help?q=${encodeURIComponent(problem.trim())}`
    : '/find-help';

  function onKey(e) {
    if (e.key === 'Enter') window.location.href = searchHref;
  }

  const chips = conditions.length > 0
    ? conditions.slice(0, 6).map(c => ({
        label: lang === 'en' ? (c.name_en || c.name_el) : c.name_el,
        href: `/therapists?condition=${encodeURIComponent(c.slug)}`,
      }))
    : FALLBACK_CHIPS[lang].map(label => ({
        label,
        href: `/find-help?q=${encodeURIComponent(label)}`,
      }));

  const STRIP_ICONS = [ShieldCheck, Target, MapPin, Tag];
  const WHAT_ICONS  = [Target, MapPin, Tag];
  const PRIN_ICONS  = [ShieldCheck, Star, Lock];

  function SearchBox({ compact }) {
    return (
      <div style={{ background: '#fff', borderRadius: 20, border: compact ? 'none' : `1px solid ${C.border}`, padding: compact ? '22px 20px' : '26px 24px', boxShadow: compact ? '0 8px 40px rgba(0,0,0,0.2)' : '0 4px 28px rgba(26,46,68,0.07)', textAlign: 'left' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
          {tx.searchLabel}
        </div>

        <div className="pv-search">
          <div className="pv-search-input">
            <Search size={18} color={C.faint} strokeWidth={2} style={{ flexShrink: 0 }} />
            <input
              value={problem}
              onChange={e => setProblem(e.target.value)}
              onKeyDown={onKey}
              placeholder={tx.searchPh}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: C.navy, fontFamily: 'inherit', background: 'transparent', minWidth: 0 }}
            />
          </div>
          <a href={searchHref} className="pv-search-btn">
            {tx.searchBtn}
            <ArrowRight size={16} />
          </a>
        </div>

        <div style={{ fontSize: 12.5, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
          {tx.searchMicro}
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.07em', margin: '18px 0 9px' }}>
          {tx.popular}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map((c, i) => (
            <a key={i} href={c.href} className="pv-chip">{c.label}</a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        html, body { max-width: 100%; overflow-x: hidden; }
        body { font-family: 'DM Sans', sans-serif; background: ${C.off}; margin: 0; }

        .pv-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .pv-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .pv-split  { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
        .pv-chips  { display: flex; flex-wrap: wrap; gap: 10px; }

        .pv-search { display: flex; gap: 9px; align-items: stretch; }
        .pv-search-input {
          flex: 1; min-width: 0; display: flex; align-items: center; gap: 9px;
          border: 1px solid ${C.border}; border-radius: 12px; padding: 13px 15px; background: #fff;
        }
        .pv-search-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${C.navy}; color: #fff; padding: 0 26px; border-radius: 12px;
          font-size: 15px; font-weight: 600; text-decoration: none; white-space: nowrap;
          justify-content: center;
        }
        .pv-chip {
          display: inline-flex; align-items: center; background: ${C.off};
          border: 1px solid ${C.border}; border-radius: 30px; padding: 8px 15px;
          font-size: 13.5px; color: ${C.navy}; text-decoration: none; font-weight: 500;
        }
        .pv-chip:hover { border-color: ${C.accent}; color: ${C.accent}; }

        @media (max-width: 900px) {
          .pv-grid-3, .pv-grid-4, .pv-split { grid-template-columns: 1fr; gap: 20px; }
        }
        @media (max-width: 620px) {
          .pv-grid-4 { grid-template-columns: 1fr 1fr; }
          /* Το clamp με vw δεν αρκεί: στα 380px οι μεγάλες ελληνικές
             λέξεις σε serif κυριαρχούν την οθόνη. */
          .pv-h1 { font-size: 26px !important; line-height: 1.22 !important; }
          .pv-h2 { font-size: 22px !important; line-height: 1.3 !important; }
          section { padding-left: 18px !important; padding-right: 18px !important; }
          .pv-search { flex-direction: column; }
          .pv-search-btn { padding: 14px 22px; }
        }
        @media (max-width: 400px) {
          .pv-h1 { font-size: 24px !important; }
          .pv-h2 { font-size: 20px !important; }
          .pv-grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>

      <Navbar />

      {/* ══ 1. HERO ══ */}
      <section style={{ background: `linear-gradient(160deg, ${C.soft} 0%, #f4f9ff 55%, ${C.off} 100%)`, padding: '64px 24px 52px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <h1 className="pv-h1" style={{ fontFamily: SERIF, fontSize: 'clamp(27px, 4.6vw, 52px)', color: C.navy, lineHeight: 1.18, margin: '0 0 16px', fontWeight: 400 }}>
            {tx.heroTitle1} <em style={{ fontStyle: 'italic', color: C.accent }}>{tx.heroTitle2}</em>
          </h1>
          <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, margin: '0 auto 34px', maxWidth: 580 }}>
            {tx.heroDesc}
          </p>
          <SearchBox />
        </div>
      </section>

      {/* ══ 2. TRUST STRIP ══ */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, textAlign: 'center', marginBottom: 18 }}>
            {tx.stripTitle}
          </div>
          <div className="pv-grid-4">
            {tx.strip.map((t, i) => {
              const Icon = STRIP_ICONS[i];
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <Icon size={17} color={C.green} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>{t}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 3. ΓΙΑΤΙ ══ */}
      <Section bg={C.off}>
        <div style={{ maxWidth: 720 }}>
          <Eyebrow>{tx.whyEyebrow}</Eyebrow>
          <H2>{tx.whyTitle1} <em style={{ fontStyle: 'italic', color: C.accent }}>{tx.whyTitle2}</em></H2>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(19px, 2.2vw, 24px)', color: C.navy, lineHeight: 1.5, margin: '22px 0 0', fontWeight: 400 }}>
            {tx.whyLead}
          </p>
          <Lead style={{ maxWidth: 700 }}>{tx.whyP1}</Lead>
          <Lead style={{ maxWidth: 700 }}>{tx.whyP2}</Lead>
        </div>
      </Section>

      {/* ══ 4. ΤΙ ══ */}
      <Section bg="#fff">
        <div style={{ maxWidth: 720, marginBottom: 40 }}>
          <Eyebrow>{tx.whatEyebrow}</Eyebrow>
          <H2>{tx.whatTitle}</H2>
          <Lead>{tx.whatLead}</Lead>
        </div>
        <div className="pv-grid-3">
          {tx.what.map((w, i) => {
            const Icon = WHAT_ICONS[i];
            return (
              <div key={w.title} style={{ background: C.off, border: `1px solid ${C.border}`, borderRadius: 16, padding: 26 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={C.accent} strokeWidth={2.1} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: C.navy, margin: '0 0 9px' }}>{w.title}</h3>
                <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>{w.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ══ 5. ΠΩΣ ══ */}
      <Section bg={C.off}>
        <div style={{ maxWidth: 660, marginBottom: 40 }}>
          <Eyebrow>{tx.howEyebrow}</Eyebrow>
          <H2>{tx.howTitle}</H2>
        </div>
        <div className="pv-grid-4">
          {tx.how.map((h, i) => (
            <div key={h.title} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, marginBottom: 15 }}>
                {i + 1}
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 600, color: C.navy, margin: '0 0 8px', lineHeight: 1.35 }}>{h.title}</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: 0 }}>{h.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 10, background: C.greenBg, border: `1px solid ${C.greenBr}`, borderRadius: 12, padding: '13px 18px' }}>
          <CreditCard size={17} color={C.green} strokeWidth={2.1} />
          <span style={{ fontSize: 14, color: C.green, fontWeight: 500, lineHeight: 1.5 }}>{tx.noCard}</span>
        </div>
      </Section>

      {/* ══ 6. ΕΠΑΛΗΘΕΥΣΗ ══ */}
      <Section bg="#fff">
        <div className="pv-split">
          <div>
            <Eyebrow>{tx.verifyEyebrow}</Eyebrow>
            <H2>{tx.verifyTitle}</H2>
            <Lead>{tx.verifyLead}</Lead>
            <a href="/therapists" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: C.navy, color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 12, textDecoration: 'none' }}>
              {tx.verifyBtn}
              <ArrowRight size={17} />
            </a>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 26, boxShadow: '0 6px 32px rgba(26,46,68,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18 }}>
              {therapist?.photo_url ? (
                <img src={therapist.photo_url} alt="" style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 62, height: 62, borderRadius: '50%', background: C.soft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                  {(therapist?.name || tx.sampleName).split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>
                  {therapist?.name || tx.sampleName}
                </div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>
                  {therapist?.specialty || tx.sampleSpec}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <VerifiedBadge lang={lang} size="md" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.muted, marginBottom: 18 }}>
              <Clock size={15} color={C.faint} />
              {tx.yearsExp(therapist?.years_experience || 5)}
            </div>

            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                {tx.handles}
              </div>
              <div className="pv-chips">
                {(therapist?.conditionNames?.length ? therapist.conditionNames : tx.sampleConds).map(c => (
                  <span key={c} style={{ background: C.soft, color: C.accent, fontSize: 12.5, fontWeight: 500, padding: '5px 12px', borderRadius: 30 }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ 7. ΠΕΡΙΣΤΑΤΙΚΑ ══ */}
      <Section bg={C.off}>
        <div style={{ maxWidth: 640, marginBottom: 32 }}>
          <Eyebrow>{tx.condEyebrow}</Eyebrow>
          <H2>{tx.condTitle}</H2>
          <Lead>{tx.condLead}</Lead>
        </div>

        <div className="pv-chips">
          {(conditions.length ? conditions : FALLBACK_CHIPS[lang].map((n, i) => ({ id: i, slug: slugify(n), name_el: n, name_en: n }))).map(c => {
            const label = lang === 'en' ? (c.name_en || c.name_el) : c.name_el;
            return (
              <a key={c.id} href={`/therapists?condition=${encodeURIComponent(c.slug || slugify(label))}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 30, padding: '11px 20px', fontSize: 14.5, color: C.navy, textDecoration: 'none', fontWeight: 500 }}>
                <Stethoscope size={15} color={C.accent} strokeWidth={2} />
                {label}
              </a>
            );
          })}
        </div>

        <a href="/find-help" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 26, fontSize: 14.5, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>
          {tx.condAll}
          <ArrowRight size={15} />
        </a>
      </Section>

      {/* ══ 8. ΑΡΧΕΣ ══
          ΚΑΜΙΑ ψεύτικη απόδειξη: ούτε μετρητές, ούτε «χιλιάδες ασθενείς»,
          ούτε testimonials. Μόνο αρχές που ισχύουν από την πρώτη μέρα. */}
      <Section bg="#fff">
        <div style={{ maxWidth: 660, marginBottom: 40 }}>
          <Eyebrow>{tx.prinEyebrow}</Eyebrow>
          <H2>{tx.prinTitle}</H2>
        </div>
        <div className="pv-grid-3">
          {tx.principles.map((p, i) => {
            const Icon = PRIN_ICONS[i];
            return (
              <div key={p.title} style={{ borderTop: `2px solid ${C.accent}`, paddingTop: 20 }}>
                <Icon size={20} color={C.accent} strokeWidth={2.1} style={{ marginBottom: 14 }} />
                <h3 style={{ fontSize: 16.5, fontWeight: 600, color: C.navy, margin: '0 0 10px', lineHeight: 1.4 }}>{p.title}</h3>
                <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ══ 9. ΠΕΡΙΟΧΕΣ ══ */}
      <Section bg={C.off}>
        <div style={{ maxWidth: 640, marginBottom: 30 }}>
          <Eyebrow>{tx.areaEyebrow}</Eyebrow>
          <H2>{tx.areaTitle}</H2>
        </div>
        <div className="pv-chips">
          {areas.map(a => (
            <a key={a} href={`/therapists?area=${encodeURIComponent(a)}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 30, padding: '10px 18px', fontSize: 14, color: C.navy, textDecoration: 'none', fontWeight: 500 }}>
              <MapPin size={14} color={C.faint} strokeWidth={2} />
              {a}
            </a>
          ))}
        </div>
        <a href="/therapists" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 24, fontSize: 14.5, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>
          {tx.areaAll}
          <ArrowRight size={15} />
        </a>
      </Section>

      {/* ══ 10. ΤΕΛΙΚΟ ══
          Ίδια ερώτηση, ίδια αναζήτηση: η σελίδα κλείνει όπως άνοιξε. */}
      <section style={{ background: C.navy, padding: '52px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(21px, 2.6vw, 30px)', color: '#fff', lineHeight: 1.35, margin: '0 0 14px', fontWeight: 400 }}>
            {tx.finalTitle}
          </h2>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 auto 26px', maxWidth: 540 }}>
            {tx.finalDesc}
          </p>
          <SearchBox compact />
        </div>
      </section>

      <Footer />
    </>
  );
}