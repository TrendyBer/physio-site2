'use client';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import RatingDisplay from '../../components/RatingDisplay';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

const TX = {
  el: {
    badge: 'Βρείτε τον ιδανικό',
    hero: 'Οι', heroEm: 'Φυσιοθεραπευτές', heroEnd: 'μας',
    heroDesc: 'Έμπειροι, αδειοδοτημένοι επαγγελματίες, που παρέχουν εξατομικευμένη φροντίδα στο σπίτι σας.',
    bookCta: 'Κλείστε Ραντεβού',
    viewProfile: 'Δείτε Προφίλ →',
    bookSession: 'Κλείστε Ραντεβού',
    noTherapists: 'Δεν υπάρχουν ενεργοί θεραπευτές ακόμα.',
    noResults: 'Δεν βρέθηκαν θεραπευτές με αυτά τα φίλτρα.',
    close: 'Κλείσιμο',
    filters: 'Φίλτρα',
    searchPh: '🔍 Αναζήτηση με όνομα ή ειδικότητα...',
    allAreas: 'Όλες οι περιοχές',
    allSpecialties: 'Όλες οι ειδικότητες',
    priceRange: 'Εύρος τιμής',
    sortBy: 'Ταξινόμηση',
    sortNewest: 'Νεότεροι πρώτα',
    sortRatingDesc: 'Υψηλότερη βαθμολογία',
    sortPriceAsc: 'Τιμή: χαμηλή → υψηλή',
    sortPriceDesc: 'Τιμή: υψηλή → χαμηλή',
    sortExpDesc: 'Περισσότερη εμπειρία',
    clearFilters: 'Καθαρισμός φίλτρων',
    resultsCount: (n) => `${n} ${n === 1 ? 'θεραπευτής' : 'θεραπευτές'}`,
    reviewsTitle: 'Αξιολογήσεις',
    noReviews: 'Δεν υπάρχουν αξιολογήσεις ακόμα.',
    notFoundTitle: 'Δεν βρίσκετε αυτό που ψάχνετε;',
    notFoundDesc: 'Συμπληρώστε το αίτημά σας και θα σας προτείνουμε τους κατάλληλους θεραπευτές.',
    notFoundBtn: 'Νέο Αίτημα →',
    becomeBanner: 'Είσαι φυσιοθεραπευτής;',
    becomeBannerDesc: 'Γίνε μέλος του δικτύου μας.',
    becomeBannerBtn: 'Μάθε περισσότερα →',
  },
  en: {
    badge: 'Find your',
    hero: 'Our', heroEm: 'Physiotherapists', heroEnd: '',
    heroDesc: 'Experienced, licensed professionals providing personalized care at your home.',
    bookCta: 'Book a Session',
    viewProfile: 'View Profile →',
    bookSession: 'Book a Session',
    noTherapists: 'No active therapists yet.',
    noResults: 'No therapists match these filters.',
    close: 'Close',
    filters: 'Filters',
    searchPh: '🔍 Search by name or specialty...',
    allAreas: 'All areas',
    allSpecialties: 'All specialties',
    priceRange: 'Price range',
    sortBy: 'Sort by',
    sortNewest: 'Newest first',
    sortRatingDesc: 'Highest rated',
    sortPriceAsc: 'Price: low → high',
    sortPriceDesc: 'Price: high → low',
    sortExpDesc: 'Most experienced',
    clearFilters: 'Clear filters',
    resultsCount: (n) => `${n} ${n === 1 ? 'therapist' : 'therapists'}`,
    reviewsTitle: 'Reviews',
    noReviews: 'No reviews yet.',
    notFoundTitle: "Can't find what you're looking for?",
    notFoundDesc: "Submit a request and we'll recommend therapists for you.",
    notFoundBtn: 'New Request →',
    becomeBanner: 'Are you a physiotherapist?',
    becomeBannerDesc: 'Join our network.',
    becomeBannerBtn: 'Learn more →',
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
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!therapist) return;
    setLoadingReviews(true);
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('therapist_id', therapist.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setReviews(data || []);
        setLoadingReviews(false);
      });
  }, [therapist]);

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
            <div style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 8 }}>{therapist.specialty}</div>
            <RatingDisplay rating={therapist.avg_rating || 0} count={therapist.review_count || 0} lang={lang} variant="stars" size={14} />
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

          {/* REVIEWS */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 10 }}>⭐ {tx.reviewsTitle}</div>
            {loadingReviews ? (
              <div style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>...</div>
            ) : reviews.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>{tx.noReviews}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.map(rv => (
                  <div key={rv.id} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <RatingDisplay rating={rv.rating} count={1} variant="stars-only" size={14} />
                      <span style={{ fontSize: 11, color: '#92400E' }}>
                        {new Date(rv.created_at).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {rv.comment && (
                      <p style={{ fontSize: 13, color: '#78350F', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>"{rv.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

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
  const tx = TX[lang];
  const [therapists, setTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [selectedTherapist, setSelectedTherapist] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState(null);
  const [filterMaxPrice, setFilterMaxPrice] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchTherapists(); }, []);

  async function fetchTherapists() {
    const timeoutId = setTimeout(() => setLoadingTherapists(false), 8000);
    try {
      const { data: ths, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('is_approved', true)
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
      }

      const enriched = ths.map(t => {
        const stats = ratingsMap[t.id];
        return {
          ...t,
          avg_rating: stats ? stats.sum / stats.count : 0,
          review_count: stats ? stats.count : 0,
        };
      });
      setTherapists(enriched);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Therapists fetch failed:', err);
      setTherapists([]);
    }
    setLoadingTherapists(false);
  }

  const uniqueAreas = useMemo(() => {
    const set = new Set(therapists.map(t => t.area).filter(Boolean));
    return Array.from(set).sort();
  }, [therapists]);

  const uniqueSpecialties = useMemo(() => {
    const set = new Set(therapists.map(t => t.specialty).filter(Boolean));
    return Array.from(set).sort();
  }, [therapists]);

  const priceRange = useMemo(() => {
    const prices = therapists.map(t => t.price_per_session).filter(p => typeof p === 'number');
    if (prices.length === 0) return { min: 25, max: 50 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [therapists]);

  useEffect(() => {
    if (filterMinPrice === null && priceRange.min < priceRange.max) {
      setFilterMinPrice(priceRange.min);
      setFilterMaxPrice(priceRange.max);
    }
  }, [priceRange, filterMinPrice]);

  const filteredTherapists = useMemo(() => {
    let result = [...therapists];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.specialty || '').toLowerCase().includes(q) ||
        (t.area || '').toLowerCase().includes(q)
      );
    }
    if (filterArea) result = result.filter(t => t.area === filterArea);
    if (filterSpecialty) result = result.filter(t => t.specialty === filterSpecialty);
    if (filterMinPrice !== null && filterMaxPrice !== null) {
      result = result.filter(t => {
        const p = t.price_per_session;
        if (typeof p !== 'number') return true;
        return p >= filterMinPrice && p <= filterMaxPrice;
      });
    }
    if (sortBy === 'rating-desc') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sortBy === 'price-asc') result.sort((a, b) => (a.price_per_session || 0) - (b.price_per_session || 0));
    else if (sortBy === 'price-desc') result.sort((a, b) => (b.price_per_session || 0) - (a.price_per_session || 0));
    else if (sortBy === 'experience-desc') result.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
    return result;
  }, [therapists, search, filterArea, filterSpecialty, filterMinPrice, filterMaxPrice, sortBy]);

  function clearFilters() {
    setSearch('');
    setFilterArea('');
    setFilterSpecialty('');
    setFilterMinPrice(priceRange.min);
    setFilterMaxPrice(priceRange.max);
    setSortBy('newest');
  }

  const hasActiveFilters = search || filterArea || filterSpecialty
    || (filterMinPrice !== null && filterMinPrice !== priceRange.min)
    || (filterMaxPrice !== null && filterMaxPrice !== priceRange.max)
    || sortBy !== 'newest';

  const selectStyle = { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#1a2e44', outline: 'none', background: '#fff', cursor: 'pointer', minWidth: 160 };
  const filterShown = showFilters || (typeof window !== 'undefined' && window.innerWidth >= 768);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }
        .th-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .th-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .th-grid { grid-template-columns: 1fr; } }
        .th-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; transition: all .3s; cursor: pointer; }
        .th-card:hover { box-shadow: 0 8px 32px rgba(26,46,68,0.12); transform: translateY(-4px); }
        .filters-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        @media (max-width: 768px) { .filters-bar > select, .filters-bar > div { width: 100%; } }
        .toggle-filters-btn { display: none; }
        @media (max-width: 768px) { .toggle-filters-btn { display: inline-flex; } }
        .become-banner { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
      `}</style>

      <Navbar />

      {/* HERO — for patients */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{tx.badge}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 54px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {tx.hero} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.heroEm}</em> {tx.heroEnd}
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 580, margin: '0 auto 32px' }}>{tx.heroDesc}</p>
          <a href="/dashboard/patient/new-request" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{tx.bookCta} →</a>
        </div>
      </section>

      {/* THERAPISTS + FILTERS */}
      <section style={{ background: '#f8fafb', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* FILTERS BAR */}
          {!loadingTherapists && therapists.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={tx.searchPh}
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#1a2e44', outline: 'none', marginBottom: 16 }} />

              <button className="toggle-filters-btn" onClick={() => setShowFilters(!showFilters)}
                style={{ width: '100%', padding: '10px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#1a2e44', cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                ⚙️ {tx.filters} {showFilters ? '▲' : '▼'}
              </button>

              <div style={{ display: filterShown ? 'block' : 'none' }}>
                <div className="filters-bar" style={{ marginBottom: 14 }}>
                  <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={selectStyle}>
                    <option value="">{tx.allAreas}</option>
                    {uniqueAreas.map(a => <option key={a} value={a}>📍 {a}</option>)}
                  </select>
                  <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)} style={selectStyle}>
                    <option value="">{tx.allSpecialties}</option>
                    {uniqueSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
                    <option value="newest">{tx.sortNewest}</option>
                    <option value="rating-desc">⭐ {tx.sortRatingDesc}</option>
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
                    <button onClick={clearFilters} style={{ background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✕ {tx.clearFilters}
                    </button>
                  )}
                </div>
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
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 15 }}>{tx.noTherapists}</div>
            </div>
          ) : filteredTherapists.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px dashed #dce6f0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, marginBottom: 16 }}>{tx.noResults}</div>
              <button onClick={clearFilters} style={{ background: '#1a2e44', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✕ {tx.clearFilters}
              </button>
            </div>
          ) : (
            <div className="th-grid">
              {filteredTherapists.map(th => (
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
                  <div style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 8 }}>{th.specialty}</div>
                  <div style={{ marginBottom: 8 }}>
                    <RatingDisplay rating={th.avg_rating} count={th.review_count} lang={lang} variant="compact" size={13} />
                  </div>
                  {th.area && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>📍 {th.area}</div>}
                  {th.price_per_session && <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600, marginBottom: 10 }}>💰 {th.price_per_session}€/{lang === 'el' ? 'συνεδρία' : 'session'}</div>}
                  <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{tx.viewProfile}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* "Δεν βρίσκετε αυτό που ψάχνετε" — direct to new-request */}
      {!loadingTherapists && (
        <section style={{ background: '#fff', padding: '60px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, #f0f6ff, #e8f0fb)', border: '1px solid #dce6f0', borderRadius: 20, padding: '40px 32px' }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(22px, 3vw, 28px)', color: '#1a2e44', marginBottom: 10 }}>{tx.notFoundTitle}</h3>
            <p style={{ fontSize: 15, color: '#6b7a8d', marginBottom: 24, lineHeight: 1.6 }}>{tx.notFoundDesc}</p>
            <a href="/dashboard/patient/new-request" style={{ display: 'inline-block', background: '#2a6fdb', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              {tx.notFoundBtn}
            </a>
          </div>
        </section>
      )}

      {/* "Become Therapist" mini-banner — direct to new page */}
      <section style={{ background: '#1a2e44', padding: '32px 24px' }}>
        <div className="become-banner" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>👨‍⚕️ {tx.becomeBanner}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{tx.becomeBannerDesc}</div>
          </div>
          <a href="/become-therapist" style={{ background: '#fff', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
            {tx.becomeBannerBtn}
          </a>
        </div>
      </section>

      {selectedTherapist && <TherapistModal therapist={selectedTherapist} lang={lang} tx={tx} onClose={() => setSelectedTherapist(null)} />}
      <Footer />
    </>
  );
}