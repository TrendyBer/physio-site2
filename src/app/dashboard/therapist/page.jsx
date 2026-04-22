'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function Avatar({ name, photoUrl, size = 48 }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function Badge({ label, bg, color }) {
  return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>;
}

const STATUS = {
  pending:   { label: 'Εκκρεμές',      bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Επιβεβαιωμένη', bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { label: 'Ολοκληρώθηκε',  bg: '#EDE9FE', color: '#5B21B6' },
  cancelled: { label: 'Ακυρώθηκε',     bg: '#FFE4E6', color: '#9F1239' },
  no_show:   { label: 'Δεν εμφανίστηκε', bg: '#FEE2E2', color: '#991B1B' },
};

const DAYS_EL = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

const HOURS = [];
for (let h = 9; h <= 20; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
  HOURS.push(`${String(h).padStart(2, '0')}:30`);
}
HOURS.push('21:00');

function generateDates() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setFullYear(end.getFullYear() + 2);
  let cur = new Date(today);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function groupByWeek(dates) {
  const weeks = [];
  let week = [];
  dates.forEach(d => {
    const day = new Date(d + 'T12:00:00').getDay();
    if (day === 1 && week.length > 0) { weeks.push(week); week = []; }
    week.push(d);
  });
  if (week.length > 0) weeks.push(week);
  return weeks;
}

const ALL_WEEKS = groupByWeek(generateDates());

export default function TherapistDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [commission, setCommission] = useState(20);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const photoInputRef = useRef();

  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const currentWeek = ALL_WEEKS[weekOffset] || ALL_WEEKS[0];

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    setUser(user);

    const { data: prof } = await supabase.from('therapist_profiles').select('*').eq('id', user.id).single();
    setProfile(prof || {});
    setProfileForm(prof || {});

    await loadRequests(user.id);

    const { data: slts } = await supabase.from('availability_slots').select('*').eq('therapist_id', user.id);
    setSlots(slts || []);

    const { data: revs } = await supabase.from('reviews').select('*').eq('therapist_id', user.id).eq('is_published', true);
    setReviews(revs || []);

    const { data: comm } = await supabase.from('platform_settings').select('value').eq('key', 'commission').single();
    if (comm) setCommission(parseInt(comm.value) || 20);

    setLoading(false);
  }

  async function loadRequests(therapistId) {
    const { data: reqs } = await supabase
      .from('session_requests')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('type', 'booking')
      .order('created_at', { ascending: false });

    if (!reqs || reqs.length === 0) { setRequests([]); return; }

    const requestIds = reqs.map(r => r.id);
    const { data: bks } = await supabase
      .from('session_bookings')
      .select('*')
      .in('request_id', requestIds)
      .order('session_date', { ascending: true });

    const patientIds = [...new Set(reqs.map(r => r.patient_id).filter(Boolean))];
    const { data: patients } = await supabase
      .from('patient_profiles')
      .select('id, name')
      .in('id', patientIds);

    const combined = reqs.map(req => {
      const reqBookings = (bks || []).filter(b => b.request_id === req.id);
      const patient = (patients || []).find(p => p.id === req.patient_id);
      return {
        ...req,
        bookings: reqBookings,
        patient_name: patient?.name || 'Άγνωστο',
      };
    });

    setRequests(combined);
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      alert('Παρακαλώ επιλέξτε εικόνα (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Η εικόνα είναι πολύ μεγάλη. Μέγιστο μέγεθος: 5 MB.');
      return;
    }

    setUploadingPhoto(true);
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `therapist-photos/${user.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      alert('Σφάλμα upload: ' + uploadError.message);
      setUploadingPhoto(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    await supabase.from('therapist_profiles').update({ photo_url: publicUrl }).eq('id', user.id);
    setProfile(p => ({ ...p, photo_url: publicUrl }));
    setProfileForm(p => ({ ...p, photo_url: publicUrl }));
    setUploadingPhoto(false);
  }

  async function saveProfile() {
    setSaving(true);
    await supabase.from('therapist_profiles').upsert({
      id: user.id,
      name: profileForm.name,
      bio: profileForm.bio,
      specialty: profileForm.specialty,
      area: profileForm.area,
      photo_url: profileForm.photo_url,
      price_per_session: Math.min(50, Math.max(25, parseFloat(profileForm.price_per_session) || 25)),
    });
    setProfile(profileForm);
    setEditProfile(false);
    setSaving(false);
  }

  async function confirmRequest(request) {
    const bookingIds = request.bookings.map(b => b.id);
    await supabase.from('session_bookings').update({ status: 'confirmed' }).in('id', bookingIds);
    await supabase.from('session_requests').update({ status: 'confirmed' }).eq('id', request.id);
    await loadRequests(user.id);
  }

  async function markBookingCompleted(bookingId) {
    await supabase.from('session_bookings').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by_therapist: true,
    }).eq('id', bookingId);
    await loadRequests(user.id);
  }

  function openCancelRequestModal(request) {
    setCancelModal({ type: 'request', data: request });
    setCancelReason('');
  }

  function openCancelBookingModal(booking, request) {
    setCancelModal({ type: 'booking', data: booking, request });
    setCancelReason('');
  }

  async function doCancel() {
    if (!cancelReason.trim()) {
      alert('Παρακαλώ συμπληρώστε λόγο ακύρωσης.');
      return;
    }
    setCancelling(true);

    const now = new Date().toISOString();
    const reason = `[Θεραπευτής] ${cancelReason}`;

    if (cancelModal.type === 'request') {
      const req = cancelModal.data;
      const bookingIds = req.bookings.filter(b => b.status !== 'completed').map(b => b.id);

      if (bookingIds.length > 0) {
        await supabase.from('session_bookings').update({
          status: 'cancelled',
          cancelled_at: now,
          cancelled_reason: reason,
        }).in('id', bookingIds);

        const slotIds = req.bookings.filter(b => b.status !== 'completed').map(b => b.slot_id).filter(Boolean);
        if (slotIds.length > 0) {
          await supabase.from('availability_slots').update({ is_blocked: false }).in('id', slotIds);
        }
      }

      await supabase.from('session_requests').update({
        status: 'cancelled',
        cancelled_at: now,
        cancelled_reason: reason,
      }).eq('id', req.id);
    } else {
      const booking = cancelModal.data;
      await supabase.from('session_bookings').update({
        status: 'cancelled',
        cancelled_at: now,
        cancelled_reason: reason,
      }).eq('id', booking.id);

      if (booking.slot_id) {
        await supabase.from('availability_slots').update({ is_blocked: false }).eq('id', booking.slot_id);
      }
    }

    await loadRequests(user.id);
    setCancelling(false);
    setCancelModal(null);
    setCancelReason('');
  }

  async function toggleSlot(day, hour) {
    const existing = slots.find(s => s.date === day && s.start_time === hour + ':00');
    if (existing) {
      if (existing.is_blocked) return;
      await supabase.from('availability_slots').delete().eq('id', existing.id);
      setSlots(prev => prev.filter(s => s.id !== existing.id));
    } else {
      const [h, m] = hour.split(':').map(Number);
      const totalMin = h * 60 + m + 30;
      const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
      const endM = String(totalMin % 60).padStart(2, '0');
      const { data } = await supabase.from('availability_slots').insert([{
        therapist_id: user.id, date: day,
        start_time: hour + ':00',
        end_time: `${endH}:${endM}:00`,
        is_blocked: false,
      }]).select().single();
      if (data) setSlots(prev => [...prev, data]);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const allBookings = requests.flatMap(r => r.bookings);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length;
  const completedCount = allBookings.filter(b => b.status === 'completed').length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const pricePerSession = profile?.price_per_session || 0;
  const netPerSession = Math.max(0, pricePerSession - commission);
  const earned = completedCount * netPerSession;

  function getNetAmount(request) {
    const totalSessions = request.bookings.length || request.package_size || 1;
    return totalSessions * netPerSession;
  }

  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
  const weekStart = currentWeek?.[0];
  const weekEnd   = currentWeek?.[currentWeek.length - 1];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 16, color: '#64748B' }}>Φόρτωση...</div>
    </div>
  );

  const TABS = [
    { id: 'overview', label: '📊 Επισκόπηση' },
    { id: 'requests', label: `📋 Αιτήματα ${pendingCount > 0 ? `(${pendingCount})` : ''}` },
    { id: 'calendar', label: '📅 Διαθεσιμότητα' },
    { id: 'reviews',  label: '⭐ Αξιολογήσεις' },
    { id: 'profile',  label: '👤 Προφίλ' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
          <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginLeft: 8, background: '#f1f5f9', padding: '2px 10px', borderRadius: 999 }}>Θεραπευτής</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!profile?.is_approved && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>⏳ Εκκρεμεί έγκριση admin</span>}
          <Avatar name={profile?.name || user?.email} photoUrl={profile?.photo_url} size={36} />
          <button onClick={signOut} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Αποσύνδεση</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#0F172A' : '#64748B', boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Νέα Αιτήματα', value: pendingCount, bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' },
                { label: 'Επιβεβαιωμένες', value: confirmedCount, bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8' },
                { label: 'Ολοκληρωμένες', value: completedCount, bg: '#D1FAE5', border: '#BBF7D0', text: '#15803D' },
                { label: 'Μέση Βαθμολογία', value: avgRating, bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
                { label: 'Καθαρά Έσοδα', value: `${earned}€`, bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
              ].map(c => (
                <div key={c.label} style={{ flex: 1, minWidth: 130, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: c.text }}>{c.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>💳 Πληροφορίες Πληρωμής</div>
              <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.7 }}>
                Τιμή συνεδρίας σας: <strong>{pricePerSession}€</strong><br />
                Προμήθεια πλατφόρμας: <strong>{commission}€ ανά συνεδρία</strong><br />
                Καθαρά έσοδα ανά συνεδρία: <strong>{netPerSession}€</strong>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Πρόσφατα Αιτήματα</div>
              {requests.slice(0, 5).length === 0
                ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Δεν υπάρχουν αιτήματα ακόμα</div>
                : requests.slice(0, 5).map((r, i) => {
                  const st = STATUS[r.status] || STATUS.pending;
                  return (
                    <div key={r.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <Avatar name={r.patient_name} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{r.patient_name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{r.problem_type} · {r.bookings.length} {r.bookings.length === 1 ? 'συνεδρία' : 'συνεδρίες'} · {new Date(r.created_at).toLocaleDateString('el-GR')}</div>
                      </div>
                      <Badge label={st.label} bg={st.bg} color={st.color} />
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* REQUESTS */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>Δεν υπάρχουν αιτήματα ακόμα</div>
              : requests.map(req => {
                const st = STATUS[req.status] || STATUS.pending;
                const netAmount = getNetAmount(req);
                const isPending = req.status === 'pending';
                const hasActiveBookings = req.bookings.some(b => b.status === 'confirmed' || b.status === 'pending');
                return (
                  <div key={req.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <Avatar name={req.patient_name} size={48} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{req.patient_name}</span>
                            <Badge label={st.label} bg={st.bg} color={st.color} />
                            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>{new Date(req.created_at).toLocaleDateString('el-GR')}</span>
                          </div>

                          <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                            📍 {req.address}, {req.area}{req.postal_code ? `, ${req.postal_code}` : ''}
                          </div>
                          {req.floor_info && (
                            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                              🏠 {req.floor_info}
                            </div>
                          )}

                          <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #cbd5e1', marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>{req.problem_type}</div>
                            {req.problem_description || 'Χωρίς περιγραφή'}
                          </div>

                          {req.notes && (
                            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10, fontStyle: 'italic' }}>
                              💬 Σημειώσεις: {req.notes}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                            <div>
                              <span style={{ color: '#64748B' }}>Τύπος: </span>
                              <strong style={{ color: '#0F172A' }}>
                                {req.session_type === 'single' ? 'Μεμονωμένη' : `Πακέτο ${req.package_size} συνεδριών`}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#64748B' }}>Συνεδρίες: </span>
                              <strong style={{ color: '#0F172A' }}>{req.bookings.length}</strong>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                              <span style={{ color: '#64748B' }}>Καθαρά: </span>
                              <strong style={{ color: '#15803D', fontSize: 15 }}>{netAmount}€</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                        📅 Συνεδρίες
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {req.bookings.map((b, i) => {
                          const bSt = STATUS[b.status] || STATUS.pending;
                          const d = new Date(b.session_date + 'T12:00:00');
                          const isPast = new Date(b.session_date + 'T' + (b.session_time || '00:00')) < new Date();
                          return (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>{i + 1}.</span>
                              <span style={{ color: '#0F172A', fontWeight: 500 }}>
                                {DAYS_EL[d.getDay()]} {d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} στις {b.session_time?.slice(0, 5)}
                              </span>
                              <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                {b.status === 'confirmed' && isPast && (
                                  <button onClick={() => markBookingCompleted(b.id)}
                                    style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                    ✓ Ολοκληρώθηκε
                                  </button>
                                )}
                                {b.status === 'confirmed' && !isPast && (
                                  <button onClick={() => openCancelBookingModal(b, req)}
                                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #FECDD3', background: 'transparent', color: '#BE123C', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                    Ακύρωση
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {(isPending || hasActiveBookings) && (
                      <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        {isPending && (
                          <>
                            <button onClick={() => openCancelRequestModal(req)}
                              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #FECDD3', background: 'transparent', color: '#BE123C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              ✕ Απόρριψη
                            </button>
                            <button onClick={() => confirmRequest(req)}
                              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              ✓ Αποδοχή Αιτήματος
                            </button>
                          </>
                        )}
                        {!isPending && hasActiveBookings && (
                          <button onClick={() => openCancelRequestModal(req)}
                            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #FECDD3', background: 'transparent', color: '#BE123C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Ακύρωση Όλου του Αιτήματος
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* CALENDAR */}
        {activeTab === 'calendar' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>📅 Διαθεσιμότητα — έως 2 χρόνια μπροστά</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Κλικάρετε για να ορίσετε/αφαιρέσετε ώρες. Ώρες ανά 30 λεπτά, 09:00–21:00.</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: weekOffset === 0 ? '#f8fafc' : '#fff', color: weekOffset === 0 ? '#94a3b8' : '#1a2e44', fontSize: 13, fontWeight: 600, cursor: weekOffset === 0 ? 'not-allowed' : 'pointer' }}>
                ← Προηγ.
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                {weekStart && weekEnd ? `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}` : ''}
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Εβδομάδα {weekOffset + 1} / {ALL_WEEKS.length}</span>
              </div>
              <button onClick={() => setWeekOffset(w => Math.min(ALL_WEEKS.length - 1, w + 1))}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Επόμ. →
              </button>
            </div>

            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '8px 10px', fontSize: 11, color: '#64748B', fontWeight: 600, textAlign: 'left', minWidth: 52 }}>Ώρα</th>
                    {currentWeek.map(d => {
                      const dateObj = new Date(d + 'T12:00:00');
                      const dayName = DAYS_EL[dateObj.getDay()];
                      const dayNum  = dateObj.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
                      const isToday = d === new Date().toISOString().split('T')[0];
                      return (
                        <th key={d} style={{ padding: '8px 4px', fontSize: 11, color: isToday ? '#2a6fdb' : '#64748B', fontWeight: 700, textAlign: 'center', minWidth: 50, background: isToday ? '#EFF6FF' : 'transparent', borderRadius: 6 }}>
                          {dayName}<br /><span style={{ fontWeight: 400, fontSize: 10 }}>{dayNum}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map(hour => (
                    <tr key={hour} style={{ borderTop: hour.endsWith(':00') ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '2px 8px', fontSize: 10, color: hour.endsWith(':00') ? '#475569' : '#94a3b8', fontWeight: hour.endsWith(':00') ? 600 : 400, whiteSpace: 'nowrap' }}>{hour}</td>
                      {currentWeek.map(day => {
                        const slot      = slots.find(s => s.date === day && s.start_time === hour + ':00');
                        const isBlocked = slot?.is_blocked;
                        const isAvail   = slot && !isBlocked;
                        const isPast    = new Date(day + 'T' + hour + ':00') < new Date();
                        return (
                          <td key={day} style={{ padding: 2, textAlign: 'center' }}>
                            <div onClick={() => !isBlocked && !isPast && toggleSlot(day, hour)}
                              style={{ width: '100%', height: 22, borderRadius: 3, cursor: isBlocked || isPast ? 'not-allowed' : 'pointer', background: isBlocked ? '#FEE2E2' : isAvail ? '#D1FAE5' : isPast ? '#F8FAFC' : '#F1F5F9', border: `1px solid ${isBlocked ? '#FECACA' : isAvail ? '#BBF7D0' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, opacity: isPast ? 0.35 : 1, transition: 'all .1s' }}>
                              {isBlocked ? '🔒' : isAvail ? '✓' : ''}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#D1FAE5', border: '1px solid #BBF7D0', borderRadius: 3, marginRight: 4 }} />Διαθέσιμο</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 3, marginRight: 4 }} />Κλειστό (κράτηση)</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 3, marginRight: 4 }} />Μη διαθέσιμο</span>
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === 'reviews' && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ flex: 1, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', marginBottom: 6 }}>Μέση Βαθμολογία</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#B45309' }}>{avgRating}</div>
              </div>
              <div style={{ flex: 1, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', marginBottom: 6 }}>Συνολικά Reviews</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#15803D' }}>{reviews.length}</div>
              </div>
            </div>
            {reviews.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>Δεν υπάρχουν αξιολογήσεις ακόμα</div>
              : reviews.map(r => (
                <div key={r.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#F59E0B' }}>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(r.created_at).toLocaleDateString('el-GR')}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #cbd5e1' }}>"{r.comment}"</p>}
                </div>
              ))}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={profile?.name} photoUrl={profile?.photo_url} size={80} />
                <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#2a6fdb', border: '2px solid #fff', color: '#fff', fontSize: 12, cursor: uploadingPhoto ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uploadingPhoto ? '⏳' : '📷'}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{profile?.name || '—'}</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{profile?.specialty} · {profile?.area}</div>
                <div style={{ marginTop: 4 }}>
                  {profile?.is_approved ? <Badge label="✓ Εγκεκριμένος" bg="#D1FAE5" color="#065F46" /> : <Badge label="⏳ Αναμένει έγκριση" bg="#FEF3C7" color="#92400E" />}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Πατήστε 📷 για αλλαγή φωτογραφίας (max 5MB)</div>
              </div>
              <button onClick={() => setEditProfile(!editProfile)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: editProfile ? '#f1f5f9' : '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {editProfile ? 'Ακύρωση' : '✏️ Επεξεργασία'}
              </button>
            </div>

            {editProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[['name', 'Ονοματεπώνυμο'], ['specialty', 'Ειδικότητα'], ['area', 'Περιοχή']].map(([k, l]) => (
                    <div key={k}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>{l}</label>
                      <input value={profileForm[k] || ''} onChange={e => setProfileForm(p => ({ ...p, [k]: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Τιμή/Συνεδρία (€25–€50)</label>
                    <input type="number" min={25} max={50} value={profileForm.price_per_session || ''} onChange={e => setProfileForm(p => ({ ...p, price_per_session: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Βιογραφικό</label>
                  <textarea rows={4} value={profileForm.bio || ''} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <button onClick={saveProfile} disabled={saving}
                  style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Αποθήκευση...' : '💾 Αποθήκευση'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Ειδικότητα',      profile?.specialty],
                  ['Περιοχή',         profile?.area],
                  ['Τιμή/Συνεδρία',   profile?.price_per_session ? `${profile.price_per_session}€` : '—'],
                  ['Καθαρά/Συνεδρία', profile?.price_per_session ? `${netPerSession}€` : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                    <span style={{ color: '#64748B' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{value || '—'}</span>
                  </div>
                ))}
                {profile?.bio && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Βιογραφικό</div>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setCancelModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              {cancelModal.type === 'request' ? 'Ακύρωση Αιτήματος' : 'Ακύρωση Συνεδρίας'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
              {cancelModal.type === 'request'
                ? 'Θα ακυρωθούν όλες οι ενεργές συνεδρίες του αιτήματος. Ο ασθενής θα ενημερωθεί.'
                : 'Η συνεδρία θα ακυρωθεί. Ο ασθενής θα ενημερωθεί.'}
            </p>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Λόγος ακύρωσης *</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="π.χ. Έκτακτη αδυναμία εξυπηρέτησης, κατανόηση από τον ασθενή..."
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCancelModal(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Ακύρωση
              </button>
              <button onClick={doCancel} disabled={cancelling}
                style={{ flex: 1, padding: '11px', borderRadius: 30, border: 'none', background: cancelling ? '#94a3b8' : '#BE123C', color: '#fff', fontSize: 14, fontWeight: 600, cursor: cancelling ? 'not-allowed' : 'pointer' }}>
                {cancelling ? 'Ακύρωση...' : 'Επιβεβαίωση Ακύρωσης'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}