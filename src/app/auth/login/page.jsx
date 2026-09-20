'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper: redirect σε pendingRedirect αν υπάρχει, αλλιώς στο default
  function redirectAfterLogin(role) {
    let pending = null;
    try { pending = localStorage.getItem('pendingRedirect'); } catch (_) {}

    const defaultDest = role === 'therapist' ? '/dashboard/therapist' : '/dashboard/patient';

    if (pending) {
      try { localStorage.removeItem('pendingRedirect'); } catch (_) {}

      // ── ΜΟΝΟ ΕΣΩΤΕΡΙΚΟΙ ΠΡΟΟΡΙΣΜΟΙ ──
      // Το pendingRedirect ζει στο localStorage, που ο χρήστης μπορεί να
      // επεξεργαστεί. Μια τιμή σαν «https://κακόβουλο.gr» θα τον έστελνε
      // εκτός του site αμέσως μετά τη σύνδεση — σε σελίδα που θα μπορούσε
      // να μιμηθεί το Theralivo και να ζητήσει ξανά κωδικό.
      //
      // Το «//» αποκλείεται ξεχωριστά: το «//κακόβουλο.gr» είναι έγκυρη
      // απόλυτη διεύθυνση για τον browser, παρότι ξεκινά με κάθετο.
      const internal = typeof pending === 'string'
        && pending.startsWith('/')
        && !pending.startsWith('//');

      if (!internal) {
        window.location.href = defaultDest;
        return;
      }

      // Οι πίνακες αφορούν συγκεκριμένο ρόλο — ένας ασθενής δεν έχει
      // λόγο να καταλήξει στον πίνακα θεραπευτή.
      const isPatientRoute   = pending.startsWith('/dashboard/patient') || pending.startsWith('/free-assessment');
      const isTherapistRoute = pending.startsWith('/dashboard/therapist');

      if (role === 'patient' && isTherapistRoute) {
        window.location.href = defaultDest;
        return;
      }
      if (role === 'therapist' && isPatientRoute) {
        window.location.href = defaultDest;
        return;
      }

      window.location.href = pending;
      return;
    }

    window.location.href = defaultDest;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    await new Promise(r => setTimeout(r, 500));

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'therapist' || profile?.role === 'patient') {
      redirectAfterLogin(profile.role);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data: profile2 } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile2?.role === 'therapist' || profile2?.role === 'patient') {
        redirectAfterLogin(profile2.role);
        return;
      }
    }

    setError('Δεν βρέθηκε προφίλ. Επικοινωνήστε με την υποστήριξη.');
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(26,46,68,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Λευκή κάρτα → σκούρα έκδοση. Το lockup μπαίνει εδώ γιατί
              είναι σελίδα εισόδου: ο επισκέπτης βλέπει μόνο αυτό. */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Logo variant="lockup" tone="dark" size={40} asLink={false} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', margin: 0 }}>Σύνδεση</h1>
          <p style={{ fontSize: 14, color: '#6b7a8d', marginTop: 6 }}>Καλώς ήρθατε πίσω</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44' }}>Password</label>
              <a href="/auth/forgot-password" style={{ fontSize: 12, color: '#2a6fdb', fontWeight: 600, textDecoration: 'none' }}>
                Ξέχασες password;
              </a>
            </div>
            <input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' }} />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ background: '#1a2e44', color: '#fff', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? 'Σύνδεση...' : 'Σύνδεση →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6b7a8d' }}>
          Δεν έχετε λογαριασμό;{' '}
          <a href="/auth/register" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none' }}>Εγγραφή</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>← Επιστροφή στην αρχική</a>
        </div>
      </div>
    </div>
  );
}