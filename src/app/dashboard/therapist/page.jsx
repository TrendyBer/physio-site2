'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import TherapistConditions from '../../../components/TherapistConditions';
import {
  LayoutDashboard, ClipboardList, Calendar, MapPin, Target, Star, User,
  Clock, AlertTriangle, Upload, CreditCard, Home, MessageSquare,
  Check, X, Lock, ChevronLeft, ChevronRight, Plus, Lightbulb,
  Camera, Pencil, CheckCircle2, Save, FileText, GraduationCap,
  Award, Eye, Trash2, Wallet, Hourglass, CalendarDays, List,
} from 'lucide-react';

function Avatar({ name, photoUrl, size = 48 }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
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

function ReviewStars({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          fill={i <= (rating || 0) ? '#F59E0B' : 'none'}
          color={i <= (rating || 0) ? '#F59E0B' : '#E2E8F0'}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

const STATUS = {
  pending:   { label: 'Εκκρεμές',      bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Επιβεβαιωμένη', bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { label: 'Ολοκληρώθηκε',  bg: '#EDE9FE', color: '#5B21B6' },
  cancelled: { label: 'Ακυρώθηκε',     bg: '#FFE4E6', color: '#9F1239' },
  no_show:   { label: 'Δεν εμφανίστηκε', bg: '#FEE2E2', color: '#991B1B' },
};

const PAYMENT_STATUS = {
  pending:  { label: 'Σε αναμονή',           bg: '#F1F5F9', color: '#475569', icon: Hourglass },
  held:     { label: 'Αναμονή απελευθέρωσης', bg: '#FEF3C7', color: '#92400E', icon: Hourglass },
  released: { label: 'Πληρώθηκε',            bg: '#D1FAE5', color: '#065F46', icon: CheckCircle2 },
  refunded: { label: 'Επιστράφηκε',          bg: '#FEE2E2', color: '#991B1B', icon: X },
};

const DAYS_EL = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
const DAYS_EL_SHORT = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
const MONTHS_EL = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
const MONTHS_EL_FULL = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];

const HOURS = [];
for (let h = 9; h <= 20; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
  HOURS.push(`${String(h).padStart(2, '0')}:30`);
}
HOURS.push('21:00');

const ATHENS_AREAS = [
  'Αθήνα Κέντρο', 'Παγκράτι', 'Κολωνάκι', 'Εξάρχεια', 'Κυψέλη', 'Πατήσια',
  'Αμπελόκηποι', 'Ζωγράφου', 'Καισαριανή', 'Βύρωνας', 'Ηλιούπολη', 'Νέα Σμύρνη',
  'Καλλιθέα', 'Παλαιό Φάληρο', 'Άγιος Δημήτριος', 'Δάφνη', 'Νέος Κόσμος',
  'Πετράλωνα', 'Θησείο', 'Γκάζι', 'Μεταξουργείο', 'Ομόνοια',
  'Γαλάτσι', 'Νέα Φιλαδέλφεια', 'Νέα Ιωνία', 'Χαλάνδρι', 'Μαρούσι', 'Κηφισιά',
  'Νέα Ερυθραία', 'Νέο Ψυχικό', 'Ψυχικό', 'Φιλοθέη', 'Παπάγου', 'Χολαργός',
  'Αγία Παρασκευή', 'Γέρακας', 'Παλλήνη', 'Πεύκη', 'Λυκόβρυση',
  'Άλιμος', 'Ελληνικό', 'Γλυφάδα', 'Βούλα', 'Βουλιαγμένη', 'Βάρη', 'Βάρκιζα',
  'Πειραιάς', 'Νίκαια', 'Κορυδαλλός', 'Καμίνια', 'Κερατσίνι', 'Πέραμα', 'Δραπετσώνα',
  'Περιστέρι', 'Αιγάλεω', 'Χαϊδάρι', 'Ίλιον', 'Πετρούπολη', 'Καματερό',
  'Άγιοι Ανάργυροι', 'Νέα Χαλκηδόνα', 'Μοσχάτο', 'Ταύρος',
];

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

// Helpers for dates
function daysUntilAutoRelease(autoReleaseAt) {
  if (!autoReleaseAt) return null;
  const now = new Date();
  const target = new Date(autoReleaseAt);
  const diffMs = target - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function friendlyDateLabel(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T12:00:00');
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'ΣΗΜΕΡΑ';
  if (diffDays === 1) return 'ΑΥΡΙΟ';
  if (diffDays === 2) return 'ΜΕΘΑΥΡΙΟ';
  if (diffDays > 2 && diffDays <= 7) return `ΣΕ ${diffDays} ΜΕΡΕΣ`;
  if (diffDays > 7 && diffDays <= 14) return 'ΣΕ 1 ΕΒΔΟΜΑΔΑ';
  if (diffDays < 0) return 'ΕΧΕΙ ΓΙΝΕΙ';
  return null;
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS_EL[d.getDay()]} ${d.getDate()} ${MONTHS_EL[d.getMonth()]}`;
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS_EL_SHORT[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function TherapistDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [commission, setCommission] = useState(3);
  const [activeTab, setActiveTab] = useState('appointments'); // default to appointments
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const photoInputRef = useRef();

  // Appointments view mode
  const [appointmentsView, setAppointmentsView] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Mark-as-done modal
  const [doneModal, setDoneModal] = useState(null);
  const [marking, setMarking] = useState(false);

  const [docsModal, setDocsModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const licenseInputRef = useRef();
  const cvInputRef = useRef();
  const certInputRef = useRef();

  const [areaInput, setAreaInput] = useState('');
  const [savingAreas, setSavingAreas] = useState(false);
  const [areaSuggestions, setAreaSuggestions] = useState([]);

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
    if (comm) setCommission(parseFloat(comm.value) || 3);

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

  async function uploadDocument(file, kind) {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Επιτρέπονται μόνο: PDF, JPG, PNG');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 10 MB.');
      return;
    }

    setUploadingDoc(kind);
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = kind === 'cert' ? `${kind}-${Date.now()}.${ext}` : `${kind}.${ext}`;
    const path = `${user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('therapist-documents')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      alert('Σφάλμα upload: ' + uploadError.message);
      setUploadingDoc(null);
      return;
    }

    const updates = {};
    if (kind === 'license') {
      updates.license_url = path;
      updates.application_status = 'pending';
    } else if (kind === 'cv') {
      updates.cv_url = path;
    } else if (kind === 'cert') {
      const existing = profile?.certifications_urls || [];
      updates.certifications_urls = [...existing, path];
    }

    const { error: updateError } = await supabase
      .from('therapist_profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      alert('Σφάλμα ενημέρωσης: ' + updateError.message);
      setUploadingDoc(null);
      return;
    }

    setProfile(p => ({ ...p, ...updates }));
    setUploadingDoc(null);
  }

  async function removeDocument(kind, certPath = null) {
    if (!confirm('Διαγραφή αρχείου;')) return;

    let pathsToRemove = [];
    const updates = {};

    if (kind === 'license') {
      pathsToRemove = [profile.license_url];
      updates.license_url = null;
      updates.application_status = 'incomplete';
    } else if (kind === 'cv') {
      pathsToRemove = [profile.cv_url];
      updates.cv_url = null;
    } else if (kind === 'cert' && certPath) {
      pathsToRemove = [certPath];
      updates.certifications_urls = (profile.certifications_urls || []).filter(p => p !== certPath);
    }

    await supabase.storage.from('therapist-documents').remove(pathsToRemove.filter(Boolean));
    await supabase.from('therapist_profiles').update(updates).eq('id', user.id);
    setProfile(p => ({ ...p, ...updates }));
  }

  async function getSignedUrl(path) {
    const { data, error } = await supabase.storage
      .from('therapist-documents')
      .createSignedUrl(path, 3600);
    if (error) { alert('Σφάλμα: ' + error.message); return null; }
    return data.signedUrl;
  }

  async function viewDocument(path) {
    const url = await getSignedUrl(path);
    if (url) window.open(url, '_blank');
  }

  function handleAreaInputChange(value) {
    setAreaInput(value);
    if (value.trim().length > 0) {
      const filtered = ATHENS_AREAS.filter(a =>
        a.toLowerCase().includes(value.toLowerCase()) &&
        !(profile?.service_areas || []).includes(a)
      ).slice(0, 6);
      setAreaSuggestions(filtered);
    } else {
      setAreaSuggestions([]);
    }
  }

  async function addArea(area) {
    const cleaned = area.trim();
    if (!cleaned) return;
    const current = profile?.service_areas || [];
    if (current.includes(cleaned)) {
      setAreaInput('');
      setAreaSuggestions([]);
      return;
    }
    const updated = [...current, cleaned];
    setSavingAreas(true);
    await supabase.from('therapist_profiles').update({ service_areas: updated }).eq('id', user.id);
    setProfile(p => ({ ...p, service_areas: updated }));
    setAreaInput('');
    setAreaSuggestions([]);
    setSavingAreas(false);
  }

  async function removeArea(area) {
    const updated = (profile?.service_areas || []).filter(a => a !== area);
    setSavingAreas(true);
    await supabase.from('therapist_profiles').update({ service_areas: updated }).eq('id', user.id);
    setProfile(p => ({ ...p, service_areas: updated }));
    setSavingAreas(false);
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
      years_experience: profileForm.years_experience ? parseInt(profileForm.years_experience) : null,
    });
    setProfile(p => ({ ...p, ...profileForm }));
    setEditProfile(false);
    setSaving(false);
  }

  async function confirmRequest(request) {
    const bookingIds = request.bookings.map(b => b.id);
    await supabase.from('session_bookings').update({ status: 'confirmed' }).in('id', bookingIds);
    await supabase.from('session_requests').update({ status: 'confirmed' }).eq('id', request.id);
    await loadRequests(user.id);
  }

  function openDoneModal(booking, request) {
    setDoneModal({ booking, request });
  }

  async function markBookingDone() {
    if (!doneModal) return;
    setMarking(true);

    const now = new Date();
    const autoRelease = new Date(now);
    autoRelease.setDate(autoRelease.getDate() + 7);

    const { error } = await supabase.from('session_bookings').update({
      status: 'completed',
      payment_status: 'held',
      completed_at: now.toISOString(),
      completed_by_therapist: true,
      therapist_marked_done_at: now.toISOString(),
      auto_release_at: autoRelease.toISOString(),
    }).eq('id', doneModal.booking.id);

    if (error) {
      alert('Σφάλμα: ' + error.message);
      setMarking(false);
      return;
    }

    await loadRequests(user.id);
    setMarking(false);
    setDoneModal(null);
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

  // ═══ STATS ═══
  const allBookings = requests.flatMap(r => r.bookings.map(b => ({ ...b, request: r })));
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length;
  const completedCount = allBookings.filter(b => b.status === 'completed').length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const pricePerSession = profile?.price_per_session || 0;

  // Escrow earnings
  const heldBookings = allBookings.filter(b => b.payment_status === 'held');
  const releasedBookings = allBookings.filter(b => b.payment_status === 'released');
  const heldAmount = heldBookings.reduce((sum, b) => sum + parseFloat(b.net_to_therapist || 0), 0);
  const releasedAmount = releasedBookings.reduce((sum, b) => sum + parseFloat(b.net_to_therapist || 0), 0);

  function getNetAmount(request) {
    return (request.bookings || []).reduce((sum, b) => sum + parseFloat(b.net_to_therapist || 0), 0);
  }

  // ═══ APPOINTMENTS DATA ═══
  const sortedAppointments = [...allBookings].sort((a, b) => {
    const aDate = a.session_date + 'T' + (a.session_time || '00:00');
    const bDate = b.session_date + 'T' + (b.session_time || '00:00');
    return aDate.localeCompare(bDate);
  });

  const now = new Date();

  const upcomingAppointments = sortedAppointments.filter(a => {
    if (a.status === 'cancelled') return false;
    const d = new Date(a.session_date + 'T' + (a.session_time || '00:00'));
    return d >= now || a.payment_status === 'held';
  });

  const pastAppointments = sortedAppointments.filter(a => {
    const d = new Date(a.session_date + 'T' + (a.session_time || '00:00'));
    return d < now && a.payment_status !== 'held' && a.status !== 'pending' && !(a.status === 'confirmed' && d >= now);
  }).reverse();

  const nextAppointment = upcomingAppointments.find(a =>
    a.status === 'confirmed' || a.status === 'pending'
  );

  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
  const weekStart = currentWeek?.[0];
  const weekEnd   = currentWeek?.[currentWeek.length - 1];

  const hasLicense = !!profile?.license_url;
  const hasCv = !!profile?.cv_url;
  const certCount = (profile?.certifications_urls || []).length;
  const showDocsBanner = !hasLicense;

  // Calendar grid builder
  function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const grid = [];
    let week = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      week.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      week.push(dateStr);
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }

    return grid;
  }

  const calendarGrid = buildMonthGrid(calendarMonth.year, calendarMonth.month);
  const todayStr = new Date().toISOString().split('T')[0];

  const appointmentsByDate = {};
  upcomingAppointments.forEach(a => {
    if (!appointmentsByDate[a.session_date]) appointmentsByDate[a.session_date] = [];
    appointmentsByDate[a.session_date].push(a);
  });
  pastAppointments.forEach(a => {
    if (!appointmentsByDate[a.session_date]) appointmentsByDate[a.session_date] = [];
    appointmentsByDate[a.session_date].push(a);
  });

  function navigateMonth(direction) {
    setCalendarMonth(curr => {
      const newMonth = curr.month + direction;
      if (newMonth < 0) return { year: curr.year - 1, month: 11 };
      if (newMonth > 11) return { year: curr.year + 1, month: 0 };
      return { year: curr.year, month: newMonth };
    });
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 16, color: '#64748B' }}>Φόρτωση...</div>
    </div>
  );

  const TABS = [
    { id: 'appointments', label: 'Ραντεβού', Icon: Calendar },
    { id: 'overview', label: 'Επισκόπηση', Icon: LayoutDashboard },
    { id: 'requests', label: `Αιτήματα ${pendingCount > 0 ? `(${pendingCount})` : ''}`, Icon: ClipboardList },
    { id: 'calendar', label: 'Διαθεσιμότητα', Icon: CalendarDays },
    { id: 'areas',    label: 'Περιοχές', Icon: MapPin },
    { id: 'conditions', label: 'Παθήσεις', Icon: Target },
    { id: 'reviews',  label: 'Αξιολογήσεις', Icon: Star },
    { id: 'profile',  label: 'Προφίλ', Icon: User },
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
          {!profile?.is_approved && hasLicense && (
            <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} />
              Εκκρεμεί έγκριση admin
            </span>
          )}
          <Avatar name={profile?.name || user?.email} photoUrl={profile?.photo_url} size={36} />
          <button onClick={signOut} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Αποσύνδεση</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {showDocsBanner && (
          <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #F59E0B', borderRadius: 14, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={26} color="#92400E" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                Ολοκλήρωσε την αίτησή σου
              </div>
              <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
                Ανέβασε την <strong>Άδεια Εξασκήσεως</strong> σου για να σταλεί η αίτησή σου στον admin για έγκριση.
                CV και Πιστοποιητικά είναι προαιρετικά.
              </div>
            </div>
            <button onClick={() => setDocsModal(true)}
              style={{ background: '#92400E', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 30, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} />
              Ανέβασμα Δικαιολογητικών
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 24, flexWrap: 'wrap' }}>
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

        {/* ═══════════════════════ APPOINTMENTS TAB ═══════════════════════ */}
        {activeTab === 'appointments' && (
          <div>
            {/* Hero: Next Appointment */}
            {nextAppointment && (() => {
              const friendly = friendlyDateLabel(nextAppointment.session_date);
              const fullDate = formatFullDate(nextAppointment.session_date);
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #1a2e44 0%, #2a6fdb 100%)',
                  borderRadius: 18,
                  padding: '28px 32px',
                  marginBottom: 24,
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(26, 46, 68, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    Επόμενο Ραντεβού
                  </div>

                  {friendly && (
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '-.02em' }}>
                      {friendly}
                    </div>
                  )}

                  <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                    {fullDate}
                  </div>

                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
                    στις {nextAppointment.session_time?.slice(0, 5)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <User size={18} color="rgba(255,255,255,0.7)" />
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{nextAppointment.request?.patient_name || 'Άγνωστος'}</span>
                    </div>

                    {nextAppointment.request?.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MapPin size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 15 }}>
                          {nextAppointment.request.address}
                          {nextAppointment.request.area && `, ${nextAppointment.request.area}`}
                          {nextAppointment.request.postal_code && `, ${nextAppointment.request.postal_code}`}
                        </span>
                      </div>
                    )}

                    {nextAppointment.request?.floor_info && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Home size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                          {nextAppointment.request.floor_info}
                        </span>
                      </div>
                    )}

                    {nextAppointment.request?.problem_type && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Target size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                          {nextAppointment.request.problem_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {nextAppointment.status === 'pending' && (
                    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255, 204, 0, 0.15)', borderRadius: 10, fontSize: 13, color: '#FEF3C7', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} />
                      Αναμένει την επιβεβαίωσή σας στα Αιτήματα
                    </div>
                  )}
                </div>
              );
            })()}

            {!nextAppointment && upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <Calendar size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 16, marginBottom: 8 }}>Δεν έχετε ραντεβού ακόμα</div>
                <div style={{ fontSize: 13 }}>Όταν έρθουν αιτήματα από ασθενείς, θα εμφανιστούν εδώ.</div>
              </div>
            )}

            {/* View toggle */}
            {(upcomingAppointments.length > 0 || pastAppointments.length > 0) && (
              <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 20 }}>
                <button onClick={() => setAppointmentsView('list')}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: appointmentsView === 'list' ? '#fff' : 'transparent', color: appointmentsView === 'list' ? '#0F172A' : '#64748B', boxShadow: appointmentsView === 'list' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <List size={15} />
                  Λίστα
                </button>
                <button onClick={() => setAppointmentsView('calendar')}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: appointmentsView === 'calendar' ? '#fff' : 'transparent', color: appointmentsView === 'calendar' ? '#0F172A' : '#64748B', boxShadow: appointmentsView === 'calendar' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={15} />
                  Ημερολόγιο
                </button>
              </div>
            )}

            {/* LIST VIEW */}
            {appointmentsView === 'list' && (
              <>
                {upcomingAppointments.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ChevronRight size={16} color="#64748b" />
                      Επερχόμενα Ραντεβού ({upcomingAppointments.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {upcomingAppointments.map(apt => {
                        const bSt = STATUS[apt.status] || STATUS.pending;
                        const payStatus = apt.payment_status || 'pending';
                        const payInfo = PAYMENT_STATUS[payStatus];
                        const isHeld = apt.payment_status === 'held';
                        const daysLeft = isHeld ? daysUntilAutoRelease(apt.auto_release_at) : null;
                        const friendly = friendlyDateLabel(apt.session_date);
                        const isPast = new Date(apt.session_date + 'T' + (apt.session_time || '00:00')) < new Date();
                        const canMarkDone = apt.status === 'confirmed' && isPast && apt.payment_status !== 'held';

                        return (
                          <div key={apt.id} style={{
                            background: '#fff',
                            borderRadius: 12,
                            border: isHeld ? '2px solid #F59E0B' : '1px solid #e2e8f0',
                            padding: '18px 20px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 110 }}>
                                {friendly ? (
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2a6fdb', marginBottom: 2 }}>
                                    {friendly}
                                  </div>
                                ) : null}
                                <div style={{ fontSize: 15, color: '#0F172A', fontWeight: 600 }}>
                                  {formatShortDate(apt.session_date)}
                                </div>
                                <div style={{ fontSize: 17, color: '#0F172A', fontWeight: 700, marginTop: 2 }}>
                                  {apt.session_time?.slice(0, 5)}
                                </div>
                              </div>

                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <User size={15} color="#2a6fdb" />
                                  {apt.request?.patient_name || 'Άγνωστος'}
                                </div>
                                {apt.request?.address && (
                                  <div style={{ fontSize: 14, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <MapPin size={13} />
                                    {apt.request.address}, {apt.request.area}
                                    {apt.request.postal_code && `, ${apt.request.postal_code}`}
                                  </div>
                                )}
                                {apt.request?.floor_info && (
                                  <div style={{ fontSize: 13, color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Home size={12} />
                                    {apt.request.floor_info}
                                  </div>
                                )}
                                {apt.request?.problem_type && (
                                  <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, marginTop: 6, display: 'inline-block' }}>
                                    {apt.request.problem_type}
                                  </div>
                                )}
                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                                  {apt.status === 'completed' && payInfo && (
                                    <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                  )}
                                  {(apt.payment_status === 'held' || apt.payment_status === 'released') && apt.net_to_therapist && (
                                    <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>
                                      +{parseFloat(apt.net_to_therapist).toFixed(2)}€
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                {canMarkDone && (
                                  <button onClick={() => openDoneModal(apt, apt.request)}
                                    style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                    <Check size={14} strokeWidth={3} />
                                    Ολοκληρώθηκε
                                  </button>
                                )}
                                {apt.status === 'confirmed' && !isPast && (
                                  <button onClick={() => openCancelBookingModal(apt, apt.request)}
                                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #FECDD3', background: 'transparent', color: '#BE123C', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Ακύρωση
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Held bookings: countdown info */}
                            {isHeld && (
                              <div style={{ marginTop: 14, padding: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 }}>
                                <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600, marginBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <Hourglass size={13} />
                                  Αναμονή απελευθέρωσης πληρωμής από ασθενή
                                </div>
                                {daysLeft !== null && (
                                  <div style={{ fontSize: 12, color: '#78350F' }}>
                                    {daysLeft === 0 ? 'Auto-release σήμερα' : `Auto-release σε ${daysLeft} μέρες`} · Καθαρά {parseFloat(apt.net_to_therapist || 0).toFixed(2)}€
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pastAppointments.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ChevronLeft size={16} color="#64748b" />
                      Παλαιότερα Ραντεβού ({pastAppointments.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pastAppointments.map(apt => {
                        const bSt = STATUS[apt.status] || STATUS.pending;
                        const payStatus = apt.payment_status || 'pending';
                        const payInfo = PAYMENT_STATUS[payStatus];

                        return (
                          <div key={apt.id} style={{
                            background: '#fff',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            flexWrap: 'wrap',
                          }}>
                            <div style={{ minWidth: 100 }}>
                              <div style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>
                                {formatShortDate(apt.session_date)}
                              </div>
                              <div style={{ fontSize: 13, color: '#94A3B8' }}>
                                στις {apt.session_time?.slice(0, 5)}
                              </div>
                            </div>

                            <div style={{ flex: 1, minWidth: 150 }}>
                              <div style={{ fontSize: 14, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <User size={12} color="#64748B" />
                                {apt.request?.patient_name || 'Άγνωστος'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                              {apt.status === 'completed' && payInfo && payStatus !== 'pending' && (
                                <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                              )}
                              {payStatus === 'released' && apt.net_to_therapist && (
                                <span style={{ fontSize: 12, color: '#15803D', fontWeight: 700 }}>
                                  +{parseFloat(apt.net_to_therapist).toFixed(2)}€
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CALENDAR VIEW */}
            {appointmentsView === 'calendar' && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <button onClick={() => navigateMonth(-1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ChevronLeft size={16} />
                    Προηγ.
                  </button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>
                    {MONTHS_EL_FULL[calendarMonth.month]} {calendarMonth.year}
                  </div>
                  <button onClick={() => navigateMonth(1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Επόμ.
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                  {['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748B', padding: 6 }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {calendarGrid.flat().map((dateStr, idx) => {
                    if (!dateStr) return <div key={`empty-${idx}`} />;
                    const dayApts = appointmentsByDate[dateStr] || [];
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;
                    const hasApts = dayApts.length > 0;
                    const day = parseInt(dateStr.split('-')[2]);

                    return (
                      <div key={dateStr}
                        onClick={() => hasApts && setSelectedDay({ date: dateStr, appointments: dayApts })}
                        style={{
                          minHeight: 70,
                          padding: '6px 8px',
                          background: isToday ? '#EFF6FF' : hasApts ? '#F0FDF4' : '#fff',
                          border: `1px solid ${isToday ? '#2a6fdb' : hasApts ? '#86EFAC' : '#f1f5f9'}`,
                          borderRadius: 8,
                          cursor: hasApts ? 'pointer' : 'default',
                          opacity: isPast && !hasApts ? 0.5 : 1,
                          transition: 'all .15s',
                        }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? '#2a6fdb' : '#0F172A', marginBottom: 4 }}>
                          {day}
                        </div>
                        {dayApts.slice(0, 2).map((a, i) => (
                          <div key={i} style={{
                            fontSize: 10,
                            background: a.status === 'cancelled' ? '#FEE2E2' : a.status === 'completed' ? '#EDE9FE' : '#DBEAFE',
                            color: a.status === 'cancelled' ? '#9F1239' : a.status === 'completed' ? '#5B21B6' : '#1D4ED8',
                            padding: '2px 5px',
                            borderRadius: 4,
                            marginBottom: 2,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {a.session_time?.slice(0, 5)}
                          </div>
                        ))}
                        {dayApts.length > 2 && (
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                            +{dayApts.length - 2}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 14, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#EFF6FF', border: '1px solid #2a6fdb', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />Σήμερα</span>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />Έχει ραντεβού</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Νέα Αιτήματα', value: pendingCount, bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' },
                { label: 'Επιβεβαιωμένες', value: confirmedCount, bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8' },
                { label: 'Ολοκληρωμένες', value: completedCount, bg: '#EDE9FE', border: '#DDD6FE', text: '#5B21B6' },
                { label: 'Μέση Βαθμολογία', value: avgRating, bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
              ].map(c => (
                <div key={c.label} style={{ flex: 1, minWidth: 130, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: c.text }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Hourglass size={16} color="#B45309" />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '.05em' }}>Σε εκκρεμότητα</div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#B45309' }}>{heldAmount.toFixed(2)}€</div>
                <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>{heldBookings.length} συνεδρίες αναμένουν απελευθέρωση</div>
              </div>
              <div style={{ flex: 1, minWidth: 200, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Wallet size={16} color="#15803D" />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.05em' }}>Πληρωμένα</div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#15803D' }}>{releasedAmount.toFixed(2)}€</div>
                <div style={{ fontSize: 12, color: '#15803D', marginTop: 4 }}>{releasedBookings.length} συνεδρίες έχουν εξοφληθεί</div>
              </div>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={16} />
                Πληροφορίες Πληρωμής
              </div>
              <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.7 }}>
                Τιμή συνεδρίας σας: <strong>{pricePerSession}€</strong><br />
                Προμήθεια πλατφόρμας: <strong>{commission}€ ανά συνεδρία</strong><br />
                Καθαρά έσοδα ανά συνεδρία (μεμονωμένη): <strong>{Math.max(0, pricePerSession - commission)}€</strong>
                <div style={{ marginTop: 8, fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                  Σε πακέτα, τα καθαρά έσοδα μπορεί να είναι μικρότερα λόγω της έκπτωσης πακέτου.
                </div>
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

        {/* ═══════════════════════ REQUESTS TAB ═══════════════════════ */}
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

                          <div style={{ fontSize: 13, color: '#475569', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={13} color="#64748B" />
                            {req.address}, {req.area}{req.postal_code ? `, ${req.postal_code}` : ''}
                          </div>
                          {req.floor_info && (
                            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Home size={12} />
                              {req.floor_info}
                            </div>
                          )}

                          <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #cbd5e1', marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>{req.problem_type}</div>
                            {req.problem_description || 'Χωρίς περιγραφή'}
                          </div>

                          {req.notes && (
                            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10, fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <MessageSquare size={12} />
                              Σημειώσεις: {req.notes}
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
                              <span style={{ color: '#64748B' }}>Σύνολο καθαρά: </span>
                              <strong style={{ color: '#15803D', fontSize: 15 }}>{netAmount.toFixed(2)}€</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} />
                        Συνεδρίες
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {req.bookings.map((b, i) => {
                          const bSt = STATUS[b.status] || STATUS.pending;
                          const d = new Date(b.session_date + 'T12:00:00');
                          const isPast = new Date(b.session_date + 'T' + (b.session_time || '00:00')) < new Date();
                          const payStatus = b.payment_status || 'pending';
                          const payInfo = PAYMENT_STATUS[payStatus];
                          const daysLeft = b.payment_status === 'held' ? daysUntilAutoRelease(b.auto_release_at) : null;

                          return (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, flexWrap: 'wrap' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>{i + 1}.</span>
                              <span style={{ color: '#0F172A', fontWeight: 500 }}>
                                {DAYS_EL_SHORT[d.getDay()]} {d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} στις {b.session_time?.slice(0, 5)}
                              </span>
                              <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />

                              {b.status === 'completed' && payInfo && (
                                <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                              )}

                              {b.payment_status === 'held' && daysLeft !== null && (
                                <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600, background: '#FEF3C7', padding: '2px 8px', borderRadius: 999 }}>
                                  {daysLeft === 0 ? 'Auto-release σήμερα' : `${daysLeft} μέρ. μέχρι auto-release`}
                                </span>
                              )}

                              {(b.payment_status === 'held' || b.payment_status === 'released') && b.net_to_therapist && (
                                <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>
                                  +{parseFloat(b.net_to_therapist).toFixed(2)}€
                                </span>
                              )}

                              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                {b.status === 'confirmed' && isPast && (
                                  <button onClick={() => openDoneModal(b, req)}
                                    style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#15803D', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Check size={12} strokeWidth={3} />
                                    Ολοκληρώθηκε
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
                              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #FECDD3', background: 'transparent', color: '#BE123C', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <X size={14} strokeWidth={2.5} />
                              Απόρριψη
                            </button>
                            <button onClick={() => confirmRequest(req)}
                              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Check size={14} strokeWidth={3} />
                              Αποδοχή Αιτήματος
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

        {/* ═══════════════════════ CALENDAR (availability) TAB ═══════════════════════ */}
        {activeTab === 'calendar' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color="#2a6fdb" />
              Διαθεσιμότητα — έως 2 χρόνια μπροστά
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Κλικάρετε για να ορίσετε/αφαιρέσετε ώρες. Ώρες ανά 30 λεπτά, 09:00–21:00.</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: weekOffset === 0 ? '#f8fafc' : '#fff', color: weekOffset === 0 ? '#94a3b8' : '#1a2e44', fontSize: 13, fontWeight: 600, cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ChevronLeft size={14} />
                Προηγ.
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                {weekStart && weekEnd ? `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}` : ''}
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Εβδομάδα {weekOffset + 1} / {ALL_WEEKS.length}</span>
              </div>
              <button onClick={() => setWeekOffset(w => Math.min(ALL_WEEKS.length - 1, w + 1))}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Επόμ.
                <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '8px 10px', fontSize: 11, color: '#64748B', fontWeight: 600, textAlign: 'left', minWidth: 52 }}>Ώρα</th>
                    {currentWeek.map(d => {
                      const dateObj = new Date(d + 'T12:00:00');
                      const dayName = DAYS_EL_SHORT[dateObj.getDay()];
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
                              style={{ width: '100%', height: 22, borderRadius: 3, cursor: isBlocked || isPast ? 'not-allowed' : 'pointer', background: isBlocked ? '#FEE2E2' : isAvail ? '#D1FAE5' : isPast ? '#F8FAFC' : '#F1F5F9', border: `1px solid ${isBlocked ? '#FECACA' : isAvail ? '#BBF7D0' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isPast ? 0.35 : 1, transition: 'all .1s' }}>
                              {isBlocked ? <Lock size={10} color="#9F1239" strokeWidth={2.5} /> : isAvail ? <Check size={11} color="#15803D" strokeWidth={3} /> : null}
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
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#D1FAE5', border: '1px solid #BBF7D0', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />Διαθέσιμο</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />Κλειστό (κράτηση)</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />Μη διαθέσιμο</span>
            </div>
          </div>
        )}

        {/* ═══════════════════════ AREAS TAB ═══════════════════════ */}
        {activeTab === 'areas' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="#2a6fdb" />
              Περιοχές Εξυπηρέτησης
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Επιλέξτε τις περιοχές της Αθήνας που εξυπηρετείτε. Οι ασθενείς σε αυτές τις περιοχές θα σας βρίσκουν πιο εύκολα.
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lightbulb size={14} color="#1E40AF" />
              <strong>Σύντομα:</strong> Σχεδίαση περιοχών σε χάρτη για ακριβέστερο matching!
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>
                Επιλεγμένες περιοχές ({(profile?.service_areas || []).length})
              </div>
              {(profile?.service_areas || []).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                  Δεν έχετε επιλέξει ακόμα περιοχές. Ξεκινήστε γράφοντας παρακάτω.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(profile?.service_areas || []).map(area => (
                    <div key={area} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 30, padding: '6px 8px 6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1D4ED8', fontWeight: 500 }}>
                      <MapPin size={12} />
                      {area}
                      <button onClick={() => removeArea(area)} disabled={savingAreas}
                        style={{ background: 'transparent', border: 'none', color: '#1D4ED8', cursor: 'pointer', padding: 0, marginLeft: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%' }}>
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                Προσθήκη περιοχής
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={areaInput}
                  onChange={e => handleAreaInputChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && areaInput.trim()) { e.preventDefault(); addArea(areaInput); } }}
                  placeholder="π.χ. Παγκράτι, Κολωνάκι..."
                  style={{ flex: 1, padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A' }}
                />
                <button onClick={() => addArea(areaInput)} disabled={!areaInput.trim() || savingAreas}
                  style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: !areaInput.trim() ? '#cbd5e1' : '#1a2e44', color: '#fff', fontSize: 13, fontWeight: 600, cursor: !areaInput.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} strokeWidth={2.5} />
                  Προσθήκη
                </button>
              </div>

              {areaSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 240, overflowY: 'auto' }}>
                  {areaSuggestions.map(s => (
                    <div key={s} onClick={() => addArea(s)}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: '#0F172A', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MapPin size={12} color="#94a3b8" />
                      {s}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Lightbulb size={12} />
                Πληκτρολογήστε για να δείτε προτάσεις από περιοχές της Αθήνας. Μπορείτε επίσης να γράψετε και δικές σας.
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ CONDITIONS ═══════════════════════ */}
        {activeTab === 'conditions' && (
          <TherapistConditions userId={user?.id} specialty={profile?.specialty} />
        )}

        {/* ═══════════════════════ REVIEWS ═══════════════════════ */}
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
                    <ReviewStars rating={r.rating} size={14} />
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(r.created_at).toLocaleDateString('el-GR')}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #cbd5e1' }}>"{r.comment}"</p>}
                </div>
              ))}
          </div>
        )}

        {/* ═══════════════════════ PROFILE ═══════════════════════ */}
        {activeTab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={profile?.name} photoUrl={profile?.photo_url} size={80} />
                <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#2a6fdb', border: '2px solid #fff', color: '#fff', cursor: uploadingPhoto ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uploadingPhoto ? <Clock size={12} /> : <Camera size={13} />}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{profile?.name || '—'}</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{profile?.specialty} · {profile?.area}</div>
                <div style={{ marginTop: 4 }}>
                  {profile?.is_approved
                    ? <Badge label="Εγκεκριμένος" bg="#D1FAE5" color="#065F46" icon={CheckCircle2} />
                    : !hasLicense
                      ? <Badge label="Δικαιολογητικά εκκρεμούν" bg="#FEF3C7" color="#92400E" icon={AlertTriangle} />
                      : <Badge label="Αναμένει έγκριση admin" bg="#FEF3C7" color="#92400E" icon={Clock} />
                  }
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Πατήστε <Camera size={11} /> για αλλαγή φωτογραφίας (max 5MB)
                </div>
              </div>
              <button onClick={() => setEditProfile(!editProfile)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: editProfile ? '#f1f5f9' : '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {editProfile ? 'Ακύρωση' : <><Pencil size={13} />Επεξεργασία</>}
              </button>
            </div>

            {editProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[['name', 'Ονοματεπώνυμο'], ['specialty', 'Ειδικότητα'], ['area', 'Περιοχή Έδρας']].map(([k, l]) => (
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
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Χρόνια Εμπειρίας</label>
                    <input type="number" min={0} max={60} value={profileForm.years_experience || ''} onChange={e => setProfileForm(p => ({ ...p, years_experience: e.target.value }))}
                      placeholder="π.χ. 5"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Βιογραφικό</label>
                  <textarea rows={4} value={profileForm.bio || ''} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <button onClick={saveProfile} disabled={saving}
                  style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: 30, border: 'none', background: '#1a2e44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Save size={14} />
                  {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Ειδικότητα',      profile?.specialty],
                  ['Περιοχή Έδρας',   profile?.area],
                  ['Χρόνια Εμπειρίας', profile?.years_experience ? `${profile.years_experience} χρόνια` : '—'],
                  ['Τιμή/Συνεδρία',   profile?.price_per_session ? `${profile.price_per_session}€` : '—'],
                  ['Καθαρά/Συνεδρία', profile?.price_per_session ? `${Math.max(0, profile.price_per_session - commission)}€ (μετά την προμήθεια ${commission}€)` : '—'],
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

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Δικαιολογητικά</div>
                    <button onClick={() => setDocsModal(true)}
                      style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#1a2e44', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={12} />
                      Διαχείριση
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: hasLicense ? '#F0FDF4' : '#FEF3C7', border: `1px solid ${hasLicense ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 8, fontSize: 13 }}>
                      {hasLicense ? <CheckCircle2 size={16} color="#15803D" /> : <AlertTriangle size={16} color="#92400E" />}
                      <strong>Άδεια Εξασκήσεως</strong>
                      <span style={{ marginLeft: 'auto', color: hasLicense ? '#15803D' : '#92400E', fontWeight: 600, fontSize: 12 }}>
                        {hasLicense ? 'Ανέβηκε' : 'Λείπει (υποχρεωτικό)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                      {hasCv ? <CheckCircle2 size={16} color="#15803D" /> : <span style={{ width: 16, height: 16, display: 'inline-block', borderRadius: '50%', background: '#e2e8f0' }} />}
                      <span>Βιογραφικό</span>
                      <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 12 }}>
                        {hasCv ? 'Ανέβηκε' : 'Προαιρετικό'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                      {certCount > 0 ? <CheckCircle2 size={16} color="#15803D" /> : <span style={{ width: 16, height: 16, display: 'inline-block', borderRadius: '50%', background: '#e2e8f0' }} />}
                      <span>Πιστοποιητικά</span>
                      <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 12 }}>
                        {certCount > 0 ? `${certCount} αρχείο/α` : 'Προαιρετικά'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar day-detail modal */}
      {selectedDay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedDay(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 0, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                {formatFullDate(selectedDay.date)}
              </h2>
              <button onClick={() => setSelectedDay(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedDay.appointments.map(apt => {
                const bSt = STATUS[apt.status] || STATUS.pending;
                return (
                  <div key={apt.id} style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                      στις {apt.session_time?.slice(0, 5)}
                    </div>
                    <div style={{ fontSize: 14, color: '#475569', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} color="#2a6fdb" />
                      {apt.request?.patient_name || 'Άγνωστος'}
                    </div>
                    {apt.request?.address && (
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={12} />
                        {apt.request.address}, {apt.request.area}
                      </div>
                    )}
                    <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MARK AS DONE MODAL */}
      {doneModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setDoneModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={28} color="#15803D" strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 12, textAlign: 'center' }}>
              Ολοκληρώθηκε η συνεδρία;
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
              Επιβεβαιώνεις ότι έγινε η συνεδρία με τον/την <strong style={{ color: '#0F172A' }}>{doneModal.request?.patient_name}</strong>;
            </p>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                Ποσό προς απελευθέρωση
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#15803D' }}>
                {parseFloat(doneModal.booking?.net_to_therapist || 0).toFixed(2)}€
              </div>
              <div style={{ fontSize: 12, color: '#15803D', marginTop: 4, lineHeight: 1.5 }}>
                Σύνολο συνεδρίας: {parseFloat(doneModal.booking?.session_amount || 0).toFixed(2)}€ − Προμήθεια: {parseFloat(doneModal.booking?.platform_fee || commission).toFixed(2)}€
              </div>
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Hourglass size={14} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Ο ασθενής θα ειδοποιηθεί και θα έχει <strong>7 μέρες</strong> να επιβεβαιώσει & να απελευθερώσει το ποσό. Αν δεν απαντήσει, η πληρωμή απελευθερώνεται αυτόματα.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDoneModal(null)} disabled={marking}
                style={{ flex: 1, padding: '12px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: marking ? 'not-allowed' : 'pointer' }}>
                Ακύρωση
              </button>
              <button onClick={markBookingDone} disabled={marking}
                style={{ flex: 2, padding: '12px', borderRadius: 30, border: 'none', background: marking ? '#94a3b8' : '#15803D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: marking ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} strokeWidth={3} />
                {marking ? 'Καταχώρηση...' : 'Ναι, ολοκληρώθηκε'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS MODAL */}
      {docsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setDocsModal(false); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 0, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#2a6fdb" />
                Δικαιολογητικά
              </h2>
              <button onClick={() => setDocsModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={16} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Η Άδεια Εξασκήσεως είναι υποχρεωτική.</strong> Μόλις την ανεβάσεις, η αίτησή σου θα σταλεί στον admin για έγκριση.</span>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap size={15} color="#2a6fdb" />
                  Άδεια Εξασκήσεως <span style={{ color: '#BE123C' }}>*</span>
                </div>
                {hasLicense ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
                    <CheckCircle2 size={18} color="#15803D" />
                    <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600, flex: 1 }}>Ανεβασμένο</span>
                    <button onClick={() => viewDocument(profile.license_url)}
                      style={{ background: 'transparent', border: '1px solid #BBF7D0', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#15803D', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} />
                      Προβολή
                    </button>
                    <button onClick={() => removeDocument('license')}
                      style={{ background: 'transparent', border: '1px solid #FECDD3', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#BE123C', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={12} />
                      Διαγραφή
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '2px dashed #e2e8f0', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>PDF, JPG, PNG · max 10 MB</div>
                    <button onClick={() => licenseInputRef.current?.click()} disabled={uploadingDoc === 'license'}
                      style={{ background: '#1a2e44', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={12} />
                      {uploadingDoc === 'license' ? 'Upload...' : 'Επιλογή Αρχείου'}
                    </button>
                    <input ref={licenseInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDocument(e.target.files[0], 'license')} style={{ display: 'none' }} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} color="#2a6fdb" />
                  Βιογραφικό <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>(προαιρετικό)</span>
                </div>
                {hasCv ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10 }}>
                    <CheckCircle2 size={18} color="#1D4ED8" />
                    <span style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 600, flex: 1 }}>Ανεβασμένο</span>
                    <button onClick={() => viewDocument(profile.cv_url)}
                      style={{ background: 'transparent', border: '1px solid #BFDBFE', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} />
                      Προβολή
                    </button>
                    <button onClick={() => removeDocument('cv')}
                      style={{ background: 'transparent', border: '1px solid #FECDD3', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#BE123C', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '2px dashed #e2e8f0', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>PDF, JPG, PNG · max 10 MB</div>
                    <button onClick={() => cvInputRef.current?.click()} disabled={uploadingDoc === 'cv'}
                      style={{ background: 'transparent', color: '#1a2e44', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={12} />
                      {uploadingDoc === 'cv' ? 'Upload...' : 'Επιλογή'}
                    </button>
                    <input ref={cvInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDocument(e.target.files[0], 'cv')} style={{ display: 'none' }} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Award size={15} color="#2a6fdb" />
                  Πιστοποιητικά <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>(προαιρετικά, πολλαπλά αρχεία)</span>
                </div>
                {(profile?.certifications_urls || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {(profile.certifications_urls || []).map((path, idx) => (
                      <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                        <FileText size={14} color="#64748b" />
                        <span style={{ fontSize: 12, color: '#475569', flex: 1 }}>Πιστοποιητικό {idx + 1}</span>
                        <button onClick={() => viewDocument(path)}
                          style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#1a2e44', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                          <Eye size={12} />
                        </button>
                        <button onClick={() => removeDocument('cert', path)}
                          style={{ background: 'transparent', border: '1px solid #FECDD3', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#BE123C', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ border: '2px dashed #e2e8f0', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Προσθέστε πιστοποιήσεις, σεμινάρια, εξειδικεύσεις</div>
                  <button onClick={() => certInputRef.current?.click()} disabled={uploadingDoc === 'cert'}
                    style={{ background: 'transparent', color: '#1a2e44', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={12} strokeWidth={2.5} />
                    {uploadingDoc === 'cert' ? 'Upload...' : 'Προσθήκη'}
                  </button>
                  <input ref={certInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDocument(e.target.files[0], 'cert')} style={{ display: 'none' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDocsModal(false)}
                style={{ background: '#1a2e44', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 30, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}

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
              placeholder="π.χ. Έκτακτη αδυναμία εξυπηρέτησης..."
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