'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import RatingDisplay from '../../components/RatingDisplay';
import ConditionSearch from '../../components/ConditionSearch';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import VerifiedBadge from '@/components/VerifiedBadge';
import { filterBookableSlots } from '@/lib/slots';
import { Search, MapPin, Star, SlidersHorizontal, X, Check, ArrowRight, Stethoscope, Users, ChevronDown, ChevronUp, Lightbulb, BadgeCheck, ShieldCheck, Info, CalendarCheck, Briefcase } from 'lucide-react';

const DAYS_SHORT = {
  el: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const TX = {
  el: {
    badge: 'Βρείτε τον ιδανικό',
    hero: 'Οι', heroEm: 'Φυσιοθεραπευτές', heroEnd: 'μας',
    heroDesc: 'Έμπειροι, αδειοδοτημένοι επαγγελματίες, που παρέχουν εξατομικευμένη φροντίδα στο σπίτι σας.',
    bookCta: 'Κλείσε ραντεβού',
    viewProfile: 'Δείτε Προφίλ',
    noTherapists: 'Δεν υπάρχουν ενεργοί θεραπευτές ακόμα.',
    noResults: 'Δεν βρέθηκαν θεραπευτές με αυτά τα φίλτρα.',
    filters: 'Φίλτρα',
    searchPh: 'Αναζήτηση με όνομα ή ειδικότητα...',
    allAreas: 'Όλες οι περιοχές',
    allSpecialties: 'Όλες οι ειδικότητες',
    priceRange: 'Εύρος τιμής',
    verifiedLicense: 'Ελεγμένη άδεια',
    fullProfile: 'Πλήρες προφίλ',
    featured: 'Προτεινόμενος',
    sortNewest: 'Προτεινόμενη σειρά',
    sortRatingDesc: 'Υψηλότερη βαθμολογία',
    sortPriceAsc: 'Τιμή: χαμηλή προς υψηλή',
    sortPriceDesc: 'Τιμή: υψηλή προς χαμηλή',
    sortExpDesc: 'Περισσότερη εμπειρία',
    sortSoonest: 'Συντομότερη διαθεσιμότητα',
    sortRelevance: 'Σχετικότητα',
    clearFilters: 'Καθαρισμός φίλτρων',
    resultsCount: (n) => `${n} ${n === 1 ? 'θεραπευτής' : 'θεραπευτές'}`,
    rankingNote: 'Η προτεινόμενη σειρά επηρεάζεται από το συνδρομητικό πλάνο του θεραπευτή. Για καθαρά αντικειμενική κατάταξη, επιλέξτε ταξινόμηση κατά βαθμολογία.',
    notFoundTitle: 'Δεν βρίσκετε αυτό που ψάχνετε;',
    notFoundDesc: 'Συμπληρώστε το αίτημά σας και θα σας προτείνουμε τους κατάλληλους θεραπευτές.',
    notFoundBtn: 'Στείλτε αίτημα',
    becomeBanner: 'Είσαι φυσιοθεραπευτής;',
    becomeBannerDesc: 'Γίνε μέλος του δικτύου μας.',
    becomeBannerBtn: 'Μάθε περισσότερα',
    findHelpTitle: 'Τι σας ταλαιπωρεί;',
    findHelpDesc: 'Περιγράψτε το πρόβλημά σας και θα σας βρούμε τον κατάλληλο θεραπευτή.',
    matchedExact: 'Εξειδικεύεται',
    matchedSpecialty: 'Σχετική ειδικότητα',
    crossLinkText: 'Δεν είστε σίγουροι ποιον χρειάζεστε;',
    crossLinkBtn: 'Δείτε κατά πάθηση',
    perSession: 'συνεδρία',
    yearsShort: (n) => `${n} χρ. εμπειρία`,
    nextFree: 'Πρώτη ώρα',
    noFreeSlots: 'Χωρίς ανοιχτές ώρες',
    today: 'Σήμερα',
    tomorrow: 'Αύριο',
  },
  en: {
    badge: 'Find your',
    hero: 'Our', heroEm: 'Physiotherapists', heroEnd: '',
    heroDesc: 'Experienced, licensed professionals providing personalized care at your home.',
    bookCta: 'Book an appointment',
    viewProfile: 'View Profile',
    noTherapists: 'No active therapists yet.',
    noResults: 'No therapists match these filters.',
    filters: 'Filters',
    searchPh: 'Search by name or specialty...',
    allAreas: 'All areas',
    allSpecialties: 'All specialties',
    priceRange: 'Price range',
    verifiedLicense: 'Verified license',
    fullProfile: 'Complete profile',
    featured: 'Featured',
    sortNewest: 'Recommended order',
    sortRatingDesc: 'Highest rated',
    sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low',
    sortExpDesc: 'Most experienced',
    sortSoonest: 'Soonest available',
    sortRelevance: 'Relevance',
    clearFilters: 'Clear filters',
    resultsCount: (n) => `${n} ${n === 1 ? 'therapist' : 'therapists'}`,
    rankingNote: "Recommended order is influenced by the therapist's subscription plan. For a purely objective ranking, sort by rating.",
    notFoundTitle: "Can't find what you're looking for?",
    notFoundDesc: "Submit a request and we'll recommend therapists for you.",
    notFoundBtn: 'Send a request',
    becomeBanner: 'Are you a physiotherapist?',
    becomeBannerDesc: 'Join our network.',
    becomeBannerBtn: 'Learn more',
    findHelpTitle: 'What is troubling you?',
    findHelpDesc: 'Describe your problem and we will find the right therapist for you.',
    matchedExact: 'Specialized',
    matchedSpecialty: 'Related specialty',
    crossLinkText: 'Not sure who you need?',
    crossLinkBtn: 'Browse by condition',
    perSession: 'session',
    yearsShort: (n) => `${n} yrs experience`,
    nextFree: 'Next slot',
    noFreeSlots: 'No open times',
    today: 'Today',
    tomorrow: 'Tomorrow',
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

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// Όλες οι περιοχές που δηλώνει ο θεραπευτής: το service_areas (jsonb)
// είναι η πραγματική λίστα, το `area` μόνο η έδρα του.
function allAreasOf(t) {
  const declared = Array.isArray(t.service_areas) ? t.service_areas.filter(Boolean) : [];
  if (declared.length > 0) return declared;
  return t.area ? [t.area] : [];
}

export default function TherapistsPage() {
  const { lang } = useLang();
  const tx = TX[lang];
  const searchParams = useSearchParams();

  const [therapists, setTherapists] = useState([]);
  const [therapistConditionsMap, setTherapistConditionsMap] = useState({});
  const [loadingTherapists, setLoadingTherapists] = useState(true);

  const [selectedCondition, setSelectedCondition] = useState(null);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState(null);
  const [filterMaxPrice, setFilterMaxPrice] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Το πλάτος διαβαζόταν κατευθείαν μέσα στο render με window.innerWidth.
  // Στον server δεν υπάρχει window, οπότε το markup του server και του
  // browser διέφεραν (hydration mismatch) και τα φίλτρα «πηδούσαν».
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const conditionSlug = searchParams.get('condition');
    if (!conditionSlug) return;

    (async () => {
      const { data } = await supabase
        .from('conditions')
        .select('id, slug, name_el, name_en, related_specialties')
        .eq('slug', conditionSlug)
        .eq('is_active', true)
        .single();
      if (data) {
        setSelectedCondition({
          id: data.id,
          slug: data.slug,
          name: lang === 'el' ? data.name_el : data.name_en,
          related_specialties: data.related_specialties || [],
        });
      }
    })();
  }, [searchParams, lang]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (selectedCondition) {
      url.searchParams.set('condition', selectedCondition.slug);
    } else {
      url.searchParams.delete('condition');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedCondition]);

  useEffect(() => {
    if (selectedCondition && sortBy === 'newest') {
      setSortBy('relevance');
    } else if (!selectedCondition && sortBy === 'relevance') {
      setSortBy('newest');
    }
  }, [selectedCondition]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTherapists(); }, []);

  async function fetchTherapists() {
    const timeoutId = setTimeout(() => setLoadingTherapists(false), 8000);
    try {
      // ΠΗΓΗ: v_public_therapists — ΟΧΙ therapist_profiles.
      // Το view εκθέτει ΜΟΝΟ δημόσια πεδία και υπολογίζει το
      // is_publicly_visible λαμβάνοντας υπόψη και το admin override.
      const { data: ths, error } = await supabase
        .from('v_public_therapists')
        .select('*')
        .eq('is_publicly_visible', true)
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);

      if (error || !ths) {
        console.error('Therapists fetch error:', error);
        setTherapists([]);
        setLoadingTherapists(false);
        return;
      }

      const therapistIds = ths.map(t => t.id);
      let ratingsMap = {};
      let conditionsMap = {};
      let rankMap = {};
      let slotMap = {};

      if (therapistIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('therapist_id, rating')
          .eq('is_published', true)
          .in('therapist_id', therapistIds);
        if (reviewsData) {
          reviewsData.forEach(rv => {
            if (!ratingsMap[rv.therapist_id]) ratingsMap[rv.therapist_id] = { sum: 0, count: 0 };
            ratingsMap[rv.therapist_id].sum += rv.rating;
            ratingsMap[rv.therapist_id].count += 1;
          });
        }

        const { data: tcData } = await supabase
          .from('therapist_conditions')
          .select('therapist_id, condition_id')
          .in('therapist_id', therapistIds);
        if (tcData) {
          tcData.forEach(tc => {
            if (!conditionsMap[tc.therapist_id]) conditionsMap[tc.therapist_id] = [];
            conditionsMap[tc.therapist_id].push(tc.condition_id);
          });
        }

        // Βάρος κατάταξης από τη συνδρομή.
        // Ρυθμίζεται ανά πλάνο από το admin: 0 = ουδέτερο, 200 = πάντα πρώτοι.
        const { data: rankData } = await supabase
          .from('v_therapist_ranking')
          .select('therapist_id, rank_weight, featured_listing')
          .in('therapist_id', therapistIds);
        if (rankData) {
          rankData.forEach(r => {
            rankMap[r.therapist_id] = {
              rank_weight: Number(r.rank_weight) || 0,
              featured: !!r.featured_listing,
            };
          });
        }

        // ΠΡΩΤΗ ΔΙΑΘΕΣΙΜΗ ΩΡΑ.
        // Το «πότε μπορεί να με δει» είναι από τα πρώτα που ρωτάει ο
        // ασθενής και η κάρτα δεν το έλεγε πουθενά.
        const horizon = new Date();
        horizon.setDate(horizon.getDate() + 21);
        const { data: slotData } = await supabase
          .from('availability_slots')
          .select('therapist_id, date, start_time')
          .eq('is_blocked', false)
          .gte('date', todayISO())
          .lte('date', horizon.toISOString().split('T')[0])
          .in('therapist_id', therapistIds)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        if (slotData) {
          // Οι περασμένες ώρες της σημερινής μέρας δεν μετράνε ούτε ως
          // «πρώτη ελεύθερη ώρα» ούτε στο σύνολο.
          filterBookableSlots(slotData).forEach(s => {
            if (!slotMap[s.therapist_id]) {
              slotMap[s.therapist_id] = { next: { date: s.date, start_time: s.start_time }, count: 0 };
            }
            slotMap[s.therapist_id].count += 1;
          });
        }
      }

      const enriched = ths.map(t => {
        const stats = ratingsMap[t.id];
        const rank = rankMap[t.id];
        const sl = slotMap[t.id];
        return {
          ...t,
          avg_rating: stats ? stats.sum / stats.count : 0,
          review_count: stats ? stats.count : 0,
          rank_weight: rank ? rank.rank_weight : 0,
          featured: rank ? rank.featured : false,
          next_slot: sl ? sl.next : null,
          free_slots: sl ? sl.count : 0,
        };
      });
      setTherapists(enriched);
      setTherapistConditionsMap(conditionsMap);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Therapists fetch failed:', err);
      setTherapists([]);
    }
    setLoadingTherapists(false);
  }

  function slotLabel(slot) {
    if (!slot) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(slot.date + 'T12:00:00'); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    const time = slot.start_time?.slice(0, 5);
    if (diff === 0) return `${tx.today} ${time}`;
    if (diff === 1) return `${tx.tomorrow} ${time}`;
    const d = new Date(slot.date + 'T12:00:00');
    return `${DAYS_SHORT[lang][d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${time}`;
  }

  const uniqueAreas = useMemo(() => {
    const set = new Set();
    therapists.forEach(t => allAreasOf(t).forEach(a => set.add(a)));
    return Array.from(set).sort();
  }, [therapists]);

  const uniqueSpecialties = useMemo(() => {
    const set = new Set(therapists.map(t => t.specialty).filter(Boolean));
    return Array.from(set).sort();
  }, [therapists]);

  // Αν κανένα πλάνο δεν δίνει βάρος, δεν έχει νόημα να μιλάμε
  // για «προτεινόμενη σειρά» — η κατάταξη είναι ήδη αντικειμενική.
  const hasPaidRanking = useMemo(
    () => therapists.some(t => (t.rank_weight || 0) > 0),
    [therapists]
  );

  const priceRange = useMemo(() => {
    const prices = therapists
      .map(t => Number(t.price_per_session))
      .filter(p => Number.isFinite(p) && p > 0);
    if (prices.length === 0) return { min: 25, max: 50 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [therapists]);

  useEffect(() => {
    if (filterMinPrice === null && priceRange.min < priceRange.max) {
      setFilterMinPrice(priceRange.min);
      setFilterMaxPrice(priceRange.max);
    }
  }, [priceRange, filterMinPrice]);

  function getMatchType(therapist) {
    if (!selectedCondition) return null;

    const therapistConditionIds = therapistConditionsMap[therapist.id] || [];
    const hasExactTag = therapistConditionIds.includes(selectedCondition.id);

    if (hasExactTag) return 'exact';

    const relatedSpecs = selectedCondition.related_specialties || [];
    const therapistSpec = (therapist.specialty || '').toLowerCase();
    const hasSpecialtyMatch = relatedSpecs.some(
      (rs) => therapistSpec.includes((rs || '').toLowerCase()) || (rs || '').toLowerCase().includes(therapistSpec)
    );

    if (hasSpecialtyMatch) return 'specialty';
    return null;
  }

  const filteredTherapists = useMemo(() => {
    let result = [...therapists];

    if (selectedCondition) {
      const relatedSpecs = (selectedCondition.related_specialties || []).map((s) => (s || '').toLowerCase());
      result = result.filter((t) => {
        const therapistConditionIds = therapistConditionsMap[t.id] || [];
        if (therapistConditionIds.includes(selectedCondition.id)) return true;
        const therapistSpec = (t.specialty || '').toLowerCase();
        return relatedSpecs.some(
          (rs) => therapistSpec.includes(rs) || rs.includes(therapistSpec)
        );
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.specialty || '').toLowerCase().includes(q) ||
        allAreasOf(t).some(a => (a || '').toLowerCase().includes(q))
      );
    }
    // Το φίλτρο περιοχής κοιτάει ΟΛΕΣ τις δηλωμένες περιοχές, όχι μόνο
    // την έδρα. Αλλιώς θεραπευτής με έδρα Νέα Σμύρνη που εξυπηρετεί και
    // Καλλιθέα δεν εμφανιζόταν ποτέ σε αναζήτηση για Καλλιθέα.
    if (filterArea) result = result.filter(t => allAreasOf(t).includes(filterArea));
    if (filterSpecialty) result = result.filter(t => t.specialty === filterSpecialty);
    if (filterMinPrice !== null && filterMaxPrice !== null) {
      result = result.filter(t => {
        const p = Number(t.price_per_session);
        if (!Number.isFinite(p) || p <= 0) return true;
        return p >= filterMinPrice && p <= filterMaxPrice;
      });
    }

    // Τα πλήρη προφίλ ανεβαίνουν: κίνητρο για τον θεραπευτή, ποιότητα για τον ασθενή
    const fullBoost = (a, b) => (b.is_profile_full ? 1 : 0) - (a.is_profile_full ? 1 : 0);

    // Η συνδρομή. Εφαρμόζεται ΜΟΝΟ στην προτεινόμενη σειρά και στη
    // σχετικότητα. Αν ο ασθενής ζητήσει ρητά «υψηλότερη βαθμολογία»
    // ή «φθηνότερος», παίρνει ακριβώς αυτό — χωρίς παρέμβαση.
    const rankBoost = (a, b) => (b.rank_weight || 0) - (a.rank_weight || 0);

    const slotKey = (t) => (t.next_slot ? `${t.next_slot.date}T${t.next_slot.start_time}` : '9999');

    if (sortBy === 'relevance' && selectedCondition) {
      result.sort((a, b) => {
        const aType = getMatchType(a);
        const bType = getMatchType(b);
        const score = (type) => (type === 'exact' ? 2 : type === 'specialty' ? 1 : 0);
        const diff = score(bType) - score(aType);
        if (diff !== 0) return diff;
        const rank = rankBoost(a, b);
        if (rank !== 0) return rank;
        const boost = fullBoost(a, b);
        if (boost !== 0) return boost;
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      });
    } else if (sortBy === 'rating-desc') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sortBy === 'price-asc') result.sort((a, b) => (Number(a.price_per_session) || 0) - (Number(b.price_per_session) || 0));
    else if (sortBy === 'price-desc') result.sort((a, b) => (Number(b.price_per_session) || 0) - (Number(a.price_per_session) || 0));
    else if (sortBy === 'experience-desc') result.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
    else if (sortBy === 'soonest') result.sort((a, b) => slotKey(a).localeCompare(slotKey(b)));
    else {
      result.sort((a, b) =>
        rankBoost(a, b) ||
        fullBoost(a, b) ||
        ((b.avg_rating || 0) - (a.avg_rating || 0)) ||
        (new Date(b.created_at) - new Date(a.created_at))
      );
    }

    return result;
  }, [therapists, therapistConditionsMap, selectedCondition, search, filterArea, filterSpecialty, filterMinPrice, filterMaxPrice, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearFilters() {
    setSelectedCondition(null);
    setSearch('');
    setFilterArea('');
    setFilterSpecialty('');
    setFilterMinPrice(priceRange.min);
    setFilterMaxPrice(priceRange.max);
    setSortBy('newest');
  }

  const hasActiveFilters = selectedCondition || search || filterArea || filterSpecialty
    || (filterMinPrice !== null && filterMinPrice !== priceRange.min)
    || (filterMaxPrice !== null && filterMaxPrice !== priceRange.max)
    || (sortBy !== 'newest' && sortBy !== 'relevance');

  const selectStyle = { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#1a2e44', outline: 'none', background: '#fff', cursor: 'pointer', minWidth: 160 };
  const filterShown = showFilters || isDesktop;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }
        .th-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .th-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .th-grid { grid-template-columns: 1fr; } }
        .th-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; transition: all .3s; cursor: pointer; display: block; text-decoration: none; }
        .th-card:hover { box-shadow: 0 8px 32px rgba(26,46,68,0.12); transform: translateY(-4px); }
        .filters-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        @media (max-width: 768px) { .filters-bar > select, .filters-bar > div { width: 100%; } }
        .toggle-filters-btn { display: none; }
        @media (max-width: 768px) { .toggle-filters-btn { display: inline-flex; } }
        .become-banner { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{tx.badge}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 54px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {tx.hero} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.heroEm}</em> {tx.heroEnd}
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 580, margin: '0 auto 32px' }}>{tx.heroDesc}</p>
          <a href="/dashboard/patient/new-request" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            {tx.bookCta}
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* CROSS-LINK BANNER */}
      <section style={{ background: '#FFFBEB', borderTop: '1px solid #FDE68A', borderBottom: '1px solid #FDE68A', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontSize: 14, fontWeight: 600 }}>
            <Lightbulb size={18} color="#F59E0B" strokeWidth={2} />
            {tx.crossLinkText}
          </div>
          <a href="/find-help" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#92400E', border: '1px solid #FDE68A', padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            {tx.crossLinkBtn}
            <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* CONDITION-BASED SEARCH */}
      <section style={{ background: '#fff', padding: '40px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(22px, 3vw, 32px)', color: '#1a2e44', marginBottom: 8 }}>
              {tx.findHelpTitle}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{tx.findHelpDesc}</p>
          </div>
          <ConditionSearch
            lang={lang}
            value={selectedCondition}
            onChange={setSelectedCondition}
            showChips={true}
          />
        </div>
      </section>

      {/* THERAPISTS + FILTERS */}
      <section style={{ background: '#f8fafb', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {!loadingTherapists && therapists.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} color="#94a3b8" strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={tx.searchPh}
                  style={{ width: '100%', padding: '12px 16px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#1a2e44', outline: 'none' }} />
              </div>

              <button className="toggle-filters-btn" onClick={() => setShowFilters(!showFilters)}
                style={{ width: '100%', padding: '10px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#1a2e44', cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <SlidersHorizontal size={14} />
                {tx.filters}
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <div style={{ display: filterShown ? 'block' : 'none' }}>
                <div className="filters-bar" style={{ marginBottom: 14 }}>
                  <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={selectStyle}>
                    <option value="">{tx.allAreas}</option>
                    {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)} style={selectStyle}>
                    <option value="">{tx.allSpecialties}</option>
                    {uniqueSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
                    {selectedCondition && <option value="relevance">{tx.sortRelevance}</option>}
                    <option value="newest">{tx.sortNewest}</option>
                    <option value="soonest">{tx.sortSoonest}</option>
                    <option value="rating-desc">{tx.sortRatingDesc}</option>
                    <option value="price-asc">{tx.sortPriceAsc}</option>
                    <option value="price-desc">{tx.sortPriceDesc}</option>
                    <option value="experience-desc">{tx.sortExpDesc}</option>
                  </select>
                </div>

                {priceRange.min < priceRange.max && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', marginBottom: 8 }}>
                      {tx.priceRange}: <span style={{ color: '#2a6fdb' }}>{filterMinPrice ?? priceRange.min}€ — {filterMaxPrice ?? priceRange.max}€</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input type="range" min={priceRange.min} max={priceRange.max} value={filterMinPrice ?? priceRange.min}
                        onChange={e => { const val = parseInt(e.target.value); setFilterMinPrice(Math.min(val, filterMaxPrice ?? priceRange.max)); }}
                        style={{ flex: 1, accentColor: '#2a6fdb' }} />
                      <input type="range" min={priceRange.min} max={priceRange.max} value={filterMaxPrice ?? priceRange.max}
                        onChange={e => { const val = parseInt(e.target.value); setFilterMaxPrice(Math.max(val, filterMinPrice ?? priceRange.min)); }}
                        style={{ flex: 1, accentColor: '#2a6fdb' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 13, color: '#6b7a8d', fontWeight: 500 }}>{tx.resultsCount(filteredTherapists.length)}</div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <X size={12} />
                      {tx.clearFilters}
                    </button>
                  )}
                </div>

                {/* Διαφάνεια κατάταξης — υποχρέωση απέναντι στον ασθενή */}
                {hasPaidRanking && (sortBy === 'newest' || sortBy === 'relevance') && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55 }}>
                    <Info size={13} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span>{tx.rankingNote}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRID */}
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
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px dashed #dce6f0' }}>
              <Users size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15 }}>{tx.noTherapists}</div>
            </div>
          ) : filteredTherapists.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px dashed #dce6f0' }}>
              <Search size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, marginBottom: 16 }}>{tx.noResults}</div>
              <button onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#1a2e44', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <X size={14} />
                {tx.clearFilters}
              </button>
            </div>
          ) : (
            <div className="th-grid">
              {filteredTherapists.map(th => {
                const matchType = getMatchType(th);
                const areas = allAreasOf(th);
                const nextLabel = slotLabel(th.next_slot);
                return (
                  <a key={th.id} href={`/therapists/${th.id}`} className="th-card">
                    {matchType && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12,
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.05em',
                        background: matchType === 'exact' ? '#DCFCE7' : '#EFF6FF',
                        color: matchType === 'exact' ? '#15803D' : '#1D4ED8',
                        border: `1px solid ${matchType === 'exact' ? '#86EFAC' : '#BFDBFE'}`,
                      }}>
                        {matchType === 'exact' ? <Check size={10} strokeWidth={3} /> : <Stethoscope size={10} />}
                        {matchType === 'exact' ? tx.matchedExact : tx.matchedSpecialty}
                      </div>
                    )}

                    {th.photo_url ? (
                      <ImgWithSkeleton src={th.photo_url} alt={th.name}
                        containerStyle={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 16 }}
                        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#2a6fdb' }}>
                        {th.name?.charAt(0)}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44' }}>{th.name}</span>
                      {th.is_profile_full && <BadgeCheck size={15} color="#2a6fdb" strokeWidth={2.2} />}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 8 }}>{th.specialty}</div>

                    {/* Trust chips — το license_verified έρχεται από το view.
                        ΔΕΝ το υποθέτουμε: με το admin override μπορεί να
                        εμφανίζεται θεραπευτής χωρίς ελεγμένη άδεια. */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      {/* Ένα κοινό badge, ένα κείμενο σε όλο το site.
                          Εδώ έλεγε «Ελεγμένη άδεια», στην αρχική «Ελεγμένη
                          άδεια», στον οδηγό «Επαληθευμένος» — τρία κείμενα
                          για το ίδιο πράγμα. */}
                      {th.license_verified && <VerifiedBadge lang={lang} compact />}
                      {th.is_profile_full && (
                        <span style={{
                          padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                          background: '#e8f1fd', color: '#2a6fdb', border: '1px solid #c8dff9',
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                        }}>
                          <BadgeCheck size={11} strokeWidth={2.2} />
                          {tx.fullProfile}
                        </span>
                      )}
                      {th.featured && (
                        <span style={{
                          padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                          background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                        }}>
                          <Star size={11} strokeWidth={2.2} />
                          {tx.featured}
                        </span>
                      )}
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <RatingDisplay rating={th.avg_rating} count={th.review_count} lang={lang} variant="compact" size={13} />
                    </div>

                    {/* Κάθε στοιχείο σε δική του γραμμή — το inline-flex τα
                        κολλούσε μεταξύ τους. */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                      {areas.length > 0 && (
                        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={12} style={{ flexShrink: 0 }} />
                          <span>
                            {areas.slice(0, 2).join(', ')}
                            {areas.length > 2 ? ` +${areas.length - 2}` : ''}
                          </span>
                        </div>
                      )}
                      {th.years_experience > 0 && (
                        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Briefcase size={12} style={{ flexShrink: 0 }} />
                          <span>{tx.yearsShort(th.years_experience)}</span>
                        </div>
                      )}

                      {/* Η πρώτη ελεύθερη ώρα. Χωρίς αυτό ο ασθενής έπρεπε
                          να ανοίξει το προφίλ για να μάθει αν είναι καν
                          διαθέσιμος αυτή την εβδομάδα. */}
                      {nextLabel ? (
                        <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CalendarCheck size={12} style={{ flexShrink: 0 }} />
                          <span>{tx.nextFree}: {nextLabel}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CalendarCheck size={12} style={{ flexShrink: 0 }} />
                          <span>{tx.noFreeSlots}</span>
                        </div>
                      )}

                      {th.price_per_session && (
                        <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600, marginTop: 2 }}>
                          {th.price_per_session}€ / {tx.perSession}
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {tx.viewProfile}
                      <ArrowRight size={13} />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* NOT FOUND CTA */}
      {!loadingTherapists && (
        <section style={{ background: '#fff', padding: '60px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, #f0f6ff, #e8f0fb)', border: '1px solid #dce6f0', borderRadius: 20, padding: '40px 32px' }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(22px, 3vw, 28px)', color: '#1a2e44', marginBottom: 10 }}>{tx.notFoundTitle}</h3>
            <p style={{ fontSize: 15, color: '#6b7a8d', marginBottom: 24, lineHeight: 1.6 }}>{tx.notFoundDesc}</p>
            <a href="/dashboard/patient/new-request" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2a6fdb', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              {tx.notFoundBtn}
              <ArrowRight size={16} />
            </a>
          </div>
        </section>
      )}

      {/* BECOME THERAPIST BANNER */}
      <section style={{ background: '#1a2e44', padding: '32px 24px' }}>
        <div className="become-banner" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Stethoscope size={18} color="#fff" />
              {tx.becomeBanner}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{tx.becomeBannerDesc}</div>
          </div>
          <a href="/become-therapist" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
            {tx.becomeBannerBtn}
            <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}