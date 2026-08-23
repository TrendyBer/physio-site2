'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ConditionPicker from '@/components/ConditionPicker';
import { HeartPulse, Stethoscope, Check, Info, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';

const DEFAULT_FEE = 10;
const DEFAULT_RESET_MONTHS = 12;
const MIN_CONDITIONS = 3;

// Το συμβόλαιο χτίζεται ΔΥΝΑΜΙΚΑ από τα στοιχεία του πακέτου που επέλεξε.
// Αν αλλάξεις τιμές στο admin, το κείμενο ακολουθεί — χωρίς deploy.
const CONTRACTS = {
  el: ({ planName, price, fee, resetMonths }) => `ΣΥΜΦΩΝΙΑ ΣΥΝΕΡΓΑΣΙΑΣ - PhysioHome

1. ΣΥΝΔΡΟΜΗ: Ο θεραπευτής εγγράφεται στο πακέτο «${planName}»${price > 0 ? ` με μηνιαία συνδρομή €${price}.` : ' — χωρίς μηνιαία χρέωση.'}

2. ΠΡΟΜΗΘΕΙΑ ΠΡΩΤΗΣ ΣΥΝΕΔΡΙΑΣ: Η πλατφόρμα παρακρατεί €${fee} μία και μόνη φορά, στην πρώτη συνεδρία με κάθε νέο ασθενή.

3. ΕΠΟΜΕΝΕΣ ΣΥΝΕΔΡΙΕΣ: Για όλες τις επόμενες συνεδρίες με τον ίδιο ασθενή — είτε μεμονωμένες είτε σε πακέτο — ΔΕΝ παρακρατείται καμία προμήθεια.

4. ΕΠΑΝΕΝΕΡΓΟΠΟΙΗΣΗ: Αν ασθενής επιστρέψει μετά από ${resetMonths} μήνες χωρίς συνεδρία, θεωρείται νέα συνεργασία και η προμήθεια εφαρμόζεται ξανά.

5. ΑΛΛΑΓΗ ΠΑΚΕΤΟΥ: Ο θεραπευτής μπορεί να αλλάξει πακέτο οποτεδήποτε από τον πίνακά του. Οι τιμές που ισχύουν σήμερα κλειδώνονται και δεν επηρεάζονται από μελλοντικές αυξήσεις.

6. ΥΠΟΧΡΕΩΣΕΙΣ: Ο θεραπευτής δεσμεύεται να τηρεί τα ραντεβού που αποδέχεται.

7. ANTI-BYPASS: Απαγορεύεται αυστηρά η ιδιωτική συμφωνία με ασθενείς που αποκτήθηκαν μέσω της πλατφόρμας.

8. ΠΑΡΑΒΙΑΣΗ: Σε περίπτωση bypass, επιβάλλεται πρόστιμο και αποβολή από την πλατφόρμα.

9. GDPR: Ο θεραπευτής δεσμεύεται να τηρεί τον κανονισμό GDPR για τα δεδομένα των ασθενών.`,

  en: ({ planName, price, fee, resetMonths }) => `PARTNERSHIP AGREEMENT - PhysioHome

1. SUBSCRIPTION: The therapist subscribes to the "${planName}" plan${price > 0 ? ` with a monthly fee of €${price}.` : ' — with no monthly charge.'}

2. FIRST-SESSION COMMISSION: The platform retains €${fee} once only, on the first session with each new patient.

3. SUBSEQUENT SESSIONS: For all further sessions with the same patient — whether single or part of a package — NO commission is retained.

4. REACTIVATION: If a patient returns after ${resetMonths} months without a session, this counts as a new partnership and the commission applies again.

5. CHANGING PLANS: The therapist may change plan at any time from their dashboard. Today's rates are locked in and are not affected by future increases.

6. OBLIGATIONS: The therapist commits to honouring the appointments they accept.

7. ANTI-BYPASS: Private arrangements with patients acquired through the platform are strictly prohibited.

8. BREACH: In case of bypass, a penalty is imposed and the therapist is removed from the platform.

9. GDPR: The therapist commits to complying with GDPR regulations regarding patient data.`,
};

const TX = {
  el: {
    brandTitle: 'Δημιουργία Λογαριασμού',
    rolePatient: 'Ασθενής',
    roleTherapist: 'Θεραπευτής',
    step1Question: 'Τι θέλετε να κάνετε;',
    cardPatientTitle: 'Θέλω Φυσιοθεραπεία',
    cardPatientDesc: 'Εγγραφή ως ασθενής',
    cardTherapistTitle: 'Θέλω να Προσφέρω',
    cardTherapistDesc: 'Εγγραφή ως θεραπευτής',
    continue: 'Συνέχεια',
    back: 'Πίσω',
    fullName: 'Ονοματεπώνυμο',
    fullNamePh: 'Γιώργος Παπαδόπουλος',
    email: 'Email',
    specialty: 'Ειδικότητα',
    specialtyPh: 'π.χ. Ορθοπαιδική',
    area: 'Περιοχή',
    areaTherapistPh: 'π.χ. Αθήνα',
    areaPatientPh: 'π.χ. Παγκράτι',
    phone: 'Τηλέφωνο',
    phonePh: '+30 69...',
    address: 'Διεύθυνση',
    addressPh: 'π.χ. Λεωφ. Κηφισίας 100 (προαιρετικό)',
    city: 'Πόλη',
    cityPh: 'π.χ. Αθήνα',
    postal: 'ΤΚ',
    postalPh: '11528',
    addressHint: 'Η διεύθυνση και ο ΤΚ μπορούν να συμπληρωθούν αργότερα από το προφίλ σας — απαιτούνται όταν κλείνετε ραντεβού.',
    password: 'Password',
    confirmPassword: 'Επιβεβαίωση',
    planTitle: 'Επιλέξτε πακέτο συνεργασίας',
    planSubtitle: 'Μπορείτε να το αλλάξετε οποτεδήποτε από τον πίνακά σας.',
    planFee: 'Προμήθεια 1ης συνεδρίας:',
    free: 'Δωρεάν',
    perMonth: '/μήνα',
    planSummaryA: 'Πληρώνετε',
    planSummaryB: 'μόνο την πρώτη φορά που θα δείτε έναν ασθενή. Σε κάθε επόμενη συνεδρία μαζί του,',
    planSummaryC: 'κρατάτε ολόκληρη την αμοιβή σας',
    trialNote: (d) => ` Οι πρώτες ${d} ημέρες συνδρομής είναι δωρεάν.`,
    gdprA: 'Αποδέχομαι την',
    gdprLink: 'Πολιτική Απορρήτου',
    gdprB: 'και τη συλλογή προσωπικών δεδομένων σύμφωνα με τον GDPR',
    termsA: 'Αποδέχομαι τους',
    termsLink: 'Όρους Χρήσης',
    contractA: 'Αποδέχομαι ηλεκτρονικά τη',
    contractStrong: 'Σύμβαση Συνεργασίας',
    contractPlan: (name, price, fee) =>
      ` — πακέτο «${name}»${price > 0 ? `, ${price}€/μήνα` : ' (δωρεάν)'}, προμήθεια ${fee}€ στην 1η συνεδρία κάθε νέου ασθενή`,
    submit: 'Δημιουργία Λογαριασμού',
    submitting: 'Δημιουργία...',
    haveAccount: 'Έχετε ήδη λογαριασμό;',
    login: 'Σύνδεση',
    errPasswordMatch: 'Τα passwords δεν ταιριάζουν',
    errAllTerms: 'Πρέπει να αποδεχτείτε όλους τους όρους',
    errPickPlan: 'Επιλέξτε πακέτο συνεργασίας για να συνεχίσετε',
    errConditions: (n) => `Επιλέξτε τουλάχιστον ${n} παθήσεις που θεραπεύετε`,
    conditionsWhy: 'Χωρίς αυτές δεν θα εμφανίζεστε στις αναζητήσεις των ασθενών.',
    errPatientTerms: 'Πρέπει να αποδεχτείτε την πολιτική GDPR και τους Όρους Χρήσης',
    errUserCreate: 'Σφάλμα δημιουργίας χρήστη',
    errProfile: 'Σφάλμα προφίλ: ',
    errTherapistProfile: 'Σφάλμα προφίλ θεραπευτή: ',
    defaultPlanName: 'Βασικό',
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
    specialty: 'Specialty',
    specialtyPh: 'e.g. Orthopaedics',
    area: 'Area',
    areaTherapistPh: 'e.g. Athens',
    areaPatientPh: 'e.g. Pangrati',
    phone: 'Phone',
    phonePh: '+30 69...',
    address: 'Address',
    addressPh: 'e.g. 100 Kifisias Ave (optional)',
    city: 'City',
    cityPh: 'e.g. Athens',
    postal: 'Postcode',
    postalPh: '11528',
    addressHint: 'Address and postcode can be filled in later from your profile — they are required when booking an appointment.',
    password: 'Password',
    confirmPassword: 'Confirm',
    planTitle: 'Choose your partnership plan',
    planSubtitle: 'You can change it at any time from your dashboard.',
    planFee: 'First-session commission:',
    free: 'Free',
    perMonth: '/month',
    planSummaryA: 'You pay',
    planSummaryB: 'only the first time you see a patient. For every session after that,',
    planSummaryC: 'you keep your full fee',
    trialNote: (d) => ` The first ${d} days of your subscription are free.`,
    gdprA: 'I accept the',
    gdprLink: 'Privacy Policy',
    gdprB: 'and the collection of personal data in accordance with GDPR',
    termsA: 'I accept the',
    termsLink: 'Terms of Use',
    contractA: 'I electronically accept the',
    contractStrong: 'Partnership Agreement',
    contractPlan: (name, price, fee) =>
      ` — "${name}" plan${price > 0 ? `, €${price}/month` : ' (free)'}, €${fee} commission on the first session with each new patient`,
    submit: 'Create Account',
    submitting: 'Creating...',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    errPasswordMatch: 'Passwords do not match',
    errAllTerms: 'You must accept all the terms',
    errPickPlan: 'Choose a partnership plan to continue',
    errConditions: (n) => `Select at least ${n} conditions you treat`,
    conditionsWhy: 'Without these you will not appear in patient searches.',
    errPatientTerms: 'You must accept the GDPR policy and the Terms of Use',
    errUserCreate: 'Error creating user',
    errProfile: 'Profile error: ',
    errTherapistProfile: 'Therapist profile error: ',
    defaultPlanName: 'Basic',
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
    phone: '', specialty: '', area: '', address: '', city: '', postal_code: '',
  });
  const [agreements, setAgreements] = useState({ gdpr: false, terms: false, contract: false });
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Συνδρομές
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [defaultFee, setDefaultFee] = useState(DEFAULT_FEE);
  const [resetMonths, setResetMonths] = useState(DEFAULT_RESET_MONTHS);
  const [trialDays, setTrialDays] = useState(0);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: planRows }, { data: cfg }] = await Promise.all([
        supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', ['first_session_fee_default', 'first_session_reset_months', 'subscription_trial_days', 'signup_default_plan']),
      ]);

      const map = {};
      (cfg || []).forEach(r => { map[r.key] = r.value; });

      setDefaultFee(Number(map.first_session_fee_default) || DEFAULT_FEE);
      setResetMonths(parseInt(map.first_session_reset_months, 10) || DEFAULT_RESET_MONTHS);
      setTrialDays(parseInt(map.subscription_trial_days, 10) || 0);

      const list = planRows || [];
      setPlans(list);

      // Προεπιλογή: το πακέτο που ορίζει το admin, αλλιώς το φθηνότερο
      const preferred = list.find(p => p.code === (map.signup_default_plan || 'basic'));
      const cheapest = [...list].sort((a, b) => Number(a.price_monthly) - Number(b.price_monthly))[0];
      setSelectedPlanId((preferred || cheapest)?.id || null);

      setPlansLoading(false);
    })();
  }, []);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updAgr = k => setAgreements(p => ({ ...p, [k]: !p[k] }));

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || null;
  const planPrice = Number(selectedPlan?.price_monthly || 0);
  const planFee = selectedPlan ? Number(selectedPlan.first_session_fee) : defaultFee;

  // Το όνομα του πακέτου ακολουθεί τη γλώσσα, με fallback στο ελληνικό
  const planName = (lang === 'en'
    ? (selectedPlan?.name_en || selectedPlan?.name_el)
    : selectedPlan?.name_el) || tx.defaultPlanName;

  function planLabel(p) {
    return (lang === 'en' ? (p.name_en || p.name_el) : p.name_el) || '';
  }
  function planDesc(p) {
    return (lang === 'en' ? (p.description_en || p.description_el) : p.description_el) || '';
  }
  function planFeatures(p) {
    const arr = lang === 'en' ? p.features_en : p.features_el;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return Array.isArray(p.features_el) ? p.features_el : [];
  }

  function redirectAfterRegister(userRole) {
    let pending = null;
    try { pending = localStorage.getItem('pendingRedirect'); } catch (_) {}

    const defaultDest = userRole === 'therapist'
      ? '/dashboard/therapist?welcome=true'
      : '/dashboard/patient?welcome=true';

    if (pending) {
      try { localStorage.removeItem('pendingRedirect'); } catch (_) {}

      const isPatientRoute = pending.startsWith('/dashboard/patient') || pending.startsWith('/free-assessment');
      const isTherapistRoute = pending.startsWith('/dashboard/therapist');

      if (userRole === 'patient' && isTherapistRoute) { window.location.href = defaultDest; return; }
      if (userRole === 'therapist' && isPatientRoute) { window.location.href = defaultDest; return; }

      window.location.href = pending;
      return;
    }

    window.location.href = defaultDest;
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError(tx.errPasswordMatch); return; }

    if (role === 'therapist') {
      if (!agreements.gdpr || !agreements.terms || !agreements.contract) {
        setError(tx.errAllTerms); return;
      }
      if (plans.length > 0 && !selectedPlanId) {
        setError(tx.errPickPlan); return;
      }
      if (selectedConditions.length < MIN_CONDITIONS) {
        setError(tx.errConditions(MIN_CONDITIONS)); return;
      }
    }
    if (role === 'patient' && (!agreements.gdpr || !agreements.terms)) {
      setError(tx.errPatientTerms); return;
    }

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

    // ΠΡΟΣΟΧΗ: upsert, ΟΧΙ insert.
    // Αν υπάρχει trigger στη βάση που δημιουργεί ήδη τη γραμμή προφίλ,
    // το insert θα έσκαγε σε duplicate key και τα στοιχεία θα χάνονταν
    // σιωπηλά — ο θεραπευτής θα έβρισκε άδειο προφίλ.
    const { error: upErr } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, role }, { onConflict: 'id' });
    if (upErr) { setError(tx.errProfile + upErr.message); setLoading(false); return; }

    if (role === 'therapist') {
      const { error: thErr } = await supabase.from('therapist_profiles').upsert({
        id: userId,
        name: form.name,
        specialty: form.specialty,
        area: form.area,
        gdpr_accepted: agreements.gdpr,
        terms_accepted: agreements.terms,
        contract_accepted: agreements.contract,
        contract_accepted_at: new Date().toISOString(),
        is_approved: false,
      }, { onConflict: 'id' });
      if (thErr) { setError(tx.errTherapistProfile + thErr.message); setLoading(false); return; }

      // ── ΠΑΘΗΣΕΙΣ ──────────────────────────────────────────────────────
      // Γράφονται ΕΔΩ, όχι στο dashboard. Είναι ένα από τα 9 υποχρεωτικά
      // του calc_profile_completeness (>= 3), και μέχρι τώρα κανένας
      // θεραπευτής δεν το συμπλήρωνε γιατί ήταν κρυμμένο σε tab.
      if (selectedConditions.length > 0) {
        const rows = selectedConditions.map(cid => ({
          therapist_id: userId,
          condition_id: cid,
        }));
        const { error: condErr } = await supabase
          .from('therapist_conditions')
          .insert(rows);
        // Δεν μπλοκάρουμε την εγγραφή αν αποτύχει — ο θεραπευτής μπορεί
        // να τις προσθέσει από τον πίνακά του.
        if (condErr) console.error('[register] conditions insert failed:', condErr);
      }

      // ── ΣΥΝΔΡΟΜΗ ──────────────────────────────────────────────────────
      // Οι τιμές κλειδώνονται ΤΩΡΑ. Αν αύριο ανέβει η τιμή του πακέτου,
      // αυτός ο θεραπευτής μένει σε ό,τι συμφώνησε σήμερα.
      if (selectedPlan) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const isPaid = planPrice > 0;
        const trialEnds = isPaid && trialDays > 0
          ? new Date(now.getTime() + trialDays * 86400000)
          : null;

        // Αν υπάρχει ήδη ενεργή συνδρομή (π.χ. από trigger), μην τη διπλασιάσεις.
        const { data: existingSub } = await supabase
          .from('therapist_subscriptions')
          .select('id')
          .eq('therapist_id', userId)
          .in('status', ['trialing', 'active', 'past_due', 'exempt'])
          .limit(1);

        if (!existingSub || existingSub.length === 0) {
          await supabase.from('therapist_subscriptions').insert([{
            therapist_id: userId,
            plan_id: selectedPlan.id,
            status: trialEnds ? 'trialing' : 'active',
            billing_interval: 'monthly',
            price_locked: planPrice,
            first_session_fee_locked: planFee,
            started_at: now.toISOString(),
            trial_ends_at: trialEnds ? trialEnds.toISOString() : null,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }]);
        }
      }
    } else {
      const { error: paErr } = await supabase.from('patient_profiles').upsert({
        id: userId,
        name: form.name,
        phone: form.phone || null,
        area: form.area || null,
        address: form.address || null,
        city: form.city || null,
        postal_code: form.postal_code || null,
      }, { onConflict: 'id' });
      if (paErr) { setError(tx.errProfile + paErr.message); setLoading(false); return; }
    }

    redirectAfterRegister(role);
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 };

  const roleLabel = role === 'patient' ? tx.rolePatient : role === 'therapist' ? tx.roleTherapist : '';
  const RoleIcon = role === 'patient' ? HeartPulse : Stethoscope;

  const buildContract = CONTRACTS[lang] || CONTRACTS.el;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px', width: '100%', maxWidth: role === 'therapist' ? 620 : 520, boxShadow: '0 8px 40px rgba(26,46,68,0.12)' }}>

        {/* Language switcher — η σελίδα δεν έχει Navbar */}
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
            <button onClick={() => { if (role) setStep(2); }} disabled={!role}
              style={{ width: '100%', background: role ? '#1a2e44' : '#e2e8f0', color: role ? '#fff' : '#94a3b8', padding: '13px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: role ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {tx.continue}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ══ ΒΗΜΑ 2: Φόρμα ══════════════════════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{tx.fullName} *</label>
                <input required value={form.name} onChange={e => upd('name', e.target.value)} style={inputStyle} placeholder={tx.fullNamePh} />
              </div>
              <div>
                <label style={labelStyle}>{tx.email} *</label>
                <input type="email" required value={form.email} onChange={e => upd('email', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {role === 'therapist' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>{tx.specialty} *</label>
                  <input required value={form.specialty} onChange={e => upd('specialty', e.target.value)} style={inputStyle} placeholder={tx.specialtyPh} />
                </div>
                <div>
                  <label style={labelStyle}>{tx.area} *</label>
                  <input required value={form.area} onChange={e => upd('area', e.target.value)} style={inputStyle} placeholder={tx.areaTherapistPh} />
                </div>
              </div>
            )}

            {role === 'patient' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>{tx.phone} *</label>
                    <input required value={form.phone} onChange={e => upd('phone', e.target.value)} style={inputStyle} placeholder={tx.phonePh} />
                  </div>
                  <div>
                    <label style={labelStyle}>{tx.area} *</label>
                    <input required value={form.area} onChange={e => upd('area', e.target.value)} style={inputStyle} placeholder={tx.areaPatientPh} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{tx.address}</label>
                  <input value={form.address} onChange={e => upd('address', e.target.value)} style={inputStyle} placeholder={tx.addressPh} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>{tx.city}</label>
                    <input value={form.city} onChange={e => upd('city', e.target.value)} style={inputStyle} placeholder={tx.cityPh} />
                  </div>
                  <div>
                    <label style={labelStyle}>{tx.postal}</label>
                    <input value={form.postal_code} onChange={e => upd('postal_code', e.target.value)} style={inputStyle} placeholder={tx.postalPh} />
                  </div>
                </div>

                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '9px 12px', fontSize: 11, color: '#1D4ED8', lineHeight: 1.5, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <Lightbulb size={13} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>{tx.addressHint}</span>
                </div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{tx.password} *</label>
                <input type="password" required value={form.password} onChange={e => upd('password', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{tx.confirmPassword} *</label>
                <input type="password" required value={form.confirmPassword} onChange={e => upd('confirmPassword', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* ══ ΕΠΙΛΟΓΗ ΠΑΚΕΤΟΥ ══════════════════════════════════════ */}
            {role === 'therapist' && !plansLoading && plans.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>
                  {tx.planTitle}
                </div>
                <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 14, lineHeight: 1.6 }}>
                  {tx.planSubtitle}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plans.map(p => {
                    const isSel = selectedPlanId === p.id;
                    const price = Number(p.price_monthly || 0);
                    const feats = planFeatures(p);
                    const desc = planDesc(p);
                    return (
                      <div key={p.id} onClick={() => setSelectedPlanId(p.id)}
                        style={{
                          padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
                          border: `2px solid ${isSel ? '#2a6fdb' : '#e2e8f0'}`,
                          background: isSel ? '#EFF6FF' : '#fff', transition: 'all .2s',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2e44' }}>{planLabel(p)}</span>
                              {p.badge_label && (
                                <span style={{ background: '#2a6fdb', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                  {p.badge_label}
                                </span>
                              )}
                            </div>
                            {desc && (
                              <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 6, lineHeight: 1.5 }}>{desc}</div>
                            )}
                            <div style={{ fontSize: 12, color: '#2a6fdb', fontWeight: 600 }}>
                              {tx.planFee} {Number(p.first_session_fee)}€
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: price === 0 ? '#15803D' : '#1a2e44' }}>
                              {price === 0 ? tx.free : `${price}€`}
                            </div>
                            {price > 0 && <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.perMonth}</div>}
                          </div>

                          {isSel && <Check size={18} color="#2a6fdb" strokeWidth={3} style={{ marginTop: 2 }} />}
                        </div>

                        {feats.length > 0 && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {feats.slice(0, 4).map((f, i) => (
                              <span key={i} style={{ fontSize: 11, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Check size={11} color="#15803D" strokeWidth={3} />
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedPlan && (
                  <div style={{ marginTop: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#15803D', lineHeight: 1.65, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Info size={14} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span>
                      {tx.planSummaryA} <strong>{planFee}€</strong> {tx.planSummaryB}{' '}
                      <strong>{tx.planSummaryC}</strong>.
                      {planPrice > 0 && trialDays > 0 && tx.trialNote(trialDays)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ══ ΠΑΘΗΣΕΙΣ ═════════════════════════════════════════════ */}
            {role === 'therapist' && (
              <div style={{ marginTop: 6, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
                <ConditionPicker
                  value={selectedConditions}
                  onChange={setSelectedConditions}
                  lang={lang}
                  specialty={form.specialty}
                  minRequired={MIN_CONDITIONS}
                  showDemand={false}
                  compact
                />
                <div style={{ marginTop: 10, fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <Info size={13} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>{tx.conditionsWhy}</span>
                </div>
              </div>
            )}

            {/* ══ ΟΡΟΙ ══════════════════════════════════════════════════ */}
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

              {role === 'therapist' && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', marginBottom: 8 }}>
                    <input type="checkbox" checked={agreements.contract} onChange={() => updAgr('contract')} style={{ marginTop: 2, accentColor: '#2a6fdb' }} />
                    <span>
                      {tx.contractA} <strong>{tx.contractStrong}</strong>
                      {selectedPlan && tx.contractPlan(planName, planPrice, planFee)}
                    </span>
                  </label>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#64748b', lineHeight: 1.7, maxHeight: 130, overflowY: 'auto', whiteSpace: 'pre-line' }}>
                    {buildContract({
                      planName,
                      price: planPrice,
                      fee: planFee,
                      resetMonths,
                    })}
                  </div>
                </div>
              )}
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