'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token from URL
    // Check if we have a valid session from the recovery link
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Wait a bit for Supabase to process the URL hash
        setTimeout(async () => {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2) {
            setSessionReady(true);
          } else {
            setInvalidLink(true);
          }
        }, 1000);
      }
    }
    checkSession();
  }, []);

  function validatePassword(pwd) {
    if (pwd.length < 8) return 'Το password πρέπει να έχει τουλάχιστον 8 χαρακτήρες.';
    if (!/[A-Za-z]/.test(pwd)) return 'Το password πρέπει να περιέχει τουλάχιστον ένα γράμμα.';
    if (!/[0-9]/.test(pwd)) return 'Το password πρέπει να περιέχει τουλάχιστον έναν αριθμό.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Τα passwords δεν ταιριάζουν.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after 3 seconds
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 3000);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <div style={{ background: '#fff', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(26,46,68,0.12)' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1a2e44', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
            PhysioHome
          </div>
        </div>

        {/* Invalid / expired link */}
        {invalidLink && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={32} color="#DC2626" strokeWidth={2.2} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', textAlign: 'center', marginBottom: 12 }}>
              Μη έγκυρος Σύνδεσμος
            </h1>
            <p style={{ fontSize: 14, color: '#6b7a8d', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              Ο σύνδεσμος επαναφοράς έχει λήξει ή δεν είναι έγκυρος. Ζητήστε νέο σύνδεσμο.
            </p>
            <a
              href="/auth/forgot-password"
              style={{ display: 'block', textAlign: 'center', background: '#1a2e44', color: '#fff', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Νέος Σύνδεσμος Επαναφοράς
            </a>
          </>
        )}

        {/* Success state */}
        {success && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} color="#15803D" strokeWidth={2.2} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', textAlign: 'center', marginBottom: 12 }}>
              Επιτυχής Αλλαγή!
            </h1>
            <p style={{ fontSize: 14, color: '#6b7a8d', textAlign: 'center', marginBottom: 8, lineHeight: 1.6 }}>
              Το password σας άλλαξε επιτυχώς.
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              Ανακατεύθυνση στη σελίδα σύνδεσης...
            </p>
          </>
        )}

        {/* Loading state */}
        {!sessionReady && !invalidLink && !success && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 14, color: '#6b7a8d' }}>Φόρτωση...</div>
          </div>
        )}

        {/* Reset form */}
        {sessionReady && !success && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Lock size={28} color="#2a6fdb" strokeWidth={2.2} />
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', textAlign: 'center', marginBottom: 8 }}>
              Νέο Password
            </h1>
            <p style={{ fontSize: 14, color: '#6b7a8d', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              Ορίστε ένα νέο password για τον λογαριασμό σας.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Νέο Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Τουλάχιστον 8 χαρακτήρες"
                    style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  Τουλάχιστον 8 χαρακτήρες, με γράμματα και αριθμούς.
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Επιβεβαίωση Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ξαναγράψε το password"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' }}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ background: '#1a2e44', color: '#fff', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: 4 }}
              >
                {loading ? 'Αλλαγή...' : 'Αλλαγή Password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}