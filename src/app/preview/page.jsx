'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConditionSearch from '@/components/ConditionSearch';
import VerifiedBadge from '@/components/VerifiedBadge';
import {
  ShieldCheck, Target, MapPin, Tag, ArrowRight,
  Star, Lock, Stethoscope, Clock, CreditCard,
} from 'lucide-react';

/**
 * ΠΡΟΕΠΙΣΚΟΠΗΣΗ ΑΡΧΙΚΗΣ — /preview
 *
 * ΔΕΝ αντικαθιστά την τρέχουσα αρχική. Ζει σε δικό της route ώστε να
 * μπορείς να τη δεις live, σε πραγματικό κινητό, χωρίς να ρισκάρεις
 * τίποτα. Αν εγκριθεί, το περιεχόμενο μεταφέρεται στο app/page.js.
 *
 * ΔΟΜΗ: Hero → Trust strip → ΓΙΑΤΙ → ΤΙ → ΠΩΣ → Επαλήθευση →
 *       Περιστατικά → Αρχές → Περιοχές → Τελικό CTA
 *
 * Το «Τι σας ταλαιπωρεί;» μένει ΑΝΕΠΑΦΟ και επαναλαμβάνεται στο τέλος:
 * η σελίδα κλείνει όπως άνοιξε.
 */

const AREAS_FALLBACK = [
  'Παγκράτι', 'Νέα Σμύρνη', 'Γλυφάδα', 'Κολωνάκι',
  'Χαλάνδρι', 'Παλαιό Φάληρο', 'Μαρούσι', 'Ζωγράφου',
  'Νέα Ιωνία', 'Καλλιθέα', 'Πειραιάς', 'Κηφισιά',
];

// Ο ίδιος μετασχηματισμός με τα SEO routes, ώστε τα links να δείχνουν
// σε πραγματικές διευθύνσεις όταν φτιαχτούν οι σελίδες.
function slugify(s) {
  const map = {
    α:'a',ά:'a',β:'v',γ:'g',δ:'d',ε:'e',έ:'e',ζ:'z',η:'i',ή:'i',θ:'th',
    ι:'i',ί:'i',ϊ:'i',ΐ:'i',κ:'k',λ:'l',μ:'m',ν:'n',ξ:'x',ο:'o',ό:'o',
    π:'p',ρ:'r',σ:'s',ς:'s',τ:'t',υ:'y',ύ:'y',ϋ:'y',ΰ:'y',φ:'f',χ:'ch',
    ψ:'ps',ω:'o',ώ:'o',
  };
  return String(s || '')
    .toLowerCase()
    .split('')
    .map(c => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const C = {
  navy: '#1a2e44',
  accent: '#2a6fdb',
  soft: '#eaf2fc',
  off: '#faf9f6',
  text: '#1a2e44',
  muted: '#6b7a8d',
  faint: '#94a3b8',
  border: '#e5eaf0',
  line: '#f1f5f9',
  green: '#15803d',
  greenBg: '#f0fdf4',
  greenBr: '#bbf7d0',
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
    <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 3.4vw, 40px)', color: C.navy, lineHeight: 1.22, margin: 0, fontWeight: 400, ...style }}>
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

// ════════════════════════════════════════════════════════════════════════
export default function PreviewHomePage() {
  const [conditions, setConditions] = useState([]);
  const [areas, setAreas] = useState(AREAS_FALLBACK);
  const [therapist, setTherapist] = useState(null);

  useEffect(() => {
    (async () => {
      // Περιστατικά — τα ίδια που βλέπει ο ασθενής στον οδηγό
      const { data: conds } = await supabase
        .from('conditions')
        .select('id, slug, name_el, category_id')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(12);
      if (conds?.length) setConditions(conds);

      // Περιοχές από τους ΕΝΕΡΓΟΥΣ θεραπευτές.
      // Αν δείχναμε σταθερή λίστα, θα οδηγούσαμε τον χρήστη σε περιοχές
      // όπου δεν εξυπηρετεί κανείς — και θα έφευγε απογοητευμένος.
      const { data: ths } = await supabase
        .from('v_public_therapists')
        .select('id, name, specialty, photo_url, years_experience, area, service_areas, license_verified, price_per_session')
        .eq('is_publicly_visible', true);

      if (ths?.length) {
        const set = new Set();
        ths.forEach(t => {
          if (t.area) set.add(t.area);
          (t.service_areas || []).forEach(a => a && set.add(a));
        });
        if (set.size >= 4) setAreas([...set].slice(0, 12));

        // Ένας πραγματικός επαληθευμένος θεραπευτής για την ενότητα
        // εμπιστοσύνης. Ένα ψεύτικο προφίλ θα ήταν ακριβώς το είδος
        // «social proof» που ζήτησες να αποφύγουμε.
        const verified = ths.find(t => t.license_verified) || ths[0];
        if (verified) {
          const { data: tc } = await supabase
            .from('therapist_conditions')
            .select('conditions(name_el)')
            .eq('therapist_id', verified.id)
            .limit(3);
          setTherapist({
            ...verified,
            conditionNames: (tc || []).map(x => x.conditions?.name_el).filter(Boolean),
          });
        }
      }
    })();
  }, []);

  const TRUST_STRIP = [
    { Icon: ShieldCheck, text: 'Επαληθευμένη επαγγελματική άδεια' },
    { Icon: Target,      text: 'Αντιστοίχιση με το περιστατικό σας' },
    { Icon: MapPin,      text: 'Εξυπηρέτηση στην περιοχή σας' },
    { Icon: Tag,         text: 'Ξεκάθαρη τιμή πριν το αίτημα' },
  ];

  const WHAT = [
    {
      Icon: Target,
      title: 'Κατάλληλος για το περιστατικό σας',
      desc: 'Βλέπετε φυσικοθεραπευτές που έχουν δηλώσει ότι αναλαμβάνουν την ανάγκη που επιλέξατε.',
    },
    {
      Icon: MapPin,
      title: 'Εξυπηρετεί την περιοχή σας',
      desc: 'Δεν χρειάζεται να ψάχνετε ποιος πραγματοποιεί κατ\u2019 οίκον συνεδρίες στην περιοχή σας.',
    },
    {
      Icon: Tag,
      title: 'Ξέρετε τι να περιμένετε',
      desc: 'Βλέπετε τιμή, εμπειρία, επαγγελματική επαλήθευση και διαθέσιμες ώρες πριν στείλετε αίτημα.',
    },
  ];

  const HOW = [
    { title: 'Πείτε μας τι σας ταλαιπωρεί', desc: 'Δεν χρειάζεται να γνωρίζετε την ακριβή διάγνωση.' },
    { title: 'Δείτε ποιοι θεραπευτές ταιριάζουν', desc: 'Με βάση το περιστατικό και την περιοχή σας.' },
    { title: 'Διαλέξτε ημέρα και ώρα', desc: 'Βλέπετε τις διαθέσιμες ώρες του θεραπευτή.' },
    { title: 'Στείλτε αίτημα', desc: 'Ο θεραπευτής το επιβεβαιώνει και το ραντεβού σας κλείνεται.' },
  ];

  const PRINCIPLES = [
    {
      Icon: ShieldCheck,
      title: 'Επαγγελματική επαλήθευση',
      desc: 'Ελέγχουμε την άδεια άσκησης επαγγέλματος πριν ενεργοποιηθεί το δημόσιο προφίλ.',
    },
    {
      Icon: Star,
      title: 'Αξιολογήσεις από πραγματικές συνεδρίες',
      desc: 'Μόνο ασθενείς που πραγματοποίησαν συνεδρία μέσω της πλατφόρμας μπορούν να αφήσουν αξιολόγηση.',
    },
    {
      Icon: Lock,
      title: 'Τα στοιχεία σας παραμένουν προστατευμένα',
      desc: 'Τα προσωπικά στοιχεία επικοινωνίας δεν εμφανίζονται δημόσια στους χρήστες της πλατφόρμας.',
    },
  ];

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

        @media (max-width: 900px) {
          .pv-grid-3, .pv-grid-4, .pv-split { grid-template-columns: 1fr; gap: 20px; }
        }
        @media (max-width: 620px) {
          .pv-grid-4 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <Navbar />

      {/* ══ 1. HERO ══
          ΑΝΕΠΑΦΟ. Το «Τι σας ταλαιπωρεί;» είναι το δυνατότερο σημείο
          εισόδου — ο χρήστης που πονάει πρέπει να ξεκινήσει αμέσως,
          όχι να διαβάσει γιατί υπάρχουμε. */}
      <section style={{ background: `linear-gradient(160deg, ${C.soft} 0%, #f4f9ff 55%, ${C.off} 100%)`, padding: '64px 24px 52px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 4.6vw, 52px)', color: C.navy, lineHeight: 1.14, margin: '0 0 16px', fontWeight: 400 }}>
            Εξειδικευμένη Φυσιοθεραπεία στην <em style={{ fontStyle: 'italic', color: C.accent }}>Άνεση του Σπιτιού σας</em>
          </h1>
          <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, margin: '0 auto 34px', maxWidth: 560 }}>
            Ελεγμένοι φυσικοθεραπευτές που έρχονται σε εσάς, στην Αθήνα και την Αττική.
          </p>

          <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, padding: '26px 24px', boxShadow: '0 4px 28px rgba(26,46,68,0.07)', textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12, textAlign: 'center' }}>
              Τι σας ταλαιπωρεί;
            </div>
            <ConditionSearch />
          </div>
        </div>
      </section>

      {/* ══ 2. TRUST STRIP ══
          Απαντά σε δύο δευτερόλεπτα: «γιατί εδώ και όχι στο Google;» */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, textAlign: 'center', marginBottom: 18 }}>
            Βρείτε τον κατάλληλο φυσικοθεραπευτή με μεγαλύτερη σιγουριά
          </div>
          <div className="pv-grid-4">
            {TRUST_STRIP.map(t => (
              <div key={t.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <t.Icon size={17} color={C.green} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. ΓΙΑΤΙ ══
          Editorial, όχι feature grid. Ένα κείμενο που θα μπορούσε να
          έχει γράψει άνθρωπος, όχι λίστα με εικονίδια. */}
      <Section bg={C.off}>
        <div style={{ maxWidth: 720 }}>
          <Eyebrow>Γιατί</Eyebrow>
          <H2>Γιατί δημιουργήσαμε το <em style={{ fontStyle: 'italic', color: C.accent }}>PhysioHome</em></H2>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(19px, 2.2vw, 24px)', color: C.navy, lineHeight: 1.5, margin: '22px 0 0', fontWeight: 400 }}>
            Η επιλογή φυσικοθεραπευτή για το σπίτι δεν θα έπρεπε να γίνεται στα τυφλά.
          </p>
          <Lead style={{ maxWidth: 700 }}>
            Όταν χρειάζεστε φυσιοθεραπεία, θέλετε να γνωρίζετε ότι ο επαγγελματίας που θα
            έρθει στον χώρο σας είναι επαληθευμένος, αναλαμβάνει το συγκεκριμένο περιστατικό
            και εξυπηρετεί την περιοχή σας.
          </Lead>
          <Lead style={{ maxWidth: 700 }}>
            Γι\u2019 αυτό δημιουργήσαμε έναν πιο απλό και ξεκάθαρο τρόπο να βρίσκετε τον
            κατάλληλο φυσικοθεραπευτή για εσάς.
          </Lead>
        </div>
      </Section>

      {/* ══ 4. ΤΙ ══ */}
      <Section bg="#fff">
        <div style={{ maxWidth: 720, marginBottom: 40 }}>
          <Eyebrow>Τι κάνουμε διαφορετικά</Eyebrow>
          <H2>Φυσικοθεραπεία που ταιριάζει πραγματικά στην ανάγκη σας</H2>
          <Lead>
            Δεν εμφανίζουμε απλώς έναν κατάλογο φυσικοθεραπευτών. Με βάση το πρόβλημα που
            αντιμετωπίζετε και την περιοχή σας, βλέπετε επαγγελματίες που μπορούν πραγματικά
            να σας εξυπηρετήσουν.
          </Lead>
        </div>

        <div className="pv-grid-3">
          {WHAT.map(w => (
            <div key={w.title} style={{ background: C.off, border: `1px solid ${C.border}`, borderRadius: 16, padding: 26 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <w.Icon size={20} color={C.accent} strokeWidth={2.1} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: C.navy, margin: '0 0 9px' }}>{w.title}</h3>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ 5. ΠΩΣ ══ */}
      <Section bg={C.off}>
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <Eyebrow>Πώς λειτουργεί</Eyebrow>
          <H2>Τέσσερα βήματα, χωρίς κάρτα</H2>
        </div>

        <div className="pv-grid-4">
          {HOW.map((h, i) => (
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
          <span style={{ fontSize: 14, color: C.green, fontWeight: 500 }}>
            Δεν χρειάζεται κάρτα. Η πληρωμή γίνεται απευθείας στον θεραπευτή μετά τη συνεδρία.
          </span>
        </div>
      </Section>

      {/* ══ 6. ΕΠΑΛΗΘΕΥΣΗ ══
          Δείχνουμε ΠΡΑΓΜΑΤΙΚΟ προφίλ, όχι εικονίδια με τη λέξη
          «Εμπιστοσύνη». Το trust φαίνεται μέσα στο προϊόν ή δεν φαίνεται. */}
      <Section bg="#fff">
        <div className="pv-split">
          <div>
            <Eyebrow>Επαλήθευση</Eyebrow>
            <H2>Ποιος έρχεται στο σπίτι σας έχει σημασία.</H2>
            <Lead>
              Κάθε φυσικοθεραπευτής που εμφανίζεται στην πλατφόρμα έχει υποβάλει την
              επαγγελματική του άδεια προς επαλήθευση.
            </Lead>
            <a href="/therapists" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: C.navy, color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 12, textDecoration: 'none' }}>
              Δες φυσικοθεραπευτές
              <ArrowRight size={17} />
            </a>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 26, boxShadow: '0 6px 32px rgba(26,46,68,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18 }}>
              {therapist?.photo_url ? (
                <img src={therapist.photo_url} alt="" style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 62, height: 62, borderRadius: '50%', background: C.soft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                  {(therapist?.name || 'ΜΠ').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>
                  {therapist?.name || 'Μαρία Παπαδοπούλου'}
                </div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>
                  {therapist?.specialty || 'Φυσικοθεραπεύτρια'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <VerifiedBadge lang="el" size="md" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.muted, marginBottom: 18 }}>
              <Clock size={15} color={C.faint} />
              {therapist?.years_experience
                ? `${therapist.years_experience} χρόνια εμπειρίας`
                : '5 χρόνια εμπειρίας'}
            </div>

            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                Αναλαμβάνει
              </div>
              <div className="pv-chips">
                {(therapist?.conditionNames?.length
                  ? therapist.conditionNames
                  : ['Οσφυαλγία', 'Μετεγχειρητική αποκατάσταση', 'Πόνος γόνατος']
                ).map(c => (
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
          <Eyebrow>Περιστατικά</Eyebrow>
          <H2>Δεν είστε σίγουροι τι είδους φυσικοθεραπεία χρειάζεστε;</H2>
          <Lead>Δεν πειράζει. Ξεκινήστε από αυτό που σας ενοχλεί.</Lead>
        </div>

        <div className="pv-chips">
          {(conditions.length ? conditions : [
            { id: 1, slug: 'osfialgia', name_el: 'Οσφυαλγία' },
            { id: 2, slug: 'ponos-gonatou', name_el: 'Πόνος γόνατος' },
            { id: 3, slug: 'aychenalgia', name_el: 'Αυχεναλγία' },
            { id: 4, slug: 'apokatastasi-meta-egkefaliko', name_el: 'Αποκατάσταση μετά εγκεφαλικό' },
            { id: 5, slug: 'metegcheiritiki', name_el: 'Μετεγχειρητική αποκατάσταση' },
            { id: 6, slug: 'athlitikes-kakoseis', name_el: 'Αθλητικές κακώσεις' },
          ]).map(c => (
            <a key={c.id} href={`/pathiseis/${c.slug || slugify(c.name_el)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fff', border: `1px solid ${C.border}`, borderRadius: 30,
                padding: '11px 20px', fontSize: 14.5, color: C.navy,
                textDecoration: 'none', fontWeight: 500,
              }}>
              <Stethoscope size={15} color={C.accent} strokeWidth={2} />
              {c.name_el}
            </a>
          ))}
        </div>

        <a href="/find-help" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 26, fontSize: 14.5, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>
          Δες όλα τα περιστατικά
          <ArrowRight size={15} />
        </a>
      </Section>

      {/* ══ 8. ΑΡΧΕΣ ══
          ΚΑΜΙΑ ψεύτικη απόδειξη: ούτε μετρητές, ούτε «χιλιάδες ασθενείς»,
          ούτε testimonials. Μόνο αρχές που ισχύουν από την πρώτη μέρα και
          μπορούμε να τις υπερασπιστούμε. */}
      <Section bg="#fff">
        <div style={{ maxWidth: 660, marginBottom: 40 }}>
          <Eyebrow>Οι αρχές μας</Eyebrow>
          <H2>Χτίζουμε μια πιο αξιόπιστη εμπειρία φυσιοθεραπείας στο σπίτι</H2>
        </div>

        <div className="pv-grid-3">
          {PRINCIPLES.map(p => (
            <div key={p.title} style={{ borderTop: `2px solid ${C.accent}`, paddingTop: 20 }}>
              <p.Icon size={20} color={C.accent} strokeWidth={2.1} style={{ marginBottom: 14 }} />
              <h3 style={{ fontSize: 16.5, fontWeight: 600, color: C.navy, margin: '0 0 10px', lineHeight: 1.4 }}>{p.title}</h3>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ 9. ΠΕΡΙΟΧΕΣ ══
          Οι περιοχές έρχονται από τους ΕΝΕΡΓΟΥΣ θεραπευτές. Μια σταθερή
          λίστα θα οδηγούσε σε περιοχές χωρίς κάλυψη — κακό και για τον
          χρήστη και για το SEO (thin pages). */}
      <Section bg={C.off}>
        <div style={{ maxWidth: 640, marginBottom: 30 }}>
          <Eyebrow>Περιοχές</Eyebrow>
          <H2>Φυσικοθεραπεία στο σπίτι κοντά σας</H2>
        </div>

        <div className="pv-chips">
          {areas.map(a => (
            <a key={a} href={`/fysiotherapeia-sto-spiti/${slugify(a)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#fff', border: `1px solid ${C.border}`, borderRadius: 30,
                padding: '10px 18px', fontSize: 14, color: C.navy,
                textDecoration: 'none', fontWeight: 500,
              }}>
              <MapPin size={14} color={C.faint} strokeWidth={2} />
              {a}
            </a>
          ))}
        </div>

        <a href="/therapists" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 24, fontSize: 14.5, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>
          Δες όλες τις περιοχές
          <ArrowRight size={15} />
        </a>
      </Section>

      {/* ══ 10. ΤΕΛΙΚΟ ══
          Η σελίδα κλείνει όπως άνοιξε: ίδια ερώτηση, ίδια αναζήτηση.
          Όποιος διάβασε τα πάντα δεν πρέπει να ψάξει πού να πατήσει. */}
      <section style={{ background: C.navy, padding: '76px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 3.2vw, 36px)', color: '#fff', lineHeight: 1.3, margin: '0 0 18px', fontWeight: 400 }}>
            Η φροντίδα είναι προσωπική. Η επιλογή της δεν πρέπει να είναι τυχαία.
          </h2>
          <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, margin: '0 auto 36px', maxWidth: 620 }}>
            Θέλουμε κάθε άνθρωπος που χρειάζεται φυσιοθεραπεία στο σπίτι να μπορεί να βρει
            τον κατάλληλο επαγγελματία με περισσότερη σιγουριά, λιγότερη ταλαιπωρία και
            ξεκάθαρη πληροφόρηση.
          </p>

          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 22px', textAlign: 'left', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12, textAlign: 'center' }}>
              Τι σας ταλαιπωρεί;
            </div>
            <ConditionSearch />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}