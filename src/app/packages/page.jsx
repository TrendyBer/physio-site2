'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';

export default function PackagesPage() {
  const { lang } = useLang();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('packages').select('*').eq('is_active', true).order('display_order').then(({ data }) => {
      setPackages(data || []);
      setLoading(false);
    });
  }, []);

  function finalPrice(pkg) {
    const total = pkg.sessions * pkg.price_per_session;
    return (total * (1 - pkg.discount_percent / 100)).toFixed(0);
  }

  function handleSelect(pkg) {
    const role = localStorage.getItem('userRole');
    if (role === 'patient') {
      localStorage.setItem('selectedPackage', JSON.stringify(pkg));
      window.location.href = `/dashboard/patient/new-request?package=${pkg.id}`;
    } else {
      localStorage.setItem('selectedPackage', JSON.stringify(pkg));
      localStorage.setItem('pendingRedirect', `/dashboard/patient/new-request?package=${pkg.id}`);
      window.location.href = '/auth/login';
    }
  }

  const icons = ['1️⃣', '5️⃣', '🔟', '2️⃣0️⃣', '📅'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pkg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
        @media (max-width: 640px) { .pkg-grid { grid-template-columns: 1fr; } }
        .pkg-card { background: #fff; border-radius: 20px; border: 2px solid #e2e8f0; padding: 28px; transition: all .25s; display: flex; flex-direction: column; }
        .pkg-card:hover { border-color: #2a6fdb; box-shadow: 0 8px 32px rgba(42,111,219,0.12); transform: translateY(-4px); }
        .pkg-card.featured { border-color: #2a6fdb; background: linear-gradient(135deg, #EFF6FF, #fff); }
      `}</style>

      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff, #f0f7ff)', padding: '72px 24px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>
            {lang === 'el' ? 'Πακέτα Συνεδριών' : 'Session Packages'}
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4vw, 52px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 16 }}>
            {lang === 'el' ? 'Επίλεξε το' : 'Choose Your'}{' '}
            <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>
              {lang === 'el' ? 'Πακέτο σου' : 'Package'}
            </em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', lineHeight: 1.7 }}>
            {lang === 'el'
              ? 'Εξοικονόμησε με πακέτα συνεδριών και λάβε εξατομικευμένη φροντίδα στο σπίτι σου.'
              : 'Save with session packages and receive personalized care at home.'}
          </p>
        </div>
      </section>

      {/* Packages */}
      <section style={{ background: '#f8fafc', padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
              {lang === 'el' ? 'Φόρτωση...' : 'Loading...'}
            </div>
          ) : (
            <div className="pkg-grid">
              {packages.map((pkg, i) => {
                const total = (pkg.sessions * pkg.price_per_session).toFixed(0);
                const final = finalPrice(pkg);
                const isFeatured = pkg.discount_percent >= 10;
                return (
                  <div key={pkg.id} className={`pkg-card${isFeatured ? ' featured' : ''}`}>
                    {isFeatured && (
                      <div style={{ background: '#2a6fdb', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, alignSelf: 'flex-start', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {lang === 'el' ? '⭐ Δημοφιλές' : '⭐ Popular'}
                      </div>
                    )}
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{icons[i] || '📦'}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                      {lang === 'el' ? pkg.name_el : (pkg.name_en || pkg.name_el)}
                    </div>
                    <div style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
                      {pkg.sessions} {lang === 'el' ? 'συνεδρίες' : 'sessions'}
                    </div>

                    {pkg.discount_percent > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'line-through' }}>€{total}</span>
                        <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                          -{pkg.discount_percent}%
                        </span>
                      </div>
                    )}

                    <div style={{ fontSize: 36, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>€{final}</div>
                    <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
                      €{(final / pkg.sessions).toFixed(0)}/{lang === 'el' ? 'συνεδρία' : 'session'}
                    </div>

                    {(lang === 'el' ? pkg.description_el : pkg.description_en) && (
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                        {lang === 'el' ? pkg.description_el : pkg.description_en}
                      </p>
                    )}

                    <button onClick={() => handleSelect(pkg)}
                      style={{ marginTop: 'auto', width: '100%', padding: '13px', borderRadius: 30, border: 'none', background: isFeatured ? '#2a6fdb' : '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {lang === 'el' ? 'Επιλογή →' : 'Select →'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}