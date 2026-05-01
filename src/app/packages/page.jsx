'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Footer } from '../../components/SharedComponents';
import BookingButton from '../../components/BookingButton';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Star, Wallet, Calendar, Target, Lightbulb, ArrowRight } from 'lucide-react';

const ICON_MAP = {
  Wallet: Wallet,
  Calendar: Calendar,
  Target: Target,
};

const t = {
  el: {
    badge: 'Πακέτα Συνεδριών',
    title: 'Επιλέξτε το',
    titleEm: 'Κατάλληλο Πακέτο',
    subtitle: 'Περισσότερες συνεδρίες = μεγαλύτερη έκπτωση. Επιλέξτε πακέτο και στη συνέχεια επιλέξτε τον θεραπευτή που σας ταιριάζει.',
    saveBadge: 'Εξοικονόμηση',
    selectBtn: 'Επιλογή Πακέτου',
    sessions: 'συνεδρίες',
    popular: 'Δημοφιλές',
    infoTitle: 'Πώς υπολογίζεται η τιμή;',
    infoText: 'Η τελική τιμή του πακέτου διαμορφώνεται από την τιμή/συνεδρία του θεραπευτή που θα επιλέξετε, αφαιρώντας την έκπτωση του πακέτου. Θα δείτε τη συνολική τιμή πριν την τελική επιβεβαίωση.',
    loading: 'Φόρτωση πακέτων...',
    noPackages: 'Δεν υπάρχουν διαθέσιμα πακέτα αυτή τη στιγμή.',
    whyTitle: 'Γιατί να επιλέξετε πακέτο;',
    whyBullets: [
      { icon: 'Wallet', title: 'Καλύτερη τιμή', desc: 'Όσο μεγαλύτερο το πακέτο, τόσο μεγαλύτερη η έκπτωση στην τιμή/συνεδρία.' },
      { icon: 'Calendar', title: 'Προγραμματισμός', desc: 'Κλείνετε όλες τις συνεδρίες μαζί και δεν σκέφτεστε ξανά το κόστος.' },
      { icon: 'Target', title: 'Συνέπεια στη θεραπεία', desc: 'Οι πολλαπλές συνεδρίες εξασφαλίζουν συνέχεια και καλύτερα αποτελέσματα.' },
    ],
  },
  en: {
    badge: 'Session Packages',
    title: 'Choose the',
    titleEm: 'Right Package',
    subtitle: 'More sessions = bigger discount. Choose a package and then select the therapist that suits you.',
    saveBadge: 'Save',
    selectBtn: 'Select Package',
    sessions: 'sessions',
    popular: 'Popular',
    infoTitle: 'How is the price calculated?',
    infoText: 'The final package price is based on your chosen therapist\'s per-session rate, minus the package discount. You\'ll see the total price before final confirmation.',
    loading: 'Loading packages...',
    noPackages: 'No packages available at the moment.',
    whyTitle: 'Why choose a package?',
    whyBullets: [
      { icon: 'Wallet', title: 'Better price', desc: 'The larger the package, the bigger the discount per session.' },
      { icon: 'Calendar', title: 'Planning ahead', desc: 'Book all sessions at once and stop worrying about costs.' },
      { icon: 'Target', title: 'Treatment consistency', desc: 'Multiple sessions ensure continuity and better results.' },
    ],
  },
};

export default function PackagesPage() {
  const { lang } = useLang();
  const tx = t[lang];

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('packages')
        .select('id, name_el, name_en, sessions, discount_percent, description_el, description_en, display_order')
        .eq('is_active', true)
        .order('sessions', { ascending: true });

      if (!error && data) setPackages(data);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const mostPopularId = packages.length > 0
    ? packages.reduce((max, p) => (p.discount_percent || 0) > (max.discount_percent || 0) ? p : max, packages[0]).id
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .pkg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .pkg-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .pkg-grid { grid-template-columns: 1fr; } }
        .pkg-card {
          background: #fff;
          border-radius: 20px;
          border: 1.5px solid #dce6f0;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          transition: all .3s;
          position: relative;
        }
        .pkg-card:hover { box-shadow: 0 12px 40px rgba(26,46,68,0.10); transform: translateY(-4px); border-color: #2a6fdb; }
        .pkg-card.popular { border-color: #2a6fdb; border-width: 2px; box-shadow: 0 8px 32px rgba(42,111,219,0.14); }
        .popular-badge {
          position: absolute;
          top: -13px;
          left: 50%;
          transform: translateX(-50%);
          background: #2a6fdb;
          color: #fff;
          padding: 6px 18px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 768px) { .why-grid { grid-template-columns: 1fr; } }
      `}</style>

      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #f0f6ff 0%, #f8fafb 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>
            {tx.badge}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {tx.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.titleEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
            {tx.subtitle}
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section style={{ background: '#f8fafb', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '60px 0' }}>{tx.loading}</div>
          ) : packages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7a8d', padding: '60px 0' }}>{tx.noPackages}</div>
          ) : (
            <div className="pkg-grid">
              {packages.map((pkg) => {
                const isPopular = pkg.id === mostPopularId && packages.length > 1;
                const name = lang === 'el' ? pkg.name_el : pkg.name_en;
                const desc = lang === 'el' ? pkg.description_el : pkg.description_en;
                return (
                  <div key={pkg.id} className={`pkg-card ${isPopular ? 'popular' : ''}`}>
                    {isPopular && (
                      <div className="popular-badge">
                        <Star size={12} fill="#fff" strokeWidth={0} />
                        {tx.popular}
                      </div>
                    )}

                    {/* Number of sessions */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 700, color: '#1a2e44', lineHeight: 1 }}>
                        {pkg.sessions}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7a8d', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
                        {tx.sessions}
                      </div>
                    </div>

                    {/* Package name */}
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', textAlign: 'center', marginBottom: 12 }}>
                      {name}
                    </h3>

                    {/* Description */}
                    {desc && (
                      <p style={{ fontSize: 13, color: '#6b7a8d', textAlign: 'center', lineHeight: 1.6, marginBottom: 20, minHeight: 40 }}>
                        {desc}
                      </p>
                    )}

                    {/* Discount badge */}
                    {pkg.discount_percent > 0 && (
                      <div style={{
                        background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                        color: '#065F46',
                        padding: '14px 20px',
                        borderRadius: 12,
                        textAlign: 'center',
                        marginBottom: 24,
                        border: '1px solid #6EE7B7',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>
                          {tx.saveBadge}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>
                          -{pkg.discount_percent}%
                        </div>
                      </div>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* CTA button */}
                    <BookingButton
                      packageName={name}
                      style={{
                        width: '100%',
                        background: isPopular ? '#2a6fdb' : '#1a2e44',
                        color: '#fff',
                        padding: '13px',
                        borderRadius: 30,
                        fontSize: 14,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {tx.selectBtn}
                      <ArrowRight size={16} />
                    </BookingButton>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Info banner — πώς υπολογίζεται η τιμή */}
      <section style={{ background: '#f8fafb', padding: '0 24px 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ background: '#e8f1fd', border: '1.5px solid #bedcff', borderRadius: 16, padding: '24px 28px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bedcff' }}>
              <Lightbulb size={24} color="#2a6fdb" strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{tx.infoTitle}</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>{tx.infoText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose a package */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a2e44', textAlign: 'center', marginBottom: 48 }}>
            {tx.whyTitle}
          </h2>
          <div className="why-grid">
            {tx.whyBullets.map((bullet, i) => {
              const IconComp = ICON_MAP[bullet.icon] || Target;
              return (
                <div key={i} style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <IconComp size={28} color="#2a6fdb" strokeWidth={2.2} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{bullet.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.7 }}>{bullet.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}