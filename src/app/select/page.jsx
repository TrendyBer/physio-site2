'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';
import { Package, Stethoscope, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const TX = {
  el: {
    loading: 'Φόρτωση...',
    dashboard: 'Dashboard',
    title: 'Επίλεξε Πακέτο & Θεραπευτή',
    subtitle: 'Μπορείς να επιλέξεις με οποιαδήποτε σειρά θέλεις.',
    stepPackage: 'Πακέτο',
    stepTherapist: 'Θεραπευτής',
    stepContinue: 'Συνέχεια',
    selectPackage: 'Επίλεξε Πακέτο',
    selectTherapist: 'Επίλεξε Θεραπευτή',
    sessions: 'συνεδρίες',
    noTherapists: 'Δεν υπάρχουν διαθέσιμοι θεραπευτές',
    packageLabel: 'Πακέτο',
    therapistLabel: 'Θεραπευτής',
    continue: 'Συνέχεια',
  },
  en: {
    loading: 'Loading...',
    dashboard: 'Dashboard',
    title: 'Select Package & Therapist',
    subtitle: 'You can select in any order you prefer.',
    stepPackage: 'Package',
    stepTherapist: 'Therapist',
    stepContinue: 'Continue',
    selectPackage: 'Select Package',
    selectTherapist: 'Select Therapist',
    sessions: 'sessions',
    noTherapists: 'No therapists available',
    packageLabel: 'Package',
    therapistLabel: 'Therapist',
    continue: 'Continue',
  },
};

function Avatar({ name, photoUrl, size = 52 }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function SelectPage() {
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;

  const [packages, setPackages] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        localStorage.setItem('pendingRedirect', '/select');
        window.location.href = '/auth/login';
        return;
      }
      const role = localStorage.getItem('userRole');
      if (role !== 'patient') { window.location.href = '/'; return; }
      setUser(user);
    });

    const saved = localStorage.getItem('selectedPackage');
    if (saved) setSelectedPkg(JSON.parse(saved));

    // ΠΗΓΗ: v_public_therapists με is_publicly_visible.
    // Πριν, αυτή η σελίδα φιλτράριζε ΜΟΝΟ με is_approved — έδειχνε
    // θεραπευτές που ήταν κρυμμένοι παντού αλλού.
    Promise.all([
      supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
      supabase.from('v_public_therapists').select('*').eq('is_publicly_visible', true),
    ]).then(([{ data: pkgs }, { data: ths }]) => {
      setPackages(pkgs || []);
      setTherapists(ths || []);
      setLoading(false);
    });
  }, []);

  function finalPrice(pkg) {
    const total = pkg.sessions * pkg.price_per_session;
    return (total * (1 - pkg.discount_percent / 100)).toFixed(0);
  }

  function handleContinue() {
    if (!selectedPkg || !selectedTherapist) return;
    localStorage.setItem('selectedPackage', JSON.stringify(selectedPkg));
    window.location.href = `/dashboard/patient/new-request?package=${selectedPkg.id}&therapist=${selectedTherapist.id}`;
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 16, color: '#64748B' }}>{tx.loading}</div>
    </div>
  );

  const canContinue = selectedPkg && selectedTherapist;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .select-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 860px) { .select-grid { grid-template-columns: 1fr; } }
      `}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
        </a>
        <a href="/dashboard/patient" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ArrowLeft size={14} />
          {tx.dashboard}
        </a>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{tx.title}</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>{tx.subtitle}</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          {[
            { label: tx.stepPackage, done: !!selectedPkg },
            { label: tx.stepTherapist, done: !!selectedTherapist },
            { label: tx.stepContinue, done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.done ? '#15803D' : '#e2e8f0', color: s.done ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                {s.done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: s.done ? '#15803D' : '#94a3b8' }}>{s.label}</span>
              {i < 2 && <div style={{ width: 32, height: 2, background: '#e2e8f0' }} />}
            </div>
          ))}
        </div>

        <div className="select-grid">
          {/* LEFT — Packages */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={17} color="#2a6fdb" strokeWidth={2.2} />
              {tx.selectPackage}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {packages.map(pkg => {
                const isSelected = selectedPkg?.id === pkg.id;
                const final = finalPrice(pkg);
                return (
                  <div key={pkg.id} onClick={() => setSelectedPkg(pkg)}
                    style={{ padding: '16px 20px', border: `2px solid ${isSelected ? '#2a6fdb' : '#e2e8f0'}`, borderRadius: 14, cursor: 'pointer', background: isSelected ? '#EFF6FF' : '#fff', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 2 }}>
                        {lang === 'el' ? pkg.name_el : (pkg.name_en || pkg.name_el)}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>
                        {pkg.sessions} {tx.sessions}
                        {pkg.discount_percent > 0 && ` · -${pkg.discount_percent}%`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2e44' }}>€{final}</div>
                      {pkg.discount_percent > 0 && (
                        <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                          €{(pkg.sessions * pkg.price_per_session).toFixed(0)}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={18} color="#2a6fdb" strokeWidth={3} style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Therapists */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stethoscope size={17} color="#2a6fdb" strokeWidth={2.2} />
              {tx.selectTherapist}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
              {therapists.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  {tx.noTherapists}
                </div>
              ) : therapists.map(th => {
                const isSelected = selectedTherapist?.id === th.id;
                return (
                  <div key={th.id} onClick={() => setSelectedTherapist(th)}
                    style={{ padding: '14px 16px', border: `2px solid ${isSelected ? '#2a6fdb' : '#e2e8f0'}`, borderRadius: 14, cursor: 'pointer', background: isSelected ? '#EFF6FF' : '#fff', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={th.name} photoUrl={th.photo_url} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{th.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{th.specialty}</div>
                      {th.area && (
                        <div style={{ fontSize: 11, color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10} />
                          {th.area}
                        </div>
                      )}
                    </div>
                    {th.price_per_session && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb' }}>{th.price_per_session}€</div>
                    )}
                    {isSelected && <Check size={18} color="#2a6fdb" strokeWidth={3} style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary & Continue */}
        {(selectedPkg || selectedTherapist) && (
          <div style={{ marginTop: 32, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {selectedPkg && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>{tx.packageLabel}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
                    {lang === 'el' ? selectedPkg.name_el : (selectedPkg.name_en || selectedPkg.name_el)}
                  </div>
                  <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>€{finalPrice(selectedPkg)}</div>
                </div>
              )}
              {selectedTherapist && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>{tx.therapistLabel}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{selectedTherapist.name}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{selectedTherapist.specialty}</div>
                </div>
              )}
            </div>
            <button onClick={handleContinue} disabled={!canContinue}
              style={{ padding: '13px 32px', borderRadius: 30, border: 'none', background: canContinue ? '#15803D' : '#e2e8f0', color: canContinue ? '#fff' : '#94a3b8', fontSize: 15, fontWeight: 600, cursor: canContinue ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              {tx.continue}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}