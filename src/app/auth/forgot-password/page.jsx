'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get the current origin so reset link goes back to our site
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
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

        {!submitted ? (
          <>
            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Mail size={28} color="#2a6fdb" strokeWidth={2.2} />
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', textAlign: 'center', marginBottom: 8 }}>
              Επαναφορά Password
            </h1>
            <p style={{ fontSize: 14, color: '#6b7a8d', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              Δώστε το email σας και θα σας στείλουμε σύνδεσμο για να ορίσετε νέο password.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
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
                {loading ? 'Αποστολή...' : 'Αποστολή Συνδέσμου →'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Success state */}
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} color="#15803D" strokeWidth={2.2} />
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', textAlign: 'center', marginBottom: 12 }}>
              Έλεγξε το email σου
            </h1>
            <p style={{ fontSize: 14, color: '#6b7a8d', textAlign: 'center', marginBottom: 24, lineHeight: 1.7 }}>
              Στείλαμε σύνδεσμο για επαναφορά password στο <strong style={{ color: '#1a2e44' }}>{email}</strong>.
              <br /><br />
              Πάτησε τον σύνδεσμο στο email για να ορίσεις νέο password. Ο σύνδεσμος ισχύει για 1 ώρα.
            </p>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#92400E', lineHeight: 1.5, marginBottom: 20 }}>
              <strong>Δεν λάβατε email;</strong> Ελέγξτε τον φάκελο spam/junk. Αν δεν το βρείτε, δοκιμάστε ξανά σε μερικά λεπτά.
            </div>

            <button
              onClick={() => { setSubmitted(false); setEmail(''); }}
              style={{ width: '100%', background: 'transparent', color: '#2a6fdb', padding: '11px', borderRadius: 30, fontSize: 13, fontWeight: 600, border: '1.5px solid #2a6fdb', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Στείλε ξανά σε άλλο email
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/auth/login" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={13} />
            Επιστροφή στη Σύνδεση
          </a>
        </div>
      </div>
    </div>
  );
}