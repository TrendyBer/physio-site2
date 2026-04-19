'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FreeAssessmentButton({ children, style, className }) {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleClick(e) {
    e.preventDefault();
    if (!mounted) return;

    if (user) {
      // Logged in → κατευθείαν στη φόρμα
      window.location.href = '/free-assessment';
    } else {
      // Not logged in → δείξε modal με επιλογές
      localStorage.setItem('pendingRedirect', '/free-assessment');
      setShowModal(true);
    }
  }

  return (
    <>
      <button onClick={handleClick} style={style} className={className}>
        {children}
      </button>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>
              Σχεδόν έτοιμοι!
            </h2>
            <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 24, lineHeight: 1.6 }}>
              Συνδεθείτε ή δημιουργήστε λογαριασμό για να κλείσετε τη δωρεάν αξιολόγησή σας.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/auth/login" style={{ background: '#1a2e44', color: '#fff', padding: '12px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'block' }}>
                Σύνδεση
              </a>
              <a href="/auth/register?role=patient" style={{ background: '#fff', color: '#1a2e44', padding: '12px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'block', border: '1.5px solid #1a2e44' }}>
                Εγγραφή
              </a>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#6b7a8d', fontSize: 13, cursor: 'pointer', marginTop: 6, fontFamily: 'inherit' }}>
                Άκυρο
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}