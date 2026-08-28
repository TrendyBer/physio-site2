'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import StepBasics from '@/components/onboarding/StepBasics';
import StepConditions from '@/components/onboarding/StepConditions';
import StepAreas from '@/components/onboarding/StepAreas';
import StepLicense from '@/components/onboarding/StepLicense';
import StepPlan from '@/components/onboarding/StepPlan';
import { Check, Cloud, LogOut, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

/*
  ONBOARDING ΘΕΡΑΠΕΥΤΗ — φάση 2 από 2

  Ο λογαριασμός υπάρχει ήδη. Εδώ χτίζεται το επαγγελματικό προφίλ
  σε 5 ξεκάθαρα βήματα.

  ΓΙΑΤΙ ΚΑΘΕ ΒΗΜΑ ΓΡΑΦΕΙ ΑΜΕΣΩΣ ΣΤΗ ΒΑΣΗ:
  Το «Συνέχεια» αποθηκεύει στους ΚΑΝΟΝΙΚΟΥΣ πίνακες, όχι σε προσωρινό
  buffer. Έτσι το resume δεν χρειάζεται να «ξεπακετάρει» τίποτα — απλά
  ξαναδιαβάζει το προφίλ. Το draft jsonb κρατάει μόνο ό,τι πληκτρολογεί
  αυτή τη στιγμή, για την περίπτωση που κλείσει ο browser στη μέση.
*/

const TOTAL_STEPS = 5;

const TX = {
  el: {
    welcome: (name) => `Καλώς ήρθες${name ? `, ${name}` : ''}`,
    intro: 'Για να εμφανιστεί το προφίλ σου στους ασθενείς, χρειάζονται μερικά ακόμη στοιχεία.',
    stepLabel: (n, total) => `Βήμα ${n} από ${total}`,
    autosave: 'Η πρόοδός σου αποθηκεύεται αυτόματα. Μπορείς να συνεχίσεις αργότερα.',
    saving: 'Αποθήκευση...',
    saved: 'Αποθηκεύτηκε',
    loading: 'Φόρτωση...',
    exit: 'Συνέχεια αργότερα',
    stepNames: ['Βασικά στοιχεία', 'Περιστατικά', 'Περιοχές', 'Άδεια', 'Πακέτο'],
    toDashboard: 'Μετάβαση στον πίνακα',
    doneTitle: 'Το προφίλ σου υποβλήθηκε για έλεγχο',
    doneBody: 'Η ομάδα μας θα ελέγξει την επαγγελματική σου άδεια. Συνήθως η διαδικασία ολοκληρώνεται μέσα σε 48 ώρες.',
    doneNext: 'Στο μεταξύ μπορείς να συμπληρώσεις επιπλέον στοιχεία ώστε το προφίλ σου να είναι πιο ολοκληρωμένο και ελκυστικό στους ασθενείς: φωτογραφία, βιογραφικό, σπουδές, πιστοποιήσεις και διαθεσιμότητα.',
    doneNoLicense: 'Δεν έχεις ανεβάσει ακόμα την άδεια ασκήσεως επαγγέλματος. Το προφίλ σου δεν θα εμφανίζεται στους ασθενείς μέχρι να την ανεβάσεις και να εγκριθεί — μπορείς να το κάνεις από τον πίνακά σου.',
    errSave: 'Δεν ήταν δυνατή η αποθήκευση: ',
  },
  en: {
    welcome: (name) => `Welcome${name ? `, ${name}` : ''}`,
    intro: 'A few more details are needed before your profile appears to patients.',
    stepLabel: (n, total) => `Step ${n} of ${total}`,
    autosave: 'Your progress is saved automatically. You can continue later.',
    saving: 'Saving...',
    saved: 'Saved',
    loading: 'Loading...',
    exit: 'Continue later',
    stepNames: ['Basic details', 'Cases', 'Areas', 'Licence', 'Plan'],
    toDashboard: 'Go to dashboard',
    doneTitle: 'Your profile has been submitted for review',
    doneBody: 'Our team will check your professional licence. This usually takes up to 48 hours.',
    doneNext: 'In the meantime you can add further details to make your profile fuller and more appealing to patients: photo, bio, education, certifications and availability.',
    doneNoLicense: "You haven't uploaded your professional licence yet. Your profile will not be shown to patients until it is uploaded and approved — you can do that from your dashboard.",
    errSave: 'Could not save: ',
  },
};

export default function TherapistOnboardingPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState([]);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState(null); // 'saving' | 'saved' | null
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const saveTimer = useRef(null);
  const topRef = useRef(null);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { router.replace('/auth/login'); return; }
    setUser(u);

    const { data: prof } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', u.id)
      .maybeSingle();
    setProfile(prof || { id: u.id });

    // Η γραμμή προόδου μπορεί να λείπει αν κάτι πήγε στραβά στην εγγραφή.
    // Τη δημιουργούμε εδώ αντί να αφήσουμε τον θεραπευτή σε λευκή σελίδα.
    let { data: ob } = await supabase
      .from('therapist_onboarding')
      .select('*')
      .eq('therapist_id', u.id)
      .maybeSingle();

    if (!ob) {
      const { data: created } = await supabase
        .from('therapist_onboarding')
        .upsert({ therapist_id: u.id, current_step: 1 }, { onConflict: 'therapist_id' })
        .select()
        .maybeSingle();
      ob = created;
    }

    if (ob?.completed_at) setDone(true);

    if (ob) {
      setStep(Math.min(Math.max(ob.current_step || 1, 1), TOTAL_STEPS));
      setCompleted(ob.completed_steps || []);
      setDraft(ob.draft || {});
    }

    setLoading(false);
  }

  // ── AUTOSAVE ────────────────────────────────────────────────────────
  // Debounce 800ms: ο θεραπευτής που γράφει τιμή συνεδρίας δεν πρέπει να
  // στέλνει ένα request ανά πληκτρολόγηση.
  const scheduleSave = useCallback((nextDraft) => {
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      const { error: err } = await supabase
        .from('therapist_onboarding')
        .update({ draft: nextDraft })
        .eq('therapist_id', user.id);
      setSaveState(err ? null : 'saved');
      if (err) console.error('[onboarding] autosave failed:', err);
      setTimeout(() => setSaveState(s => (s === 'saved' ? null : s)), 2000);
    }, 800);
  }, [user]);

  function patchDraft(partial) {
    setDraft(prev => {
      const next = { ...prev, ...partial };
      scheduleSave(next);
      return next;
    });
  }

  // ── ΜΕΤΑΒΑΣΗ ΒΗΜΑΤΟΣ ────────────────────────────────────────────────
  async function goToStep(next, markDone = null) {
    const target = Math.min(Math.max(next, 1), TOTAL_STEPS);
    const nextCompleted = markDone && !completed.includes(markDone)
      ? [...completed, markDone]
      : completed;

    setStep(target);
    setCompleted(nextCompleted);
    setError('');

    if (user) {
      const { error: err } = await supabase
        .from('therapist_onboarding')
        .update({ current_step: target, completed_steps: nextCompleted })
        .eq('therapist_id', user.id);
      if (err) setError(tx.errSave + err.message);
    }

    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function finish() {
    if (user) {
      await supabase
        .from('therapist_onboarding')
        .update({
          current_step: TOTAL_STEPS,
          completed_steps: [1, 2, 3, 4, 5],
          completed_at: new Date().toISOString(),
        })
        .eq('therapist_id', user.id);
    }
    await refreshProfile();
    setDone(true);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function refreshProfile() {
    if (!user) return;
    const { data } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f6', fontFamily: "'DM Sans', sans-serif", color: '#64748b' }}>
        {tx.loading}
      </div>
    );
  }

  const firstName = (profile?.name || '').split(' ')[0] || '';
  const pct = Math.round(((step - 1) / TOTAL_STEPS) * 100);

  const stepProps = {
    lang,
    profile,
    userId: user?.id,
    draft,
    patchDraft,
    refreshProfile,
    onBack: () => goToStep(step - 1),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f6', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ob-steps { display: flex; gap: 6px; flex-wrap: wrap; }
        .ob-actions { display: flex; gap: 10px; align-items: center; }
        @media (max-width: 560px) {
          .ob-step-name { display: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 700, color: '#1a2e44', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
            PhysioHome
          </span>
          <div className="ob-actions">
            {saveState && (
              <span style={{ fontSize: 12, color: saveState === 'saved' ? '#15803D' : '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {saveState === 'saved' ? <Check size={13} strokeWidth={3} /> : <Cloud size={13} />}
                {saveState === 'saved' ? tx.saved : tx.saving}
              </span>
            )}
            <LanguageSwitcher color="#94a3b8" hoverColor="#1a2e44" navHeight={62} />
            <a href="/dashboard/therapist"
              style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none', border: '1px solid #e2e8f0', borderRadius: 20, padding: '7px 15px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <LogOut size={13} />
              {tx.exit}
            </a>
          </div>
        </div>
      </div>

      <div ref={topRef} style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px 60px', scrollMarginTop: 20 }}>

        {done ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={30} color="#15803D" strokeWidth={2.1} />
            </div>

            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(21px, 3vw, 27px)', color: '#1a2e44', marginBottom: 12 }}>
              {tx.doneTitle}
            </h1>

            <p style={{ fontSize: 14.5, color: '#6b7a8d', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 24px' }}>
              {tx.doneBody}
            </p>

            {/* Αν δεν ανέβασε άδεια στο βήμα 4, δεν το κρύβουμε:
                χωρίς αυτήν το προφίλ δεν γίνεται ποτέ ορατό. */}
            {!profile?.license_url && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '13px 16px', marginBottom: 20, textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: 520, margin: '0 auto 20px' }}>
                <Clock size={15} color="#B45309" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.6 }}>{tx.doneNoLicense}</span>
              </div>
            )}

            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', fontSize: 13, color: '#64748b', lineHeight: 1.7, textAlign: 'left', maxWidth: 520, margin: '0 auto 26px' }}>
              {tx.doneNext}
            </div>

            <a href="/dashboard/therapist"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '14px 34px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              {tx.toDashboard}
              <ArrowRight size={17} />
            </a>
          </div>
        ) : (
        <>
        {/* Καλωσόρισμα */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 32px)', color: '#1a2e44', marginBottom: 8 }}>
            {tx.welcome(firstName)}
          </h1>
          <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.6 }}>{tx.intro}</p>
        </div>

        {/* Πρόοδος */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44' }}>
              {tx.stepLabel(step, TOTAL_STEPS)}
            </span>
            <span className="ob-step-name" style={{ fontSize: 13, color: '#6b7a8d' }}>
              {tx.stepNames[step - 1]}
            </span>
          </div>

          <div style={{ height: 7, background: '#f1f5f9', borderRadius: 30, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#2a6fdb', borderRadius: 30, transition: 'width .35s ease' }} />
          </div>

          <div className="ob-steps">
            {tx.stepNames.map((name, i) => {
              const n = i + 1;
              const isDone = completed.includes(n);
              const isCurrent = step === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { if (isDone || n < step) goToStep(n); }}
                  disabled={!isDone && n >= step}
                  style={{
                    fontSize: 11.5, fontWeight: 600, padding: '5px 11px', borderRadius: 20,
                    border: `1px solid ${isCurrent ? '#2a6fdb' : isDone ? '#BBF7D0' : '#e2e8f0'}`,
                    background: isCurrent ? '#EFF6FF' : isDone ? '#F0FDF4' : '#fff',
                    color: isCurrent ? '#1D4ED8' : isDone ? '#15803D' : '#94a3b8',
                    cursor: (isDone || n < step) ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {isDone && <Check size={11} strokeWidth={3} />}
                  {n}. {name}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '11px 15px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Βήματα */}
        {step === 1 && <StepBasics {...stepProps} onNext={() => goToStep(2, 1)} />}
        {step === 2 && <StepConditions {...stepProps} onNext={() => goToStep(3, 2)} />}
        {step === 3 && <StepAreas {...stepProps} onNext={() => goToStep(4, 3)} />}

        {step === 4 && <StepLicense {...stepProps} onNext={() => goToStep(5, 4)} />}
        {step === 5 && <StepPlan {...stepProps} onDone={finish} />}

        <div style={{ marginTop: 20, fontSize: 12.5, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
          {tx.autosave}
        </div>
        </>
        )}
      </div>
    </div>
  );
}