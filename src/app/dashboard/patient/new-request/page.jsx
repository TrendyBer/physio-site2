'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, ChevronLeft, ChevronRight, Calendar, ArrowRight, MapPin, AlertCircle, Star } from 'lucide-react';
import ConditionSearch from '@/components/ConditionSearch';

// ── helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = 44 }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

const PROBLEM_TYPES = [
  'Μυοσκελετικό', 'Μετεγχειρητική Αποκατάσταση', 'Νευρολογική Αποκατάσταση',
  'Αθλητικός Τραυματισμός', 'Χρόνιος Πόνος', 'Άλλο'
];

const SINGLE_SESSION = {
  id: 'single',
  isSingle: true,
  name_el: 'Μεμονωμένη Συνεδρία',
  name_en: 'Single Session',
  sessions: 1,
  discount_percent: 0,
  description_el: '1 συνεδρία με την τιμή του θεραπευτή',
};

const DAYS_EL = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

const STEPS = ['Πρόβλημα', 'Θεραπευτής', 'Τύπος', 'Ημερομηνίες', 'Επιβεβαίωση'];

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPackageName = searchParams.get('package');

  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
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
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Step 3
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const [loadingTherapists, setLoadingTherapists] = useState(false);

  // Step 4
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [calendarWeek, setCalendarWeek] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      setUser(user);

      // Τα στοιχεία που έχει ήδη δώσει ο ασθενής στο προφίλ του
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
        // Δεν έχει διεύθυνση στο προφίλ → κανονική φόρμα
        setEditingAddress(true);
      }

      // Διεύθυνση από το hero search του site (αν ήρθε από εκεί)
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
    async function fetchPackages() {
      const { data } = await supabase
        .from('packages')
        .select('id, name_el, name_en, sessions, discount_percent, description_el, description_en, display_order')
        .eq('is_active', true)
        .order('sessions', { ascending: true });
      setPackages(data || []);
      setLoadingPackages(false);
    }
    fetchPackages();
  }, []);

  useEffect(() => {
    if (!preselectedPackageName || packages.length === 0) return;
    const matched = packages.find(p => p.name_el === preselectedPackageName || p.name_en === preselectedPackageName);
    if (matched) setSelectedPackage(matched);
  }, [preselectedPackageName, packages]);

  useEffect(() => {
    if (step === 2) fetchTherapists();
  }, [step]);

  useEffect(() => {
    if (step === 4 && selectedTherapist) fetchSlots();
  }, [step, selectedTherapist, calendarWeek]);

  // Κανονικοποίηση για σύγκριση περιοχών (τόνοι, πεζά/κεφαλαία)
  function normalize(str) {
    return (str || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function servesArea(t, targetArea) {
    const target = normalize(targetArea);
    if (!target) return true;
    if (normalize(t.area) === target) return true;
    const areas = Array.isArray(t.service_areas) ? t.service_areas : [];
    return areas.some((a) => normalize(a) === target);
  }

  /**
   * MATCH SCORE (0-100)
   *
   * Η πάθηση ΔΕΝ βαθμολογείται — είναι σκληρό φίλτρο.
   * Όποιος δεν τη δήλωσε, δεν μπαίνει καν στην κύρια λίστα.
   * Το score κατατάσσει ΜΟΝΟ ανάμεσα στους κατάλληλους.
   */
  function matchScore(t) {
    let score = 0;

    // Διαθεσιμότητα (30) — χωρίς ελεύθερες ώρες δεν κλείνεις ραντεβού
    if (t.freeSlots >= 5) score += 30;
    else if (t.freeSlots >= 1) score += 15 + t.freeSlots * 3;

    // Αξιολογήσεις (25)
    if (t.reviewCount > 0) {
      score += Math.round((t.avgRating / 5) * 20);
      if (t.reviewCount >= 5) score += 5;
      else score += t.reviewCount;
    } else {
      score += 8;   // νέος θεραπευτής — ουδέτερο, όχι τιμωρία
    }

    // Εμπειρία στην πλατφόρμα (20)
    score += Math.min(20, t.completedCount * 2);

    // Πλήρες προφίλ (15)
    if (t.is_profile_full) score += 15;
    else score += 5;

    // Ταχύτητα απόκρισης (10)
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

    // ── 2. Εγκεκριμένοι + πλήρες προφίλ (ίδιο gate με το site) ──
    const { data: all } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('is_approved', true)
      .eq('is_profile_complete', true);

    const pool = (all || []).filter((t) => !t.is_paused);
    if (pool.length === 0) { setTherapists([]); setLoadingTherapists(false); return; }

    const ids = pool.map((t) => t.id);
    const todayStr = new Date().toISOString().split('T')[0];

    // ── 3. Δεδομένα κατάταξης, όλα μαζί ──
    const [{ data: revs }, { data: reqs }, { data: freeSlots }] = await Promise.all([
      supabase.from('reviews').select('therapist_id, rating').eq('is_published', true).in('therapist_id', ids),
      supabase.from('session_requests').select('therapist_id, status').in('therapist_id', ids),
      supabase.from('availability_slots').select('therapist_id')
        .eq('is_blocked', false).gte('date', todayStr).in('therapist_id', ids),
    ]);

    const stats = {};
    ids.forEach((id) => { stats[id] = { sum: 0, count: 0, completed: 0, slots: 0 }; });
    (revs || []).forEach((r) => { stats[r.therapist_id].sum += r.rating; stats[r.therapist_id].count += 1; });
    (reqs || []).forEach((r) => { if (r.status === 'completed') stats[r.therapist_id].completed += 1; });
    (freeSlots || []).forEach((sl) => { stats[sl.therapist_id].slots += 1; });

    const enrich = (t) => {
      const st = stats[t.id];
      return {
        ...t,
        avgRating: st.count ? st.sum / st.count : 0,
        reviewCount: st.count,
        completedCount: st.completed,
        freeSlots: st.slots,
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

    setTherapists([...primary, ...secondary]);
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
    setSlots(data || []);
    setLoadingSlots(false);
  }

  function toggleSlot(slot) {
    const needed = selectedPackage?.sessions || 1;
    const already = selectedSlots.find(s => s.id === slot.id);
    if (already) {
      setSelectedSlots(prev => prev.filter(s => s.id !== slot.id));
    } else {
      if (selectedSlots.length >= needed) return;
      setSelectedSlots(prev => [...prev, slot]);
    }
  }

  function validateStep() {
    setError('');
    if (step === 1) {
      if (!condition) { setError('Πείτε μας τι σας ταλαιπωρεί — γράψτε π.χ. «πόνος στη μέση».'); return false; }
      // Αν δείχνουμε αποθηκευμένη διεύθυνση, πρέπει να την επιβεβαιώσει
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
      if (!selectedPackage) { setError('Παρακαλώ επιλέξτε τύπο συνεδρίας.'); return false; }
    }
    if (step === 4) {
      const needed = selectedPackage?.sessions || 1;
      if (selectedSlots.length < needed) { setError(`Παρακαλώ επιλέξτε ${needed} συνεδρία/ες (έχετε επιλέξει ${selectedSlots.length}).`); return false; }
    }
    return true;
  }

  function calculateTotalCost() {
    if (!selectedPackage || !selectedTherapist) return 0;
    const pricePerSession = selectedTherapist.price_per_session || 0;
    const sessions = selectedPackage.sessions;
    const discountPercent = selectedPackage.discount_percent || 0;
    const subtotal = sessions * pricePerSession;
    const discount = subtotal * (discountPercent / 100);
    return Math.round(subtotal - discount);
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);

    const totalCost = calculateTotalCost();

    // Αν έδωσε νέα διεύθυνση, την κρατάμε στο προφίλ του.
    // Έτσι την επόμενη φορά απλά την επιβεβαιώνει.
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

    const { data: req, error: reqErr } = await supabase
      .from('session_requests')
      .insert([{
        patient_id: user.id,
        therapist_id: selectedTherapist.id,
        problem_type: problemType,
        condition_id: condition?.id || null,
        problem_description: problemDesc,
        address, area, postal_code: postalCode,
        floor_info: floorInfo, notes,
        session_type: selectedPackage.isSingle ? 'single' : 'package',
        package_size: selectedPackage.sessions,
        total_cost: totalCost,
        status: 'pending',
        type: 'booking',
      }])
      .select().single();

    if (reqErr) { setError('Σφάλμα: ' + reqErr.message); setSubmitting(false); return; }

    const bookings = selectedSlots.map(slot => ({
      request_id: req.id,
      patient_id: user.id,
      therapist_id: selectedTherapist.id,
      slot_id: slot.id,
      session_date: slot.date,
      session_time: slot.start_time,
      status: 'pending',
    }));

    await supabase.from('session_bookings').insert(bookings);

    await supabase.from('availability_slots')
      .update({ is_blocked: true })
      .in('id', selectedSlots.map(s => s.id));

    setSubmitting(false);
    setSubmitted(true);
  }

  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + calendarWeek * 7 + i);
    return d.toISOString().split('T')[0];
  });

  const needed = selectedPackage?.sessions || 1;

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a2e44' };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={32} color="#15803D" strokeWidth={3} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Το αίτημά σας εστάλη!</h2>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 28 }}>
          Ο θεραπευτής <strong>{selectedTherapist?.name}</strong> θα λάβει το αίτημά σας και θα απαντήσει σύντομα.
        </p>
        <a href="/dashboard/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Επιστροφή στο Dashboard
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );

  const allOptions = [SINGLE_SESSION, ...packages];

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
          Πίσω στο Dashboard
        </a>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Title */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Νέο Αίτημα Συνεδρίας</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Συμπλήρωσε τα στοιχεία σου και επίλεξε θεραπευτή και ώρα</p>
        </div>

        {/* DESKTOP Stepper (768px+) */}
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
                {i < STEPS.length - 1 && <div style={{ width: 40, height: 2, background: done ? '#15803D' : '#e2e8f0', margin: '0 4px', marginBottom: 16, transition: 'all .2s' }} />}
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
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Πες μας τι χρειάζεσαι</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Συμπλήρωσε το πρόβλημα, τη διεύθυνσή σου και οποιεσδήποτε επιπλέον πληροφορίες.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Τι σας ταλαιπωρεί; *</label>
                  <ConditionSearch
                    lang="el"
                    value={condition}
                    onChange={(c) => {
                      setCondition(c);
                      setProblemType(c?.name || '');
                      setSelectedTherapist(null);   // αλλάζει η πάθηση → ξαναδιαλέγει θεραπευτή
                    }}
                    showChips={true}
                    compact={false}
                  />
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                    Γράψτε με απλά λόγια — π.χ. «πόνος στη μέση». Δεν χρειάζεται διάγνωση.
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Περιγραφή προβλήματος</label>
                  <textarea value={problemDesc} onChange={e => setProblemDesc(e.target.value)} rows={4}
                    placeholder="Περιγράψτε σύντομα το πρόβλημα ή τον λόγο που ζητάτε φυσιοθεραπεία"
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {/* ── ΔΙΕΥΘΥΝΣΗ ── */}
                {savedAddress && !editingAddress ? (
                  /* Έχει ήδη διεύθυνση στο προφίλ → μόνο επιβεβαίωση */
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
                          {addressConfirmed ? 'Διεύθυνση επιβεβαιωμένη' : 'Επιβεβαίωσε τη διεύθυνσή σου'}
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

                    <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Διεύθυνση *</label>
                        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="π.χ. Αθηνάς 12" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Περιοχή *</label>
                        <input value={area} onChange={e => setArea(e.target.value)} placeholder="π.χ. Κολωνάκι" style={inputStyle} />
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
                  </>
                )}

                {/* Ο όροφος ζητείται πάντα — αλλάζει ανά επίσκεψη */}
                {savedAddress && !editingAddress && (
                  <div>
                    <label style={labelStyle}>Όροφος / Κουδούνι</label>
                    <input value={floorInfo} onChange={e => setFloorInfo(e.target.value)} placeholder="π.χ. 3ος, Παπαδόπουλος" style={inputStyle} />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Επιπλέον σημειώσεις</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Οτιδήποτε άλλο πρέπει να γνωρίζει ο θεραπευτής"
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Τύπος Συνεδρίας */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Επίλεξε τύπο συνεδρίας</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                {selectedTherapist
                  ? <>Τιμές για τον/την <strong style={{ color: '#0F172A' }}>{selectedTherapist.name}</strong> — {selectedTherapist.price_per_session}€ ανά συνεδρία.</>
                  : 'Μεμονωμένη συνεδρία ή πακέτο με έκπτωση;'}
              </p>

              {preselectedPackageName && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} strokeWidth={3} />
                  Προεπιλέχθηκε: <strong>{preselectedPackageName}</strong>
                </div>
              )}

              {loadingPackages ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Φόρτωση...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                  {allOptions.map(pkg => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    const name = pkg.name_el;
                    const discount = pkg.discount_percent || 0;
                    return (
                      <div key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                        style={{
                          padding: '20px 16px',
                          border: `2px solid ${isSelected ? '#2a6fdb' : '#e2e8f0'}`,
                          borderRadius: 14,
                          cursor: 'pointer',
                          textAlign: 'center',
                          background: isSelected ? '#EFF6FF' : '#fff',
                          transition: 'all .2s',
                          position: 'relative',
                        }}>
                        {discount > 0 && (
                          <div style={{ position: 'absolute', top: -10, right: 10, background: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                            -{discount}%
                          </div>
                        )}
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#1a2e44', marginBottom: 4, fontFamily: 'Georgia, serif' }}>
                          {pkg.sessions}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 10 }}>
                          {pkg.sessions === 1 ? 'συνεδρία' : 'συνεδρίες'}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{name}</div>

                        {selectedTherapist?.price_per_session > 0 && (() => {
                          const sub = pkg.sessions * selectedTherapist.price_per_session;
                          const tot = Math.round(sub - (sub * discount / 100));
                          return (
                            <div style={{ marginBottom: 6 }}>
                              <div style={{ fontSize: 17, fontWeight: 700, color: '#15803D' }}>{tot}€</div>
                              {discount > 0 && (
                                <div style={{ fontSize: 11, color: '#94A3B8', textDecoration: 'line-through' }}>{sub}€</div>
                              )}
                            </div>
                          );
                        })()}
                        {pkg.description_el && (
                          <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{pkg.description_el}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Θεραπευτής */}
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
                  {therapists.map((t, idx) => {
                    const prev = idx > 0 ? therapists[idx - 1] : null;
                    const startsSecondary = t.matchLevel === 'area' && (!prev || prev.matchLevel !== 'area');
                    const isSelected = selectedTherapist?.id === t.id;

                    const pricePerSession = t.price_per_session || 0;
                    const sessions = selectedPackage?.sessions || 1;
                    const discountPercent = selectedPackage?.discount_percent || 0;
                    const subtotal = sessions * pricePerSession;
                    const totalWithDiscount = Math.round(subtotal - (subtotal * discountPercent / 100));

                    const noSlots = t.freeSlots === 0;

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
                      <div style={{ border: `2px solid ${isSelected ? '#2a6fdb' : '#e2e8f0'}`, borderRadius: 14, padding: '16px 20px', background: isSelected ? '#EFF6FF' : '#fff', transition: 'all .2s', opacity: noSlots ? 0.65 : 1 }}>
                        <div className="therapist-card-row" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <Avatar name={t.name} photoUrl={t.photo_url} size={52} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{t.name || '—'}</span>
                              {t.matchLevel === 'exact' && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Check size={11} strokeWidth={3} />
                                  Αντιμετωπίζει {condition?.name}
                                </span>
                              )}
                              {noSlots && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#BE123C', background: '#FFF1F2', border: '1px solid #FECDD3', padding: '2px 9px', borderRadius: 999 }}>
                                  Χωρίς διαθέσιμες ώρες
                                </span>
                              )}
                              {t.reviewCount > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <Star size={11} fill="#B45309" color="#B45309" />
                                  {t.avgRating.toFixed(1)}
                                  <span style={{ color: '#94A3B8', fontWeight: 400 }}>({t.reviewCount})</span>
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>{t.specialty} · {t.area}</div>
                            <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>
                              {pricePerSession}€/συνεδρία
                              {selectedPackage && sessions > 1 && (
                                <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
                                  · Σύνολο: <strong style={{ color: '#10b981' }}>{totalWithDiscount}€</strong>
                                  {discountPercent > 0 && <span style={{ textDecoration: 'line-through', marginLeft: 6, color: '#94a3b8' }}>{subtotal}€</span>}
                                </span>
                              )}
                            </div>
                            {t.bio && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, lineHeight: 1.5 }}>{t.bio.slice(0, 100)}{t.bio.length > 100 ? '...' : ''}</p>}
                          </div>
                          <div className="therapist-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => setProfileModal(t)}
                              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Δες προφίλ
                            </button>
                            <button
                              onClick={() => !noSlots && setSelectedTherapist(isSelected ? null : t)}
                              disabled={noSlots}
                              title={noSlots ? 'Δεν έχει ανοιχτές ώρες αυτή τη στιγμή' : ''}
                              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: noSlots ? '#cbd5e1' : (isSelected ? '#15803D' : '#1a2e44'), color: '#fff', fontSize: 12, fontWeight: 600, cursor: noSlots ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
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

          {/* STEP 4 — Calendar */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Διάλεξε ημέρα και ώρα</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>
                Επίλεξε {needed === 1 ? '1 διαθέσιμο slot' : `${needed} διαθέσιμα slots`} από το ημερολόγιο του θεραπευτή.
              </p>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#1D4ED8', fontWeight: 600 }}>
                Έχετε επιλέξει {selectedSlots.length} από {needed} συνεδρία/ες
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button onClick={() => setCalendarWeek(w => Math.max(0, w - 1))} disabled={calendarWeek === 0}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: calendarWeek === 0 ? '#f8fafc' : '#fff', color: calendarWeek === 0 ? '#94a3b8' : '#1a2e44', fontSize: 13, fontWeight: 600, cursor: calendarWeek === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ChevronLeft size={14} />
                  Πριν
                </button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                  {weekDates[0] && `${new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} – ${new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}`}
                </div>
                <button onClick={() => setCalendarWeek(w => w + 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
                            const isSelected = selectedSlots.find(s => s.id === slot.id);
                            const canSelect = isSelected || selectedSlots.length < needed;
                            return (
                              <button key={slot.id} onClick={() => canSelect && toggleSlot(slot)}
                                style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${isSelected ? '#2a6fdb' : '#e2e8f0'}`, background: isSelected ? '#2a6fdb' : canSelect ? '#fff' : '#f8fafc', color: isSelected ? '#fff' : canSelect ? '#0F172A' : '#94a3b8', fontSize: 13, fontWeight: 600, cursor: canSelect ? 'pointer' : 'not-allowed', transition: 'all .15s' }}>
                                {slot.start_time?.slice(0, 5)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {slots.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 14 }}>
                      Δεν υπάρχουν διαθέσιμα slots αυτή την εβδομάδα. Δοκιμάστε την επόμενη.
                    </div>
                  )}
                </div>
              )}

              {selectedSlots.length > 0 && (
                <div style={{ marginTop: 20, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Check size={14} strokeWidth={3} />
                    Επιλεγμένες συνεδρίες:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedSlots.map((slot, i) => {
                      const d = new Date(slot.date + 'T12:00:00');
                      return (
                        <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#15803D' }}>
                          <span>{i + 1}. {DAYS_EL[d.getDay()]} {d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} στις {slot.start_time?.slice(0, 5)}</span>
                          <button onClick={() => toggleSlot(slot)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 2 }}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5 — Επιβεβαίωση */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Επιβεβαίωση αιτήματος</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Ελέγξτε τα στοιχεία πριν την αποστολή.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                {[
                  ['Πρόβλημα', problemType],
                  ['Περιγραφή', problemDesc || '—'],
                  ['Διεύθυνση', `${address}, ${area}${postalCode ? ', ' + postalCode : ''}`],
                  ['Όροφος/Κουδούνι', floorInfo || '—'],
                  ['Σημειώσεις', notes || '—'],
                  ['Τύπος συνεδρίας', selectedPackage?.name_el],
                  ['Συνεδρίες', selectedPackage?.sessions],
                  ['Έκπτωση', selectedPackage?.discount_percent ? `${selectedPackage.discount_percent}%` : '—'],
                  ['Θεραπευτής', selectedTherapist?.name],
                  ['Τιμή/Συνεδρία', `${selectedTherapist?.price_per_session}€`],
                  ['Συνολικό κόστος', `${calculateTotalCost()}€`],
                ].map(([label, value], i) => (
                  <div key={label} style={{ display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : '#fff', fontSize: 14, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ color: '#64748B', minWidth: 140, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#0F172A', wordBreak: 'break-word' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} />
                  Επιλεγμένες Συνεδρίες:
                </div>
                {selectedSlots.map((slot, i) => {
                  const d = new Date(slot.date + 'T12:00:00');
                  return (
                    <div key={slot.id} style={{ fontSize: 13, color: '#1E40AF', marginBottom: 4 }}>
                      {i + 1}. {DAYS_EL[d.getDay()]} {d.toLocaleDateString('el-GR', { day: '2-digit', month: 'long' })} στις {slot.start_time?.slice(0, 5)}
                    </div>
                  );
                })}
              </div>
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
            {step < 5 ? (
              <button onClick={() => { if (validateStep()) setStep(s => s + 1); }}
                style={{ padding: '11px 32px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Συνέχεια
                <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '11px 32px', borderRadius: 30, border: 'none', background: submitting ? '#94a3b8' : '#15803D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {!submitting && <Check size={16} strokeWidth={3} />}
                {submitting ? 'Αποστολή...' : 'Αποστολή Αιτήματος'}
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
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{profileModal.name}</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{profileModal.specialty}</div>
                <div style={{ fontSize: 14, color: '#2a6fdb', fontWeight: 600 }}>{profileModal.price_per_session}€/συνεδρία</div>
              </div>
            </div>

            {[
              ['Ειδικότητα', profileModal.specialty],
              ['Περιοχή', profileModal.area],
              ['Τιμή/Συνεδρία', `${profileModal.price_per_session}€`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                <span style={{ color: '#64748B' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{value || '—'}</span>
              </div>
            ))}

            {profileModal.bio && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Βιογραφικό</div>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>{profileModal.bio}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setSelectedTherapist(profileModal); setProfileModal(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} strokeWidth={3} />
                Επιλογή θεραπευτή
              </button>
              <button onClick={() => setProfileModal(null)}
                style={{ padding: '12px 20px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}