'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PROBLEM_TYPES = [
  'Μυοσκελετικό',
  'Μετεγχειρητική Αποκατάσταση',
  'Νευρολογική Αποκατάσταση',
  'Αθλητικός Τραυματισμός',
  'Χρόνιος Πόνος',
  'Άλλο',
];

export default function FreeAssessmentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [problemType, setProblemType] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [floorInfo, setFloorInfo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Prefill email αν έχει
        if (user.email) setEmail(user.email);
      }
      setChecking(false);
    }
    loadUser();
  }, []);

  function validate() {
    setError('');
    if (!fullName.trim()) { setError('Παρακαλώ συμπληρώστε το ονοματεπώνυμό σας.'); return false; }
    if (!phone.trim())    { setError('Παρακαλώ συμπληρώστε το τηλέφωνό σας.'); return false; }
    if (!email.trim())    { setError('Παρακαλώ συμπληρώστε το email σας.'); return false; }
    if (!problemType)     { setError('Παρακαλώ επιλέξτε είδος προβλήματος.'); return false; }
    if (!address.trim())  { setError('Παρακαλώ συμπληρώστε τη διεύθυνσή σας.'); return false; }
    if (!area.trim())     { setError('Παρακαλώ συμπληρώστε την περιοχή σας.'); return false; }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      type: 'free_assessment',
      patient_id: user?.id || null,
      therapist_id: null,
      problem_type: problemType,
      problem_description: problemDesc
        ? `${problemDesc}\n\n[Στοιχεία επικοινωνίας: ${fullName}, ${phone}, ${email}]`
        : `[Στοιχεία επικοινωνίας: ${fullName}, ${phone}, ${email}]`,
      address,
      area,
      postal_code: postalCode,
      floor_info: floorInfo,
      notes,
      status: 'pending',
    };

    const { error: insertErr } = await supabase
      .from('session_requests')
      .insert([payload]);

    if (insertErr) {
      setError('Σφάλμα αποστολής: ' + insertErr.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1a2e44',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };

  if (checking) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          Φόρτωση...
        </div>
        <Footer />
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Το αίτημα εστάλη!</h2>
            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 28 }}>
              Λάβαμε το αίτημά σας για δωρεάν αξιολόγηση. Η ομάδα μας θα επικοινωνήσει μαζί σας εντός 24 ωρών για να προγραμματίσουμε την αξιολόγηση.
            </p>
            <a href="/" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Επιστροφή στην Αρχική →
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>

          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#e8f1fd', color: '#2a6fdb', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Δωρεάν Αξιολόγηση
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 700, color: '#0F172A', marginBottom: 12, lineHeight: 1.2 }}>
              Ξεκινήστε με μια <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>Δωρεάν Αξιολόγηση</em>
            </h1>
            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
              Συμπληρώστε τη φόρμα και η ομάδα μας θα επικοινωνήσει μαζί σας για να αξιολογήσουμε τις ανάγκες σας και να δημιουργήσουμε ένα εξατομικευμένο πλάνο θεραπείας.
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Contact info */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 0, marginTop: 0 }}>Στοιχεία Επικοινωνίας</h3>

              <div>
                <label style={labelStyle}>Ονοματεπώνυμο *</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="π.χ. Μαρία Παπαδοπούλου" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Τηλέφωνο *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="π.χ. 6912345678" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} />
                </div>
              </div>

              {/* Problem */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 16, marginBottom: 0 }}>Πρόβλημα</h3>

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
                  placeholder="Περιγράψτε σύντομα το πρόβλημα ή τον λόγο που ζητάτε αξιολόγηση"
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Address */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 16, marginBottom: 0 }}>Διεύθυνση</h3>

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
                  placeholder="Οτιδήποτε άλλο θέλετε να γνωρίζουμε"
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 30,
                  border: 'none',
                  background: submitting ? '#94a3b8' : '#1a2e44',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  marginTop: 12,
                }}>
                {submitting ? 'Αποστολή...' : '✓ Αποστολή Αιτήματος για Δωρεάν Αξιολόγηση'}
              </button>

              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                Η αξιολόγηση είναι δωρεάν και χωρίς καμία δέσμευση.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}