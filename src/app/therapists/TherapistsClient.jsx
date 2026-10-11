'use client';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import RatingDisplay from '../../components/RatingDisplay';
import ConditionSearch from '../../components/ConditionSearch';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { loadTherapistList } from '@/lib/therapistList';
import { compareByRank, weightsFromSettings, DEFAULT_WEIGHTS } from '@/lib/ranking';
import { fetchPublicSettings } from '@/lib/publicSettings';
import { Search, MapPin, Star, SlidersHorizontal, X, Check, ArrowRight, Stethoscope, Users, ChevronDown, ChevronUp, BadgeCheck, Info, CalendarCheck, Briefcase } from 'lucide-react';

const MONTHS_SHORT = {
  el: ['Ιαν','Φεβ','Μαρ','Απρ','Μαΐ','Ιουν','Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

const DAYS_SHORT = {
  el: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const TX = {
  el: {
    badge: 'Επιλέξτε με σιγουριά',
    hero: 'Βρείτε φυσικοθεραπευτή με', heroEm: 'μεγαλύτερη σιγουριά', heroEnd: '',
    heroDesc: 'Δείτε επαγγελματίες που έχουν επαληθεύσει την επαγγελματική τους άδεια, αναλαμβάνουν το περιστατικό σας και εξυπηρετούν την περιοχή σας.',
    trustLine: [
      'Επαληθευμένη επαγγελματική άδεια',
      'Περιστατικά που αναλαμβάνει',
      'Περιοχές εξυπηρέτησης',
      'Τιμή και διαθεσιμότητα',
    ],
    matchTitle: 'Ταιριάζει στην αναζήτησή σας',
    matchCondition: (c) => `Αναλαμβάνει ${c}`,
    matchArea: (a) => `Εξυπηρετεί ${a}`,
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
    rankingNote: 'Εμφανίζονται μόνο θεραπευτές που ταιριάζουν με τα κριτήριά σας. Η προτεινόμενη σειρά συνδυάζει αξιολογήσεις, διαθεσιμότητα, εμπειρία στην πλατφόρμα και το συνδρομητικό πακέτο του θεραπευτή. Για σειρά μόνο κατά βαθμολογία, επιλέξτε «Υψηλότερη βαθμολογία».',
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
    aboutTherapist: 'Σχετικά με τον θεραπευτή',
    visit: 'Επίσκεψη',
    seeCost: 'Δείτε το κόστος',
    fromTime: 'από',
    yearsShort: (n) => `${n} χρ. εμπειρία`,
    nextFree: 'Πρώτη ώρα',
    noFreeSlots: 'Χωρίς ανοιχτές ώρες',
    today: 'Σήμερα',
    tomorrow: 'Αύριο',
  },
  en: {
    badge: 'Choose with confidence',
    hero: 'Find a physiotherapist with', heroEm: 'more confidence', heroEnd: '',
    heroDesc: 'See professionals who have verified their licence, handle your condition and serve your area.',
    trustLine: [
      'Verified professional licence',
      'Conditions they handle',
      'Service areas',
      'Price and availability',
    ],
    matchTitle: 'Matches your search',
    matchCondition: (c) => `Handles ${c}`,
    matchArea: (a) => `Serves ${a}`,
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
    rankingNote: "Only therapists who match your criteria are shown. The recommended order combines reviews, availability, platform experience and the therapist's subscription plan. To sort by rating only, choose “Highest rated”.",
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
    aboutTherapist: 'About the therapist',
    visit: 'Visit',
    seeCost: 'See the cost',
    fromTime: 'from',
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

// Ο server (page.js) στέλνει έτοιμα δεδομένα, ώστε η σελίδα να φτάνει
// γεμάτη — στο Google, στα εργαλεία και στον επισκέπτη πριν φορτώσει η
// JavaScript. Ο browser τα ανανεώνει αμέσως μετά για φρέσκια διαθεσιμότητα.
export default function TherapistsClient({ initialData = null, initialCms = null }) {
  const { lang } = useLang();
  const [cms, setCms] = useState(initialCms);

  // ── ΚΕΙΜΕΝΑ ΑΠΟ ΤΟ ADMIN ──
  // Τα TX είναι προεπιλογή. Ό,τι γράφεται στο admin τα σκεπάζει· ό,τι
  // μένει κενό κρατάει το κείμενο του κώδικα, ώστε μια άδεια βάση ή ένα
  // κατά λάθος άδειασμα να μην αφήσει τη σελίδα χωρίς λόγια.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_content')
        .select('section, content_el, content_en')
        .eq('page', 'therapists');
      if (data?.length) setCms(data);
    })();
  }, []);

  const tx = (() => {
    const base = TX[lang] || TX.el;
    if (!cms) return base;
    const key = lang === 'en' ? 'content_en' : 'content_el';
    const merged = { ...base };
    cms.forEach(row => {
      // Μόνο η ενότητα που υπάρχει πραγματικά στη σελίδα.
      if (row.section !== 'hero') return;
      const c = row[key];
      if (!c || typeof c !== 'object') return;
      Object.entries(c).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') return;
        if (Array.isArray(v) && v.length === 0) return;
        // Έλεγχος τύπου: ένα παλιό string δεν επιτρέπεται να
        // αντικαταστήσει πίνακα — το .map θα έριχνε τη σελίδα.
        const d = base[k];
        if (d !== undefined && Array.isArray(d) !== Array.isArray(v)) return;
        if (typeof d === 'function') return;
        merged[k] = v;
      });
    });
    return merged;
  })();
  const [therapists, setTherapists] = useState(initialData?.therapists || []);
  const [therapistConditionsMap, setTherapistConditionsMap] = useState(initialData?.conditionsMap || {});
  const [loadingTherapists, setLoadingTherapists] = useState(!initialData);

  // Βάρη κατάταξης από το admin (ranking_weight_*). Μέχρι να έρθουν,
  // ισχύουν οι προεπιλογές — ίδιες σε server και browser.
  const [rankWeights, setRankWeights] = useState(DEFAULT_WEIGHTS);
  useEffect(() => {
    fetchPublicSettings().then(({ data }) => { if (data) setRankWeights(weightsFromSettings(data)); });
  }, []);

  // Οι παράμετροι του URL διαβάζονται από το window (όχι με το hook
  // του Next), ώστε η σελίδα να αποδίδεται ολόκληρη στον server.
  const [urlParams, setUrlParams] = useState(null);
  useEffect(() => {
    setUrlParams(new URLSearchParams(window.location.search));
  }, []);

  const [selectedCondition, setSelectedCondition] = useState(null);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [expandedBio, setExpandedBio] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(null);
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

  // ── ΠΕΡΙΟΧΗ ΑΠΟ ΤΟ URL ──
  // Η αρχική στέλνει ?area=Παγκράτι. Χωρίς αυτό, ο επισκέπτης πατούσε
  // περιοχή και έβλεπε ΟΛΟΥΣ τους θεραπευτές — σαν να μην πάτησε τίποτα.
  useEffect(() => {
    const a = urlParams?.get('area');
    if (a) setFilterArea(a);
  }, [urlParams]);

  // ── ΕΛΕΥΘΕΡΗ ΑΝΑΖΗΤΗΣΗ ΑΠΟ ΤΟ URL ──
  // Το ?q= έρχεται από το «Τι σας ταλαιπωρεί;» της αρχικής.
  useEffect(() => {
    const q = urlParams?.get('q');
    if (q) setSearch(q);
  }, [urlParams]);

  useEffect(() => {
    const conditionSlug = urlParams?.get('condition');
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
  }, [urlParams, lang]);

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
    const result = await loadTherapistList();
    clearTimeout(timeoutId);
    if (result) {
      setTherapists(result.therapists);
      setTherapistConditionsMap(result.conditionsMap);
    } else if (!initialData) {
      setTherapists([]);
    }
    setLoadingTherapists(false);
  }

  // Μόνο η μέρα, για τα πλακίδια διαθεσιμότητας. Το «Σήμερα» και το
  // «Αύριο» διαβάζονται πιο γρήγορα από ημερομηνία.
  function dayLabel(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T12:00:00'); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    if (diff === 0) return tx.today;
    if (diff === 1) return tx.tomorrow;
    const d = new Date(dateStr + 'T12:00:00');
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[lang][d.getMonth()]}`;
  }

  // ── ΕΙΝΑΙ ΣΥΝΔΕΔΕΜΕΝΟΣ; ──
  // Το πλήρες προφίλ με τιμές και διαθεσιμότητα είναι για εγγεγραμμένους.
  // Ελέγχουμε ΜΙΑ φορά και κρατάμε την απάντηση, αντί να ρωτάμε σε κάθε
  // κλικ — η καθυστέρηση θα φαινόταν σαν να μην απαντά το κουμπί.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data?.user));
  }, []);

  // Όσο δεν ξέρουμε ακόμα, στέλνουμε στο προφίλ: καλύτερα μια περιττή
  // φόρτωση παρά να διώξουμε συνδεδεμένο χρήστη στη σύνδεση.
  function profileHref(id) {
    return isLoggedIn === false ? '/auth/login' : `/therapists/${id}`;
  }

  // Θυμάται πού πήγαινε, ώστε μετά τη σύνδεση να επιστρέψει εκεί και
  // όχι στον πίνακά του. Ίδιος μηχανισμός με τον οδηγό κράτησης.
  function rememberProfile(id) {
    if (isLoggedIn !== false) return;
    try { localStorage.setItem('pendingRedirect', `/therapists/${id}`); } catch (_) {}
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

    const relatedSpecs = (selectedCondition.related_specialties || []).map((rs) => (rs || '').trim().toLowerCase()).filter(Boolean);
    const therapistSpec = (therapist.specialty || '').trim().toLowerCase();
    // Κενή ειδικότητα δεν ταιριάζει με τίποτα (πριν ταίριαζε με όλα).
    const hasSpecialtyMatch = !!therapistSpec && relatedSpecs.some(
      (rs) => therapistSpec.includes(rs) || rs.includes(therapistSpec)
    );

    if (hasSpecialtyMatch) return 'specialty';
    return null;
  }

  const filteredTherapists = useMemo(() => {
    let result = [...therapists];

    if (selectedCondition) {
      // ΣΤΑΔΙΟ 1 της κατάταξης: μένουν ΜΟΝΟ όσοι ταιριάζουν.
      result = result.filter((t) => getMatchType(t) !== null);
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

    // ΣΤΑΔΙΟ 2: βαθμολογία (αξιολογήσεις, συνδρομή, διαθεσιμότητα,
    // εμπειρία) — βλ. lib/ranking.js. Εφαρμόζεται ΜΟΝΟ στην προτεινόμενη
    // σειρά και στη σχετικότητα. Αν ο ασθενής ζητήσει ρητά «υψηλότερη
    // βαθμολογία» ή «φθηνότερος», παίρνει ακριβώς αυτό.
    const byRank = compareByRank(rankWeights);

    const slotKey = (t) => (t.next_slot ? `${t.next_slot.date}T${t.next_slot.start_time}` : '9999');

    if (sortBy === 'relevance' && selectedCondition) {
      result.sort((a, b) => {
        const aType = getMatchType(a);
        const bType = getMatchType(b);
        const score = (type) => (type === 'exact' ? 2 : type === 'specialty' ? 1 : 0);
        // Όσοι δήλωσαν ρητά την πάθηση πριν από όσους ταιριάζουν μόνο
        // στην ειδικότητα· μέσα σε κάθε ομάδα, η βαθμολογία κατάταξης.
        const diff = score(bType) - score(aType);
        if (diff !== 0) return diff;
        return byRank(a, b);
      });
    } else if (sortBy === 'rating-desc') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sortBy === 'price-asc') result.sort((a, b) => (Number(a.price_per_session) || 0) - (Number(b.price_per_session) || 0));
    else if (sortBy === 'price-desc') result.sort((a, b) => (Number(b.price_per_session) || 0) - (Number(a.price_per_session) || 0));
    else if (sortBy === 'experience-desc') result.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
    else if (sortBy === 'soonest') result.sort((a, b) => slotKey(a).localeCompare(slotKey(b)));
    else {
      result.sort(byRank);
    }

    return result;
  }, [therapists, therapistConditionsMap, selectedCondition, search, filterArea, filterSpecialty, filterMinPrice, filterMaxPrice, sortBy, rankWeights]); // eslint-disable-line react-hooks/exhaustive-deps

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
        /* ΟΡΙΖΟΝΤΙΕΣ ΚΑΡΤΕΣ.
           Σε τρεις στήλες κάθε κάρτα είχε ~350px — δεν χωρούσε ούτε η
           διαθεσιμότητα ούτε το κουμπί. Μία στήλη με χωρισμένη κάρτα
           δίνει χώρο και στα δύο, και ο ασθενής βλέπει «πότε μπορεί»
           χωρίς να ανοίξει το προφίλ. */
        .th-grid { display: flex; flex-direction: column; gap: 18px; }
        .th-card {
          background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
          display: grid; grid-template-columns: minmax(0, 1.15fr) 360px;
          transition: all .25s; overflow: hidden;
        }
        .th-card-main { padding: 20px 22px; min-width: 0; }
        .th-card-side {
          padding: 18px 20px; border-left: 1px solid #f1f5f9;
          background: #fcfdff; display: flex; flex-direction: column;
        }
        .th-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-bottom: 14px; }
        .th-slot {
          border: 1px solid #dce6f0; border-radius: 9px;
          padding: 7px 5px; text-align: center; background: #fff;
        }
        /* Τα εσωτερικά πλαίσια δεν χρειάζεται να φτάνουν ως την άκρη —
           το κείμενο διαβάζεται καλύτερα σε στενότερη στήλη. */
        .th-box { max-width: 560px; }
        @media (max-width: 900px) {
          .th-card { grid-template-columns: 1fr; }
          .th-card-side { border-left: none; border-top: 1px solid #f1f5f9; }
        }
        @media (max-width: 460px) {
          .th-slots { grid-template-columns: repeat(2, 1fr); }
        }

        /* Το σήμα ΠΑΝΩ στη φωτογραφία, όχι ως ξεχωριστό chip από κάτω.
           Έτσι το πρώτο πράγμα που βλέπει ο επισκέπτης είναι το πρόσωπο
           μαζί με την επαλήθευση — δεν χρειάζεται να διαβάσει. */
        .th-avatar { position: relative; display: inline-block; margin-bottom: 12px; }
        .th-avatar-badge {
          position: absolute; right: -2px; bottom: -2px;
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 3px solid #fff; box-sizing: content-box;
        }
        .th-card:hover { box-shadow: 0 8px 32px rgba(26,46,68,0.12); transform: translateY(-4px); }
        .filters-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        @media (max-width: 768px) { .filters-bar > select, .filters-bar > div { width: 100%; } }
        .toggle-filters-btn { display: none; }
        @media (max-width: 768px) { .toggle-filters-btn { display: inline-flex; } }
        .become-banner { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
      `}</style>

      <Navbar />

      {/* ── ΣΥΜΠΑΓΗΣ ΚΕΦΑΛΙΔΑ ──
          Ο επισκέπτης ήρθε εδώ για να ΔΕΙ ΘΕΡΑΠΕΥΤΕΣ. Ένα hero 140
          pixel ύψους τον ανάγκαζε να κυλήσει πριν δει έναν.

          Ο τίτλος μένει — χρειάζεται για SEO και για να ξέρει πού
          βρίσκεται — αλλά μικρός, αριστερά, χωρίς CTA που ανταγωνίζεται
          τα κουμπιά των καρτών. Η γραμμή εμπιστοσύνης γίνεται μία
          διακριτική σειρά. */}
      <section style={{ background: 'linear-gradient(135deg, #f2f8ff 0%, #f8fbff 100%)', borderBottom: '1px solid #e2e8f0', padding: '26px 24px 22px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(22px, 2.6vw, 30px)', color: '#1a2e44', lineHeight: 1.25, margin: '0 0 6px' }}>
            {tx.hero} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.heroEm}</em> {tx.heroEnd}
          </h1>
          <p style={{ fontSize: 14.5, color: '#6b7a8d', margin: '0 0 14px', maxWidth: 620, lineHeight: 1.55 }}>{tx.heroDesc}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, rowGap: 7 }}>
            {(tx.trustLine || []).map(item => (
              <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#64748b' }}>
                <Check size={12} color="#15803d" strokeWidth={2.8} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ΑΝΑΖΗΤΗΣΗ ΠΑΘΗΣΗΣ ──
          Ήταν τρεις ξεχωριστές ενότητες πριν τα αποτελέσματα: κίτρινο
          banner, τίτλος, αναζήτηση. Μαζί έσπρωχναν τον πρώτο θεραπευτή
          εκτός οθόνης.

          Τώρα μία συμπαγής γραμμή: ετικέτα, αναζήτηση, και ο σύνδεσμος
          προς τις παθήσεις δίπλα αντί για ολόκληρο banner. */}
      <section style={{ background: '#fff', padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a2e44' }}>
              {tx.findHelpTitle}
            </div>
            <a href="/find-help" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#2a6fdb', textDecoration: 'none' }}>
              {tx.crossLinkBtn}
              <ArrowRight size={13} />
            </a>
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
      <section style={{ background: '#f8fafb', padding: '24px 24px 60px' }}>
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
                {(sortBy === 'newest' || sortBy === 'relevance') && (
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
                return (
                  <div key={th.id} className="th-card">
                    <div className="th-card-main">
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

                    <div className="th-avatar">
                      {th.photo_url ? (
                        <ImgWithSkeleton src={th.photo_url} alt={th.name}
                          containerStyle={{ width: 72, height: 72, borderRadius: '50%' }}
                          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, fontWeight: 700, color: '#2a6fdb' }}>
                          {th.name?.charAt(0)}
                        </div>
                      )}

                      {/* ΕΠΑΛΗΘΕΥΣΗ: πράσινο ✓ πάνω στη φωτογραφία.
                          ΝΕΟΣ: γαλάζιο «Ν», αντί για τη φράση «Νέος
                          θεραπευτής» που έπιανε ολόκληρη γραμμή και
                          ακουγόταν σαν μειονέκτημα.
                          Η επαλήθευση προηγείται — είναι το σημαντικότερο. */}
                      {th.license_verified ? (
                        <span className="th-avatar-badge" style={{ background: '#15803d' }} title="Επαληθευμένη επαγγελματική άδεια">
                          <Check size={14} color="#fff" strokeWidth={3.2} />
                        </span>
                      ) : (th.review_count || 0) === 0 ? (
                        <span className="th-avatar-badge" style={{ background: '#2a6fdb', fontSize: 13, fontWeight: 700, color: '#fff' }} title="Νέος στην πλατφόρμα">
                          Ν
                        </span>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <a href={profileHref(th.id)} onClick={() => rememberProfile(th.id)} style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none' }}>{th.name}</a>
                      {th.is_profile_full && <BadgeCheck size={15} color="#2a6fdb" strokeWidth={2.2} />}
                    </div>
                    <div style={{ fontSize: 13.5, color: '#6b7a8d', marginBottom: 8 }}>{th.specialty}</div>

                    {/* Trust chips — το license_verified έρχεται από το view.
                        ΔΕΝ το υποθέτουμε: με το admin override μπορεί να
                        εμφανίζεται θεραπευτής χωρίς ελεγμένη άδεια. */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      {/* Η επαλήθευση φαίνεται πλέον ΠΑΝΩ στη φωτογραφία.
                          Ένα δεύτερο chip εδώ θα ήταν επανάληψη και θα
                          έσπρωχνε κάτω τα πραγματικά χρήσιμα: τιμή,
                          περιοχή, διαθεσιμότητα. */}
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

                    {/* Μόνο όταν ΥΠΑΡΧΟΥΝ αξιολογήσεις. Το «Νέος θεραπευτής»
                        έπιανε ολόκληρη γραμμή για να πει κάτι που δεν
                        βοηθάει τον επισκέπτη — και ακουγόταν σαν μειονέκτημα. */}
                    {(th.review_count || 0) > 0 && (
                      <div style={{ marginBottom: 9 }}>
                        <RatingDisplay rating={th.avg_rating} count={th.review_count} lang={lang} variant="compact" size={14} />
                      </div>
                    )}

                    {/* ΓΙΑΤΙ ΒΛΕΠΕΙΣ ΑΥΤΟΝ.
                        Ο χρήστης δεν πρέπει να αναρωτιέται «γιατί μου τον
                        δείχνει;». Όταν έχει φιλτράρει σε περιστατικό ή
                        περιοχή, του λέμε ρητά τι ταιριάζει. */}
                    {(selectedCondition || filterArea) && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                          {tx.matchTitle}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {selectedCondition && (
                            <span style={{ fontSize: 12.5, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Check size={12} strokeWidth={2.8} style={{ flexShrink: 0 }} />
                              {tx.matchCondition(lang === 'el' ? selectedCondition.name_el : (selectedCondition.name_en || selectedCondition.name_el))}
                            </span>
                          )}
                          {filterArea && (
                            <span style={{ fontSize: 12.5, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Check size={12} strokeWidth={2.8} style={{ flexShrink: 0 }} />
                              {tx.matchArea(filterArea)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Κάθε στοιχείο σε δική του γραμμή — το inline-flex τα
                        κολλούσε μεταξύ τους. */}
                      {/* Περιοχή, διαθεσιμότητα και τιμή ζουν πλέον στη
                          δεξιά στήλη. Εδώ μένει μόνο η εμπειρία. */}
                      {th.years_experience > 0 && (
                        <div style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <Briefcase size={13} style={{ flexShrink: 0 }} />
                          <span>{tx.yearsShort(th.years_experience)}</span>
                        </div>
                      )}

                      {/* ── ΣΧΕΤΙΚΑ ΜΕ ΤΟΝ ΘΕΡΑΠΕΥΤΗ ──
                          Κλειστό στις δύο γραμμές. Ο ασθενής σαρώνει
                          τη λίστα· αν ανοίγαμε τα πάντα, κάθε κάρτα θα
                          είχε άλλο ύψος και η σύγκριση θα γινόταν
                          αδύνατη. */}
                      {th.bio && String(th.bio).trim() && (
                        <div className="th-box" style={{ background: '#f8fafb', border: '1px solid #eef2f7', borderRadius: 10, padding: '11px 13px', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                            <Info size={13} color="#94a3b8" strokeWidth={2.2} />
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{tx.aboutTherapist}</span>
                            <button
                              onClick={() => setExpandedBio(prev => ({ ...prev, [th.id]: !prev[th.id] }))}
                              aria-label={tx.aboutTherapist}
                              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}>
                              {expandedBio[th.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                          <p style={{
                            fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: 0,
                            display: expandedBio[th.id] ? 'block' : '-webkit-box',
                            WebkitLineClamp: expandedBio[th.id] ? 'none' : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: expandedBio[th.id] ? 'visible' : 'hidden',
                          }}>
                            {th.bio}
                          </p>
                        </div>
                      )}

                      {/* ── ΕΠΙΣΚΕΨΗ / ΚΟΣΤΟΣ ──
                          Η τιμή υπάρχει δεξιά, αλλά εδώ είναι το σημείο
                          που κοιτάει ο ασθενής όταν διαβάζει το προφίλ.
                          Ο σύνδεσμος οδηγεί στο πλήρες προφίλ — ή στη
                          σύνδεση, αν δεν είναι συνδεδεμένος. */}
                      <div className="th-box" style={{ background: '#f8fafb', border: '1px solid #eef2f7', borderRadius: 10, padding: '11px 13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                          <Stethoscope size={13} color="#94a3b8" strokeWidth={2.2} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{tx.visit}</span>
                        </div>
                        <a href={profileHref(th.id)} onClick={() => rememberProfile(th.id)}
                          style={{ fontSize: 13.5, color: '#2a6fdb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {tx.seeCost}
                          <ArrowRight size={13} />
                        </a>
                      </div>
                    </div>

                    {/* ── ΔΕΞΙΑ: ΠΟΤΕ ΚΑΙ ΠΟΣΟ ──
                        Τα δύο που ρωτάει πρώτα ο ασθενής, χωρίς να
                        χρειαστεί να ανοίξει το προφίλ. */}
                    <div className="th-card-side">
                      {areas.length > 0 && (
                        <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 16 }}>
                          <MapPin size={14} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>{areas.slice(0, 3).join(' · ')}{areas.length > 3 ? ` +${areas.length - 3}` : ''}</span>
                        </div>
                      )}

                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a2e44', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <CalendarCheck size={14} color="#2a6fdb" />
                        {tx.nextFree}
                      </div>

                      {(th.slot_days || []).length > 0 ? (
                        <div className="th-slots">
                          {th.slot_days.map(d => (
                            <div key={d.date} className="th-slot">
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2a6fdb' }}>
                                {dayLabel(d.date)}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                                {tx.fromTime} {String(d.start_time).slice(0, 5)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                          {tx.noFreeSlots}
                        </div>
                      )}

                      {/* Η ΤΙΜΗ ΔΕΝ ΜΠΑΙΝΕΙ ΕΔΩ.
                          Αριστερά γράφει «Δείτε το κόστος», που υπονοεί
                          ότι η τιμή αποκαλύπτεται στο προφίλ. Το να τη
                          δείχναμε δίπλα ακύρωνε το ίδιο το κάλεσμα —
                          και γέμιζε τη στήλη με κενό. */}
                      <div style={{ marginTop: 14 }}>
                        <a href={profileHref(th.id)} onClick={() => rememberProfile(th.id)} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          background: '#1a2e44', color: '#fff', padding: '13px 20px',
                          borderRadius: 10, fontSize: 14.5, fontWeight: 600, textDecoration: 'none',
                        }}>
                          {tx.bookCta}
                          <ArrowRight size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
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
