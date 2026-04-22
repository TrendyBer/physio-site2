'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function Avatar({ name, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function Badge({ label, bg, color }) {
  return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>;
}

function Stars({ rating, onChange, size = 24 }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} onClick={() => onChange && onChange(i)}
          style={{ fontSize: size, color: i <= rating ? '#F59E0B' : '#E2E8F0', cursor: onChange ? 'pointer' : 'default', lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

const STATUS_MAP = {
  pending:   { label: 'Εκκρεμές',      bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Επιβεβαιωμένο', bg: '#D1FAE5', color: '#065F46' },
  accepted:  { label: 'Αποδεκτό',      bg: '#D1FAE5', color: '#065F46' },
  declined:  { label: 'Απορρίφθηκε',   bg: '#FFE4E6', color: '#9F1239' },
  rejected:  { label: 'Απορρίφθηκε',   bg: '#FFE4E6', color: '#9F1239' },
  completed: { label: 'Ολοκληρώθηκε',  bg: '#EDE9FE', color: '#5B21B6' },
  cancelled: { label: 'Ακυρώθηκε',     bg: '#F1F5F9', color: '#64748B' },
};

const BOOKING_STATUS = {
  pending:   { label: 'Εκκρεμής',      bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Επιβεβαιωμένη', bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { label: 'Ολοκληρώθηκε',  bg: '#D1FAE5', color: '#065F46' },
  cancelled: { label: 'Ακυρώθηκε',     bg: '#F1F5F9', color: '#64748B' },
};

const DAYS_EL = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    setUser(user);

    // Profile
    const { data: prof } = await supabase.from('patient_profiles').select('*').eq('id', user.id).single();
    setProfile(prof || {});

    // Services
    const { data: svcs } = await supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true });
    setServices(svcs || []);

    await loadRequests(user.id);
    setLoading(false);
  }

  // Φορτώνει session_requests + joined bookings + therapist info + reviews
  async function loadRequests(patientId) {
    // 1. Fetch session_requests
    const { data: reqs } = await supabase
      .from('session_requests')
      .select('*, therapist_profiles(id, name, photo_url, specialty)')
      .eq('patient_id', patientId)
      .eq('type', 'booking')
      .order('created_at', { ascending: false });

    if (!reqs || reqs.length === 0) { setSessionRequests([]); return; }

    // 2. Fetch bookings for these requests
    const requestIds = reqs.map(r => r.id);
    const { data: bks } = await supabase
      .from('session_bookings')
      .select('*')
      .in('request_id', requestIds)
      .order('session_date', { ascending: true });

    // 3. Fetch reviews from this patient for these bookings
    const bookingIds = (bks || []).map(b => b.id);
    let reviews = [];
    if (bookingIds.length > 0) {
      const { data: rvs } = await supabase
        .from('reviews')
        .select('*')
        .eq('patient_id', patientId)
        .in('booking_id', bookingIds);
      reviews = rvs || [];
    }

    // 4. Combine
    const combined = reqs.map(req => {
      const reqBookings = (bks || []).filter(b => b.request_id === req.id);
      // Μαζεύουμε reviews που αντιστοιχούν σε bookings αυτού του αιτήματος
      const reqReview = reviews.find(rv => reqBookings.some(b => b.id === rv.booking_id));
      return {
        ...req,
        bookings: reqBookings,
        review: reqReview || null,
      };
    });

    setSessionRequests(combined);
  }

  // Άνοιγμα modal για review — χρειάζεται το request + το πρώτο completed booking ως reference
  function openReviewModal(request) {
    const firstCompletedBooking = request.bookings.find(b => b.status === 'completed');
    if (!firstCompletedBooking) {
      alert('Δεν υπάρχει ολοκληρωμένη συνεδρία ακόμα.');
      return;
    }
    setReviewModal({
      request,
      booking_id: firstCompletedBooking.id,
      therapist_id: request.therapist_id,
      therapist_name: request.therapist_profiles?.name || 'Θεραπευτής',
    });
    setReviewForm({ rating: 0, comment: '' });
  }

  async function submitReview() {
    if (!reviewForm.rating) {
      alert('Παρακαλώ επιλέξτε βαθμολογία.');
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert([{
      booking_id: reviewModal.booking_id,
      patient_id: user.id,
      therapist_id: reviewModal.therapist_id,
      rating: reviewForm.rating,
      comment: reviewForm.comment || null,
    }]);
    if (error) {
      alert('Σφάλμα υποβολής: ' + error.message);
      setSubmittingReview(false);
      return;
    }
    setReviewModal(null);
    setReviewForm({ rating: 0, comment: '' });
    await loadRequests(user.id);
    setSubmittingReview(false);
  }

  async function signOut() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  // Stats
  const pendingCount   = sessionRequests.filter(r => r.status === 'pending').length;
  const confirmedCount = sessionRequests.filter(r => r.status === 'confirmed' || r.status === 'accepted').length;
  const completedCount = sessionRequests.filter(r =>
    r.bookings.length > 0 && r.bookings.every(b => b.status === 'completed' || b.status === 'cancelled')
    && r.bookings.some(b => b.status === 'completed')
  ).length;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 16, color: '#64748B' }}>Φόρτωση...</div>
    </div>
  );

  const TABS = [
    { id: 'requests', label: '📋 Τα Αιτήματά μου' },
    { id: 'services', label: '🏥 Υπηρεσίες' },
    { id: 'profile',  label: '👤 Προφίλ' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
          <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginLeft: 8, background: '#f1f5f9', padding: '2px 10px', borderRadius: 999 }}>Ασθενής</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={profile?.name || user?.email} size={36} />
          <button onClick={signOut} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Αποσύνδεση</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Καλώς ήρθατε, {profile?.name?.split(' ')[0] || 'Ασθενής'}! 👋</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Διαχειριστείτε τα αιτήματά σας και τα ραντεβού σας.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Εκκρεμή', value: pendingCount, bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' },
            { label: 'Ενεργά', value: confirmedCount, bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8' },
            { label: 'Ολοκληρωμένα', value: completedCount, bg: '#D1FAE5', border: '#BBF7D0', text: '#15803D' },
          ].map(c => (
            <div key={c.label} style={{ flex: 1, minWidth: 140, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: c.text }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* New request CTA */}
        <div style={{ background: '#1a2e44', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Θέλετε νέο ραντεβού;</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Κλείστε ραντεβού με έναν από τους θεραπευτές μας</div>
          </div>
          <a href="/dashboard/patient/new-request" style={{ background: '#fff', color: '#1a2e44', padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
            Νέο Αίτημα →
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#0F172A' : '#64748B', boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* REQUESTS */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessionRequests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 14 }}>
                Δεν έχετε κάνει αίτημα ακόμα.<br />
                <a href="/dashboard/patient/new-request" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none' }}>Κλείστε το πρώτο σας ραντεβού →</a>
              </div>
            ) : sessionRequests.map(req => {
              const st = STATUS_MAP[req.status] || STATUS_MAP.pending;
              const hasCompletedBooking = req.bookings.some(b => b.status === 'completed');
              const canReview = hasCompletedBooking && !req.review;

              return (
                <div key={req.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{req.problem_type || 'Φυσιοθεραπεία'}</span>
                      <Badge label={st.label} bg={st.bg} color={st.color} />
                      {req.session_type === 'package' && (
                        <span style={{ background: '#EDE9FE', color: '#5B21B6', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          Πακέτο {req.package_size} συνεδριών
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>{new Date(req.created_at).toLocaleDateString('el-GR')}</span>
                    </div>

                    {req.therapist_profiles?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Avatar name={req.therapist_profiles.name} size={32} />
                        <div>
                          <div style={{ fontSize: 14, color: '#1a2e44', fontWeight: 600 }}>👨‍⚕️ {req.therapist_profiles.name}</div>
                          {req.therapist_profiles.specialty && (
                            <div style={{ fontSize: 12, color: '#64748B' }}>{req.therapist_profiles.specialty}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {req.address && <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>📍 {req.address}, {req.area}</div>}
                    {req.total_cost && <div style={{ fontSize: 13, color: '#15803D', fontWeight: 600, marginBottom: 6 }}>💰 Σύνολο: {req.total_cost}€</div>}
                    {req.problem_description && <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #cbd5e1', marginTop: 6 }}>{req.problem_description}</div>}
                  </div>

                  {/* Bookings list */}
                  {req.bookings.length > 0 && (
                    <div style={{ padding: '0 20px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                        📅 Συνεδρίες ({req.bookings.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {req.bookings.map((b, i) => {
                          const bSt = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                          const d = new Date(b.session_date + 'T12:00:00');
                          return (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>{i + 1}.</span>
                              <span style={{ color: '#0F172A', fontWeight: 500 }}>
                                {DAYS_EL[d.getDay()]} {d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} στις {b.session_time?.slice(0, 5)}
                              </span>
                              <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Review section */}
                  {req.review ? (
                    // Ήδη έχει αξιολογήσει
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#FFFBEB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.05em' }}>✓ Η αξιολόγησή σας</span>
                        <Stars rating={req.review.rating} size={16} />
                      </div>
                      {req.review.comment && (
                        <p style={{ fontSize: 13, color: '#78350F', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>"{req.review.comment}"</p>
                      )}
                    </div>
                  ) : canReview ? (
                    // Μπορεί να αξιολογήσει
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, color: '#475569' }}>
                        Πώς ήταν η εμπειρία σας με τον/την <strong>{req.therapist_profiles?.name}</strong>;
                      </div>
                      <button onClick={() => openReviewModal(req)}
                        style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ⭐ Άφησε αξιολόγηση
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* SERVICES */}
        {activeTab === 'services' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Υπηρεσίες Φυσιοθεραπείας</h2>
              <p style={{ fontSize: 13, color: '#64748B' }}>Εξατομικευμένη φροντίδα για ένα εύρος παθήσεων.</p>
            </div>

            {services.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 14 }}>
                Δεν υπάρχουν διαθέσιμες υπηρεσίες αυτή τη στιγμή.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {services.map(s => (
                  <div key={s.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        {s.icon || '🏥'}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{s.title_el}</h3>
                    </div>
                    {s.desc_el && (
                      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{s.desc_el}</p>
                    )}
                    <a href="/dashboard/patient/new-request" style={{ display: 'inline-block', textAlign: 'center', background: '#1a2e44', color: '#fff', padding: '9px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      Κλείσε Ραντεβού →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar name={profile?.name || user?.email} size={64} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{profile?.name || '—'}</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{user?.email}</div>
              </div>
            </div>
            {[
              ['Email', user?.email],
              ['Τηλέφωνο', profile?.phone],
              ['Μέλος από', user?.created_at ? new Date(user.created_at).toLocaleDateString('el-GR') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                <span style={{ color: '#64748B' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Αξιολόγηση Θεραπευτή</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>
              Πώς ήταν η εμπειρία σας με τον/την <strong style={{ color: '#0F172A' }}>{reviewModal.therapist_name}</strong>;
            </p>

            <div style={{ marginBottom: 20, padding: '16px 20px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>Βαθμολογία *</div>
              <Stars rating={reviewForm.rating} onChange={r => setReviewForm(p => ({ ...p, rating: r }))} size={32} />
              {reviewForm.rating > 0 && (
                <div style={{ fontSize: 12, color: '#92400E', marginTop: 8 }}>
                  {['', 'Κακή', 'Μέτρια', 'Καλή', 'Πολύ καλή', 'Εξαιρετική'][reviewForm.rating]}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: 8 }}>Σχόλιο (προαιρετικό)</label>
              <textarea rows={4} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                placeholder="Μοιραστείτε την εμπειρία σας με άλλους ασθενείς..."
                maxLength={500}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#0F172A' }} />
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{reviewForm.comment.length}/500</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReviewModal(null)} disabled={submittingReview}
                style={{ flex: 1, padding: '12px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: submittingReview ? 'not-allowed' : 'pointer' }}>
                Άκυρο
              </button>
              <button onClick={submitReview} disabled={!reviewForm.rating || submittingReview}
                style={{ flex: 2, padding: '12px', borderRadius: 30, border: 'none', background: reviewForm.rating ? '#F59E0B' : '#e2e8f0', color: reviewForm.rating ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600, cursor: reviewForm.rating ? 'pointer' : 'not-allowed' }}>
                {submittingReview ? 'Αποστολή...' : '⭐ Υποβολή Αξιολόγησης'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}