'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

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

// Η Μεμονωμένη Συνεδρία είναι πάντα διαθέσιμη (δεν είναι πακέτο)
const SINGLE_SESSION = {
  id: 'single',
  isSingle: true,
  name_el: 'Μεμονωμένη Συνεδρία',
  name_en: 'Single Session',
  sessions: 1,
  discount_percent: 0,
  description_el: '1 συνεδρία με την τιμή του θεραπευτή',
  icon: '1️⃣',
};

const DAYS_EL = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

const STEPS = ['Πρόβλημα', 'Τύπος', 'Θεραπευτής', 'Ημερομηνίες', 'Επιβεβαίωση'];

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
  const [problemType, setProblemType] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [floorInfo, setFloorInfo] = useState('');
  const [notes, setNotes] = useState('');

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

  // Load user + prefill address if exists from localStorage
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      setUser(user);

      // Prefill address από localStorage (αν πάτησε από Hero/CtaBanner με address)
      try {
        const savedAddress = localStorage.getItem('bookingAddress');
        if (savedAddress) {
          setAddress(savedAddress);
          localStorage.removeItem('bookingAddress');
        }
      } catch (_) {}
    });
  }, []);

  // Fetch packages από Supabase
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

  // Αν ήρθε με ?package=... preselect το αντίστοιχο πακέτο
  useEffect(() => {
    if (!preselectedPackageName || packages.length === 0) return;
    const matched = packages.find(p => p.name_el === preselectedPackageName || p.name_en === preselectedPackageName);
    if (matched) setSelectedPackage(matched);
  }, [preselectedPackageName, packages]);

  useEffect(() => {
    if (step === 3) fetchTherapists();
  }, [step]);

  useEffect(() => {
    if (step === 4 && selectedTherapist) fetchSlots();
  }, [step, selectedTherapist, calendarWeek]);

  async function fetchTherapists() {
    setLoadingTherapists(true);
    const { data } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('is_approved', true);
    setTherapists(data || []);
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
      if (!problemType || !address || !area) { setError('Παρακαλώ συμπληρώστε τα υποχρεωτικά πεδία (Πρόβλημα, Διεύθυνση, Περιοχή).'); return false; }
    }
    if (step === 2) {
      if (!selectedPackage) { setError('Παρακαλώ επιλέξτε τύπο συνεδρίας.'); return false; }
    }
    if (step === 3) {
      if (!selectedTherapist) { setError('Παρακαλώ επιλέξτε θεραπευτή.'); return false; }
    }
    if (step === 4) {
      const needed = selectedPackage?.sessions || 1;
      if (selectedSlots.length < needed) { setError(`Παρακαλώ επιλέξτε ${needed} συνεδρία/ες (έχετε επιλέξει ${selectedSlots.length}).`); return false; }
    }
    return true;
  }

  // Υπολογισμός κόστους με βάση την έκπτωση του πακέτου
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
    const packageLabel = selectedPackage.isSingle
      ? 'Μεμονωμένη Συνεδρία'
      : selectedPackage.name_el;

    // 1. Create session_request
    const { data: req, error: reqErr } = await supabase
      .from('session_requests')
      .insert([{
        patient_id: user.id,
        therapist_id: selectedTherapist.id,
        problem_type: problemType,
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

    // 2. Create session_bookings (ένα για κάθε slot)
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

    // 3. Block the slots temporarily
    await supabase.from('availability_slots')
      .update({ is_blocked: true })
      .in('id', selectedSlots.map(s => s.id));

    setSubmitting(false);
    setSubmitted(true);
  }

  // Week dates
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
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Το αίτημά σας εστάλη!</h2>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 28 }}>
          Ο θεραπευτής <strong>{selectedTherapist?.name}</strong> θα λάβει το αίτημά σας και θα απαντήσει σύντομα.
        </p>
        <a href="/dashboard/patient" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Επιστροφή στο Dashboard →
        </a>
      </div>
    </div>
  );

  // Όλες οι επιλογές: Μεμονωμένη + τα πακέτα
  const allOptions = [SINGLE_SESSION, ...packages];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard/patient" style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
        </a>
        <a href="/dashboard/patient" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Πίσω στο Dashboard</a>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Title */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Νέο Αίτημα Συνεδρίας</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Συμπλήρωσε τα στοιχεία σου και επίλεξε θεραπευτή και ώρα βάσει διαθεσιμότητας</p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40, gap: 0 }}>
          {STEPS.map((s, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#15803D' : active ? '#2a6fdb' : '#e2e8f0', color: done || active ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all .2s' }}>
                    {done ? '✓' : num}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#2a6fdb' : done ? '#15803D' : '#94a3b8', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 40, height: 2, background: done ? '#15803D' : '#e2e8f0', margin: '0 4px', marginBottom: 16, transition: 'all .2s' }} />}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '32px', marginBottom: 20 }}>

          {/* STEP 1 — Πρόβλημα */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Πες μας τι χρειάζεσαι</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Συμπλήρωσε το πρόβλημα, τη διεύθυνσή σου και οποιεσδήποτε επιπλέον πληροφορίες.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Είδος προβλήματος *</label>
                  <select value={problemType} onChange={e => setProblemType(e.target.value)} style={inputStyle}>
                    <option value="">Επιλέξτε...</option>
                    {PROBLEM_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Περιγραφή προβλήματος</label>
                  <textarea value={problemDesc} onChange={e => setProblemDesc(e.target.value)} rows={4}
                    placeholder="Περιγράψτε σύντομα το πρόβλημα ή τον λόγο που ζητάτε φυσιοθεραπεία"
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

                <div>
                  <label style={labelStyle}>Επιπλέον σημειώσεις</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Οτιδήποτε άλλο πρέπει να γνωρίζει ο θεραπευτής"
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Τύπος Συνεδρίας (Μεμονωμένη + Πακέτα) */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Επίλεξε τύπο συνεδρίας</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
                Μεμονωμένη συνεδρία ή πακέτο με έκπτωση; Η τελική τιμή υπολογίζεται όταν επιλέξεις θεραπευτή.
              </p>

              {preselectedPackageName && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#1D4ED8' }}>
                  ✓ Προεπιλέχθηκε: <strong>{preselectedPackageName}</strong>
                </div>
              )}

              {loadingPackages ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Φόρτωση...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
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
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{name}</div>
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
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Διάλεξε θεραπευτή</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Επίλεξε τον θεραπευτή που σε εξυπηρετεί καλύτερα.</p>

              {loadingTherapists ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Φόρτωση θεραπευτών...</div>
              ) : therapists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Δεν υπάρχουν διαθέσιμοι θεραπευτές αυτή τη στιγμή.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {therapists.map(t => {
                    const isSelected = selectedTherapist?.id === t.id;

                    // Υπολογισμός κόστους για αυτόν τον θεραπευτή
                    const pricePerSession = t.price_per_session || 0;
                    const sessions = selectedPackage?.sessions || 1;
                    const discountPercent = selectedPackage?.discount_percent || 0;
                    const subtotal = sessions * pricePerSession;
                    const totalWithDiscount = Math.round(subtotal - (subtotal * discountPercent / 100));

                    return (
                      <div key={t.id} style={{ border: `2px solid ${isSelected ? '#2a6fdb' : '#e2e8f0'}`, borderRadius: 14, padding: '16px 20px', background: isSelected ? '#EFF6FF' : '#fff', transition: 'all .2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <Avatar name={t.name} photoUrl={t.photo_url} size={52} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 2 }}>{t.name || '—'}</div>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => setProfileModal(t)}
                              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Δες προφίλ
                            </button>
                            <button onClick={() => setSelectedTherapist(isSelected ? null : t)}
                              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: isSelected ? '#15803D' : '#1a2e44', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              {isSelected ? '✓ Επιλεγμένος' : 'Επιλογή'}
                            </button>
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
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: calendarWeek === 0 ? '#f8fafc' : '#fff', color: calendarWeek === 0 ? '#94a3b8' : '#1a2e44', fontSize: 13, fontWeight: 600, cursor: calendarWeek === 0 ? 'not-allowed' : 'pointer' }}>
                  ← Πριν
                </button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                  {weekDates[0] && `${new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} – ${new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}`}
                </div>
                <button onClick={() => setCalendarWeek(w => w + 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Μετά →
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 8 }}>✓ Επιλεγμένες συνεδρίες:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedSlots.map((slot, i) => {
                      const d = new Date(slot.date + 'T12:00:00');
                      return (
                        <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#15803D' }}>
                          <span>{i + 1}. {DAYS_EL[d.getDay()]} {d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} στις {slot.start_time?.slice(0, 5)}</span>
                          <button onClick={() => toggleSlot(slot)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 14 }}>✕</button>
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
                  <div key={label} style={{ display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : '#fff', fontSize: 14 }}>
                    <span style={{ color: '#64748B', width: 160, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>📅 Επιλεγμένες Συνεδρίες:</div>
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

          <div style={{ display: 'flex', justifyContent: step === 1 ? 'flex-end' : 'space-between', marginTop: 28 }}>
            {step > 1 && (
              <button onClick={() => { setError(''); setStep(s => s - 1); }}
                style={{ padding: '11px 28px', borderRadius: 30, border: '1.5px solid #e2e8f0', background: 'transparent', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Πίσω
              </button>
            )}
            {step < 5 ? (
              <button onClick={() => { if (validateStep()) setStep(s => s + 1); }}
                style={{ padding: '11px 32px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Συνέχεια →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '11px 32px', borderRadius: 30, border: 'none', background: submitting ? '#94a3b8' : '#15803D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {submitting ? 'Αποστολή...' : '✓ Αποστολή Αιτήματος'}
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
                style={{ flex: 1, padding: '12px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                ✓ Επιλογή αυτού του θεραπευτή
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