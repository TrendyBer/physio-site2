'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

const CONTRACT_TEXT = `ΣΥΜΦΩΝΙΑ ΣΥΝΕΡΓΑΣΙΑΣ - PhysioHome

1. ΠΡΟΜΗΘΕΙΑ: Η πλατφόρμα χρεώνει €20 ανά ανατεθέν περιστατικό.
2. ΥΠΟΧΡΕΩΣΕΙΣ: Ο θεραπευτής δεσμεύεται να τηρεί τα ραντεβού που αποδέχεται.
3. ANTI-BYPASS: Απαγορεύεται αυστηρά η ιδιωτική συμφωνία με ασθενείς που αποκτήθηκαν μέσω της πλατφόρμας.
4. ΠΑΡΑΒΙΑΣΗ: Σε περίπτωση bypass, επιβάλλεται πρόστιμο και αποβολή από την πλατφόρμα.
5. GDPR: Ο θεραπευτής δεσμεύεται να τηρεί τον κανονισμό GDPR για τα δεδομένα των ασθενών.`;

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const preRole = searchParams.get('role');

  const [role, setRole] = useState(preRole || '');
  const [step, setStep] = useState(preRole ? 2 : 1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', specialty: '', area: '' });
  const [agreements, setAgreements] = useState({ gdpr: false, terms: false, contract: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updAgr = k => setAgreements(p => ({ ...p, [k]: !p[k] }));

  async function handleRegister(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Τα passwords δεν ταιριάζουν'); return; }
    if (role === 'therapist' && (!agreements.gdpr || !agreements.terms || !agreements.contract)) {
      setError('Πρέπει να αποδεχτείτε όλους τους όρους'); return;
    }
    if (role === 'patient' && !agreements.gdpr) {
      setError('Πρέπει να αποδεχτείτε την πολιτική GDPR'); return;
    }

    setLoading(true); setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } }
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setError('Σφάλμα δημιουργίας χρήστη'); setLoading(false); return; }

    // Auto sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) { setError(signInError.message); setLoading(false); return; }

    await supabase.from('user_profiles').insert([{ id: userId, role }]);

    if (role === 'therapist') {
      await supabase.from('therapist_profiles').insert([{
        id: userId, name: form.name, specialty: form.specialty, area: form.area,
        gdpr_accepted: agreements.gdpr, terms_accepted: agreements.terms,
        contract_accepted: agreements.contract, contract_accepted_at: new Date().toISOString(),
        is_approved: false,
      }]);
      window.location.href = '/dashboard/therapist?welcome=true';
    } else {
      await supabase.from('patient_profiles').insert([{ id: userId, name: form.name, phone: form.phone }]);
      window.location.href = '/dashboard/patient?welcome=true';
    }
    setLoading(false);
  }

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' };

  const roleLabel = role === 'patient' ? 'Ασθενής' : role === 'therapist' ? 'Θεραπευτής' : '';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 520, boxShadow: '0 8px 40px rgba(26,46,68,0.12)' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1a2e44', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
            PhysioHome
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', margin: 0 }}>Δημιουργία Λογαριασμού</h1>
          {roleLabel && <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#2a6fdb', padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>{role === 'patient' ? '🏥' : '👨‍⚕️'} {roleLabel}</div>}
        </div>

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 15, color: '#6b7a8d', textAlign: 'center', marginBottom: 24 }}>Τι θέλετε να κάνετε;</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { id: 'patient',   icon: '🏥', title: 'Θέλω Φυσιοθεραπεία',          desc: 'Εγγραφή ως ασθενής' },
                { id: 'therapist', icon: '👨‍⚕️', title: 'Θέλω να Προσφέρω', desc: 'Εγγραφή ως θεραπευτής' },
              ].map(r => (
                <div key={r.id} onClick={() => setRole(r.id)}
                  style={{ padding: 20, border: `2px solid ${role === r.id ? '#2a6fdb' : '#e2e8f0'}`, borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: role === r.id ? '#EFF6FF' : '#fff', transition: 'all .2s' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
                  <div style={{ fontWeight: 700, color: '#1a2e44', marginBottom: 4, fontSize: 14 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7a8d' }}>{r.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { if (role) setStep(2); }} disabled={!role}
              style={{ width: '100%', background: role ? '#1a2e44' : '#e2e8f0', color: role ? '#fff' : '#94a3b8', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: role ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Συνέχεια →
            </button>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Ονοματεπώνυμο *</label>
                <input required value={form.name} onChange={e => upd('name', e.target.value)} style={inputStyle} placeholder="Γιώργος Παπαδόπουλος" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Email *</label>
                <input type="email" required value={form.email} onChange={e => upd('email', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {role === 'therapist' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Ειδικότητα *</label>
                  <input required value={form.specialty} onChange={e => upd('specialty', e.target.value)} style={inputStyle} placeholder="π.χ. Ορθοπαιδική" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Περιοχή *</label>
                  <input required value={form.area} onChange={e => upd('area', e.target.value)} style={inputStyle} placeholder="π.χ. Αθήνα" />
                </div>
              </div>
            )}

            {role === 'patient' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Τηλέφωνο</label>
                <input value={form.phone} onChange={e => upd('phone', e.target.value)} style={inputStyle} placeholder="+30 69..." />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Password *</label>
                <input type="password" required value={form.password} onChange={e => upd('password', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Επιβεβαίωση *</label>
                <input type="password" required value={form.confirmPassword} onChange={e => upd('confirmPassword', e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
                <input type="checkbox" checked={agreements.gdpr} onChange={() => updAgr('gdpr')} style={{ marginTop: 2, accentColor: '#2a6fdb' }} />
                Αποδέχομαι την <a href="#" style={{ color: '#2a6fdb', fontWeight: 600 }}>Πολιτική GDPR</a> και τη συλλογή προσωπικών δεδομένων
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
                <input type="checkbox" checked={agreements.terms} onChange={() => updAgr('terms')} style={{ marginTop: 2, accentColor: '#2a6fdb' }} />
                Αποδέχομαι τους <a href="#" style={{ color: '#2a6fdb', fontWeight: 600 }}>Όρους Χρήσης</a>
              </label>
              {role === 'therapist' && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', marginBottom: 8 }}>
                    <input type="checkbox" checked={agreements.contract} onChange={() => updAgr('contract')} style={{ marginTop: 2, accentColor: '#2a6fdb' }} />
                    Αποδέχομαι ηλεκτρονικά τη <strong>Σύμβαση Συνεργασίας</strong> (anti-bypass, προμήθεια €20/περιστατικό)
                  </label>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#64748b', lineHeight: 1.6, maxHeight: 100, overflowY: 'auto', whiteSpace: 'pre-line' }}>
                    {CONTRACT_TEXT}
                  </div>
                </div>
              )}
            </div>

            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              {!preRole && (
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, background: 'transparent', color: '#64748b', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Πίσω
                </button>
              )}
              <button type="submit" disabled={loading}
                style={{ flex: 2, background: '#1a2e44', color: '#fff', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Δημιουργία...' : 'Δημιουργία Λογαριασμού →'}
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7a8d' }}>
          Έχετε ήδη λογαριασμό;{' '}
          <a href="/auth/login" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none' }}>Σύνδεση</a>
        </div>
      </div>
    </div>
  );
}