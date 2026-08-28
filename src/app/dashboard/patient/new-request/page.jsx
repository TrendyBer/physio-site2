'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Check, X, ChevronLeft, ChevronRight, Calendar, ArrowRight, MapPin, AlertCircle, Star, Heart, Banknote, Clock, ShieldCheck, Send } from 'lucide-react';
import ConditionSearch from '@/components/ConditionSearch';
import AreaInput from '@/components/AreaInput';
import { areasMatch } from '@/lib/areas';
import { filterBookableSlots } from '@/lib/slots';

// ── helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = 44 }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

const DAYS_EL = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

// Το βήμα «Τύπος / Πακέτο» έχει αφαιρεθεί.
// Κάθε αίτημα αφορά ΜΙΑ συνεδρία. Ο ασθενής δεν δεσμεύεται σε πακέτο
// πριν καν γνωρίσει τον θεραπευτή.
const STEPS = ['Πρόβλημα', 'Θεραπευτής', 'Ημερομηνία', 'Επιβεβαίωση'];

function friendlyDay(dateStr) {
  if (!dateStr) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T12:00:00'); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'σήμερα';
  if (diff === 1) return 'αύριο';
  return null;
}

export default function NewRequestPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);

  // Ο ασθενής μπορεί να έρθει από το προφίλ συγκεκριμένου θεραπευτή
  // (/therapists/<id> → «Κλείσε ραντεβού»). Τότε τον θέλει ΑΥΤΟΝ.
  // Διαβάζεται από το window αντί για useSearchParams ώστε να μην
  // χρειάζεται Suspense boundary στο build.
  const [preselectedId, setPreselectedId] = useState(null);
  const [cameFromProfile, setCameFromProfile] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [condition, setCondition] = useState(null);   // { id, slug, name, related_specialties }
  const [problemType, setProblemType] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [floorInfo, setFloorInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Αποθηκευμένη διεύθυνση από το προφίλ — ο ασθενής δεν ξαναγράφει
  // ό,τι έχει ήδη δώσει. Απλά επιβεβαιώνει.
  const [savedAddress, setSavedAddress] = useState(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  // Step 2
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const [loadingTherapists, setLoadingTherapists] = useState(false);

  // Προμήθεια πλατφόρμας.
  // Δεν υπολογίζεται ΠΟΤΕ εδώ — τη ρωτάμε από τη βάση (resolve_session_fee),
  // ώστε site και admin να λένε πάντα το ίδιο πράγμα.
  const [feeInfo, setFeeInfo] = useState(null);

  // Step 3 — ημερομηνία
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [calendarWeek, setCalendarWeek] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('therapist');
      if (q) { setPreselectedId(q); setCameFromProfile(true); }
    } catch (_) {}
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      setUser(user);

      const { data: prof } = await supabase
        .from('patient_profiles')
        .select('address, area, postal_code')
        .eq('id', user.id)
        .maybeSingle();

      if (prof?.address && prof?.area) {
        setSavedAddress(prof);
        setAddress(prof.address);
        setArea(prof.area);
        setPostalCode(prof.postal_code || '');
        setEditingAddress(false);
      } else {
        // Ο ασθενής δεν δίνει πλέον διεύθυνση στην εγγραφή.
        // Τη ζητάμε εδώ, την πρώτη φορά, και μετά αποθηκεύεται.
        if (prof?.area) setArea(prof.area);
        setEditingAddress(true);
      }

      try {
        const fromSite = localStorage.getItem('bookingAddress');
        if (fromSite) {
          setAddress(fromSite);
          setEditingAddress(true);
          setSavedAddress(null);
          localStorage.removeItem('bookingAddress');
        }
      } catch (_) {}
    });
  }, []);

  useEffect(() => {
    if (step === 2) fetchTherapists();
  }, [step]);

  useEffect(() => {
    if (step === 3 && selectedTherapist) fetchSlots();
  }, [step, selectedTherapist, calendarWeek]);

  useEffect(() => {
    if (!user || !selectedTherapist) { setFeeInfo(null); return; }
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.rpc('resolve_session_fee', {
        p_patient_id: user.id,
        p_therapist_id: selectedTherapist.id,
      });
      if (cancelled) return;
      if (error) {
        console.error('resolve_session_fee:', error.message);
        setFeeInfo(null);
      } else {
        setFeeInfo(data || null);
      }
    })();

    return () => { cancelled = true; };
  }, [user, selectedTherapist]);

  // ΦΩΝΗΤΙΚΟ ταίριασμα, όχι σύγκριση string.
  // Ο θεραπευτής γράφει «Κολωνάκι», ο ασθενής «κολονακι» ή «Kolonaki».
  function servesArea(t, targetArea) {
    if (!targetArea || !targetArea.trim()) return true;
    if (areasMatch(t.area, targetArea)) return true;
    const areas = Array.isArray(t.service_areas) ? t.service_areas : [];
    return areas.some((a) => areasMatch(a, targetArea));
  }

  /**
   * MATCH SCORE (0-100)
   *
   * Η πάθηση ΔΕΝ βαθμολογείται — είναι σκληρό φίλτρο.
   * Όποιος δεν τη δήλωσε, δεν μπαίνει καν στην κύρια λίστα.
   */
  function matchScore(t) {
    let score = 0;

    if (t.freeSlots >= 5) score += 30;
    else if (t.freeSlots >= 1) score += 15 + t.freeSlots * 3;

    if (t.reviewCount > 0) {
      score += Math.round((t.avgRating / 5) * 20);
      if (t.reviewCount >= 5) score += 5;
      else score += t.reviewCount;
    } else {
      score += 8;   // νέος θεραπευτής — ουδέτερο, όχι τιμωρία
    }

    score += Math.min(20, t.completedCount * 2);

    if (t.is_profile_full) score += 15;
    else score += 5;

    const h = t.response_time_hours || 24;
    if (h <= 6) score += 10;
    else if (h <= 12) score += 7;
    else if (h <= 24) score += 5;

    return Math.min(100, score);
  }

  async function fetchTherapists() {
    setLoadingTherapists(true);
    setTherapists([]);

    // ── 1. ΣΚΛΗΡΟ ΦΙΛΤΡΟ: ποιοι δηλώνουν αυτή την πάθηση ──
    let declaredIds = [];
    if (condition?.id) {
      const { data: links } = await supabase
        .from('therapist_conditions')
        .select('therapist_id')
        .eq('condition_id', condition.id);
      declaredIds = (links || []).map((l) => l.therapist_id);
    }

    // ── 2. ΠΗΓΗ: v_public_therapists ──
    const { data: all } = await supabase
      .from('v_public_therapists')
      .select('*')
      .eq('is_publicly_visible', true);

    let pool = all || [];

    // ── 2β. ΕΠΙΒΟΛΗ ΣΥΝΔΡΟΜΗΣ ──
    if (pool.length > 0) {
      const [{ data: cfg }, { data: exempt }] = await Promise.all([
        supabase.from('platform_settings').select('key, value')
          .in('key', ['subscription_enforcement', 'subscription_grace_days']),
        supabase.from('therapist_subscriptions')
          .select('therapist_id, current_period_end, status')
          .in('therapist_id', pool.map((t) => t.id))
          .in('status', ['trialing', 'active', 'past_due', 'exempt']),
      ]);

      const cfgMap = {};
      (cfg || []).forEach((r) => { cfgMap[r.key] = r.value; });
      const enforcement = cfgMap.subscription_enforcement || 'off';

      if (enforcement !== 'off') {
        const graceMs = (parseInt(cfgMap.subscription_grace_days, 10) || 0) * 86400000;

        const okIds = new Set(
          (exempt || [])
            .filter((sub) => !sub.current_period_end ||
              new Date(sub.current_period_end).getTime() + graceMs > Date.now())
            .map((sub) => sub.therapist_id)
        );

        pool = pool.filter((t) => okIds.has(t.id));
      }
    }

    if (pool.length === 0) { setTherapists([]); setLoadingTherapists(false); return; }

    const ids = pool.map((t) => t.id);
    const todayStr = new Date().toISOString().split('T')[0];

    // ── 3. Δεδομένα κατάταξης, όλα μαζί ──
    // Τα slots έρχονται ταξινομημένα ώστε το πρώτο κάθε θεραπευτή να
    // είναι η επόμενη διαθέσιμη ώρα του — μπαίνει στην κάρτα.
    const [{ data: revs }, { data: reqs }, { data: freeSlots }] = await Promise.all([
      supabase.from('reviews').select('therapist_id, rating').eq('is_published', true).in('therapist_id', ids),
      supabase.from('session_requests').select('therapist_id, status').in('therapist_id', ids),
      supabase.from('availability_slots').select('therapist_id, date, start_time')
        .eq('is_blocked', false).gte('date', todayStr).in('therapist_id', ids)
        .order('date', { ascending: true }).order('start_time', { ascending: true }),
    ]);

    const stats = {};
    ids.forEach((id) => { stats[id] = { sum: 0, count: 0, completed: 0, slots: 0, next: null }; });
    (revs || []).forEach((r) => { if (stats[r.therapist_id]) { stats[r.therapist_id].sum += r.rating; stats[r.therapist_id].count += 1; } });
    (reqs || []).forEach((r) => { if (stats[r.therapist_id] && r.status === 'completed') stats[r.therapist_id].completed += 1; });
    filterBookableSlots(freeSlots).forEach((sl) => {
      const st = stats[sl.therapist_id];
      if (!st) return;
      st.slots += 1;
      if (!st.next) st.next = { date: sl.date, start_time: sl.start_time };
    });

    const enrich = (t) => {
      const st = stats[t.id];
      return {
        ...t,
        avgRating: st.count ? st.sum / st.count : 0,
        reviewCount: st.count,
        completedCount: st.completed,
        freeSlots: st.slots,
        nextSlot: st.next,
      };
    };

    // ── 4. ΚΥΡΙΑ ΛΙΣΤΑ: δήλωσε την πάθηση ΚΑΙ εξυπηρετεί την περιοχή ──
    const primary = pool
      .filter((t) => declaredIds.includes(t.id) && servesArea(t, area))
      .map(enrich)
      .map((t) => ({ ...t, matchLevel: 'exact', score: matchScore(t) }))
      .sort((a, b) => b.score - a.score);

    // ── 5. ΣΤΟ ΤΕΛΟΣ: εξυπηρετεί την περιοχή αλλά ΔΕΝ δήλωσε την πάθηση ──
    const secondary = pool
      .filter((t) => !declaredIds.includes(t.id) && servesArea(t, area))
      .map(enrich)
      .map((t) => ({ ...t, matchLevel: 'area', score: matchScore(t) }))
      .sort((a, b) => b.score - a.score);

    const combined = [...primary, ...secondary];

    // ── 6. ΗΡΘΕ ΓΙΑ ΣΥΓΚΕΚΡΙΜΕΝΟ ΘΕΡΑΠΕΥΤΗ ──
    // Τον ανεβάζουμε πρώτο και τον προεπιλέγουμε. Αν δεν πέρασε τα
    // φίλτρα (π.χ. δεν δήλωσε αυτή την πάθηση ή δηλώνει άλλη περιοχή),
    // τον δείχνουμε ΠΑΝΤΩΣ — ο ασθενής τον διάλεξε συνειδητά και δεν
    // πρέπει να τον χάσει επειδή δεν ταιριάζει ένα tag.
    if (preselectedId) {
      let pre = combined.find((t) => t.id === preselectedId);
      if (!pre) {
        const raw = pool.find((t) => t.id === preselectedId);
        if (raw) pre = { ...enrich(raw), matchLevel: 'chosen', score: 0 };
      }
      if (pre) {
        setTherapists([{ ...pre, matchLevel: 'chosen' }, ...combined.filter((t) => t.id !== pre.id)]);
        setSelectedTherapist(pre);
        setLoadingTherapists(false);
        return;
      }
    }

    setTherapists(combined);
    setLoadingTherapists(false);
  }

  async function fetchSlots() {
    setLoadingSlots(true);
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + calendarWeek * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('therapist_id', selectedTherapist.id)
      .eq('is_blocked', false)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date').order('start_time');
    // Κόβουμε ώρες που έχουν ήδη περάσει (ή είναι πολύ κοντά).
    // Χωρίς αυτό, στις 14:45 ο ασθενής μπορούσε να κλείσει τις 10:00.
    setSlots(filterBookableSlots(data));
    setLoadingSlots(false);
  }

  // Μία συνεδρία = μία ώρα. Νέα επιλογή αντικαθιστά την προηγούμενη
  // αντί να μπλοκάρει τον χρήστη με «έχετε φτάσει το όριο».
  function pickSlot(slot) {
    setSelectedSlot(prev => (prev?.id === slot.id ? null : slot));
  }

  function validateStep() {
    setError('');
    if (step === 1) {
      if (!condition) { setError('Πείτε μας τι σας ταλαιπωρεί — γράψτε π.χ. «πόνος στη μέση».'); return false; }
      if (savedAddress && !editingAddress && !addressConfirmed) {
        setError('Επιβεβαιώστε τη διεύθυνση για να συνεχίσετε.');
        return false;
      }
      if (!address || !area) { setError('Συμπληρώστε διεύθυνση και περιοχή.'); return false; }
    }
    if (step === 2) {
      if (!selectedTherapist) { setError('Παρακαλώ επιλέξτε θεραπευτή.'); return false; }
    }
    if (step === 3) {
      if (!selectedSlot) { setError('Παρακαλώ επιλέξτε ημέρα και ώρα.'); return false; }
    }
    return true;
  }

  const sessionCost = Math.round(Number(selectedTherapist?.price_per_session || 0));

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);

    const changed =
      !savedAddress ||
      savedAddress.address !== address ||
      savedAddress.area !== area ||
      (savedAddress.postal_code || '') !== (postalCode || '');

    if (changed && address && area) {
      await supabase
        .from('patient_profiles')
        .update({ address, area, postal_code: postalCode || null })
        .eq('id', user.id);
    }

    // ── ΑΤΟΜΙΚΗ ΚΡΑΤΗΣΗ ────────────────────────────────────────────────
    // Τα πάντα σε ΕΝΑ transaction στη βάση: κλείδωμα γραμμών, έλεγχος
    // διαθεσιμότητας, δημιουργία αιτήματος, κράτηση, block slot.
    const { data: result, error: bookErr } = await supabase.rpc('book_session_slots', {
      p_therapist_id:        selectedTherapist.id,
      p_slot_ids:            [selectedSlot.id],
      p_problem_type:        problemType,
      p_condition_id:        condition?.id || null,
      p_problem_description: problemDesc,
      p_address:             address,
      p_area:                area,
      p_postal_code:         postalCode,
      p_floor_info:          floorInfo,
      p_notes:               notes,
      p_session_type:        'single',
      p_package_size:        1,
      p_total_cost:          sessionCost,
    });

    if (bookErr) {
      setError('Σφάλμα: ' + bookErr.message);
      setSubmitting(false);
      return;
    }

    if (!result?.ok) {
      if (result?.error === 'slots_taken') {
        setError('Η ώρα που επιλέξατε μόλις κλείστηκε από άλλον ασθενή. Επιλέξτε άλλη.');
        setSelectedSlot(null);
        setStep(3);
        await fetchSlots();
      } else if (result?.error === 'not_authenticated') {
        setError('Η σύνδεσή σας έληξε. Παρακαλώ συνδεθείτε ξανά.');
      } else {
        setError('Δεν ήταν δυνατή η κράτηση. Δοκιμάστε ξανά.');
      }
      setSubmitting(false);
      return;
    }

    const requestId = result.request_id;

    // ── ΠΡΟΜΗΘΕΙΑ ΠΛΑΤΦΟΡΜΑΣ ────────────────────────────────────────────
    try {
      const { data: feeNow } = await supabase.rpc('resolve_session_fee', {
        p_patient_id: user.id,
        p_therapist_id: selectedTherapist.id,
      });

      const resolved = feeNow || feeInfo || { fee: 0, is_first: false, reason: 'unknown' };
      const fee = Number(resolved.fee || 0);
      const isFirst = Boolean(resolved.is_first);

      const { data: linkId } = await supabase.rpc('register_session_charge', {
        p_patient_id: user.id,
        p_therapist_id: selectedTherapist.id,
        p_fee: fee,
        p_session_at: new Date().toISOString(),
      });

      // ΣΗΜΕΙΩΣΗ: το patient_amount καταγράφεται ΜΟΝΟ ως πληροφορία.
      // Ο ασθενής πληρώνει μετρητά τον θεραπευτή — η πλατφόρμα δεν
      // εισπράττει το ποσό της συνεδρίας.
      if (fee > 0) {
        await supabase.from('payments').insert([{
          request_id: requestId,
          therapist_id: selectedTherapist.id,
          amount: fee,
          patient_amount: sessionCost,
          therapist_net: Math.max(0, sessionCost - fee),
          status: 'unpaid',
          paid: false,
          payment_method: 'cash',
          fee_type: 'first_session',
          is_first_session: isFirst,
          link_id: linkId || null,
          plan_id: resolved.plan_id || null,
        }]);
      }
    } catch (feeErr) {
      console.error('Αποτυχία καταγραφής προμήθειας:', feeErr);
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + calendarWeek * 7 + i);
    return d.toISOString().split('T')[0];
  });

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={32} color="#15803D" strokeWidth={3} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Το αίτημά σας εστάλη</h2>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 20 }}>
          Ο θεραπευτής <strong>{selectedTherapist?.name}</strong> θα δει το αίτημά σας και θα απαντήσει σύντομα.
          Μόλις το αποδεχθεί, το ραντεβού σας επιβεβαιώνεται.
        </p>
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 16px', marginBottom: 26, textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Banknote size={16} color="#15803D" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#15803D', lineHeight: 1.6 }}>
            Η πληρωμή γίνεται <strong>απευθείας στον θεραπευτή</strong> μετά τη συνεδρία.
          </span>
        </div>
        <a href="/dashboard/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Επιστροφή στον πίνακά μου
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );

  const currentStepLabel = STEPS[step - 1];
  const progressPercent = (step / STEPS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .stepper-desktop { display: flex; }
        .stepper-mobile { display: none; }

        @media (max-width: 768px) {
          .stepper-desktop { display: none !important; }
          .stepper-mobile { display: block !important; }
          .form-card { padding: 20px !important; }
          .form-grid-2col { grid-template-columns: 1fr !important; }
          .nav-buttons-mobile { flex-direction: column-reverse !important; gap: 10px; }
          .nav-buttons-mobile button { width: 100% !important; }
          .therapist-card-row { flex-direction: column !important; align-items: stretch !important; }
          .therapist-card-actions { flex-direction: row !important; width: 100%; }
          .therapist-card-actions button { flex: 1; }
        }
      `}</style>

      {/* Header */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard/patient" style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
        </a>
        <a href="/dashboard/patient" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ChevronLeft size={14} />
          Πίσω στον πίνακά μου
        </a>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Title */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Κλείσε ραντεβού</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Τέσσερα σύντομα βήματα — δεν χρειάζεται κάρτα.</p>
        </div>

        {/* DESKTOP Stepper */}
        <div className="stepper-desktop" style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 0 }}>
          {STEPS.map((s, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#15803D' : active ? '#2a6fdb' : '#e2e8f0', color: done || active ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all .2s' }}>
                    {done ? <Check size={14} strokeWidth={3} /> : num}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#2a6fdb' : done ? '#15803D' : '#94a3b8', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 48, height: 2, background: done ? '#15803D' : '#e2e8f0', margin: '0 4px', marginBottom: 16, transition: 'all .2s' }} />}
              </div>
            );
          })}
        </div>

        {/* MOBILE Stepper */}
        <div className="stepper-mobile" style={{ marginBottom: 24, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a6fdb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {step}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Βήμα {step} από {STEPS.length}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  {currentStepLabel}
                </div>
              </div>
            </div>
            {step < STEPS.length && (
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Επόμενο: <strong style={{ color: '#1a2e44' }}>{STEPS[step]}</strong>
              </div>
            )}
          </div>
          <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #2a6fdb, #15803D)', transition: 'width .3s ease' }} />
          </div>
        </div>

        {/* Card */}
        <div className="form-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '32px', marginBottom: 20 }}>

          {/* STEP 1 — Πρόβλημα */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Τι χρειάζεσαι;</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Πες μας με απλά λόγια τι σε ενοχλεί και πού θέλεις τη συνεδρία.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Τι σας ταλαιπωρεί; *</label>

                  {/* Το «δεν χρειάζεται διάγνωση» μπαίνει ΠΑΝΩ από το input.
                      Είναι το πρώτο άγχος του ασθενή — απαντιέται πριν καν γράψει. */}
                  <div style={{ fontSize: 12.5, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 12px', marginBottom: 8, lineHeight: 1.5 }}>
                    Δεν χρειάζεται να γνωρίζετε τη διάγνωση. Πείτε μας απλά τι σας ενοχλεί — π.χ. «πόνος στη μέση».
                  </div>

                  <ConditionSearch
                    lang="el"
                    value={condition}
                    onChange={(c) => {
                      setCondition(c);
                      setProblemType(c?.name || '');
                      setSelectedTherapist(null);
                      setSelectedSlot(null);
                    }}
                    showChips={true}
                    compact={false}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Θέλετε να προσθέσετε κάτι; <span style={{ color: '#94a3b8', fontWeight: 400 }}>— προαιρετικό</span></label>
                  <textarea value={problemDesc} onChange={e => setProblemDesc(e.target.value)} rows={3}
                    placeholder="Από πότε το έχετε, τι το επιδεινώνει, αν έχετε κάνει εξετάσεις..."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {/* ── ΔΙΕΥΘΥΝΣΗ ── */}
                {savedAddress && !editingAddress ? (
                  <div style={{
                    background: addressConfirmed ? '#F0FDF4' : '#FFFBEB',
                    border: `1px solid ${addressConfirmed ? '#BBF7D0' : '#FDE68A'}`,
                    borderRadius: 12,
                    padding: '18px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <MapPin size={18} color={addressConfirmed ? '#15803D' : '#B45309'} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: addressConfirmed ? '#15803D' : '#B45309', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                          {addressConfirmed ? 'Διεύθυνση επιβεβαιωμένη' : 'Επιβεβαιώστε τη διεύθυνσή σας'}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>
                          {savedAddress.address}
                        </div>
                        <div style={{ fontSize: 14, color: '#64748B' }}>
                          {savedAddress.area}{savedAddress.postal_code ? `, ${savedAddress.postal_code}` : ''}
                        </div>
                      </div>
                    </div>

                    {!addressConfirmed ? (
                      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => setAddressConfirmed(true)}
                          style={{ padding: '10px 22px', borderRadius: 30, border: 'none', background: '#15803D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Check size={15} strokeWidth={3} />
                          Ναι, εδώ
                        </button>
                        <button type="button" onClick={() => { setEditingAddress(true); setAddressConfirmed(false); }}
                          style={{ padding: '10px 22px', borderRadius: 30, border: '1px solid #e2e8f0', background: '#fff', color: '#64748B', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Άλλη διεύθυνση
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setEditingAddress(true); setAddressConfirmed(false); }}
                        style={{ marginTop: 12, background: 'transparent', border: 'none', color: '#2a6fdb', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                        Αλλαγή διεύθυνσης
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {savedAddress && (
                      <button type="button"
                        onClick={() => {
                          setAddress(savedAddress.address);
                          setArea(savedAddress.area);
                          setPostalCode(savedAddress.postal_code || '');
                          setEditingAddress(false);
                          setAddressConfirmed(false);
                        }}
                        style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#2a6fdb', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <ChevronLeft size={14} />
                        Χρήση της αποθηκευμένης διεύθυνσης
                      </button>
                    )}

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>Πού θα γίνει η συνεδρία;</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Θα αποθηκευτεί, ώστε να μη χρειαστεί να την ξαναγράψετε.</div>

                      <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Διεύθυνση *</label>
                          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="π.χ. Αθηνάς 12" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Περιοχή *</label>
                          <AreaInput value={area} onChange={setArea} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Τ.Κ.</label>
                          <input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="π.χ. 10674" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Όροφος / Κουδούνι</label>
                          <input value={floorInfo} onChange={e => setFloorInfo(e.target.value)} placeholder="π.χ. 3ος, Παπαδόπουλος" style={inputStyle} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {savedAddress && !editingAddress && (
                  <div>
                    <label style={labelStyle}>Όροφος / Κουδούνι</label>
                    <input value={floorInfo} onChange={e => setFloorInfo(e.target.value)} placeholder="π.χ. 3ος, Παπαδόπουλος" style={inputStyle} />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Οδηγίες πρόσβασης <span style={{ color: '#94a3b8', fontWeight: 400 }}>— προαιρετικό</span></label>
                  <input value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="π.χ. το κουδούνι δεν λειτουργεί, τηλεφωνήστε"
                    style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Θεραπευτής */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Διάλεξε θεραπευτή</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                {condition
                  ? <>Θεραπευτές για <strong style={{ color: '#0F172A' }}>{condition.name}</strong> στην περιοχή <strong style={{ color: '#0F172A' }}>{area}</strong>.</>
                  : 'Επίλεξε τον θεραπευτή που σε εξυπηρετεί καλύτερα.'}
              </p>

              {loadingTherapists ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Αναζήτηση θεραπευτών...</div>
              ) : therapists.length === 0 ? (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '28px 24px', textAlign: 'center' }}>
                  <AlertCircle size={30} color="#B45309" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>
                    Δεν βρέθηκε θεραπευτής για {condition?.name || 'αυτή την πάθηση'} στην περιοχή {area}
                  </div>
                  <p style={{ fontSize: 13.5, color: '#92400E', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 18px' }}>
                    Επεκτείνουμε συνεχώς το δίκτυό μας. Δοκιμάστε άλλη περιοχή, ή γυρίστε πίσω
                    και περιγράψτε το πρόβλημα διαφορετικά.
                  </p>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ padding: '10px 22px', borderRadius: 30, border: '1px solid #FDE68A', background: '#fff', color: '#B45309', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ChevronLeft size={15} />
                    Αλλαγή πάθησης ή περιοχής
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {cameFromProfile && selectedTherapist && (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                      <Check size={16} color="#1D4ED8" strokeWidth={3} />
                      <span style={{ fontSize: 13.5, color: '#1E40AF', flex: 1, minWidth: 200 }}>
                        Επιλέξατε τον/την <strong>{selectedTherapist.name}</strong> από το προφίλ.
                        Μπορείτε να αλλάξετε επιλογή παρακάτω.
                      </span>
                    </div>
                  )}

                  {therapists.map((t, idx) => {
                    const prev = idx > 0 ? therapists[idx - 1] : null;
                    const startsSecondary = t.matchLevel === 'area' && (!prev || prev.matchLevel !== 'area');
                    const isSelected = selectedTherapist?.id === t.id;
                    const noSlots = t.freeSlots === 0;

                    const nextLabel = (() => {
                      if (!t.nextSlot) return null;
                      const fd = friendlyDay(t.nextSlot.date);
                      const d = new Date(t.nextSlot.date + 'T12:00:00');
                      const when = fd || `${DAYS_EL[d.getDay()]} ${d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}`;
                      return `${when} στις ${t.nextSlot.start_time?.slice(0, 5)}`;
                    })();

                    return (
                      <div key={t.id}>
                      {startsSecondary && (
                        <div style={{ margin: '18px 0 12px', paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                            Άλλοι θεραπευτές στην περιοχή σας
                          </div>
                          <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                            Δεν έχουν δηλώσει εμπειρία σε {condition?.name}. Εξυπηρετούν την περιοχή, αλλά ίσως δεν είναι η καταλληλότερη επιλογή.
                          </div>
                        </div>
                      )}

                      <div style={{ border: `2px solid ${isSelected ? '#2a6fdb' : '#e2e8f0'}`, borderRadius: 14, padding: '18px 20px', background: isSelected ? '#EFF6FF' : '#fff', transition: 'all .2s', opacity: noSlots ? 0.65 : 1 }}>
                        <div className="therapist-card-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <Avatar name={t.name} photoUrl={t.photo_url} size={56} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Όνομα + πιστοποίηση */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{t.name || '—'}</span>
                              {t.license_verified && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <ShieldCheck size={11} strokeWidth={2.5} />
                                  Επαληθευμένος
                                </span>
                              )}
                              {noSlots && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#BE123C', background: '#FFF1F2', border: '1px solid #FECDD3', padding: '2px 9px', borderRadius: 999 }}>
                                  Χωρίς διαθέσιμες ώρες
                                </span>
                              )}
                            </div>

                            {/* Ειδικότητα · εμπειρία */}
                            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 5 }}>
                              {t.specialty}
                              {t.years_experience > 0 && ` · ${t.years_experience} ${t.years_experience === 1 ? 'χρόνος' : 'χρόνια'} εμπειρίας`}
                            </div>

                            {/* Αξιολογήσεις */}
                            <div style={{ fontSize: 12.5, marginBottom: 8 }}>
                              {t.reviewCount > 0 ? (
                                <span style={{ fontWeight: 600, color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Star size={12} fill="#B45309" color="#B45309" />
                                  {t.avgRating.toFixed(1)}
                                  <span style={{ color: '#94A3B8', fontWeight: 400 }}>
                                    ({t.reviewCount} {t.reviewCount === 1 ? 'αξιολόγηση' : 'αξιολογήσεις'})
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>Χωρίς αξιολογήσεις ακόμη</span>
                              )}
                            </div>

                            {/* Γιατί εμφανίζεται — χτίζει εμπιστοσύνη στο matching */}
                            {t.matchLevel === 'exact' && (
                              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '9px 12px', marginBottom: 9 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>
                                  Ταιριάζει στην αναζήτησή σας
                                </div>
                                <div style={{ fontSize: 12.5, color: '#166534', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                  <Check size={12} strokeWidth={3} /> Αντιμετωπίζει {condition?.name}
                                </div>
                                <div style={{ fontSize: 12.5, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Check size={12} strokeWidth={3} /> Εξυπηρετεί {area}
                                </div>
                              </div>
                            )}

                            {/* Τιμή + επόμενο διαθέσιμο */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 15, color: '#2a6fdb', fontWeight: 700 }}>
                                {Math.round(Number(t.price_per_session || 0))}€ <span style={{ fontSize: 12.5, fontWeight: 500, color: '#64748b' }}>/ συνεδρία</span>
                              </span>
                              {nextLabel && (
                                <span style={{ fontSize: 12.5, color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <Clock size={12} />
                                  Επόμενο διαθέσιμο: {nextLabel}
                                </span>
                              )}
                            </div>

                            {t.bio && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 7, lineHeight: 1.5 }}>{t.bio.slice(0, 110)}{t.bio.length > 110 ? '...' : ''}</p>}
                          </div>

                          <div className="therapist-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => setProfileModal(t)}
                              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              Δες προφίλ
                            </button>
                            <button
                              onClick={() => { if (!noSlots) { setSelectedTherapist(isSelected ? null : t); setSelectedSlot(null); } }}
                              disabled={noSlots}
                              title={noSlots ? 'Δεν έχει ανοιχτές ώρες αυτή τη στιγμή' : ''}
                              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: noSlots ? '#cbd5e1' : (isSelected ? '#15803D' : '#1a2e44'), color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: noSlots ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              {isSelected && <Check size={12} strokeWidth={3} />}
                              {noSlots ? 'Μη διαθέσιμος' : isSelected ? 'Επιλεγμένος' : 'Επιλογή'}
                            </button>
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Ημερομηνία */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Διάλεξε ημέρα και ώρα</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                Επίλεξε την ώρα που σε βολεύει από το πρόγραμμα του θεραπευτή.
                Ο θεραπευτής θα την επιβεβαιώσει.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button onClick={() => setCalendarWeek(w => Math.max(0, w - 1))} disabled={calendarWeek === 0}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: calendarWeek === 0 ? '#f8fafc' : '#fff', color: calendarWeek === 0 ? '#94a3b8' : '#1a2e44', fontSize: 13, fontWeight: 600, cursor: calendarWeek === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                  <ChevronLeft size={14} />
                  Πριν
                </button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                  {weekDates[0] && `${new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} – ${new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}`}
                </div>
                <button onClick={() => setCalendarWeek(w => w + 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                  Μετά
                  <ChevronRight size={14} />
                </button>
              </div>

              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#64748B' }}>Φόρτωση διαθεσιμότητας...</div>
              ) : (
                <div>
                  {weekDates.map(date => {
                    const daySlots = slots.filter(s => s.date === date);
                    if (daySlots.length === 0) return null;
                    const dateObj = new Date(date + 'T12:00:00');
                    return (
                      <div key={date} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                          {DAYS_EL[dateObj.getDay()]} {dateObj.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {daySlots.map(slot => {
                            const isSelected = selectedSlot?.id === slot.id;
                            return (
                              <button key={slot.id} onClick={() => pickSlot(slot)}
                                style={{
                                  padding: '9px 16px', borderRadius: 8,
                                  border: `2px solid ${isSelected ? '#15803D' : '#e2e8f0'}`,
                                  background: isSelected ? '#15803D' : '#fff',
                                  color: isSelected ? '#fff' : '#0F172A',
                                  fontSize: 13.5, fontWeight: isSelected ? 700 : 600,
                                  cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                }}>
                                {slot.start_time?.slice(0, 5)}
                                {isSelected && <Check size={13} strokeWidth={3} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {slots.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 14 }}>
                      Δεν υπάρχουν διαθέσιμες ώρες αυτή την εβδομάδα. Δοκιμάστε την επόμενη.
                    </div>
                  )}
                </div>
              )}

              {selectedSlot && (
                <div style={{ marginTop: 20, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13.5, color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Check size={15} strokeWidth={3} />
                    {(() => {
                      const d = new Date(selectedSlot.date + 'T12:00:00');
                      return `${DAYS_EL[d.getDay()]} ${d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} στις ${selectedSlot.start_time?.slice(0, 5)}`;
                    })()}
                  </div>
                  <button onClick={() => setSelectedSlot(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
                    <X size={13} />
                    Αλλαγή
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Επιβεβαίωση */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Έλεγχος πριν την αποστολή</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Δείτε αν είναι όλα σωστά.</p>

              {/* Compact card αντί για μακρύ πίνακα */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                    Αίτημα για
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{problemType || '—'}</div>
                </div>

                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={selectedTherapist?.name} photoUrl={selectedTherapist?.photo_url} size={44} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{selectedTherapist?.name}</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{selectedTherapist?.specialty}</div>
                  </div>
                </div>

                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <Calendar size={15} color="#2a6fdb" style={{ marginTop: 2, flexShrink: 0 }} />
                    <strong>
                      {selectedSlot && (() => {
                        const d = new Date(selectedSlot.date + 'T12:00:00');
                        return `${DAYS_EL[d.getDay()]} ${d.toLocaleDateString('el-GR', { day: '2-digit', month: 'long' })} στις ${selectedSlot.start_time?.slice(0, 5)}`;
                      })()}
                    </strong>
                  </div>
                  <div style={{ fontSize: 14, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <MapPin size={15} color="#2a6fdb" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>
                      {address}, {area}{postalCode ? `, ${postalCode}` : ''}
                      {floorInfo && <span style={{ color: '#94a3b8' }}> · {floorInfo}</span>}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <Banknote size={15} color="#15803D" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>
                      <strong style={{ color: '#15803D' }}>{sessionCost}€</strong> — πληρωμή απευθείας στον θεραπευτή μετά τη συνεδρία
                    </span>
                  </div>
                </div>

                {(problemDesc || notes) && (
                  <div style={{ padding: '14px 20px', background: '#f8fafc', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    {problemDesc && <div>{problemDesc}</div>}
                    {notes && <div style={{ marginTop: problemDesc ? 6 : 0, color: '#64748b' }}>Πρόσβαση: {notes}</div>}
                  </div>
                )}
              </div>

              {/* Το πιο σημαντικό μήνυμα αυτής της οθόνης */}
              <div style={{ marginTop: 16, background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <AlertCircle size={18} color="#B45309" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 3 }}>
                    Το ραντεβού δεν έχει κλείσει ακόμη
                  </div>
                  <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
                    Στέλνετε αίτημα. Ο θεραπευτής πρέπει να το αποδεχθεί — θα ειδοποιηθείτε μόλις απαντήσει.
                  </div>
                </div>
              </div>

              {feeInfo && feeInfo.is_first === false && feeInfo.reason === 'repeat_patient' && (
                <div style={{ marginTop: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Heart size={15} color="#1D4ED8" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: '#1D4ED8', lineHeight: 1.6 }}>
                    Συνεχίζετε με τον/την <strong>{selectedTherapist?.name}</strong>, που σας γνωρίζει ήδη.
                    Η θεραπεία σας συνεχίζεται από εκεί που την αφήσατε.
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}

          <div className="nav-buttons-mobile" style={{ display: 'flex', justifyContent: step === 1 ? 'flex-end' : 'space-between', marginTop: 28, gap: 10 }}>
            {step > 1 && (
              <button onClick={() => { setError(''); setStep(s => s - 1); }}
                style={{ padding: '11px 28px', borderRadius: 30, border: '1.5px solid #e2e8f0', background: 'transparent', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ChevronLeft size={16} />
                Πίσω
              </button>
            )}
            {step < STEPS.length ? (
              <button onClick={() => { if (validateStep()) setStep(s => s + 1); }}
                style={{ padding: '11px 32px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Συνέχεια
                <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '11px 30px', borderRadius: 30, border: 'none', background: submitting ? '#94a3b8' : '#15803D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {!submitting && <Send size={15} />}
                {submitting ? 'Αποστολή...' : 'Στείλε αίτημα στον θεραπευτή'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Therapist Profile Modal */}
      {profileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setProfileModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar name={profileModal.name} photoUrl={profileModal.photo_url} size={64} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 7 }}>
                  {profileModal.name}
                  {profileModal.license_verified && <ShieldCheck size={16} color="#2a6fdb" strokeWidth={2.5} />}
                </div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{profileModal.specialty}</div>
                <div style={{ fontSize: 14, color: '#2a6fdb', fontWeight: 600 }}>{Math.round(Number(profileModal.price_per_session || 0))}€/συνεδρία</div>
              </div>
            </div>

            {profileModal.license_verified && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#1D4ED8', display: 'flex', gap: 8, alignItems: 'center' }}>
                <ShieldCheck size={14} strokeWidth={2.3} />
                Η επαγγελματική άδεια έχει επαληθευτεί από την πλατφόρμα.
              </div>
            )}

            {[
              ['Ειδικότητα', profileModal.specialty],
              ['Εμπειρία', profileModal.years_experience > 0 ? `${profileModal.years_experience} χρόνια` : null],
              ['Περιοχή', profileModal.area],
              ['Αξιολογήσεις', profileModal.reviewCount > 0 ? `${profileModal.avgRating.toFixed(1)} / 5 (${profileModal.reviewCount})` : 'Καμία ακόμη'],
              ['Τιμή/Συνεδρία', `${Math.round(Number(profileModal.price_per_session || 0))}€`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14, gap: 12 }}>
                <span style={{ color: '#64748B' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0F172A', textAlign: 'right' }}>{value || '—'}</span>
              </div>
            ))}

            {profileModal.bio && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Βιογραφικό</div>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>{profileModal.bio}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setSelectedTherapist(profileModal); setSelectedSlot(null); setProfileModal(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                <Check size={14} strokeWidth={3} />
                Επιλογή θεραπευτή
              </button>
              <button onClick={() => setProfileModal(null)}
                style={{ padding: '12px 20px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}