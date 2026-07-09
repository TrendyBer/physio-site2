'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Clock, Heart, Calendar, MapPin, Star, ArrowRight, Search } from 'lucide-react';

const DEFAULT = {
  el: {
    badge: 'Φυσιοθεραπεία στο σπίτι · Αθήνα & Αττική',
    title1: 'Φυσιοθεραπεία στο σπίτι,',
    title2: 'για αυτό που σας ταλαιπωρεί',
    desc: 'Περιγράψτε με απλά λόγια το πρόβλημα και βρείτε φυσιοθεραπευτή που αναλαμβάνει παρόμοια περιστατικά στην περιοχή σας.',
    cta: 'Βρες φυσιοθεραπευτή', how: 'Δες παθήσεις',
    pills: [
      { icon: 'CheckCircle2', label: 'Ελεγμένοι φυσιοθεραπευτές' },
      { icon: 'MapPin', label: 'Στην περιοχή σας' },
      { icon: 'Calendar', label: 'Ευέλικτο ραντεβού' },
      { icon: 'Heart', label: 'Υποστήριξη από την ομάδα μας' },
    ],
    image_url: '',
  },
  en: {
    badge: 'Home physiotherapy · Athens & Attica',
    title1: 'Home physiotherapy,',
    title2: 'for whatever troubles you',
    desc: 'Describe your problem in simple words and find a physiotherapist who handles similar cases in your area.',
    cta: 'Find a physiotherapist', how: 'Browse conditions',
    pills: [
      { icon: 'CheckCircle2', label: 'Vetted physiotherapists' },
      { icon: 'MapPin', label: 'In your area' },
      { icon: 'Calendar', label: 'Flexible scheduling' },
      { icon: 'Heart', label: 'Support from our team' },
    ],
    image_url: '',
  },
};

const FALLBACK_CHIPS = {
  el: ['Πόνος στη μέση', 'Αυχενικό', 'Πόνος γόνατου', 'Μετά από χειρουργείο', 'Δυσκολία στο περπάτημα', 'Αθλητικός τραυματισμός'],
  en: ['Back pain', 'Neck pain', 'Knee pain', 'After surgery', 'Difficulty walking', 'Sports injury'],
};

const CACHE_KEY = 'cms_homepage_hero';
const CACHE_TTL = 5 * 60 * 1000;

const ICON_MAP = {
  CheckCircle2: CheckCircle2,
  Clock: Clock,
  Heart: Heart,
  Calendar: Calendar,
  MapPin: MapPin,
};

function normalizePills(pills, defaultPills) {
  if (!Array.isArray(pills) || pills.length === 0) return defaultPills;
  if (typeof pills[0] === 'string') return defaultPills;
  return pills;
}

export default function Hero() {
  const { lang } = useLang();
  const [data, setData] = useState(DEFAULT);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [problem, setProblem] = useState('');
  const [conditionChips, setConditionChips] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) { setData(value); return; }
        }
      } catch (_) {}

      const { data: row } = await supabase
        .from('site_content')
        .select('content_el, content_en')
        .eq('page', 'homepage')
        .eq('section', 'hero')
        .single();

      if (row) {
        const value = { el: row.content_el, en: row.content_en };
        setData(value);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value, timestamp: Date.now() })); } catch (_) {}
      }
    }
    fetchData();
  }, []);

  // Δημοφιλείς αναζητήσεις — πραγματικές παθήσεις από τη βάση
  useEffect(() => {
    (async () => {
      const { data: cds } = await supabase
        .from('conditions')
        .select('slug, name_el, name_en')
        .eq('is_active', true)
        .limit(6);
      if (cds && cds.length > 0) setConditionChips(cds);
    })();
  }, []);

  const text = data[lang] || DEFAULT[lang];
  const pills = normalizePills(text.pills, DEFAULT[lang].pills);

  const bookT = {
    el: {
      label: 'Τι σας ταλαιπωρεί;',
      placeholder: 'π.χ. πόνος στη μέση, αυχενικό, εγχείρηση γόνατου',
      btn: 'Βρες φυσιοθεραπευτή',
      micro: 'Δεν χρειάζεται να γνωρίζετε ακριβή διάγνωση · Η περιοχή ζητείται στο επόμενο βήμα',
      popular: 'Δημοφιλείς αναζητήσεις',
    },
    en: {
      label: 'What is troubling you?',
      placeholder: 'e.g. back pain, neck pain, knee surgery',
      btn: 'Find a physiotherapist',
      micro: "You don't need to know an exact diagnosis · Your area is asked in the next step",
      popular: 'Popular searches',
    },
  };
  const bt = bookT[lang];

  const buttonHref = problem.trim()
    ? `/find-help?q=${encodeURIComponent(problem.trim())}`
    : '/find-help';

  function handleKey(e) {
    if (e.key === 'Enter') { window.location.href = buttonHref; }
  }

  // quick chips: πραγματικές παθήσεις -> φιλτραρισμένοι θεραπευτές, αλλιώς fallback -> find-help
  const quickChips = conditionChips.length > 0
    ? conditionChips.map(c => ({
        label: lang === 'el' ? c.name_el : c.name_en,
        href: `/therapists?condition=${encodeURIComponent(c.slug)}`,
      }))
    : FALLBACK_CHIPS[lang].map(label => ({
        label,
        href: `/find-help?q=${encodeURIComponent(label)}`,
      }));

  return (
    <>
      <style>{`
        .hero-wrapper {
          background: linear-gradient(180deg, #faf9f6 0%, #f0f7ff 100%);
          color-scheme: light;
        }
        .hero-section { max-width: 1200px; margin: 0 auto; padding: 80px 24px 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-visual { position: relative; }
        .hero-search-label { font-size: 14px; font-weight: 700; color: #1a2e44; margin-bottom: 10px; }
        .hero-book-box {
          background: #fff;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          padding: 8px 8px 8px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 540px;
          box-shadow: 0 8px 32px rgba(26,46,68,0.10);
          margin-bottom: 12px;
        }
        .hero-book-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: #1a2e44;
          font-family: inherit;
          background: transparent;
          padding: 14px 0;
        }
        .hero-book-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hero-book-btn {
          background: #1a2e44;
          color: #fff;
          padding: 14px 26px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .hero-book-btn:hover { background: #0f1e30; }
        .hero-chips-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 20px 0 10px; }
        .hero-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: #fff; border: 1px solid #dce6f0; color: #1a2e44;
          padding: 7px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: all .2s; cursor: pointer;
        }
        .hero-chip:hover { border-color: #2a6fdb; color: #2a6fdb; }
        .hero-title { font-family: Georgia, serif; font-size: clamp(28px, 4vw, 52px); line-height: 1.15; color: #1a2e44; margin-bottom: 20px; }
        .hero-desc { font-size: 17px; color: #6b7a8d; line-height: 1.7; margin-bottom: 28px; max-width: 470px; }

        @media (max-width: 768px) {
          .hero-section { grid-template-columns: 1fr; padding: 32px 20px; gap: 28px; }
          .hero-visual { order: -1; }
          .hero-book-box { flex-direction: column; align-items: stretch; padding: 12px; }
          .hero-book-input-wrapper { padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; }
          .hero-book-input { padding: 0; }
          .hero-book-btn { width: 100%; justify-content: center; }
          .hero-title { font-size: 30px; line-height: 1.2; }
          .hero-desc { font-size: 15px; max-width: 100%; }
        }

        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        .img-skeleton {
          background: linear-gradient(90deg, #e8f1fd 25%, #d4e4f7 50%, #e8f1fd 75%);
          background-size: 600px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 24px;
          aspect-ratio: 4/5;
          width: 100%;
        }
        .hero-image-fallback {
          width: 100%;
          aspect-ratio: 4/5;
          border-radius: 24px;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%),
            linear-gradient(135deg, #d4e8ff 0%, #a0c4f4 100%);
          box-shadow: 0 12px 48px rgba(26,46,68,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .hero-image-fallback::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(42,111,219,0.08) 100%);
        }
      `}</style>

      <div className="hero-wrapper">
        <section className="hero-section">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f1fd', color: '#2a6fdb', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
              <Star size={13} fill="#2a6fdb" strokeWidth={0} />
              {text.badge}
            </div>
            <h1 className="hero-title">
              {text.title1}{' '}<em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.title2}</em>
            </h1>
            <p className="hero-desc">{text.desc}</p>

            {/* Problem-first search */}
            <div className="hero-search-label">{bt.label}</div>
            <div className="hero-book-box">
              <div className="hero-book-input-wrapper">
                <Search size={18} color="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }} />
                <input
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={bt.placeholder}
                  className="hero-book-input"
                />
              </div>
              <a href={buttonHref} className="hero-book-btn">
                {bt.btn} <ArrowRight size={16} />
              </a>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{bt.micro}</div>

            {/* Δημοφιλείς αναζητήσεις */}
            <div className="hero-chips-label">{bt.popular}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {quickChips.map((chip, i) => (
                <a key={i} href={chip.href} className="hero-chip">{chip.label}</a>
              ))}
            </div>

            {/* Trust pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              {pills.map((pill, i) => {
                const IconComp = ICON_MAP[pill.icon] || CheckCircle2;
                return (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #dce6f0', padding: '7px 14px', borderRadius: 20, fontSize: 13, color: '#475569', boxShadow: '0 4px 24px rgba(26,46,68,0.08)' }}>
                    <IconComp size={13} color="#2a6fdb" strokeWidth={2.2} />
                    {pill.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="hero-visual">
            {text.image_url ? (
              <>
                {!imgLoaded && <div className="img-skeleton" />}
                <img
                  src={text.image_url}
                  alt="Hero"
                  onLoad={() => setImgLoaded(true)}
                  style={{ width: '100%', borderRadius: 24, boxShadow: '0 12px 48px rgba(26,46,68,0.14)', objectFit: 'cover', aspectRatio: '4/5', display: imgLoaded ? 'block' : 'none' }}
                />
              </>
            ) : (
              <div className="hero-image-fallback" />
            )}
          </div>
        </section>
      </div>
    </>
  );
}