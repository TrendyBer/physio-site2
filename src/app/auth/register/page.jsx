'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { HeartPulse, Stethoscope, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';
import { track, EV, captureUtm } from '@/lib/analytics';

/*
  ΔΗΜΙΟΥΡΓΙΑ ΛΟΓΑΡΙΑΣΜΟΥ — φάση 1 από 2

  Η σελίδα ζητάει ΜΟΝΟ ό,τι χρειάζεται για να υπάρξει λογαριασμός.
  Στόχος: 30–60 δευτερόλεπτα.

  ΔΕΝ ζητούνται εδώ (μεταφέρθηκαν στο onboarding):
    ειδικότητα · περιστατικά · περιοχές εξυπηρέτησης · άδεια ·
    πακέτο συνεργασίας · σύμβαση συνεργασίας · φωτογραφία · CV ·
    πιστοποιήσεις · IBAN · διαθεσιμότητα

  Η ΕΙΔΙΚΟΤΗΤΑ αφαιρέθηκε συνειδητά: ο θεραπευτής δηλώνει αναλυτικά
  ποια περιστατικά αναλαμβάνει στο βήμα 2 του onboarding. Δύο πεδία
  για το ίδιο πράγμα σημαίνει αντικρουόμενη πληροφορία στο matching.

  Η ΠΟΛΗ είναι ξεχωριστή οντότητα από τις περιοχές εξυπηρέτησης:
    Πόλη: Αθήνα  ·  Περιοχές: Κολωνάκι, Παγκράτι, Νέα Σμύρνη
*/

const TX = {
  el: {
    brandTitle: 'Δημιουργία Λογαριασμού',
    rolePatient: 'Ασθενής',
    roleTherapist: 'Θεραπευτής',
    step1Question: 'Τι θέλετε να κάνετε;',
    cardPatientTitle: 'Θέλω Φυσικοθεραπεία',
    cardPatientDesc: 'Εγγραφή ως ασθενής',
    cardTherapistTitle: 'Θέλω να Προσφέρω',
    cardTherapistDesc: 'Εγγραφή ως θεραπευτής',
    continue: 'Συνέχεια',
    back: 'Πίσω',

    fullName: 'Ονοματεπώνυμο',
    fullNamePh: 'Γιώργος Παπαδόπουλος',
    email: 'Email',
    city: 'Πόλη',
    cityPlaceholder: 'Επιλέξτε πόλη',
    cityHint: 'Τις συγκεκριμένες περιοχές που εξυπηρετείτε θα τις δηλώσετε στο επόμενο βήμα.',
    phone: 'Τηλέφωνο',
    phonePh: '+30 69...',
    addressLater: 'Τη διεύθυνσή σας θα τη ζητήσουμε μόνο όταν κλείσετε το πρώτο σας ραντεβού — και θα αποθηκευτεί για την επόμενη φορά.',
    password: 'Password',
    confirmPassword: 'Επιβεβαίωση',

    gdprA: 'Αποδέχομαι την',
    gdprLink: 'Πολιτική Απορρήτου',
    gdprB: 'και τη συλλογή προσωπικών δεδομένων σύμφωνα με τον GDPR',
    termsA: 'Αποδέχομαι τους',
    termsLink: 'Όρους Χρήσης',

    submit: 'Δημιουργία λογαριασμού',
    submitting: 'Δημιουργία...',
    freeNote: 'Η δημιουργία λογαριασμού είναι δωρεάν.',
    nextStepsTitle: 'Τι ακολουθεί',
    nextSteps: 'Μετά τη δημιουργία λογαριασμού, 5 σύντομα βήματα για να ενεργοποιήσετε το επαγγελματικό σας προφίλ.',

    haveAccount: 'Έχετε ήδη λογαριασμό;',
    login: 'Σύνδεση',

    errPasswordMatch: 'Τα passwords δεν ταιριάζουν',
    errPasswordShort: 'Το password πρέπει να έχει τουλάχιστον 6 χαρακτήρες',
    errCity: 'Επιλέξτε πόλη',
    errTerms: 'Πρέπει να αποδεχτείτε την Πολιτική Απορρήτου και τους Όρους Χρήσης',
    errUserCreate: 'Σφάλμα δημιουργίας χρήστη',
    errProfile: 'Σφάλμα προφίλ: ',
  },
  en: {
    brandTitle: 'Create Account',
    rolePatient: 'Patient',
    roleTherapist: 'Therapist',
    step1Question: 'What would you like to do?',
    cardPatientTitle: 'I Need Physiotherapy',
    cardPatientDesc: 'Register as a patient',
    cardTherapistTitle: 'I Want to Provide Care',
    cardTherapistDesc: 'Register as a therapist',
    continue: 'Continue',
    back: 'Back',

    fullName: 'Full Name',
    fullNamePh: 'John Smith',
    email: 'Email',
    city: 'City',
    cityPlaceholder: 'Select a city',
    cityHint: 'You will declare the specific areas you serve in the next step.',
    phone: 'Phone',
    phonePh: '+30 69...',
    addressLater: "We'll ask for your address only when you book your first appointment — and we'll save it for next time.",
    password: 'Password',
    confirmPassword: 'Confirm',

    gdprA: 'I accept the',
    gdprLink: 'Privacy Policy',
    gdprB: 'and the collection of personal data in accordance with GDPR',
    termsA: 'I accept the',
    termsLink: 'Terms of Use',

    submit: 'Create account',
    submitting: 'Creating...',
    freeNote: 'Creating an account is free.',
    nextStepsTitle: 'What comes next',
    nextSteps: 'After creating your account, 5 short steps to activate your professional profile.',

    haveAccount: 'Already have an account?',
    login: 'Sign in',

    errPasswordMatch: 'Passwords do not match',
    errPasswordShort: 'Password must be at least 6 characters',
    errCity: 'Please select a city',
    errTerms: 'You must accept the Privacy Policy and the Terms of Use',
    errUserCreate: 'Error creating user',
    errProfile: 'Profile error: ',
  },
};

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const preRole = searchParams.get('role');
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;

  const [role, setRole] = useState(preRole || '');
  const [step, setStep] = useState(preRole ? 2 : 1);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', cityId: '',
  });
  const [agreements, setAgreements] = useState({ gdpr: false, terms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cities, setCities] = useState([]);

  useEffect(() => {
    captureUtm();
    // Αν ήρθε από /become-therapist με ?role=therapist, το βήμα 1
    // παρακάμπτεται — το started πρέπει να πυροδοτηθεί εδώ.
    if (preRole) {
      track(preRole === 'therapist' ? EV.THERAPIST_SIGNUP_STARTED : EV.PATIENT_SIGNUP_STARTED);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cities')
        .select('id, code, name_el, name_en')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const list = data || [];
      setCities(list);
      // Όσο υπάρχει μία μόνο πόλη, την προεπιλέγουμε — δεν έχει νόημα
      // να αναγκάζουμε επιλογή από λίστα του ενός.
      if (list.length === 1) setForm(p => ({ ...p, cityId: list[0].id }));
    })();
  }, []);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updAgr = k => setAgreements(p => ({ ...p, [k]: !p[k] }));

  const cityLabel = (c) => (lang === 'en' ? (c.name_en || c.name_el) : c.name_el);

  function redirectAfterRegister(userRole) {
    if (userRole === 'therapist') {
      // Ο λογαριασμός υπάρχει — τώρα αρχίζει το επαγγελματικό προφίλ.
      window.location.href = '/onboarding/therapist';
      return;
    }

    let pending = null;
    try { pending = localStorage.getItem('pendingRedirect'); } catch (_) {}

    if (pending && (pending.startsWith('/dashboard/patient') || pending.startsWith('/free-assessment'))) {
      try { localStorage.removeItem('pendingRedirect'); } catch (_) {}
      window.location.href = pending;
      return;
    }
    try { localStorage.removeItem('pendingRedirect'); } catch (_) {}
    window.location.href = '/dashboard/patient?welcome=true';
  }

  async function handleRegister(e) {
    e.preventDefault();

    if (form.password.length < 6) { setError(tx.errPasswordShort); return; }
    if (form.password !== form.confirmPassword) { setError(tx.errPasswordMatch); return; }
    if (!agreements.gdpr || !agreements.terms) { setError(tx.errTerms); return; }
    if (role === 'therapist' && !form.cityId) { setError(tx.errCity); return; }

    setLoading(true); setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setError(tx.errUserCreate); setLoading(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) { setError(signInError.message); setLoading(false); return; }

    // upsert, ΟΧΙ insert: αν υπάρχει trigger που δημιουργεί ήδη τη γραμμή,
    // το insert θα έσκαγε σε duplicate key και τα στοιχεία θα χάνονταν σιωπηλά.
    const { error: upErr } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, role }, { onConflict: 'id' });
    if (upErr) { setError(tx.errProfile + upErr.message); setLoading(false); return; }

    if (role === 'therapist') {
      const { error: thErr } = await supabase.from('therapist_profiles').upsert({
        id: userId,
        name: form.name,
        city_id: form.cityId,
        gdpr_accepted: agreements.gdpr,
        terms_accepted: agreements.terms,
        terms_accepted_at: new Date().toISOString(),
        is_approved: false,
        application_status: 'incomplete',
      }, { onConflict: 'id' });
      if (thErr) { setError(tx.errProfile + thErr.message); setLoading(false); return; }

      // Ανοίγει η πρόοδος onboarding. Αν αποτύχει δεν μπλοκάρουμε —
      // η σελίδα onboarding τη δημιουργεί κι εκείνη αν λείπει.
      const { error: obErr } = await supabase.from('therapist_onboarding').upsert({
        therapist_id: userId,
        current_step: 1,
      }, { onConflict: 'therapist_id' });
      if (obErr) console.error('[register] onboarding row failed:', obErr);
    } else {
      const { error: paErr } = await supabase.from('patient_profiles').upsert({
        id: userId,
        name: form.name,
        phone: form.phone || null,
      }, { onConflict: 'id' });
      if (paErr) { setError(tx.errProfile + paErr.message); setLoading(false); return; }
    }

    track(role === 'therapist' ? EV.THERAPIST_SIGNUP_COMPLETED : EV.PATIENT_SIGNUP_COMPLETED, {
      user_id: userId,
      city_id: role === 'therapist' ? form.cityId : null,
    });

    redirectAfterRegister(role);
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44',
    background: '#fff',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 };

  const roleLabel = role === 'patient' ? tx.rolePatient : role === 'therapist' ? tx.roleTherapist : '';
  const RoleIcon = role === 'patient' ? HeartPulse : Stethoscope;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`
        .reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 520px) { .reg-row { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ background: '#fff', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 520, boxShadow: '0 8px 40px rgba(26,46,68,0.12)' }}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <LanguageSwitcher color="#94a3b8" hoverColor="#1a2e44" navHeight={0} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1a2e44', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
            PhysioHome
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2e44', margin: 0 }}>{tx.brandTitle}</h1>
          {roleLabel && (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#2a6fdb', padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
              <RoleIcon size={14} strokeWidth={2.2} />
              {roleLabel}
            </div>
          )}
        </div>

        {/* ══ ΒΗΜΑ 1: Ρόλος ══════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 15, color: '#6b7a8d', textAlign: 'center', marginBottom: 24 }}>{tx.step1Question}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { id: 'patient', Icon: HeartPulse, title: tx.cardPatientTitle, desc: tx.cardPatientDesc },
                { id: 'therapist', Icon: Stethoscope, title: tx.cardTherapistTitle, desc: tx.cardTherapistDesc },
              ].map(r => (
                <div key={r.id} onClick={() => setRole(r.id)}
                  style={{ padding: 20, border: `2px solid ${role === r.id ? '#2a6fdb' : '#e2e8f0'}`, borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: role === r.id ? '#EFF6FF' : '#fff', transition: 'all .2s' }}>
                  <r.Icon size={30} color={role === r.id ? '#2a6fdb' : '#94a3b8'} strokeWidth={1.8} style={{ marginBottom: 10 }} />
                  <div style={{ fontWeight: 700, color: '#1a2e44', marginBottom: 4, fontSize: 14 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7a8d' }}>{r.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => {
                if (!role) return;
                track(role === 'therapist' ? EV.THERAPIST_SIGNUP_STARTED : EV.PATIENT_SIGNUP_STARTED);
                setStep(2);
              }} disabled={!role}
              style={{ width: '100%', background: role ? '#1a2e44' : '#e2e8f0', color: role ? '#fff' : '#94a3b8', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: role ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {tx.continue}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ══ ΒΗΜΑ 2: Στοιχεία λογαριασμού ═══════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={labelStyle}>{tx.fullName} *</label>
              <input required value={form.name} onChange={e => upd('name', e.target.value)} style={inputStyle} placeholder={tx.fullNamePh} />
            </div>

            <div>
              <label style={labelStyle}>{tx.email} *</label>
              <input type="email" required value={form.email} onChange={e => upd('email', e.target.value)} style={inputStyle} />
            </div>

            {role === 'therapist' && (
              <div>
                <label style={labelStyle}>{tx.city} *</label>
                <select required value={form.cityId} onChange={e => upd('cityId', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{tx.cityPlaceholder}</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{cityLabel(c)}</option>)}
                </select>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
                  {tx.cityHint}
                </div>
              </div>
            )}

            {role === 'patient' && (
              <>
                <div>
                  <label style={labelStyle}>{tx.phone} *</label>
                  <input required value={form.phone} onChange={e => upd('phone', e.target.value)} style={inputStyle} placeholder={tx.phonePh} />
                </div>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '9px 12px', fontSize: 11.5, color: '#1D4ED8', lineHeight: 1.5, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <Lightbulb size={13} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>{tx.addressLater}</span>
                </div>
              </>
            )}

            <div className="reg-row">
              <div>
                <label style={labelStyle}>{tx.password} *</label>
                <input type="password" required value={form.password} onChange={e => upd('password', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{tx.confirmPassword} *</label>
                <input type="password" required value={form.confirmPassword} onChange={e => upd('confirmPassword', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Νομικά — ΜΟΝΟ αυτά τα δύο.
                Η Σύμβαση Συνεργασίας υπογράφεται στο βήμα 5 του onboarding,
                όταν ο θεραπευτής ξέρει ποιο πακέτο επιλέγει. */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
                <input type="checkbox" checked={agreements.gdpr} onChange={() => updAgr('gdpr')} style={{ marginTop: 2, accentColor: '#2a6fdb' }} />
                <span>
                  {tx.gdprA} <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.gdprLink}</a> {tx.gdprB}
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
                <input type="checkbox" checked={agreements.terms} onChange={() => updAgr('terms')} style={{ marginTop: 2, accentColor: '#2a6fdb' }} />
                <span>
                  {tx.termsA} <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.termsLink}</a>
                </span>
              </label>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {!preRole && (
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, background: 'transparent', color: '#64748b', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ArrowLeft size={15} />
                  {tx.back}
                </button>
              )}
              <button type="submit" disabled={loading}
                style={{ flex: 2, background: '#1a2e44', color: '#fff', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {loading ? tx.submitting : tx.submit}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#94a3b8' }}>
              {tx.freeNote}
            </div>

            {role === 'therapist' && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '11px 14px', fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
                <strong>{tx.nextStepsTitle}:</strong> {tx.nextSteps}
              </div>
            )}
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7a8d' }}>
          {tx.haveAccount}{' '}
          <a href="/auth/login" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none' }}>{tx.login}</a>
        </div>
      </div>
    </div>
  );
}