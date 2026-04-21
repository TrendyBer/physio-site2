'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FreeAssessmentButton({ children, style, className }) {
  const [user, setUser] = useState(null);
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
      // Logged in → κατευθείαν στη φόρμα δωρεάν αξιολόγησης
      window.location.href = '/free-assessment';
    } else {
      // Not logged in → login page (με redirect back μετά το login)
      try { localStorage.setItem('pendingRedirect', '/free-assessment'); } catch (_) {}
      window.location.href = '/auth/login';
    }
  }

  return (
    <button onClick={handleClick} style={style} className={className}>
      {children}
    </button>
  );
}