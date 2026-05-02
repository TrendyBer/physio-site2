'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ClipboardList, Stethoscope, User, MapPin, Euro, Calendar, Star, Check, ArrowRight, Save, X, Hourglass, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

function Avatar({ name, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function Badge({ label, bg, color, icon: Icon }) {
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

function Stars({ rating, onChange, size = 24 }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          onClick={() => onChange && onChange(i)}
          size={size}
          fill={i <= rating ? '#F59E0B' : 'none'}
          color={i <= rating ? '#F59E0B' : '#E2E8F0'}
          strokeWidth={2}
          style={{ cursor: onChange ? 'pointer' : 'default' }}
        />
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

const PAYMENT_STATUS = {
  pending:  { label: 'Σε αναμονή',           bg: '#F1F5F9', color: '#475569', icon: Hourglass },
  held:     { label: 'Προς απελευθέρωση',    bg: '#FEF3C7', color: '#92400E', icon: AlertCircle },
  released: { label: 'Πληρωμένη',            bg: '#D1FAE5', color: '#065F46', icon: CheckCircle2 },
  refunded: { label: 'Επιστράφηκε',          bg: '#FEE2E2', color: '#991B1B', icon: X },
};

const DAYS_EL = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

// Helper: how many days until auto-release
function daysUntilAutoRelease(autoReleaseAt) {
  if (!autoReleaseAt) return null;
  const now = new Date();
  const target = new Date(autoReleaseAt);
  const diffMs = target - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

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

  // Release payment modal
  const [releaseModal, setReleaseModal] = useState(null);
  const [releasing, setReleasing] = useState(false);

  // Profile edit state
  const [editProfile, setEditProfile] = useState({ name: '', phone: '', area: '', address: '', city: '', postal_code: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    setUser(user);

    const { data: prof } = await supabase.from('patient_profiles').select('*').eq('id', user.id).single();
    setProfile(prof || {});
    setEditProfile({
      name: prof?.name || '',
      phone: prof?.phone || '',
      area: prof?.area || '',
      address: prof?.address || '',
      city: prof?.city || '',
      postal_code: prof?.postal_code || '',
    });

    const { data: svcs } = await supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true });
    setServices(svcs || []);

    await loadRequests(user.id);
    setLoading(false);
  }

  async function loadRequests(patientId) {
    const { data: reqs, error: reqsError } = await supabase
      .from('session_requests')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (reqsError) {
      console.error('Requests fetch error:', reqsError);
      setSessionRequests([]);
      return;
    }

    if (!reqs || reqs.length === 0) { setSessionRequests([]); return; }

    const therapistIds = [...new Set(reqs.map(r => r.therapist_id).filter(Boolean))];
    let therapists = [];
    if (therapistIds.length > 0) {
      const { data: ths } = await supabase
        .from('therapist_profiles')
        .select('id, name, photo_url, specialty')
        .in('id', therapistIds);
      therapists = ths || [];
    }

    const requestIds = reqs.map(r => r.id);
    const { data: bks } = await supabase
      .from('session_bookings')
      .select('*')
      .in('request_id', requestIds)
      .order('session_date', { ascending: true });

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

    const combined = reqs.map(req => {
      const reqBookings = (bks || []).filter(b => b.request_id === req.id);
      const therapist = therapists.find(t => t.id === req.therapist_id);
      const reqReview = reviews.find(rv => reqBookings.some(b => b.id === rv.booking_id));
      return {
        ...req,
        bookings: reqBookings,
        therapist: therapist || null,
        review: reqReview || null,
      };
    });

    setSessionRequests(combined);
  }

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
      therapist_name: request.therapist?.name || 'Θεραπευτής',
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

  // ═══ NEW: Release payment flow ═══
  function openReleaseModal(booking, request) {
    setReleaseModal({ booking, request });
  }

  async function confirmRelease() {
    if (!releaseModal) return;
    setReleasing(true);

    const { error } = await supabase.from('session_bookings').update({
      payment_status: 'released',
      patient_released_at: new Date().toISOString(),
    }).eq('id', releaseModal.booking.id);

    if (error) {
      alert('Σφάλμα: ' + error.message);
      setReleasing(false);
      return;
    }

    await loadRequests(user.id);
    setReleasing(false);
    setReleaseModal(null);
  }

  async function saveProfile() {
    if (!editProfile.name.trim()) {
      setProfileMsg({ type: 'error', text: 'Το ονοματεπώνυμο είναι υποχρεωτικό' });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);

    const { error } = await supabase
      .from('patient_profiles')
      .update({
        name: editProfile.name.trim(),
        phone: editProfile.phone.trim() || null,
        area: editProfile.area.trim() || null,
        address: editProfile.address.trim() || null,
        city: editProfile.city.trim() || null,
        postal_code: editProfile.postal_code.trim() || null,
      })
      .eq('id', user.id);

    setSavingProfile(false);

    if (error) {
      setProfileMsg({ type: 'error', text: 'Σφάλμα: ' + error.message });
      return;
    }

    setProfile({ ...profile, ...editProfile });
    setProfileMsg({ type: 'success', text: 'Το προφίλ αποθηκεύτηκε επιτυχώς' });
    setTimeout(() => setProfileMsg(null), 3000);
  }

  async function signOut() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  // Stats
  const allBookings = sessionRequests.flatMap(r => r.bookings);
  const pendingCount = sessionRequests.filter(r => r.status === 'pending').length;
  const confirmedCount = sessionRequests.filter(r => r.status === 'confirmed' || r.status === 'accepted').length;
  const completedCount = sessionRequests.filter(r =>
    r.bookings.length > 0 &&
    r.bookings.every(b => b.status === 'completed' || b.status === 'cancelled') &&
    r.bookings.some(b => b.status === 'completed')
  ).length;

  // Bookings awaiting release
  const heldBookings = allBookings.filter(b => b.payment_status === 'held');
  const heldAmount = heldBookings.reduce((sum, b) => sum + parseFloat(b.session_amount || 0), 0);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 16, color: '#64748B' }}>Φόρτωση...</div>
    </div>
  );

  const TABS = [
    { id: 'requests', label: 'Τα Αιτήματά μου', Icon: ClipboardList },
    { id: 'services', label: 'Υπηρεσίες', Icon: Stethoscope },
    { id: 'profile',  label: 'Προφίλ', Icon: User },
  ];

  const profileInputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#0F172A' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

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

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Καλώς ήρθατε, {profile?.name?.split(' ')[0] || 'Ασθενής'}</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Διαχειριστείτε τα αιτήματά σας και τα ραντεβού σας.</p>
        </div>

        {/* ═══ NEW: Release alert banner if there are held bookings ═══ */}
        {heldBookings.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #F59E0B', borderRadius: 14, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={26} color="#92400E" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                Έχετε {heldBookings.length} {heldBookings.length === 1 ? 'συνεδρία' : 'συνεδρίες'} προς έγκριση
              </div>
              <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
                Ο θεραπευτής δηλώνει ότι ολοκληρώθηκαν. Επιβεβαιώστε για να απελευθερωθεί η πληρωμή ({heldAmount.toFixed(2)}€ συνολικά). Δείτε τα στα αιτήματά σας παρακάτω.
              </div>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Εκκρεμή', value: pendingCount, bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' },
            { label: 'Ενεργά', value: confirmedCount, bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8' },
            { label: 'Ολοκληρωμένα', value: completedCount, bg: '#D1FAE5', border: '#BBF7D0', text: '#15803D' },
            ...(heldBookings.length > 0 ? [{ label: 'Προς απελευθέρωση', value: `${heldAmount.toFixed(0)}€`, bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' }] : []),
          ].map(c => (
            <div key={c.label} style={{ flex: 1, minWidth: 140, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: c.text }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#1a2e44', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Θέλετε νέο ραντεβού;</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Κλείστε ραντεβού με έναν από τους θεραπευτές μας</div>
          </div>
          <a href="/dashboard/patient/new-request" style={{ background: '#fff', color: '#1a2e44', padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Νέο Αίτημα
            <ArrowRight size={14} />
          </a>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => {
            const TabIcon = t.Icon;
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: isActive ? '#fff' : 'transparent', color: isActive ? '#0F172A' : '#64748B', boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <TabIcon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* REQUESTS */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessionRequests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 14 }}>
                Δεν έχετε κάνει αίτημα ακόμα.<br />
                <a href="/dashboard/patient/new-request" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  Κλείστε το πρώτο σας ραντεβού
                  <ArrowRight size={14} />
                </a>
              </div>
            ) : sessionRequests.map(req => {
              const st = STATUS_MAP[req.status] || STATUS_MAP.pending;
              const hasCompletedBooking = req.bookings.some(b => b.status === 'completed');
              const canReview = hasCompletedBooking && !req.review;
              const reqHeldBookings = req.bookings.filter(b => b.payment_status === 'held');

              return (
                <div key={req.id} style={{ background: '#fff', borderRadius: 14, border: reqHeldBookings.length > 0 ? '2px solid #F59E0B' : '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{req.problem_type || 'Φυσιοθεραπεία'}</span>
                      <Badge label={st.label} bg={st.bg} color={st.color} />
                      {req.session_type === 'package' && (
                        <span style={{ background: '#EDE9FE', color: '#5B21B6', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          Πακέτο {req.package_size} συνεδριών
                        </span>
                      )}
                      {reqHeldBookings.length > 0 && (
                        <Badge label={`${reqHeldBookings.length} προς έγκριση`} bg="#FEF3C7" color="#92400E" icon={AlertCircle} />
                      )}
                      <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>{new Date(req.created_at).toLocaleDateString('el-GR')}</span>
                    </div>

                    {req.therapist?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Avatar name={req.therapist.name} size={32} />
                        <div>
                          <div style={{ fontSize: 14, color: '#1a2e44', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Stethoscope size={14} color="#2a6fdb" />
                            {req.therapist.name}
                          </div>
                          {req.therapist.specialty && (
                            <div style={{ fontSize: 12, color: '#64748B' }}>{req.therapist.specialty}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {req.address && (
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} />
                        {req.address}, {req.area}
                      </div>
                    )}
                    {req.total_cost && (
                      <div style={{ fontSize: 13, color: '#15803D', fontWeight: 600, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Euro size={13} strokeWidth={2.5} />
                        Σύνολο: {req.total_cost}€
                      </div>
                    )}
                    {req.problem_description && <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #cbd5e1', marginTop: 6 }}>{req.problem_description}</div>}
                  </div>

                  {req.bookings.length > 0 && (
                    <div style={{ padding: '0 20px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} />
                        Συνεδρίες ({req.bookings.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {req.bookings.map((b, i) => {
                          const bSt = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                          const d = new Date(b.session_date + 'T12:00:00');
                          const payStatus = b.payment_status || 'pending';
                          const payInfo = PAYMENT_STATUS[payStatus];
                          const daysLeft = b.payment_status === 'held' ? daysUntilAutoRelease(b.auto_release_at) : null;
                          const isHeld = b.payment_status === 'held';

                          return (
                            <div key={b.id} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              padding: '10px 14px',
                              background: isHeld ? '#FFFBEB' : '#f8fafc',
                              borderRadius: 8,
                              fontSize: 13,
                              border: isHeld ? '1px solid #FDE68A' : 'none',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>{i + 1}.</span>
                                <span style={{ color: '#0F172A', fontWeight: 500 }}>
                                  {DAYS_EL[d.getDay()]} {d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} στις {b.session_time?.slice(0, 5)}
                                </span>
                                <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />

                                {/* Payment status */}
                                {b.status === 'completed' && payInfo && (
                                  <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                )}
                              </div>

                              {/* Release section — for held bookings */}
                              {isHeld && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 8, borderTop: '1px solid #FDE68A', flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600, marginBottom: 2 }}>
                                      Ο θεραπευτής δηλώνει ότι ολοκληρώθηκε
                                    </div>
                                    {daysLeft !== null && (
                                      <div style={{ fontSize: 11, color: '#78350F' }}>
                                        {daysLeft === 0 ? 'Αυτόματη απελευθέρωση σήμερα' : `Αυτόματη απελευθέρωση σε ${daysLeft} μέρες`}
                                      </div>
                                    )}
                                  </div>
                                  <button onClick={() => openReleaseModal(b, req)}
                                    style={{
                                      padding: '8px 18px',
                                      borderRadius: 20,
                                      border: 'none',
                                      background: '#15803D',
                                      color: '#fff',
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontFamily: 'inherit',
                                    }}>
                                    <CheckCircle2 size={14} strokeWidth={2.5} />
                                    Απελευθέρωση {parseFloat(b.session_amount || 0).toFixed(2)}€
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {req.review ? (
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#FFFBEB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.05em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} strokeWidth={3} />
                          Η αξιολόγησή σας
                        </span>
                        <Stars rating={req.review.rating} size={16} />
                      </div>
                      {req.review.comment && (
                        <p style={{ fontSize: 13, color: '#78350F', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>"{req.review.comment}"</p>
                      )}
                    </div>
                  ) : canReview ? (
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, color: '#475569' }}>
                        Πώς ήταν η εμπειρία σας με τον/την <strong>{req.therapist?.name || 'θεραπευτή'}</strong>;
                      </div>
                      <button onClick={() => openReviewModal(req)}
                        style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Star size={13} fill="#fff" strokeWidth={0} />
                        Άφησε αξιολόγηση
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
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Stethoscope size={22} color="#2a6fdb" strokeWidth={2} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{s.title_el}</h3>
                    </div>
                    {s.desc_el && (
                      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{s.desc_el}</p>
                    )}
                    <a href="/dashboard/patient/new-request" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', background: '#1a2e44', color: '#fff', padding: '9px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      Κλείσε Ραντεβού
                      <ArrowRight size={14} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
              <Avatar name={editProfile.name || user?.email} size={64} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{editProfile.name || '—'}</div>
                <div style={{ fontSize: 14, color: '#64748B', wordBreak: 'break-word' }}>{user?.email}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  Μέλος από {user?.created_at ? new Date(user.created_at).toLocaleDateString('el-GR') : '—'}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Στοιχεία Προφίλ</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Ενημερώστε τα στοιχεία σας. Η διεύθυνση και ο ΤΚ απαιτούνται όταν κλείνετε ραντεβού.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Ονοματεπώνυμο *</label>
                <input
                  value={editProfile.name}
                  onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))}
                  style={profileInputStyle}
                  placeholder="Γιώργος Παπαδόπουλος"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Τηλέφωνο</label>
                  <input
                    value={editProfile.phone}
                    onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))}
                    style={profileInputStyle}
                    placeholder="+30 69..."
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Περιοχή</label>
                  <input
                    value={editProfile.area}
                    onChange={e => setEditProfile(p => ({ ...p, area: e.target.value }))}
                    style={profileInputStyle}
                    placeholder="π.χ. Παγκράτι"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Διεύθυνση</label>
                <input
                  value={editProfile.address}
                  onChange={e => setEditProfile(p => ({ ...p, address: e.target.value }))}
                  style={profileInputStyle}
                  placeholder="π.χ. Λεωφ. Κηφισίας 100"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>Πόλη</label>
                  <input
                    value={editProfile.city}
                    onChange={e => setEditProfile(p => ({ ...p, city: e.target.value }))}
                    style={profileInputStyle}
                    placeholder="π.χ. Αθήνα"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>ΤΚ</label>
                  <input
                    value={editProfile.postal_code}
                    onChange={e => setEditProfile(p => ({ ...p, postal_code: e.target.value }))}
                    style={profileInputStyle}
                    placeholder="11528"
                  />
                </div>
              </div>

              {profileMsg && (
                <div style={{
                  background: profileMsg.type === 'success' ? '#D1FAE5' : '#FEF2F2',
                  border: `1px solid ${profileMsg.type === 'success' ? '#86EFAC' : '#FECACA'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: profileMsg.type === 'success' ? '#15803D' : '#DC2626',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  {profileMsg.type === 'success' && <Check size={14} strokeWidth={3} />}
                  {profileMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{
                    background: '#1a2e44',
                    color: '#fff',
                    padding: '11px 28px',
                    borderRadius: 30,
                    fontSize: 14,
                    fontWeight: 600,
                    border: 'none',
                    cursor: savingProfile ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: savingProfile ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Save size={16} />
                  {savingProfile ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ NEW: RELEASE PAYMENT MODAL ═══ */}
      {releaseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setReleaseModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Wallet size={28} color="#15803D" strokeWidth={2.2} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 12, textAlign: 'center' }}>
              Επιβεβαίωση Πληρωμής
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
              Επιβεβαιώνετε ότι έγινε η συνεδρία με τον/την <strong style={{ color: '#0F172A' }}>{releaseModal.request?.therapist?.name || 'θεραπευτή'}</strong> και θέλετε να απελευθερωθεί η πληρωμή;
            </p>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                Ποσό προς απελευθέρωση
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#15803D' }}>
                {parseFloat(releaseModal.booking?.session_amount || 0).toFixed(2)}€
              </div>
              {releaseModal.booking?.session_date && (
                <div style={{ fontSize: 12, color: '#15803D', marginTop: 6 }}>
                  Συνεδρία: {new Date(releaseModal.booking.session_date + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: 'long', year: 'numeric' })} στις {releaseModal.booking.session_time?.slice(0, 5)}
                </div>
              )}
            </div>

            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={14} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>Προσοχή:</strong> Μετά την απελευθέρωση, η πληρωμή πηγαίνει στον θεραπευτή και δεν μπορεί να ανακληθεί. Πατήστε επιβεβαίωση μόνο εφόσον έχει πραγματοποιηθεί η συνεδρία.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReleaseModal(null)} disabled={releasing}
                style={{ flex: 1, padding: '12px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer' }}>
                Ακύρωση
              </button>
              <button onClick={confirmRelease} disabled={releasing}
                style={{ flex: 2, padding: '12px', borderRadius: 30, border: 'none', background: releasing ? '#94a3b8' : '#15803D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                {releasing ? 'Απελευθέρωση...' : 'Ναι, απελευθέρωση'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                style={{ flex: 2, padding: '12px', borderRadius: 30, border: 'none', background: reviewForm.rating ? '#F59E0B' : '#e2e8f0', color: reviewForm.rating ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 600, cursor: reviewForm.rating ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Star size={14} fill={reviewForm.rating ? '#fff' : '#94a3b8'} strokeWidth={0} />
                {submittingReview ? 'Αποστολή...' : 'Υποβολή Αξιολόγησης'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}