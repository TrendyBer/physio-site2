'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) { setError(error.message); setLoading(false); return; }

    // Get role and redirect
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'therapist') router.push('/dashboard/therapist');
    else if (profile?.role === 'patient') router.push('/dashboard/patient');
    else if (profile?.role === 'admin') router.push('/admin');
    else router.push('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(26,46,68,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1a2e44', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
            PhysioHome
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', margin: 0 }}>Σύνδεση</h1>
          <p style={{ fontSize: 14, color: '#6b7a8d', marginTop: 6 }}>Καλώς ήρθατε πίσω</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' }}
              onFocus={e => e.target.style.borderColor = '#2a6fdb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' }}
              onFocus={e => e.target.style.borderColor = '#2a6fdb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
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