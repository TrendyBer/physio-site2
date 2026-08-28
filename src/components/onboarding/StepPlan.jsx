'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Check, Tag, X, Info, Star, Send } from 'lucide-react';

/*
  ΒΗΜΑ 5 — Πακέτο συνεργασίας, κωδικός προσφοράς, σύμβαση

  ΔΥΟ ΑΡΧΕΣ ΠΟΥ ΔΙΕΠΟΥΝ ΟΛΟ ΤΟ ΒΗΜΑ:

  1. Ο υπολογισμός της έκπτωσης δεν γίνεται ΠΟΤΕ εδώ.
     Το «Εφαρμογή» καλεί evaluate_promo_code στη βάση — την ΙΔΙΑ συνάρτηση
     που τρέχει και η activate_subscription. Αν υπολογίζαμε εδώ, ο
     θεραπευτής θα έβλεπε μια τιμή και θα χρεωνόταν άλλη.

  2. Η ενεργοποίηση είναι ΜΙΑ ατομική πράξη στη βάση.
     Η activate_subscription παγώνει πακέτο, προσφορά και σύμβαση μαζί.
     Αλλαγή τιμής στο admin αύριο δεν αγγίζει αυτή τη συμφωνία.
*/

const AGREEMENT_VERSION = 'v1';

const CONTRACTS = {
  el: ({ planName, price, fee, promo }) => `ΣΥΜΒΑΣΗ ΣΥΝΕΡΓΑΣΙΑΣ — PhysioHome (έκδοση ${AGREEMENT_VERSION})

1. ΠΑΚΕΤΟ: Ο θεραπευτής εντάσσεται στο πακέτο «${planName}»${price > 0 ? ` με μηνιαία συνδρομή €${price}.` : ' — χωρίς μηνιαία χρέωση.'}

2. ΤΕΛΟΣ ΝΕΟΥ ΑΣΘΕΝΗ: Η πλατφόρμα χρεώνει €${fee} μία και μόνη φορά, για την πρώτη συνεδρία με κάθε νέο ασθενή.

3. ΕΠΟΜΕΝΕΣ ΣΥΝΕΔΡΙΕΣ: Για όλες τις επόμενες συνεδρίες με τον ίδιο ασθενή δεν υπάρχει καμία χρέωση.

4. ΠΛΗΡΩΜΗ ΣΥΝΕΔΡΙΑΣ: Ο ασθενής πληρώνει τον θεραπευτή απευθείας σε μετρητά. Η πλατφόρμα δεν παρακρατεί μέρος της αμοιβής της συνεδρίας.
${promo ? `
5. ΠΡΟΣΦΟΡΑ: Εφαρμόζεται ο κωδικός ${promo.code}${promo.duration_months ? ` για ${promo.duration_months} μήνες` : ''}. Οι όροι της προσφοράς κλειδώνονται κατά την αποδοχή και δεν επηρεάζονται από μελλοντική αλλαγή ή απενεργοποίηση του κωδικού.
` : ''}
${promo ? '6' : '5'}. ΚΛΕΙΔΩΜΑ ΟΡΩΝ: Οι οικονομικοί όροι που ισχύουν σήμερα κλειδώνονται. Μελλοντικές αλλαγές τιμών στο πακέτο δεν εφαρμόζονται αυτόματα σε αυτή τη συμφωνία.

${promo ? '7' : '6'}. ΑΛΛΑΓΗ ΠΑΚΕΤΟΥ: Ο θεραπευτής μπορεί να αλλάξει πακέτο οποτεδήποτε από τον πίνακά του. Η αλλαγή δημιουργεί νέα συμφωνία με τους τότε ισχύοντες όρους.

${promo ? '8' : '7'}. ΥΠΟΧΡΕΩΣΕΙΣ: Ο θεραπευτής δεσμεύεται να τηρεί τα ραντεβού που αποδέχεται και να ειδοποιεί έγκαιρα σε περίπτωση κωλύματος.

${promo ? '9' : '8'}. ΑΠΑΓΟΡΕΥΣΗ ΠΑΡΑΚΑΜΨΗΣ: Απαγορεύεται η ιδιωτική συμφωνία με ασθενείς που αποκτήθηκαν μέσω της πλατφόρμας, με σκοπό την αποφυγή του τέλους νέου ασθενή.

${promo ? '10' : '9'}. GDPR: Ο θεραπευτής δεσμεύεται να τηρεί τον κανονισμό GDPR για τα δεδομένα των ασθενών.`,

  en: ({ planName, price, fee, promo }) => `PARTNERSHIP AGREEMENT — PhysioHome (version ${AGREEMENT_VERSION})

1. PLAN: The therapist joins the "${planName}" plan${price > 0 ? ` with a monthly subscription of €${price}.` : ' — with no monthly charge.'}

2. NEW PATIENT FEE: The platform charges €${fee} once only, for the first session with each new patient.

3. SUBSEQUENT SESSIONS: There is no charge for any further session with the same patient.

4. SESSION PAYMENT: The patient pays the therapist directly in cash. The platform retains no part of the session fee.
${promo ? `
5. PROMOTION: Code ${promo.code} is applied${promo.duration_months ? ` for ${promo.duration_months} months` : ''}. The promotion terms are locked at acceptance and are unaffected by any later change or deactivation of the code.
` : ''}
${promo ? '6' : '5'}. LOCKED TERMS: Today's financial terms are locked in. Future price changes to the plan do not apply automatically to this agreement.

${promo ? '7' : '6'}. CHANGING PLAN: The therapist may change plan at any time from their dashboard. Doing so creates a new agreement on the terms in force at that time.

${promo ? '8' : '7'}. OBLIGATIONS: The therapist commits to honouring accepted appointments and to giving timely notice if prevented.

${promo ? '9' : '8'}. NO BYPASS: Private arrangements with patients acquired through the platform, made to avoid the new patient fee, are prohibited.

${promo ? '10' : '9'}. GDPR: The therapist commits to complying with GDPR regarding patient data.`,
};

const TX = {
  el: {
    title: 'Πακέτο συνεργασίας',
    desc: 'Διάλεξε πακέτο. Μπορείς να το αλλάξεις οποτεδήποτε από τον πίνακά σου.',
    loading: 'Φόρτωση πακέτων...',
    noPlans: 'Δεν υπάρχουν διαθέσιμα πακέτα αυτή τη στιγμή. Επικοινώνησε μαζί μας.',
    free: 'Δωρεάν',
    perMonth: '/μήνα',
    feeLabel: 'Τέλος νέου ασθενή',
    recommended: 'Προτεινόμενο',

    promoTitle: 'Έχεις κωδικό προσφοράς;',
    promoPh: 'Εισαγωγή κωδικού',
    promoApply: 'Εφαρμογή',
    promoChecking: 'Έλεγχος...',
    promoOk: 'Ο κωδικός εφαρμόστηκε',
    promoRemove: 'Αφαίρεση',
    promoErrors: {
      empty: 'Γράψε έναν κωδικό.',
      invalid_or_expired: 'Ο κωδικός δεν είναι έγκυρος ή έχει λήξει.',
      exhausted: 'Ο κωδικός έχει εξαντληθεί.',
      wrong_plan: 'Ο κωδικός δεν ισχύει για το πακέτο που επέλεξες.',
      already_used: 'Έχεις ήδη χρησιμοποιήσει αυτόν τον κωδικό.',
      existing_subscription: 'Ο κωδικός ισχύει μόνο για νέους θεραπευτές.',
      plan_not_found: 'Επίλεξε πρώτα πακέτο.',
      generic: 'Ο κωδικός δεν είναι έγκυρος ή έχει λήξει.',
    },

    summaryTitle: 'Η επιλογή σου',
    sPlan: 'Πακέτο',
    sListPrice: 'Κανονική τιμή',
    sPromo: 'Κωδικός προσφοράς',
    sDiscount: 'Έκπτωση',
    sFinalPrice: 'Τελική τιμή',
    sListFee: 'Κανονικό τέλος νέου ασθενή',
    sFinalFee: 'Τελικό τέλος νέου ασθενή',
    sAfter: (m, price) => `Μετά τους ${m} μήνες: ${price}€/μήνα`,
    sAfterFee: (m, fee) => `Μετά τους ${m} μήνες: ${fee}€ ανά νέο ασθενή`,
    forMonths: (m) => `για ${m} μήνες`,

    contractA: 'Αποδέχομαι τη',
    contractStrong: 'Σύμβαση Συνεργασίας',
    contractB: 'με τους παραπάνω οικονομικούς όρους',

    submit: 'Υποβολή προφίλ',
    submitting: 'Υποβολή...',
    back: 'Πίσω',
    errPlan: 'Επίλεξε πακέτο για να συνεχίσεις.',
    errContract: 'Πρέπει να αποδεχτείς τη Σύμβαση Συνεργασίας.',
    errSubmit: 'Σφάλμα υποβολής: ',
  },
  en: {
    title: 'Partnership plan',
    desc: 'Pick a plan. You can change it at any time from your dashboard.',
    loading: 'Loading plans...',
    noPlans: 'No plans are available right now. Please get in touch.',
    free: 'Free',
    perMonth: '/month',
    feeLabel: 'New patient fee',
    recommended: 'Recommended',

    promoTitle: 'Have a promo code?',
    promoPh: 'Enter code',
    promoApply: 'Apply',
    promoChecking: 'Checking...',
    promoOk: 'Code applied',
    promoRemove: 'Remove',
    promoErrors: {
      empty: 'Please enter a code.',
      invalid_or_expired: 'That code is not valid or has expired.',
      exhausted: 'That code has been fully used.',
      wrong_plan: 'That code does not apply to the plan you selected.',
      already_used: 'You have already used this code.',
      existing_subscription: 'That code is only for new therapists.',
      plan_not_found: 'Please select a plan first.',
      generic: 'That code is not valid or has expired.',
    },

    summaryTitle: 'Your selection',
    sPlan: 'Plan',
    sListPrice: 'List price',
    sPromo: 'Promo code',
    sDiscount: 'Discount',
    sFinalPrice: 'Final price',
    sListFee: 'Standard new patient fee',
    sFinalFee: 'Final new patient fee',
    sAfter: (m, price) => `After ${m} months: €${price}/month`,
    sAfterFee: (m, fee) => `After ${m} months: €${fee} per new patient`,
    forMonths: (m) => `for ${m} months`,

    contractA: 'I accept the',
    contractStrong: 'Partnership Agreement',
    contractB: 'on the financial terms above',

    submit: 'Submit profile',
    submitting: 'Submitting...',
    back: 'Back',
    errPlan: 'Select a plan to continue.',
    errContract: 'You must accept the Partnership Agreement.',
    errSubmit: 'Submission error: ',
  },
};

export default function StepPlan({ lang, userId, onDone, onBack }) {
  const tx = TX[lang] || TX.el;

  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [codeInput, setCodeInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [promoError, setPromoError] = useState('');

  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('display_order', { ascending: true });
      const list = data || [];
      setPlans(list);
      if (list.length > 0) setPlanId(list[0].id);
      setLoading(false);
    })();
  }, []);

  // Αν αλλάξει πακέτο, η προσφορά μπορεί να μην ισχύει πια γι' αυτό.
  // Την καθαρίζουμε αντί να δείξουμε λάθος τιμή.
  useEffect(() => {
    if (promo) { setPromo(null); setPromoError(''); setAccepted(false); }
  }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  const plan = plans.find(p => p.id === planId) || null;
  const listPrice = Number(plan?.price_monthly || 0);
  const listFee = Number(plan?.first_session_fee || 0);
  const finalPrice = promo ? Number(promo.final_price) : listPrice;
  const finalFee = promo ? Number(promo.final_fee) : listFee;

  const planName = plan ? ((lang === 'en' ? (plan.name_en || plan.name_el) : plan.name_el) || '') : '';
  const planDesc = plan ? ((lang === 'en' ? (plan.description_en || plan.description_el) : plan.description_el) || '') : '';

  function label(p) { return (lang === 'en' ? (p.name_en || p.name_el) : p.name_el) || ''; }
  function features(p) {
    const arr = lang === 'en' ? p.features_en : p.features_el;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return Array.isArray(p.features_el) ? p.features_el : [];
  }

  async function applyPromo() {
    const code = codeInput.trim();
    if (!code) { setPromoError(tx.promoErrors.empty); return; }
    if (!planId) { setPromoError(tx.promoErrors.plan_not_found); return; }

    setChecking(true); setPromoError('');

    const { data, error: err } = await supabase.rpc('evaluate_promo_code', {
      p_code: code,
      p_plan_id: planId,
      p_therapist_id: userId,
    });

    setChecking(false);

    if (err) { setPromoError(tx.promoErrors.generic); return; }
    if (!data?.valid) {
      setPromoError(tx.promoErrors[data?.reason] || tx.promoErrors.generic);
      setPromo(null);
      return;
    }

    setPromo(data);
    setAccepted(false); // άλλαξαν οι όροι — να τους ξαναδεί
  }

  function clearPromo() {
    setPromo(null);
    setCodeInput('');
    setPromoError('');
    setAccepted(false);
  }

  async function submit() {
    if (!planId) { setError(tx.errPlan); return; }
    if (!accepted) { setError(tx.errContract); return; }

    setSubmitting(true); setError('');

    // Η βάση ξαναελέγχει τον κωδικό και παγώνει τους όρους.
    const { error: err } = await supabase.rpc('activate_subscription', {
      p_plan_id: planId,
      p_promo_code: promo ? promo.code : null,
      p_agreement_version: AGREEMENT_VERSION,
    });

    if (err) {
      setSubmitting(false);
      setError(tx.errSubmit + (err.message || ''));
      return;
    }

    await supabase.from('therapist_profiles')
      .update({ contract_accepted: true, contract_accepted_at: new Date().toISOString() })
      .eq('id', userId);

    setSubmitting(false);
    onDone();
  }

  const buildContract = CONTRACTS[lang] || CONTRACTS.el;

  if (loading) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        {tx.loading}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        {tx.noPlans}
      </div>
    );
  }

  const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5 };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
      <style>{`
        .plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
        .promo-row { display: flex; gap: 8px; }
        @media (max-width: 480px) { .promo-row { flex-direction: column; } .promo-row button { width: 100%; } }
      `}</style>

      <h2 style={{ fontSize: 19, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{tx.title}</h2>
      <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 22 }}>{tx.desc}</p>

      {/* ── ΠΑΚΕΤΑ ── */}
      <div className="plan-grid">
        {plans.map(p => {
          const isSel = planId === p.id;
          const price = Number(p.price_monthly || 0);
          return (
            <div key={p.id} onClick={() => setPlanId(p.id)}
              style={{
                position: 'relative', padding: '20px 18px', borderRadius: 14, cursor: 'pointer',
                border: `2px solid ${isSel ? '#2a6fdb' : '#e2e8f0'}`,
                background: isSel ? '#EFF6FF' : '#fff', transition: 'all .2s',
              }}>
              {p.is_recommended && (
                <span style={{ position: 'absolute', top: -10, left: 16, background: '#6D28D9', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Star size={9} strokeWidth={3} />
                  {p.badge_label || tx.recommended}
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1a2e44' }}>{label(p)}</span>
                {isSel && <Check size={17} color="#2a6fdb" strokeWidth={3} />}
              </div>

              <div style={{ fontSize: 24, fontWeight: 700, color: price === 0 ? '#15803D' : '#1a2e44', marginBottom: 2 }}>
                {price === 0 ? tx.free : `${price}€`}
                {price > 0 && <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{tx.perMonth}</span>}
              </div>

              <div style={{ fontSize: 12.5, color: '#2a6fdb', fontWeight: 600, marginBottom: 10 }}>
                {tx.feeLabel}: {Number(p.first_session_fee)}€
              </div>

              {features(p).length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {features(p).map((f, i) => (
                    <span key={i} style={{ fontSize: 12, color: '#475569', display: 'inline-flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.45 }}>
                      <Check size={12} color="#15803D" strokeWidth={3} style={{ marginTop: 2, flexShrink: 0 }} />
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── ΚΩΔΙΚΟΣ ΠΡΟΣΦΟΡΑΣ ── */}
      <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a2e44', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Tag size={15} color="#2a6fdb" />
          {tx.promoTitle}
        </div>

        {promo ? (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Check size={16} color="#15803D" strokeWidth={3} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#15803D' }}>{tx.promoOk}</span>
            <span style={{ fontSize: 12.5, color: '#166534', flex: 1, minWidth: 140 }}>
              {promo.code}
              {(lang === 'en' ? promo.description_en : promo.description_el)
                ? ` — ${lang === 'en' ? promo.description_en : promo.description_el}` : ''}
            </span>
            <button type="button" onClick={clearPromo}
              style={{ background: 'transparent', border: '1px solid #BBF7D0', borderRadius: 20, padding: '5px 12px', fontSize: 11.5, fontWeight: 600, color: '#15803D', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <X size={11} strokeWidth={2.6} />
              {tx.promoRemove}
            </button>
          </div>
        ) : (
          <>
            <div className="promo-row">
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setPromoError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
                placeholder={tx.promoPh}
                style={{ flex: 1, padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1a2e44', letterSpacing: '.03em' }}
              />
              <button type="button" onClick={applyPromo} disabled={checking}
                style={{ padding: '11px 24px', borderRadius: 10, border: '1.5px solid #1a2e44', background: 'transparent', color: '#1a2e44', fontSize: 13.5, fontWeight: 600, cursor: checking ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {checking ? tx.promoChecking : tx.promoApply}
              </button>
            </div>
            {promoError && (
              <div style={{ marginTop: 9, fontSize: 12.5, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                <X size={13} strokeWidth={2.6} />
                {promoError}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── ΣΥΝΟΨΗ ── */}
      {plan && (
        <div style={{ marginTop: 22, background: '#faf9f6', border: '1px solid #e8e4dc', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
            {tx.summaryTitle}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={rowStyle}>
              <span style={{ color: '#64748b' }}>{tx.sPlan}</span>
              <strong style={{ color: '#1a2e44' }}>{planName}</strong>
            </div>

            {(promo && promo.price_saving > 0) ? (
              <>
                <div style={rowStyle}>
                  <span style={{ color: '#64748b' }}>{tx.sListPrice}</span>
                  <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{listPrice.toFixed(2)}€{tx.perMonth}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ color: '#64748b' }}>{tx.sDiscount}</span>
                  <strong style={{ color: '#15803D' }}>−{Number(promo.price_saving).toFixed(2)}€</strong>
                </div>
              </>
            ) : (
              <div style={rowStyle}>
                <span style={{ color: '#64748b' }}>{tx.sListPrice}</span>
                <strong style={{ color: '#1a2e44' }}>{listPrice === 0 ? tx.free : `${listPrice.toFixed(2)}€${tx.perMonth}`}</strong>
              </div>
            )}

            {promo && (
              <div style={rowStyle}>
                <span style={{ color: '#64748b' }}>{tx.sPromo}</span>
                <strong style={{ color: '#6D28D9' }}>
                  {promo.code}{promo.duration_months ? ` · ${tx.forMonths(promo.duration_months)}` : ''}
                </strong>
              </div>
            )}

            <div style={{ ...rowStyle, paddingTop: 9, borderTop: '1px solid #e8e4dc' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>{tx.sFinalPrice}</span>
              <strong style={{ color: finalPrice === 0 ? '#15803D' : '#1a2e44', fontSize: 16 }}>
                {finalPrice === 0 ? tx.free : `${finalPrice.toFixed(2)}€${tx.perMonth}`}
              </strong>
            </div>

            <div style={rowStyle}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>{tx.sFinalFee}</span>
              <strong style={{ color: finalFee === 0 ? '#15803D' : '#1a2e44', fontSize: 16 }}>
                {finalFee === 0 ? tx.free : `${finalFee.toFixed(2)}€`}
                {(promo && promo.fee_saving > 0) && (
                  <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 500, color: '#94a3b8', textDecoration: 'line-through' }}>
                    {listFee.toFixed(2)}€
                  </span>
                )}
              </strong>
            </div>

            {/* Τι ισχύει ΜΕΤΑ τη λήξη της προσφοράς — ο θεραπευτής πρέπει
                να το ξέρει πριν υπογράψει, όχι σε 12 μήνες. */}
            {promo && promo.duration_months && (promo.price_saving > 0 || promo.fee_saving > 0) && (
              <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px dashed #e8e4dc', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                {promo.price_saving > 0 && <div>{tx.sAfter(promo.duration_months, listPrice.toFixed(2))}</div>}
                {promo.fee_saving > 0 && <div>{tx.sAfterFee(promo.duration_months, listFee.toFixed(2))}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ΣΥΜΒΑΣΗ ── */}
      <div style={{ marginTop: 22 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#334155', marginBottom: 10 }}>
          <input type="checkbox" checked={accepted} onChange={() => setAccepted(a => !a)} style={{ marginTop: 3, accentColor: '#2a6fdb' }} />
          <span>
            {tx.contractA} <strong>{tx.contractStrong}</strong> {tx.contractB}
          </span>
        </label>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', fontSize: 11.5, color: '#64748b', lineHeight: 1.75, maxHeight: 190, overflowY: 'auto', whiteSpace: 'pre-line' }}>
          {buildContract({ planName, price: finalPrice, fee: finalFee, promo })}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onBack} type="button"
          style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '13px 24px', borderRadius: 30, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <ArrowLeft size={15} />
          {tx.back}
        </button>
        <button onClick={submit} disabled={submitting}
          style={{ background: '#1a2e44', color: '#fff', border: 'none', padding: '13px 32px', borderRadius: 30, fontSize: 14.5, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {submitting ? tx.submitting : tx.submit}
          {!submitting && <Send size={15} />}
        </button>
      </div>
    </div>
  );
}