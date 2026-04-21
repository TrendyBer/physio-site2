'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Ενιαίο κουμπί που χρησιμοποιείται ΠΑΝΤΟΥ για κλείσιμο ραντεβού/αξιολόγησης.
 *
 * Props:
 *   - variant: "booking" (default) ή "assessment"
 *       booking    → /dashboard/patient/new-request
 *       assessment → /free-assessment
 *   - address: (optional) αν περαστεί, αποθηκεύεται στο localStorage
 *   - packageName: (optional) αν περαστεί, προστίθεται σαν ?package=... στο URL
 *   - disabled: αν true, το κουμπί είναι disabled
 *   - style, className, children: standard props
 *
 * Λογική:
 *   - Αν ο χρήστης είναι logged-in → πάει κατευθείαν στον προορισμό
 *   - Αν ΔΕΝ είναι logged-in → πάει στο /auth/login
 *     (αποθηκεύει το pendingRedirect για να γυρίσει μετά το login)
 */
export default function BookingButton({
  children,
  style,
  className,
  variant = 'booking',
  address = '',
  packageName = '',
  disabled = false,
}) {
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
    if (!mounted || disabled) return;

    // Destination ανάλογα με το variant
    let destination = variant === 'assessment'
      ? '/free-assessment'
      : '/dashboard/patient/new-request';

    // Αν υπάρχει packageName, πρόσθεσέ το στο URL
    if (packageName && packageName.trim()) {
      const separator = destination.includes('?') ? '&' : '?';
      destination += `${separator}package=${encodeURIComponent(packageName.trim())}`;
    }

    // Save address αν υπάρχει
    if (address && address.trim()) {
      try { localStorage.setItem('bookingAddress', address.trim()); } catch (_) {}
    }

    if (user) {
      // Logged in → κατευθείαν στον προορισμό
      window.location.href = destination;
    } else {
      // Not logged in → login page (με redirect back μετά)
      try { localStorage.setItem('pendingRedirect', destination); } catch (_) {}
      window.location.href = '/auth/login';
    }
  }

  return (
    <button
      onClick={handleClick}
      style={style}
      className={className}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}