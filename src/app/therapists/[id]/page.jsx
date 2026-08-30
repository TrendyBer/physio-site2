'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import RatingDisplay from '../../../components/RatingDisplay';
import VerifiedBadge from '../../../components/VerifiedBadge';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { filterBookableSlots } from '@/lib/slots';
import { track, EV, captureUtm } from '@/lib/analytics';
import { ArrowRight, MapPin, ShieldCheck, GraduationCap, ChevronRight, CalendarCheck, Clock } from 'lucide-react';

const LOCALE = { el: 'el-GR', en: 'en-US' };

const DAYS_SHORT = {
  el: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const TX = {
  el: {
    breadcrumbHome: 'Αρχική',
    breadcrumbList: 'Θεραπευτές',
    verified: 'Ελεγμένο προφίλ από το PhysioHome',
    verifiedSession: 'Από επαληθευμένη συνεδρία',
    chipLicense: 'Άδεια ασκήσεως ελεγμένη',
    chipFullProfile: 'Πλήρες προφίλ',
    chipReviews: (n) => `${n} ${n === 1 ? 'αξιολόγηση' : 'αξιολογήσεις'} από ασθενείς`,
    chipResponse: (h) => `Απαντά συνήθως εντός ${h} ${h === 1 ? 'ώρας' : 'ωρών'}`,
    perSession: 'συνεδρία',
    yearsExp: 'χρόνια εμπειρίας',
    aboutTitle: 'Σχετικά με τον θεραπευτή',
    aboutEmpty: 'Ο θεραπευτής δεν έχει προσθέσει ακόμα αναλυτικό βιογραφικό.',
    specialtiesTitle: 'Περιστατικά που αναλαμβάνει',
    specialtiesEmpty: 'Δεν έχουν δηλωθεί ακόμα συγκεκριμένα περιστατικά.',
    experienceTitle: 'Επαγγελματική εμπειρία',
    experienceEmpty: 'Δεν έχει δηλωθεί ακόμα εμπειρία.',
    experienceLine: (y) => `${y} χρόνια εμπειρίας στη φυσιοθεραπεία.`,
    educationTitle: 'Εκπαίδευση & πιστοποιήσεις',
    educationEmpty: 'Δεν έχουν προστεθεί επιπλέον πιστοποιήσεις.',
    degreeDefault: 'Πτυχίο Φυσικοθεραπείας',
    classOf: 'Απόφοιτος',
    licenseNote: 'Η άδεια ασκήσεως επαγγέλματος έχει ελεγχθεί από την ομάδα του PhysioHome.',
    licensePending: 'Η άδεια ασκήσεως επαγγέλματος δεν έχει ελεγχθεί ακόμα από την ομάδα μας.',
    areasTitle: 'Περιοχές εξυπηρέτησης',
    areasEmpty: 'Δεν έχουν δηλωθεί ακόμα περιοχές εξυπηρέτησης.',
    areasMicro: 'Δεν βλέπετε την περιοχή σας; Στείλτε αίτημα και θα ελέγξουμε αν μπορεί να σας εξυπηρετήσει.',

    availTitle: 'Διαθεσιμότητα',
    availLoading: 'Φόρτωση ωρών...',
    availNextLabel: 'Πρώτη διαθέσιμη ώρα',
    availPickPrompt: 'Επιλέξτε ώρα και ο θεραπευτής την επιβεβαιώνει.',
    availMoreDays: (n) => `+ ${n} ${n === 1 ? 'ακόμα ημέρα' : 'ακόμα ημέρες'} με διαθέσιμες ώρες`,
    availMoreTimes: (n) => `+${n}`,
    availEmpty: 'Ο θεραπευτής δεν έχει ανοιχτές ώρες αυτή τη στιγμή. Στείλτε αίτημα και θα επικοινωνήσουμε μαζί του για να βρεθεί ώρα.',
    availSeeAll: 'Δείτε όλες τις ώρες',
    today: 'Σήμερα',
    tomorrow: 'Αύριο',

    reviewsTitle: 'Αξιολογήσεις ασθενών',
    reviewsBasedOn: (n) => `Βάσει ${n} ${n === 1 ? 'αξιολόγησης' : 'αξιολογήσεων'} από ολοκληρωμένες συνεδρίες`,
    reviewsEmpty: 'Δεν υπάρχουν ακόμα αξιολογήσεις. Οι αξιολογήσεις εμφανίζονται μετά από ολοκληρωμένες συνεδρίες.',
    faqTitle: 'Συχνές ερωτήσεις',
    faqs: [
      { q: 'Έρχεται με εξοπλισμό;', a: 'Ο φυσιοθεραπευτής φέρνει τον απαραίτητο βασικό εξοπλισμό για τη συνεδρία, ανάλογα με την περίπτωση.' },
      { q: 'Πώς πληρώνω;', a: 'Πληρώνετε τον θεραπευτή απευθείας σε μετρητά μετά τη συνεδρία. Η πλατφόρμα δεν σας χρεώνει τίποτα.' },
      { q: 'Μπορώ να αλλάξω ώρα;', a: 'Ναι. Μπορείτε να ζητήσετε αλλαγή ώρας μέσα από τον πίνακά σας και ο θεραπευτής την εγκρίνει.' },
      { q: 'Χρειάζομαι παραπεμπτικό;', a: 'Στις περισσότερες περιπτώσεις όχι. Για συγκεκριμένα περιστατικά ή μετεγχειρητικά μπορεί να ζητηθούν ιατρικές οδηγίες.' },
      { q: 'Πώς γίνεται η πρώτη συνεδρία;', a: 'Ο θεραπευτής αξιολογεί την κατάσταση, συζητά το ιστορικό σας και προτείνει πλάνο θεραπείας.' },
    ],
    bookTitle: (n) => `Κλείστε ραντεβού με ${n}`,
    from: 'Από',
    areaLabel: 'Περιοχή εξυπηρέτησης',
    bookCta: 'Κλείσε ραντεβού',
    bookMicro: [
      'Στέλνετε αίτημα — ο θεραπευτής το επιβεβαιώνει.',
      'Πληρώνετε σε μετρητά μετά τη συνεδρία.',
      'Η ακριβής σας διεύθυνση δεν εμφανίζεται δημόσια.',
    ],
    notFound: 'Ο θεραπευτής δεν βρέθηκε ή δεν είναι διαθέσιμος.',
    backToList: 'Πίσω στους θεραπευτές',
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbList: 'Therapists',
    verified: 'Profile vetted by PhysioHome',
    verifiedSession: 'From a verified session',
    chipLicense: 'License verified',
    chipFullProfile: 'Complete profile',
    chipReviews: (n) => `${n} patient ${n === 1 ? 'review' : 'reviews'}`,
    chipResponse: (h) => `Usually replies within ${h}h`,
    perSession: 'session',
    yearsExp: 'years of experience',
    aboutTitle: 'About the therapist',
    aboutEmpty: 'The therapist has not added a detailed bio yet.',
    specialtiesTitle: 'Cases they take on',
    specialtiesEmpty: 'No specific cases have been listed yet.',
    experienceTitle: 'Professional experience',
    experienceEmpty: 'No experience has been listed yet.',
    experienceLine: (y) => `${y} years of experience in physiotherapy.`,
    educationTitle: 'Education & certifications',
    educationEmpty: 'No additional certifications have been added.',
    degreeDefault: 'Physiotherapy Degree',
    classOf: 'Class of',
    licenseNote: 'Professional license verified by the PhysioHome team.',
    licensePending: 'The professional license has not been verified by our team yet.',
    areasTitle: 'Service areas',
    areasEmpty: 'No service areas have been listed yet.',
    areasMicro: "Don't see your area? Send a request and we'll check if the therapist can serve you.",

    availTitle: 'Availability',
    availLoading: 'Loading times...',
    availNextLabel: 'First available time',
    availPickPrompt: 'Pick a time and the therapist confirms it.',
    availMoreDays: (n) => `+ ${n} more ${n === 1 ? 'day' : 'days'} with open times`,
    availMoreTimes: (n) => `+${n}`,
    availEmpty: 'This therapist has no open times right now. Send a request and we will reach out to arrange one.',
    availSeeAll: 'See all times',
    today: 'Today',
    tomorrow: 'Tomorrow',

    reviewsTitle: 'Patient reviews',
    reviewsBasedOn: (n) => `Based on ${n} ${n === 1 ? 'review' : 'reviews'} from completed sessions`,
    reviewsEmpty: 'No reviews yet. Reviews appear after completed sessions.',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Do they bring equipment?', a: 'The physiotherapist brings the necessary basic equipment for the session, depending on the case.' },
      { q: 'How do I pay?', a: 'You pay the therapist directly in cash after the session. The platform charges you nothing.' },
      { q: 'Can I change the time?', a: 'Yes. You can request a time change from your dashboard and the therapist approves it.' },
      { q: 'Do I need a referral?', a: 'In most cases no. For certain cases or post-surgical situations medical guidance may be requested.' },
      { q: 'How does the first session work?', a: 'The therapist assesses your condition, discusses your history and proposes a treatment plan.' },
    ],
    bookTitle: (n) => `Book an appointment with ${n}`,
    from: 'From',
    areaLabel: 'Service area',
    bookCta: 'Book an appointment',
    bookMicro: [
      'You send a request — the therapist confirms it.',
      'You pay in cash after the session.',
      'Your exact address is never shown publicly.',
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

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function TherapistProfilePage() {
  const { lang } = useLang();
  const tx = TX[lang];
  const loc = LOCALE[lang] || LOCALE.el;
  const params = useParams();
  const id = params?.id;

  const [therapist, setTherapist] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);

      // ΠΗΓΗ: v_public_therapists — ΟΧΙ therapist_profiles.
      // Ούτε το ΑΦΜ ούτε το IBAN ούτε η άδεια φτάνουν στον browser.
      const { data: th } = await supabase
        .from('v_public_therapists')
        .select('*')
        .eq('id', id)
        .eq('is_publicly_visible', true)
        .single();

      if (!th) { setTherapist(null); setLoading(false); setLoadingSlots(false); return; }

      const { data: rv } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('therapist_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      const reviewsData = rv || [];

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

      // Δείκτης ενδιαφέροντος: πόσοι βλέπουν προφίλ σε σχέση με πόσοι
      // κλείνουν. Αν πολλοί βλέπουν και λίγοι κλείνουν, το πρόβλημα
      // είναι στο προφίλ ή στην τιμή, όχι στη διαφήμιση.
      captureUtm();
      track(EV.THERAPIST_PROFILE_VIEWED, {
        therapist_id: th.id,
        price: Number(th.price_per_session) || 0,
        verified: !!th.license_verified,
        rating: avg || 0,
      });
      setReviews(reviewsData);
      setConditions(conditionNames);
      setLoading(false);
    })();
  }, [id, lang]);

  // ── ΔΙΑΘΕΣΙΜΟΤΗΤΑ ──
  // Η σελίδα έλεγε «η ώρα ορίζεται μετά την αποστολή αιτήματος» και δεν
  // έδειχνε τίποτα. Ο ασθενής όμως αποφασίζει με βάση το ΠΟΤΕ.
  // Το availability_slots είναι δημόσιο και ήδη γεμάτο από το εβδομαδιαίο
  // πρόγραμμα του θεραπευτή — απλά δεν το διαβάζαμε.
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingSlots(true);
      const end = new Date();
      end.setDate(end.getDate() + 21);
      const { data } = await supabase
        .from('availability_slots')
        .select('date, start_time')
        .eq('therapist_id', id)
        .eq('is_blocked', false)
        .gte('date', todayISO())
        .lte('date', end.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      // Μόνο ώρες που είναι ακόμα κρατήσιμες — ο έλεγχος `date >= σήμερα`
      // του query είναι έλεγχος ημέρας, όχι ώρας.
      setSlots(filterBookableSlots(data));
      setLoadingSlots(false);
    })();
  }, [id]);

  const slotDays = useMemo(() => {
    const map = new Map();
    slots.forEach(s => {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s.start_time);
    });
    return Array.from(map.entries()).map(([date, times]) => ({ date, times }));
  }, [slots]);

  function dayLabel(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T12:00:00'); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    if (diff === 0) return tx.today;
    if (diff === 1) return tx.tomorrow;
    const d = new Date(dateStr + 'T12:00:00');
    return `${DAYS_SHORT[lang][d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const firstName = therapist?.name ? therapist.name.split(' ')[0] : '';

  // Το link περνάει το ID, όχι το όνομα. Παλιά έστελνε ?therapist=<όνομα>,
  // που ο οδηγός κράτησης δεν διάβαζε ποτέ — ο ασθενής έφτανε σε κενή
  // φόρμα και έπρεπε να ξαναβρεί τον θεραπευτή από την αρχή.
  const bookHref = therapist
    ? `/dashboard/patient/new-request?therapist=${encodeURIComponent(therapist.id)}`
    : '/dashboard/patient/new-request';

  // Οι περιοχές εξυπηρέτησης ζουν στο service_areas (jsonb array).
  // Το `area` είναι μόνο η ΕΔΡΑ. Παλιά δείχναμε μόνο την έδρα, οπότε
  // θεραπευτής με 8 δηλωμένες περιοχές φαινόταν να καλύπτει μία.
  const areaList = useMemo(() => {
    if (!therapist) return [];
    const declared = Array.isArray(therapist.service_areas) ? therapist.service_areas.filter(Boolean) : [];
    if (declared.length > 0) return declared;
    return therapist.area ? String(therapist.area).split(',').map(a => a.trim()).filter(Boolean) : [];
  }, [therapist]);

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    n: reviews.filter(r => Math.round(r.rating) === star).length,
  }));
  const maxDist = Math.max(1, ...dist.map(d => d.n));

  // Structured data — αυτή η σελίδα είναι το landing page των διαφημίσεων.
  const jsonLd = useMemo(() => {
    if (!therapist) return null;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Physician',
      medicalSpecialty: 'Physiotherapy',
      name: therapist.name,
      description: therapist.bio || undefined,
      image: therapist.photo_url || undefined,
      areaServed: areaList.length > 0 ? areaList : undefined,
availableService: {
        '@type': 'MedicalTherapy',
        name: therapist.specialty || 'Physiotherapy',
      },
    };
    if (therapist.review_count > 0) {
      data.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(therapist.avg_rating).toFixed(1),
        reviewCount: therapist.review_count,
        bestRating: 5,
        worstRating: 1,
      };
    }
    return JSON.stringify(data);
  }, [therapist, areaList]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }
        .prof-layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: 32px; align-items: start; }
        @media (max-width: 900px) { .prof-layout { grid-template-columns: 1fr; } .prof-book { position: static !important; } }
        .trust-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .trust-chip { background: #f8fafb; color: #1a2e44; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; }
        .trust-chip-green { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .trust-chip-blue { background: #e8f1fd; color: #2a6fdb; border-color: #c8dff9; }
        .breadcrumb { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #94a3b8; flex-wrap: wrap; }
        .slot-pill { background: #f0f7ff; border: 1px solid #d8e6fb; color: #2a6fdb; border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
      `}</style>

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      )}

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
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="breadcrumb">
                <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>{tx.breadcrumbHome}</a>
                <ChevronRight size={13} />
                <a href="/therapists" style={{ color: '#94a3b8', textDecoration: 'none' }}>{tx.breadcrumbList}</a>
                <ChevronRight size={13} />
                <span style={{ color: '#1a2e44', fontWeight: 600 }}>{therapist.name}</span>
              </div>
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
                              <MapPin size={15} color="#94a3b8" />
                              {areaList.slice(0, 3).join(', ')}
                              {areaList.length > 3 ? ` +${areaList.length - 3}` : ''}
                            </span>
                          )}
                          {therapist.years_experience ? <span>{therapist.years_experience} {tx.yearsExp}</span> : null}
                          {therapist.price_per_session ? <span style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.from} {therapist.price_per_session}€/{tx.perSession}</span> : null}
                        </div>
                      </div>
                    </div>

                    {/* Trust chips — ΠΡΑΓΜΑΤΙΚΑ δεδομένα.
                        Το "Ελεγμένο προφίλ" εμφανίζεται μόνο αν η άδεια
                        έχει όντως ελεγχθεί — όχι επειδή φαίνεται η σελίδα. */}
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                      {/* ΕΝΑ badge αντί για δύο.
                          Υπήρχαν «Ελεγμένο προφίλ» και chip «Επαληθευμένη άδεια»
                          δίπλα-δίπλα, που έλεγαν σχεδόν το ίδιο με διαφορετικά
                          λόγια. Τώρα λέει ακριβώς τι εγγυάται η πλατφόρμα. */}
                      {therapist.license_verified && (
                        <div style={{ marginBottom: 12 }}>
                          <VerifiedBadge lang={lang} size="md" />
                        </div>
                      )}
                      <div className="trust-chips">
                        {therapist.education_school && (
                          <span className="trust-chip">
                            {therapist.education_school}
                            {therapist.education_year ? ` · ${therapist.education_year}` : ''}
                          </span>
                        )}
                        {therapist.years_experience > 0 && (
                          <span className="trust-chip">{therapist.years_experience} {tx.yearsExp}</span>
                        )}
                        {therapist.review_count > 0 && (
                          <span className="trust-chip">{tx.chipReviews(therapist.review_count)}</span>
                        )}
                        {therapist.is_profile_full && (
                          <span className="trust-chip trust-chip-blue">{tx.chipFullProfile}</span>
                        )}
                        {therapist.response_time_hours > 0 && (
                          <span className="trust-chip">{tx.chipResponse(therapist.response_time_hours)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Availability — ΠΡΑΓΜΑΤΙΚΕΣ ώρες */}
                  <Section title={tx.availTitle}>
                    {loadingSlots ? (
                      <EmptyText>{tx.availLoading}</EmptyText>
                    ) : slotDays.length === 0 ? (
                      <EmptyText>{tx.availEmpty}</EmptyText>
                    ) : (
                      <>
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <CalendarCheck size={17} color="#15803D" strokeWidth={2.1} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            {tx.availNextLabel}
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>
                            {dayLabel(slotDays[0].date)} · {slotDays[0].times[0]?.slice(0, 5)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {slotDays.slice(0, 4).map(day => (
                            <div key={day.date} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', minWidth: 74 }}>
                                {dayLabel(day.date)}
                              </span>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {day.times.slice(0, 5).map(t => (
                                  <span key={t} className="slot-pill">{t.slice(0, 5)}</span>
                                ))}
                                {day.times.length > 5 && (
                                  <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>
                                    {tx.availMoreTimes(day.times.length - 5)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {slotDays.length > 4 && (
                          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 14 }}>
                            {tx.availMoreDays(slotDays.length - 4)}
                          </div>
                        )}

                        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: '#6b7a8d', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={14} color="#94a3b8" />
                            {tx.availPickPrompt}
                          </span>
                          <a href={bookHref} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eaf2fc', color: '#2a6fdb', border: '1px solid #c8dff9', padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                            {tx.availSeeAll}
                            <ArrowRight size={14} />
                          </a>
                        </div>
                      </>
                    )}
                  </Section>

                  {/* About */}
                  <Section title={tx.aboutTitle}>
                    {therapist.bio && therapist.bio.trim().length > 3
                      ? <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{therapist.bio}</p>
                      : <EmptyText>{tx.aboutEmpty}</EmptyText>}
                  </Section>

                  {/* Conditions */}
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

                  {/* Education */}
                  <Section title={tx.educationTitle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {therapist.education_school && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: '#f0f7ff', border: '1px solid #d8e6fb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <GraduationCap size={18} color="#2a6fdb" strokeWidth={2} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a2e44' }}>
                              {therapist.education_degree || tx.degreeDefault}
                            </div>
                            <div style={{ fontSize: 14, color: '#6b7a8d', marginTop: 2 }}>
                              {therapist.education_school}
                              {therapist.education_year ? ` · ${tx.classOf} ${therapist.education_year}` : ''}
                            </div>
                          </div>
                        </div>
                      )}

                      {therapist.license_verified ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '12px 16px', background: '#f0fdf4',
                          border: '1px solid #bbf7d0', borderRadius: 12,
                        }}>
                          <ShieldCheck size={16} color="#15803d" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500, lineHeight: 1.5 }}>
                            {tx.licenseNote}
                          </span>
                        </div>
                      ) : (
                        <EmptyText>{tx.licensePending}</EmptyText>
                      )}

                      {!therapist.education_school && !therapist.license_verified && (
                        <EmptyText>{tx.educationEmpty}</EmptyText>
                      )}
                    </div>
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
                        {/* Ουδέτερο φόντο. Το κίτρινο έκανε κάθε θετική
                            αξιολόγηση να μοιάζει με προειδοποίηση. */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {reviews.map(rv => (
                            <div key={rv.id} style={{ background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                                <RatingDisplay rating={rv.rating} count={1} variant="stars-only" size={14} />
                                {/* Κάθε αξιολόγηση προέρχεται πλέον από
                                    ολοκληρωμένη συνεδρία — το επιβάλλει η RLS. */}
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                  <ShieldCheck size={11} strokeWidth={2.4} />
                                  {tx.verifiedSession}
                                </span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                  {new Date(rv.created_at).toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              {rv.comment && <p style={{ fontSize: 14, color: '#475569', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>{rv.comment}</p>}
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

                    {!loadingSlots && slotDays.length > 0 && (
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '11px 14px', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                          {tx.availNextLabel}
                        </div>
                        <div style={{ fontSize: 14, color: '#166534', fontWeight: 700 }}>
                          {dayLabel(slotDays[0].date)} · {slotDays[0].times[0]?.slice(0, 5)}
                        </div>
                      </div>
                    )}

                    {areaList.length > 0 && (
                      <div style={{ background: '#f8fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{tx.areaLabel}</div>
                        <div style={{ fontSize: 13, color: '#1a2e44', fontWeight: 600, lineHeight: 1.5 }}>{areaList.join(', ')}</div>
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