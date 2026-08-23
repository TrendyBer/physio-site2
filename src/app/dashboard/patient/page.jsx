'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CancelBookingModal from '@/components/CancelBookingModal';
import { useRouter } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ClipboardList, Stethoscope, User, MapPin, Euro, Calendar, Star, Check, ArrowRight, Save, X, Hourglass, Wallet, AlertCircle, CheckCircle2, CalendarDays, List, ChevronLeft, ChevronRight, Clock, XCircle, Globe } from 'lucide-react';

// ─── Locale data ──────────────────────────────────────────────────────
const LOCALE = { el: 'el-GR', en: 'en-US' };

const DAYS = {
  el: ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const DAYS_SHORT = {
  el: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const DAYS_GRID = {
  el: ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};
const MONTHS = {
  el: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_FULL = {
  el: ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const RATING_WORDS = {
  el: ['', 'Κακή', 'Μέτρια', 'Καλή', 'Πολύ καλή', 'Εξαιρετική'],
  en: ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'],
};

// ─── Status maps ──────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:   { el: 'Εκκρεμές',      en: 'Pending',   bg: '#FEF3C7', color: '#92400E' },
  confirmed: { el: 'Επιβεβαιωμένο', en: 'Confirmed', bg: '#D1FAE5', color: '#065F46' },
  accepted:  { el: 'Αποδεκτό',      en: 'Accepted',  bg: '#D1FAE5', color: '#065F46' },
  declined:  { el: 'Απορρίφθηκε',   en: 'Declined',  bg: '#FFE4E6', color: '#9F1239' },
  rejected:  { el: 'Απορρίφθηκε',   en: 'Rejected',  bg: '#FFE4E6', color: '#9F1239' },
  completed: { el: 'Ολοκληρώθηκε',  en: 'Completed', bg: '#EDE9FE', color: '#5B21B6' },
  cancelled: { el: 'Ακυρώθηκε',     en: 'Cancelled', bg: '#F1F5F9', color: '#64748B' },
};

const BOOKING_STATUS = {
  pending:   { el: 'Εκκρεμής',      en: 'Pending',   bg: '#FEF3C7', color: '#92400E' },
  confirmed: { el: 'Επιβεβαιωμένη', en: 'Confirmed', bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { el: 'Ολοκληρώθηκε',  en: 'Completed', bg: '#D1FAE5', color: '#065F46' },
  cancelled: { el: 'Ακυρώθηκε',     en: 'Cancelled', bg: '#F1F5F9', color: '#64748B' },
};

const PAYMENT_STATUS = {
  pending:  { el: 'Σε αναμονή',        en: 'Awaiting',      bg: '#F1F5F9', color: '#475569', icon: Hourglass },
  held:     { el: 'Προς απελευθέρωση', en: 'To release',    bg: '#FEF3C7', color: '#92400E', icon: AlertCircle },
  released: { el: 'Πληρωμένη',         en: 'Paid',          bg: '#D1FAE5', color: '#065F46', icon: CheckCircle2 },
  refunded: { el: 'Επιστράφηκε',       en: 'Refunded',      bg: '#FEE2E2', color: '#991B1B', icon: X },
};

// ─── Translations ─────────────────────────────────────────────────────
const TX = {
  el: {
    roleBadge: 'Ασθενής',
    site: 'Site',
    backToSite: 'Επιστροφή στο site',
    signOut: 'Αποσύνδεση',
    loading: 'Φόρτωση...',
    welcome: (n) => `Καλώς ήρθατε, ${n}`,
    welcomeFallback: 'Ασθενής',
    welcomeSub: 'Διαχειριστείτε τα ραντεβού και τα αιτήματά σας.',
    tabAppointments: 'Τα Ραντεβού μου',
    tabRequests: 'Τα Αιτήματά μου',
    tabServices: 'Υπηρεσίες',
    tabProfile: 'Προφίλ',
    releaseBannerTitle: (n) => `Έχετε ${n} ${n === 1 ? 'συνεδρία' : 'συνεδρίες'} προς έγκριση`,
    releaseBannerDesc: (amt) => `Ο θεραπευτής δηλώνει ότι ολοκληρώθηκαν. Επιβεβαιώστε για να απελευθερωθεί η πληρωμή (${amt}€ συνολικά).`,
    statPending: 'Εκκρεμή',
    statActive: 'Ενεργά',
    statCompleted: 'Ολοκληρωμένα',
    statToRelease: 'Προς απελευθέρωση',
    ctaTitle: 'Θέλετε νέο ραντεβού;',
    ctaDesc: 'Κλείστε ραντεβού με έναν από τους θεραπευτές μας',
    ctaBtn: 'Νέο Αίτημα',
    nextAppointment: 'Επόμενο Ραντεβού',
    at: 'στις',
    awaitingTherapist: 'Αναμονή επιβεβαίωσης από τον θεραπευτή',
    cancelAppointment: 'Ακύρωση ραντεβού',
    cancel: 'Ακύρωση',
    noAppointments: 'Δεν έχετε ραντεβού ακόμα',
    bookFirst: 'Κλείστε το πρώτο σας ραντεβού',
    viewList: 'Λίστα',
    viewCalendar: 'Ημερολόγιο',
    upcoming: (n) => `Επερχόμενα Ραντεβού (${n})`,
    past: (n) => `Παλαιότερα Ραντεβού (${n})`,
    therapistSaysDone: 'Ο θεραπευτής δηλώνει ότι ολοκληρώθηκε',
    autoReleaseToday: 'Αυτόματη απελευθέρωση σήμερα',
    autoReleaseIn: (d) => `Αυτόματη απελευθέρωση σε ${d} μέρες`,
    release: 'Απελευθέρωση',
    prev: 'Προηγ.',
    next: 'Επόμ.',
    today: 'Σήμερα',
    hasAppointment: 'Έχει ραντεβού',
    noRequests: 'Δεν έχετε κάνει αίτημα ακόμα.',
    physiotherapy: 'Φυσιοθεραπεία',
    package: (n) => `Πακέτο ${n} συνεδριών`,
    pendingApproval: (n) => `${n} προς έγκριση`,
    total: 'Σύνολο',
    sessions: (n) => `Συνεδρίες (${n})`,
    yourReview: 'Η αξιολόγησή σας',
    cancelledByTherapist: 'Ακυρώθηκε από τον θεραπευτή',
    cancelledByYou: 'Ακυρώθηκε από εσάς',
    cancelledByAdmin: 'Ακυρώθηκε από την πλατφόρμα',
    cancelReason: 'Αιτιολογία:',
    noReason: 'Δεν δόθηκε αιτιολογία',
    reviewAfterCancel: 'Μπορείτε να αξιολογήσετε την εμπειρία σας παρόλο που το ραντεβού ακυρώθηκε.',
    howWasIt: (n) => `Πώς ήταν η εμπειρία σας με τον/την ${n};`,
    therapistFallback: 'θεραπευτή',
    leaveReview: 'Άφησε αξιολόγηση',
    servicesTitle: 'Υπηρεσίες Φυσιοθεραπείας',
    servicesDesc: 'Εξατομικευμένη φροντίδα για ένα εύρος παθήσεων.',
    noServices: 'Δεν υπάρχουν διαθέσιμες υπηρεσίες αυτή τη στιγμή.',
    bookAppointment: 'Κλείσε Ραντεβού',
    memberSince: 'Μέλος από',
    profileTitle: 'Στοιχεία Προφίλ',
    profileDesc: 'Ενημερώστε τα στοιχεία σας. Η διεύθυνση και ο ΤΚ απαιτούνται όταν κλείνετε ραντεβού.',
    fullName: 'Ονοματεπώνυμο',
    fullNamePh: 'Γιώργος Παπαδόπουλος',
    phone: 'Τηλέφωνο',
    phonePh: '+30 69...',
    area: 'Περιοχή',
    areaPh: 'π.χ. Παγκράτι',
    address: 'Διεύθυνση',
    addressPh: 'π.χ. Λεωφ. Κηφισίας 100',
    city: 'Πόλη',
    cityPh: 'π.χ. Αθήνα',
    postal: 'ΤΚ',
    postalPh: '11528',
    save: 'Αποθήκευση',
    saving: 'Αποθήκευση...',
    errNameRequired: 'Το ονοματεπώνυμο είναι υποχρεωτικό',
    errPrefix: 'Σφάλμα: ',
    profileSaved: 'Το προφίλ αποθηκεύτηκε επιτυχώς',
    releaseTitle: 'Επιβεβαίωση Πληρωμής',
    releaseDesc: (n) => `Επιβεβαιώνετε ότι έγινε η συνεδρία με τον/την ${n} και θέλετε να απελευθερωθεί η πληρωμή;`,
    releaseAmount: 'Ποσό προς απελευθέρωση',
    session: 'Συνεδρία',
    releaseWarnLabel: 'Προσοχή:',
    releaseWarn: 'Μετά την απελευθέρωση, η πληρωμή πηγαίνει στον θεραπευτή και δεν μπορεί να ανακληθεί. Πατήστε επιβεβαίωση μόνο εφόσον έχει πραγματοποιηθεί η συνεδρία.',
    releasing: 'Απελευθέρωση...',
    confirmRelease: 'Ναι, απελευθέρωση',
    reviewTitle: 'Αξιολόγηση Θεραπευτή',
    rating: 'Βαθμολογία',
    comment: 'Σχόλιο (προαιρετικό)',
    commentPh: 'Μοιραστείτε την εμπειρία σας...',
    dismiss: 'Άκυρο',
    submit: 'Υποβολή',
    submitting: 'Αποστολή...',
    errNoRating: 'Παρακαλώ επιλέξτε βαθμολογία.',
    errNoCompleted: 'Δεν υπάρχει ολοκληρωμένη συνεδρία ακόμα.',
    errSubmit: 'Σφάλμα υποβολής: ',
    unknown: 'Άγνωστος',
  },
  en: {
    roleBadge: 'Patient',
    site: 'Site',
    backToSite: 'Back to site',
    signOut: 'Sign out',
    loading: 'Loading...',
    welcome: (n) => `Welcome back, ${n}`,
    welcomeFallback: 'Patient',
    welcomeSub: 'Manage your appointments and requests.',
    tabAppointments: 'My Appointments',
    tabRequests: 'My Requests',
    tabServices: 'Services',
    tabProfile: 'Profile',
    releaseBannerTitle: (n) => `You have ${n} ${n === 1 ? 'session' : 'sessions'} to approve`,
    releaseBannerDesc: (amt) => `Your therapist marked them as done. Confirm to release the payment (${amt}€ in total).`,
    statPending: 'Pending',
    statActive: 'Active',
    statCompleted: 'Completed',
    statToRelease: 'To release',
    ctaTitle: 'Need a new appointment?',
    ctaDesc: 'Book a session with one of our therapists',
    ctaBtn: 'New Request',
    nextAppointment: 'Next Appointment',
    at: 'at',
    awaitingTherapist: 'Awaiting confirmation from your therapist',
    cancelAppointment: 'Cancel appointment',
    cancel: 'Cancel',
    noAppointments: "You don't have any appointments yet",
    bookFirst: 'Book your first appointment',
    viewList: 'List',
    viewCalendar: 'Calendar',
    upcoming: (n) => `Upcoming Appointments (${n})`,
    past: (n) => `Past Appointments (${n})`,
    therapistSaysDone: 'Your therapist marked this as completed',
    autoReleaseToday: 'Auto-release today',
    autoReleaseIn: (d) => `Auto-release in ${d} days`,
    release: 'Release',
    prev: 'Prev',
    next: 'Next',
    today: 'Today',
    hasAppointment: 'Has appointment',
    noRequests: "You haven't made a request yet.",
    physiotherapy: 'Physiotherapy',
    package: (n) => `Package of ${n} sessions`,
    pendingApproval: (n) => `${n} to approve`,
    total: 'Total',
    sessions: (n) => `Sessions (${n})`,
    yourReview: 'Your review',
    cancelledByTherapist: 'Cancelled by the therapist',
    cancelledByYou: 'Cancelled by you',
    cancelledByAdmin: 'Cancelled by the platform',
    cancelReason: 'Reason:',
    noReason: 'No reason given',
    reviewAfterCancel: 'You can still rate your experience even though the appointment was cancelled.',
    howWasIt: (n) => `How was your experience with ${n}?`,
    therapistFallback: 'your therapist',
    leaveReview: 'Leave a review',
    servicesTitle: 'Physiotherapy Services',
    servicesDesc: 'Personalized care for a range of conditions.',
    noServices: 'No services are available at the moment.',
    bookAppointment: 'Book Appointment',
    memberSince: 'Member since',
    profileTitle: 'Profile Details',
    profileDesc: 'Update your details. Address and postcode are required when booking an appointment.',
    fullName: 'Full Name',
    fullNamePh: 'John Smith',
    phone: 'Phone',
    phonePh: '+30 69...',
    area: 'Area',
    areaPh: 'e.g. Pangrati',
    address: 'Address',
    addressPh: 'e.g. 100 Kifisias Ave',
    city: 'City',
    cityPh: 'e.g. Athens',
    postal: 'Postcode',
    postalPh: '11528',
    save: 'Save',
    saving: 'Saving...',
    errNameRequired: 'Full name is required',
    errPrefix: 'Error: ',
    profileSaved: 'Your profile was saved successfully',
    releaseTitle: 'Confirm Payment',
    releaseDesc: (n) => `Do you confirm the session with ${n} took place and want to release the payment?`,
    releaseAmount: 'Amount to release',
    session: 'Session',
    releaseWarnLabel: 'Careful:',
    releaseWarn: 'Once released, the payment goes to the therapist and cannot be reversed. Only confirm if the session actually took place.',
    releasing: 'Releasing...',
    confirmRelease: 'Yes, release',
    reviewTitle: 'Rate Your Therapist',
    rating: 'Rating',
    comment: 'Comment (optional)',
    commentPh: 'Share your experience...',
    dismiss: 'Cancel',
    submit: 'Submit',
    submitting: 'Sending...',
    errNoRating: 'Please choose a rating.',
    errNoCompleted: 'There is no completed session yet.',
    errSubmit: 'Submission error: ',
    unknown: 'Unknown',
  },
};

// Το status ΔΕΝ έχει ποτέ σκέτο 'cancelled'. Το check constraint της βάσης
// επιτρέπει μόνο: cancelled_by_therapist | cancelled_by_patient |
// cancelled_by_admin. Έλεγχος με === 'cancelled' δεν ταιριάζει ΠΟΤΕ —
// γι' αυτό ακυρωμένα ραντεβού εμφανίζονταν ως ενεργά.
const isCancelled = (s) => String(s || '').startsWith('cancelled');

function Avatar({ name, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#2a6fdb,#1a2e44)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function Badge({ label, bg, color, icon: Icon }) {
  return (
    <span style={{ background: bg, color, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {Icon && <Icon size={12} strokeWidth={2.5} />}
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

function daysUntilAutoRelease(autoReleaseAt) {
  if (!autoReleaseAt) return null;
  const now = new Date();
  const target = new Date(autoReleaseAt);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export default function PatientDashboard() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;
  const loc = LOCALE[lang] || LOCALE.el;

  // Helpers που εξαρτώνται από τη γλώσσα
  function friendlyDateLabel(dateStr) {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T12:00:00');
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (lang === 'en') {
      if (diffDays === 0) return 'TODAY';
      if (diffDays === 1) return 'TOMORROW';
      if (diffDays === 2) return 'IN 2 DAYS';
      if (diffDays > 2 && diffDays <= 7) return `IN ${diffDays} DAYS`;
      if (diffDays > 7 && diffDays <= 14) return 'IN 1 WEEK';
      if (diffDays < 0) return 'PAST';
      return null;
    }

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
    if (lang === 'en') return `${DAYS.en[d.getDay()]} ${d.getDate()} ${MONTHS.en[d.getMonth()]}`;
    return `${DAYS.el[d.getDay()]} ${d.getDate()} ${MONTHS.el[d.getMonth()]}`;
  }

  function formatShortDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${DAYS_SHORT[lang][d.getDay()]} ${dd}/${mm}`;
  }

  function statusLabel(map, key, fallbackKey = 'pending') {
    // Χαρτογράφηση των cancelled_by_* στο ενιαίο 'cancelled' του map,
    // αλλιώς πέφτουν στο fallback και δείχνουν «Εκκρεμές».
    const k = isCancelled(key) ? 'cancelled' : key;
    const entry = map[k] || map[fallbackKey];
    return { ...entry, label: entry[lang] || entry.el };
  }

  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [appointmentsView, setAppointmentsView] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [releaseModal, setReleaseModal] = useState(null);
  const [releasing, setReleasing] = useState(false);

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

  const allAppointments = sessionRequests.flatMap(req =>
    req.bookings.map(b => ({ ...b, request: req, therapist: req.therapist }))
  );

  const sortedAppointments = [...allAppointments].sort((a, b) => {
    const aDate = a.session_date + 'T' + (a.session_time || '00:00');
    const bDate = b.session_date + 'T' + (b.session_time || '00:00');
    return aDate.localeCompare(bDate);
  });

  const now = new Date();

  const upcomingAppointments = sortedAppointments.filter(a => {
    if (isCancelled(a.status)) return false;
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

  function openReviewModal(request) {
    // Προτεραιότητα σε ολοκληρωμένη· αλλιώς ακύρωση από τον θεραπευτή.
    const target =
      request.bookings.find(b => b.status === 'completed') ||
      request.bookings.find(b => b.status === 'cancelled_by_therapist');

    if (!target) {
      alert(tx.errNoCompleted);
      return;
    }
    setReviewModal({
      request,
      booking_id: target.id,
      therapist_id: request.therapist_id,
      therapist_name: request.therapist?.name || tx.therapistFallback,
      wasCancelled: target.status === 'cancelled_by_therapist',
    });
    setReviewForm({ rating: 0, comment: '' });
  }

  async function submitReview() {
    if (!reviewForm.rating) {
      alert(tx.errNoRating);
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
      alert(tx.errSubmit + error.message);
      setSubmittingReview(false);
      return;
    }
    setReviewModal(null);
    setReviewForm({ rating: 0, comment: '' });
    await loadRequests(user.id);
    setSubmittingReview(false);
  }

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
      alert(tx.errPrefix + error.message);
      setReleasing(false);
      return;
    }

    await loadRequests(user.id);
    setReleasing(false);
    setReleaseModal(null);
  }

  async function saveProfile() {
    if (!editProfile.name.trim()) {
      setProfileMsg({ type: 'error', text: tx.errNameRequired });
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
      setProfileMsg({ type: 'error', text: tx.errPrefix + error.message });
      return;
    }

    setProfile({ ...profile, ...editProfile });
    setProfileMsg({ type: 'success', text: tx.profileSaved });
    setTimeout(() => setProfileMsg(null), 3000);
  }

  async function signOut() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const allBookings = sessionRequests.flatMap(r => r.bookings);
  const pendingCount = sessionRequests.filter(r => r.status === 'pending').length;
  const confirmedCount = sessionRequests.filter(r => r.status === 'confirmed' || r.status === 'accepted').length;
  const completedCount = sessionRequests.filter(r =>
    r.bookings.length > 0 &&
    r.bookings.every(b => b.status === 'completed' || isCancelled(b.status)) &&
    r.bookings.some(b => b.status === 'completed')
  ).length;

  const heldBookings = allBookings.filter(b => b.payment_status === 'held');
  const heldAmount = heldBookings.reduce((sum, b) => sum + parseFloat(b.session_amount || 0), 0);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 18, color: '#64748B' }}>{tx.loading}</div>
    </div>
  );

  const TABS = [
    { id: 'appointments', label: tx.tabAppointments, Icon: Calendar },
    { id: 'requests', label: tx.tabRequests, Icon: ClipboardList },
    { id: 'services', label: tx.tabServices, Icon: Stethoscope },
    { id: 'profile', label: tx.tabProfile, Icon: User },
  ];

  const profileInputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#0F172A' };

  function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const grid = [];
    let week = [];

    for (let i = 0; i < startDayOfWeek; i++) week.push(null);

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      week.push(dateStr);
      if (week.length === 7) { grid.push(week); week = []; }
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 700, color: '#1a2e44', textDecoration: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
          <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b', marginLeft: 8, background: '#f1f5f9', padding: '3px 12px', borderRadius: 999 }}>{tx.roleBadge}</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageSwitcher color="#64748b" hoverColor="#1a2e44" navHeight={64} />
          <a href="/"
            title={tx.backToSite}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #c8dff9', background: '#eaf2fc', color: '#2a6fdb', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} />
            {tx.site}
          </a>
          <Avatar name={profile?.name || user?.email} size={38} />
          <button onClick={signOut} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{tx.signOut}</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A' }}>
            {tx.welcome(profile?.name?.split(' ')[0] || tx.welcomeFallback)}
          </h1>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 4 }}>{tx.welcomeSub}</p>
        </div>

        {heldBookings.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #F59E0B', borderRadius: 14, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={28} color="#92400E" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                {tx.releaseBannerTitle(heldBookings.length)}
              </div>
              <div style={{ fontSize: 14, color: '#78350F', lineHeight: 1.5 }}>
                {tx.releaseBannerDesc(heldAmount.toFixed(2))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: tx.statPending, value: pendingCount, bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' },
            { label: tx.statActive, value: confirmedCount, bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8' },
            { label: tx.statCompleted, value: completedCount, bg: '#D1FAE5', border: '#BBF7D0', text: '#15803D' },
            ...(heldBookings.length > 0 ? [{ label: tx.statToRelease, value: `${heldAmount.toFixed(0)}€`, bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' }] : []),
          ].map(c => (
            <div key={c.label} style={{ flex: 1, minWidth: 140, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: c.text }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#1a2e44', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{tx.ctaTitle}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{tx.ctaDesc}</div>
          </div>
          <a href="/dashboard/patient/new-request" style={{ background: '#fff', color: '#1a2e44', padding: '12px 22px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {tx.ctaBtn}
            <ArrowRight size={16} />
          </a>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => {
            const TabIcon = t.Icon;
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: isActive ? '#fff' : 'transparent', color: isActive ? '#0F172A' : '#64748B', boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <TabIcon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ═══ APPOINTMENTS TAB ═══ */}
        {activeTab === 'appointments' && (
          <div>
            {nextAppointment && (() => {
              const friendly = friendlyDateLabel(nextAppointment.session_date);
              const fullDate = formatFullDate(nextAppointment.session_date);
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #1a2e44 0%, #2a6fdb 100%)',
                  borderRadius: 18, padding: '28px 32px', marginBottom: 24, color: '#fff',
                  boxShadow: '0 8px 32px rgba(26, 46, 68, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
                    {tx.nextAppointment}
                  </div>

                  {friendly && (
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '-.02em' }}>
                      {friendly}
                    </div>
                  )}

                  <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>{fullDate}</div>

                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
                    {tx.at} {nextAppointment.session_time?.slice(0, 5)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    {nextAppointment.therapist?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Stethoscope size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{nextAppointment.therapist.name}</span>
                        {nextAppointment.therapist.specialty && (
                          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>· {nextAppointment.therapist.specialty}</span>
                        )}
                      </div>
                    )}

                    {nextAppointment.request?.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MapPin size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 15 }}>
                          {nextAppointment.request.address}
                          {nextAppointment.request.area && `, ${nextAppointment.request.area}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {nextAppointment.status === 'pending' && (
                    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255, 204, 0, 0.15)', borderRadius: 10, fontSize: 13, color: '#FEF3C7', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} />
                      {tx.awaitingTherapist}
                    </div>
                  )}

                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <button
                      onClick={() => setCancelBookingId(nextAppointment.id)}
                      style={{
                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)',
                        color: 'rgba(255,255,255,0.9)', padding: '9px 20px', borderRadius: 30,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <XCircle size={14} />
                      {tx.cancelAppointment}
                    </button>
                  </div>
                </div>
              );
            })()}

            {!nextAppointment && upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <Calendar size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 16, marginBottom: 8 }}>{tx.noAppointments}</div>
                <a href="/dashboard/patient/new-request" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 15 }}>
                  {tx.bookFirst}
                  <ArrowRight size={15} />
                </a>
              </div>
            )}

            {(upcomingAppointments.length > 0 || pastAppointments.length > 0) && (
              <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 20 }}>
                <button onClick={() => setAppointmentsView('list')}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: appointmentsView === 'list' ? '#fff' : 'transparent', color: appointmentsView === 'list' ? '#0F172A' : '#64748B', boxShadow: appointmentsView === 'list' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <List size={15} />
                  {tx.viewList}
                </button>
                <button onClick={() => setAppointmentsView('calendar')}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: appointmentsView === 'calendar' ? '#fff' : 'transparent', color: appointmentsView === 'calendar' ? '#0F172A' : '#64748B', boxShadow: appointmentsView === 'calendar' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={15} />
                  {tx.viewCalendar}
                </button>
              </div>
            )}

            {appointmentsView === 'list' && (
              <>
                {upcomingAppointments.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ChevronRight size={16} color="#64748b" />
                      {tx.upcoming(upcomingAppointments.length)}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {upcomingAppointments.map(apt => {
                        const bSt = statusLabel(BOOKING_STATUS, apt.status);
                        const payStatus = apt.payment_status || 'pending';
                        const payInfo = statusLabel(PAYMENT_STATUS, payStatus);
                        const isHeld = apt.payment_status === 'held';
                        const daysLeft = isHeld ? daysUntilAutoRelease(apt.auto_release_at) : null;
                        const friendly = friendlyDateLabel(apt.session_date);

                        return (
                          <div key={apt.id} style={{
                            background: '#fff', borderRadius: 12,
                            border: isHeld ? '2px solid #F59E0B' : '1px solid #e2e8f0',
                            padding: '18px 20px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 110 }}>
                                {friendly ? (
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2a6fdb', marginBottom: 2 }}>{friendly}</div>
                                ) : null}
                                <div style={{ fontSize: 15, color: '#0F172A', fontWeight: 600 }}>{formatShortDate(apt.session_date)}</div>
                                <div style={{ fontSize: 17, color: '#0F172A', fontWeight: 700, marginTop: 2 }}>{apt.session_time?.slice(0, 5)}</div>
                              </div>

                              <div style={{ flex: 1, minWidth: 200 }}>
                                {apt.therapist?.name && (
                                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Stethoscope size={15} color="#2a6fdb" />
                                    {apt.therapist.name}
                                  </div>
                                )}
                                {apt.request?.address && (
                                  <div style={{ fontSize: 14, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <MapPin size={13} />
                                    {apt.request.address}, {apt.request.area}
                                  </div>
                                )}
                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                                  {apt.status === 'completed' && (
                                    <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                  )}

                                  {apt.status !== 'completed' && !isCancelled(apt.status) && (
                                    <button
                                      onClick={() => setCancelBookingId(apt.id)}
                                      style={{
                                        marginLeft: 'auto', background: 'transparent', border: '1px solid #e2e8f0',
                                        color: '#64748B', padding: '5px 14px', borderRadius: 30, fontSize: 12.5,
                                        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                      }}
                                    >
                                      <XCircle size={13} />
                                      {tx.cancel}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isHeld && (
                              <div style={{ marginTop: 14, padding: 14, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 }}>
                                <div style={{ fontSize: 14, color: '#92400E', fontWeight: 600, marginBottom: 4 }}>
                                  {tx.therapistSaysDone}
                                </div>
                                {daysLeft !== null && (
                                  <div style={{ fontSize: 13, color: '#78350F', marginBottom: 12 }}>
                                    {daysLeft === 0 ? tx.autoReleaseToday : tx.autoReleaseIn(daysLeft)}
                                  </div>
                                )}
                                <button onClick={() => openReleaseModal(apt, apt.request)}
                                  style={{
                                    padding: '11px 22px', borderRadius: 30, border: 'none', background: '#15803D',
                                    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                                  }}>
                                  <CheckCircle2 size={16} strokeWidth={2.5} />
                                  {tx.release} {parseFloat(apt.session_amount || 0).toFixed(2)}€
                                </button>
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
                      {tx.past(pastAppointments.length)}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pastAppointments.map(apt => {
                        const bSt = statusLabel(BOOKING_STATUS, apt.status);
                        const payStatus = apt.payment_status || 'pending';
                        const payInfo = statusLabel(PAYMENT_STATUS, payStatus);

                        return (
                          <div key={apt.id} style={{
                            background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0',
                            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                          }}>
                            <div style={{ minWidth: 100 }}>
                              <div style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{formatShortDate(apt.session_date)}</div>
                              <div style={{ fontSize: 13, color: '#94A3B8' }}>{tx.at} {apt.session_time?.slice(0, 5)}</div>
                            </div>

                            <div style={{ flex: 1, minWidth: 150 }}>
                              {apt.therapist?.name && (
                                <div style={{ fontSize: 14, color: '#475569' }}>{apt.therapist.name}</div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                              {apt.status === 'completed' && payStatus !== 'pending' && (
                                <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                              )}
                            </div>

                            {isCancelled(apt.status) && apt.cancelled_reason && (
                              <div style={{ width: '100%', paddingTop: 8, marginTop: 4, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#9F1239' }}>
                                {apt.status === 'cancelled_by_therapist' ? tx.cancelledByTherapist
                                  : apt.status === 'cancelled_by_patient' ? tx.cancelledByYou
                                  : tx.cancelledByAdmin}
                                {' · '}
                                <span style={{ fontStyle: 'italic', color: '#78350F' }}>{apt.cancelled_reason}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {appointmentsView === 'calendar' && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <button onClick={() => navigateMonth(-1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                    <ChevronLeft size={16} />
                    {tx.prev}
                  </button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>
                    {MONTHS_FULL[lang][calendarMonth.month]} {calendarMonth.year}
                  </div>
                  <button onClick={() => navigateMonth(1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                    {tx.next}
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                  {DAYS_GRID[lang].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748B', padding: 6 }}>{d}</div>
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
                        onClick={() => hasApts && setSelectedAppointment({ date: dateStr, appointments: dayApts })}
                        style={{
                          minHeight: 70, padding: '6px 8px',
                          background: isToday ? '#EFF6FF' : hasApts ? '#F0FDF4' : '#fff',
                          border: `1px solid ${isToday ? '#2a6fdb' : hasApts ? '#86EFAC' : '#f1f5f9'}`,
                          borderRadius: 8, cursor: hasApts ? 'pointer' : 'default',
                          opacity: isPast && !hasApts ? 0.5 : 1, transition: 'all .15s',
                        }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? '#2a6fdb' : '#0F172A', marginBottom: 4 }}>{day}</div>
                        {dayApts.slice(0, 2).map((a, i) => (
                          <div key={i} style={{
                            fontSize: 10,
                            background: isCancelled(a.status) ? '#FEE2E2' : a.status === 'completed' ? '#EDE9FE' : '#DBEAFE',
                            color: isCancelled(a.status) ? '#9F1239' : a.status === 'completed' ? '#5B21B6' : '#1D4ED8',
                            padding: '2px 5px', borderRadius: 4, marginBottom: 2, fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {a.session_time?.slice(0, 5)}
                          </div>
                        ))}
                        {dayApts.length > 2 && (
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>+{dayApts.length - 2}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 14, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#EFF6FF', border: '1px solid #2a6fdb', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />{tx.today}</span>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />{tx.hasAppointment}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ REQUESTS TAB ═══ */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessionRequests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 15 }}>
                {tx.noRequests}<br />
                <a href="/dashboard/patient/new-request" style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {tx.bookFirst}
                  <ArrowRight size={14} />
                </a>
              </div>
            ) : sessionRequests.map(req => {
              const st = statusLabel(STATUS_MAP, req.status);
              const hasCompletedBooking = req.bookings.some(b => b.status === 'completed');
              // Αν ο θεραπευτής ακύρωσε, ο ασθενής εξακολουθεί να έχει
              // εμπειρία να μοιραστεί — και είναι η πιο χρήσιμη
              // πληροφορία για τους επόμενους ασθενείς.
              const cancelledByTherapist = req.bookings.find(b => b.status === 'cancelled_by_therapist');
              const canReview = (hasCompletedBooking || !!cancelledByTherapist) && !req.review;
              const reqHeldBookings = req.bookings.filter(b => b.payment_status === 'held');

              return (
                <div key={req.id} style={{ background: '#fff', borderRadius: 14, border: reqHeldBookings.length > 0 ? '2px solid #F59E0B' : '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{req.problem_type || tx.physiotherapy}</span>
                      <Badge label={st.label} bg={st.bg} color={st.color} />
                      {req.session_type === 'package' && (
                        <span style={{ background: '#EDE9FE', color: '#5B21B6', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          {tx.package(req.package_size)}
                        </span>
                      )}
                      {reqHeldBookings.length > 0 && (
                        <Badge label={tx.pendingApproval(reqHeldBookings.length)} bg="#FEF3C7" color="#92400E" icon={AlertCircle} />
                      )}
                      <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 'auto' }}>{new Date(req.created_at).toLocaleDateString(loc)}</span>
                    </div>

                    {req.therapist?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Avatar name={req.therapist.name} size={32} />
                        <div>
                          <div style={{ fontSize: 15, color: '#1a2e44', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Stethoscope size={14} color="#2a6fdb" />
                            {req.therapist.name}
                          </div>
                          {req.therapist.specialty && (
                            <div style={{ fontSize: 13, color: '#64748B' }}>{req.therapist.specialty}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {req.address && (
                      <div style={{ fontSize: 14, color: '#64748B', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} />
                        {req.address}, {req.area}
                      </div>
                    )}
                    {req.total_cost && (
                      <div style={{ fontSize: 14, color: '#15803D', fontWeight: 600, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Euro size={13} strokeWidth={2.5} />
                        {tx.total}: {req.total_cost}€
                      </div>
                    )}
                    {req.problem_description && <div style={{ fontSize: 14, color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #cbd5e1', marginTop: 6 }}>{req.problem_description}</div>}
                  </div>

                  {req.bookings.length > 0 && (
                    <div style={{ padding: '0 20px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} />
                        {tx.sessions(req.bookings.length)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {req.bookings.map((b, i) => {
                          const bSt = statusLabel(BOOKING_STATUS, b.status);
                          const d = new Date(b.session_date + 'T12:00:00');
                          const payStatus = b.payment_status || 'pending';
                          const payInfo = statusLabel(PAYMENT_STATUS, payStatus);
                          const daysLeft = b.payment_status === 'held' ? daysUntilAutoRelease(b.auto_release_at) : null;
                          const isHeld = b.payment_status === 'held';

                          return (
                            <div key={b.id} style={{
                              display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 14px',
                              background: isHeld ? '#FFFBEB' : isCancelled(b.status) ? '#FFF1F2' : '#f8fafc',
                              borderRadius: 8, fontSize: 14,
                              border: isHeld ? '1px solid #FDE68A' : isCancelled(b.status) ? '1px solid #FECDD3' : 'none',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>{i + 1}.</span>
                                <span style={{ color: '#0F172A', fontWeight: 500 }}>
                                  {DAYS_SHORT[lang][d.getDay()]} {d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' })} {tx.at} {b.session_time?.slice(0, 5)}
                                </span>
                                <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                                {b.status === 'completed' && (
                                  <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                )}
                              </div>

                              {/* ΛΟΓΟΣ ΑΚΥΡΩΣΗΣ — ο ασθενής δικαιούται να ξέρει
                                  γιατί χάθηκε το ραντεβού του. */}
                              {isCancelled(b.status) && (
                                <div style={{ paddingTop: 8, borderTop: '1px solid #e2e8f0', fontSize: 12.5, color: '#9F1239', lineHeight: 1.6 }}>
                                  <strong>
                                    {b.status === 'cancelled_by_therapist' ? tx.cancelledByTherapist
                                      : b.status === 'cancelled_by_patient' ? tx.cancelledByYou
                                      : tx.cancelledByAdmin}
                                  </strong>
                                  <div style={{ marginTop: 3, color: '#78350F' }}>
                                    {tx.cancelReason}{' '}
                                    {b.cancelled_reason
                                      ? <span style={{ fontStyle: 'italic' }}>{b.cancelled_reason}</span>
                                      : <span style={{ color: '#94a3b8' }}>{tx.noReason}</span>}
                                  </div>
                                </div>
                              )}

                              {isHeld && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 8, borderTop: '1px solid #FDE68A', flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600, marginBottom: 2 }}>
                                      {tx.therapistSaysDone}
                                    </div>
                                    {daysLeft !== null && (
                                      <div style={{ fontSize: 12, color: '#78350F' }}>
                                        {daysLeft === 0 ? tx.autoReleaseToday : tx.autoReleaseIn(daysLeft)}
                                      </div>
                                    )}
                                  </div>
                                  <button onClick={() => openReleaseModal(b, req)}
                                    style={{
                                      padding: '10px 20px', borderRadius: 30, border: 'none', background: '#15803D',
                                      color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                                      display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                                    }}>
                                    <CheckCircle2 size={15} strokeWidth={2.5} />
                                    {tx.release} {parseFloat(b.session_amount || 0).toFixed(2)}€
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
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.05em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} strokeWidth={3} />
                          {tx.yourReview}
                        </span>
                        <Stars rating={req.review.rating} size={16} />
                      </div>
                      {req.review.comment && (
                        <p style={{ fontSize: 14, color: '#78350F', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{req.review.comment}</p>
                      )}
                    </div>
                  ) : canReview ? (
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 14, color: '#475569' }}>
                        {tx.howWasIt(req.therapist?.name || tx.therapistFallback)}
                        {cancelledByTherapist && (
                          <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>
                            {tx.reviewAfterCancel}
                          </div>
                        )}
                      </div>
                      <button onClick={() => openReviewModal(req)}
                        style={{ padding: '10px 20px', borderRadius: 30, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                        <Star size={14} fill="#fff" strokeWidth={0} />
                        {tx.leaveReview}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ SERVICES TAB ═══ */}
        {activeTab === 'services' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{tx.servicesTitle}</h2>
              <p style={{ fontSize: 14, color: '#64748B' }}>{tx.servicesDesc}</p>
            </div>

            {services.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 14 }}>
                {tx.noServices}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {services.map(s => {
                  const title = (lang === 'en' ? (s.title_en || s.title_el) : s.title_el);
                  const desc = (lang === 'en' ? (s.desc_en || s.desc_el) : s.desc_el);
                  return (
                    <div key={s.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Stethoscope size={22} color="#2a6fdb" strokeWidth={2} />
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{title}</h3>
                      </div>
                      {desc && (
                        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{desc}</p>
                      )}
                      <a href="/dashboard/patient/new-request" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', background: '#1a2e44', color: '#fff', padding: '11px 18px', borderRadius: 25, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                        {tx.bookAppointment}
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ PROFILE TAB ═══ */}
        {activeTab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
              <Avatar name={editProfile.name || user?.email} size={64} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 21, fontWeight: 700, color: '#0F172A' }}>{editProfile.name || '—'}</div>
                <div style={{ fontSize: 15, color: '#64748B', wordBreak: 'break-word' }}>{user?.email}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                  {tx.memberSince} {user?.created_at ? new Date(user.created_at).toLocaleDateString(loc) : '—'}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{tx.profileTitle}</h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>{tx.profileDesc}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>{tx.fullName} *</label>
                <input value={editProfile.name} onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))} style={profileInputStyle} placeholder={tx.fullNamePh} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>{tx.phone}</label>
                  <input value={editProfile.phone} onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))} style={profileInputStyle} placeholder={tx.phonePh} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>{tx.area}</label>
                  <input value={editProfile.area} onChange={e => setEditProfile(p => ({ ...p, area: e.target.value }))} style={profileInputStyle} placeholder={tx.areaPh} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>{tx.address}</label>
                <input value={editProfile.address} onChange={e => setEditProfile(p => ({ ...p, address: e.target.value }))} style={profileInputStyle} placeholder={tx.addressPh} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>{tx.city}</label>
                  <input value={editProfile.city} onChange={e => setEditProfile(p => ({ ...p, city: e.target.value }))} style={profileInputStyle} placeholder={tx.cityPh} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2e44', display: 'block', marginBottom: 5 }}>{tx.postal}</label>
                  <input value={editProfile.postal_code} onChange={e => setEditProfile(p => ({ ...p, postal_code: e.target.value }))} style={profileInputStyle} placeholder={tx.postalPh} />
                </div>
              </div>

              {profileMsg && (
                <div style={{
                  background: profileMsg.type === 'success' ? '#D1FAE5' : '#FEF2F2',
                  border: `1px solid ${profileMsg.type === 'success' ? '#86EFAC' : '#FECACA'}`,
                  borderRadius: 8, padding: '12px 16px', fontSize: 14,
                  color: profileMsg.type === 'success' ? '#15803D' : '#DC2626',
                  fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
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
                    background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30,
                    fontSize: 15, fontWeight: 600, border: 'none',
                    cursor: savingProfile ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: savingProfile ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Save size={16} />
                  {savingProfile ? tx.saving : tx.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar day-detail modal */}
      {selectedAppointment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedAppointment(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 0, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{formatFullDate(selectedAppointment.date)}</h2>
              <button onClick={() => setSelectedAppointment(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedAppointment.appointments.map(apt => {
                const bSt = statusLabel(BOOKING_STATUS, apt.status);
                return (
                  <div key={apt.id} style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                      {tx.at} {apt.session_time?.slice(0, 5)}
                    </div>
                    {apt.therapist?.name && (
                      <div style={{ fontSize: 14, color: '#475569', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Stethoscope size={14} color="#2a6fdb" />
                        {apt.therapist.name}
                      </div>
                    )}
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

      {/* RELEASE PAYMENT MODAL */}
      {releaseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setReleaseModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Wallet size={30} color="#15803D" strokeWidth={2.2} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 12, textAlign: 'center' }}>{tx.releaseTitle}</h2>
            <p style={{ fontSize: 15, color: '#64748B', marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
              {tx.releaseDesc(releaseModal.request?.therapist?.name || tx.therapistFallback)}
            </p>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '18px 22px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                {tx.releaseAmount}
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: '#15803D' }}>
                {parseFloat(releaseModal.booking?.session_amount || 0).toFixed(2)}€
              </div>
              {releaseModal.booking?.session_date && (
                <div style={{ fontSize: 13, color: '#15803D', marginTop: 6 }}>
                  {tx.session}: {new Date(releaseModal.booking.session_date + 'T12:00:00').toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' })} {tx.at} {releaseModal.booking.session_time?.slice(0, 5)}
                </div>
              )}
            </div>

            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={16} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>{tx.releaseWarnLabel}</strong> {tx.releaseWarn}</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReleaseModal(null)} disabled={releasing}
                style={{ flex: 1, padding: '14px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 15, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {tx.dismiss}
              </button>
              <button onClick={confirmRelease} disabled={releasing}
                style={{ flex: 2, padding: '14px', borderRadius: 30, border: 'none', background: releasing ? '#94a3b8' : '#15803D', color: '#fff', fontSize: 15, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                <CheckCircle2 size={16} strokeWidth={2.5} />
                {releasing ? tx.releasing : tx.confirmRelease}
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
            <h2 style={{ fontSize: 21, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{tx.reviewTitle}</h2>
            <p style={{ fontSize: 15, color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>
              {tx.howWasIt(reviewModal.therapist_name)}
            </p>

            <div style={{ marginBottom: 20, padding: '16px 20px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>{tx.rating} *</div>
              <Stars rating={reviewForm.rating} onChange={r => setReviewForm(p => ({ ...p, rating: r }))} size={36} />
              {reviewForm.rating > 0 && (
                <div style={{ fontSize: 13, color: '#92400E', marginTop: 8 }}>
                  {RATING_WORDS[lang][reviewForm.rating]}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: 8 }}>{tx.comment}</label>
              <textarea rows={4} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                placeholder={tx.commentPh}
                maxLength={500}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#0F172A' }} />
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{reviewForm.comment.length}/500</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReviewModal(null)} disabled={submittingReview}
                style={{ flex: 1, padding: '13px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 15, fontWeight: 600, cursor: submittingReview ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {tx.dismiss}
              </button>
              <button onClick={submitReview} disabled={!reviewForm.rating || submittingReview}
                style={{ flex: 2, padding: '13px', borderRadius: 30, border: 'none', background: reviewForm.rating ? '#F59E0B' : '#e2e8f0', color: reviewForm.rating ? '#fff' : '#94a3b8', fontSize: 15, fontWeight: 600, cursor: reviewForm.rating ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                <Star size={15} fill={reviewForm.rating ? '#fff' : '#94a3b8'} strokeWidth={0} />
                {submittingReview ? tx.submitting : tx.submit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ακύρωσης */}
      {cancelBookingId && (
        <CancelBookingModal
          bookingId={cancelBookingId}
          onClose={() => setCancelBookingId(null)}
          onDone={() => {
            setCancelBookingId(null);
            init();
          }}
        />
      )}
    </div>
  );
}