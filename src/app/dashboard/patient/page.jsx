'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CancelBookingModal from '@/components/CancelBookingModal';
import { useRouter } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RescheduleModal from '@/components/RescheduleModal';
import { C, R as RAD, T, F, MAX_WIDTH, card, btn, badge, input as inputStyle } from '@/lib/tokens';
import ReportModal from '@/components/ReportModal';
import { ClipboardList, Stethoscope, User, MapPin, Euro, Calendar, Star, Check, ArrowRight, Save, X, Hourglass, Wallet, AlertCircle, CheckCircle2, CalendarDays, List, ChevronLeft, ChevronRight, Clock, XCircle, Globe, CalendarClock, Home, UserX} from 'lucide-react';

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
  pending:   { el: 'Εκκρεμεί',       en: 'Pending',   bg: C.warnBg, color: C.warn },
  confirmed: { el: 'Επιβεβαιωμένο',  en: 'Confirmed', bg: C.successBg, color: C.success },
  accepted:  { el: 'Επιβεβαιωμένο',  en: 'Confirmed', bg: C.successBg, color: C.success },
  declined:  { el: 'Απορρίφθηκε',    en: 'Declined',  bg: C.dangerBg, color: C.danger },
  rejected:  { el: 'Απορρίφθηκε',    en: 'Rejected',  bg: C.dangerBg, color: C.danger },
  completed: { el: 'Ολοκληρώθηκε',   en: 'Completed', bg: C.infoBg, color: C.info },
  cancelled: { el: 'Ακυρώθηκε',      en: 'Cancelled', bg: C.borderSoft, color: C.textMuted },
  expired:   { el: 'Έληξε',           en: 'Expired',   bg: C.borderSoft, color: C.textMuted },
};

const BOOKING_STATUS = {
  pending:   { el: 'Εκκρεμεί',       en: 'Pending',   bg: C.warnBg, color: C.warn },
  confirmed: { el: 'Επιβεβαιωμένο',  en: 'Confirmed', bg: C.infoBg, color: C.info },
  completed: { el: 'Ολοκληρώθηκε',   en: 'Completed', bg: C.successBg, color: C.success },
  cancelled: { el: 'Ακυρώθηκε',      en: 'Cancelled', bg: C.borderSoft, color: C.textMuted },
};

const PAYMENT_STATUS = {
  pending:  { el: 'Σε αναμονή',        en: 'Awaiting',      bg: C.borderSoft, color: C.textBody, icon: Hourglass },
  held:     { el: 'Προς απελευθέρωση', en: 'To release',    bg: C.warnBg, color: C.warn, icon: AlertCircle },
  released: { el: 'Πληρωμένη',         en: 'Paid',          bg: C.successBg, color: C.success, icon: CheckCircle2 },
  refunded: { el: 'Επιστράφηκε',       en: 'Refunded',      bg: C.dangerBg, color: C.danger, icon: X },
};

// ─── Translations ─────────────────────────────────────────────────────
// ΟΡΟΛΟΓΙΑ (ίδια σε ΟΛΟ το προϊόν):
//   Αίτημα → Επιβεβαιωμένο ραντεβού → Ολοκληρωμένη συνεδρία → Αξιολόγηση
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
    tabAppointments: 'Ραντεβού',
    tabRequests: 'Αιτήματα',
    tabServices: 'Υπηρεσίες',
    tabProfile: 'Προφίλ',
    tabsHintRequests: 'Αιτήματα = περιμένουν απάντηση από τον θεραπευτή.',
    tabsHintAppointments: 'Ραντεβού = έχουν επιβεβαιωθεί από τον θεραπευτή.',
    releaseBannerTitle: (n) => `Έχετε ${n} ${n === 1 ? 'συνεδρία' : 'συνεδρίες'} προς έγκριση`,
    releaseBannerDesc: (amt) => `Ο θεραπευτής δηλώνει ότι ολοκληρώθηκαν. Επιβεβαιώστε για να απελευθερωθεί η πληρωμή (${amt}€ συνολικά).`,
    statPending: 'Εκκρεμή αιτήματα',
    statActive: 'Επιβεβαιωμένα',
    statCompleted: 'Ολοκληρωμένα',
    statToRelease: 'Προς απελευθέρωση',
    ctaTitle: 'Χρειάζεστε φυσικοθεραπεία;',
    ctaDesc: 'Βρείτε θεραπευτή και κλείστε ραντεβού στο σπίτι σας',
    ctaBtn: 'Κλείσε ραντεβού',
    nextAppointment: 'Το επόμενο ραντεβού σου',
    withTherapist: 'με τον/την',
    atHome: 'στο σπίτι σου',
    at: 'στις',
    awaitingTherapist: 'Αναμονή επιβεβαίωσης από τον θεραπευτή',
    cancelAppointment: 'Ακύρωση ραντεβού',
    noShow: 'Δεν ήρθε',
    reportIssue: 'Αναφορά',
    reschedule: 'Αλλαγή ώρας',
    reschedulePending: 'Εκκρεμεί πρόταση αλλαγής',
    reschedulePendingYours: 'Στείλατε πρόταση αλλαγής',
    rescheduleReview: 'Δείτε την πρόταση',
    rescheduleTo: (d) => `Προτεινόμενη νέα ώρα: ${d}`,
    cancel: 'Ακύρωση',
    noAppointments: 'Δεν έχετε ραντεβού ακόμα',
    bookFirst: 'Κλείσε το πρώτο σου ραντεβού',
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
    noRequests: 'Δεν έχετε στείλει αίτημα ακόμα.',
    deadEndRejected: 'Ο θεραπευτής δεν είναι διαθέσιμος για αυτό το ραντεβού.',
    deadEndExpired: 'Ο θεραπευτής δεν απάντησε εγκαίρως.',
    deadEndAction: 'Δείτε άλλους διαθέσιμους θεραπευτές — τα στοιχεία σας είναι ήδη συμπληρωμένα.',
    deadEndBtn: 'Δες άλλους θεραπευτές',
    matchesTitle: (n) => n === 1 ? 'Βρήκαμε 1 διαθέσιμο θεραπευτή' : `Βρήκαμε ${n} διαθέσιμους θεραπευτές`,
    matchesToday: 'που μπορούν σήμερα',
    matchesPick: 'Επίλεξε',
    today: 'Σήμερα',
    deadlineLabel: 'Απάντηση έως',
    deadlineLeft: (t) => `Απομένουν ${t}`,
    deadlinePassed: 'Η προθεσμία πέρασε',
    sameDayTag: 'Αυθημερόν',
    physiotherapy: 'Φυσικοθεραπεία',
    pendingApproval: (n) => `${n} προς έγκριση`,
    total: 'Κόστος συνεδρίας',
    sessions: (n) => `Συνεδρίες (${n})`,
    yourReview: 'Η αξιολόγησή σας',
    cancelledByTherapist: 'Ακυρώθηκε από τον θεραπευτή',
    reviewVerifiedNote: 'Η αξιολόγησή σας θα φέρει την ένδειξη «Από επαληθευμένη συνεδρία».',
    verifiedSession: 'Από επαληθευμένη συνεδρία',
    cancelledByYou: 'Ακυρώθηκε από εσάς',
    cancelledByAdmin: 'Ακυρώθηκε από την πλατφόρμα',
    cancelReason: 'Αιτιολογία:',
    noReason: 'Δεν δόθηκε αιτιολογία',
    reviewAfterCancel: 'Μπορείτε να αξιολογήσετε την εμπειρία σας παρόλο που το ραντεβού ακυρώθηκε.',
    howWasIt: (n) => `Πώς ήταν η εμπειρία σας με τον/την ${n};`,
    therapistFallback: 'θεραπευτή',
    leaveReview: 'Άφησε αξιολόγηση',
    servicesTitle: 'Υπηρεσίες Φυσικοθεραπείας',
    servicesDesc: 'Εξατομικευμένη φροντίδα για ένα εύρος παθήσεων.',
    noServices: 'Δεν υπάρχουν διαθέσιμες υπηρεσίες αυτή τη στιγμή.',
    bookAppointment: 'Κλείσε ραντεβού',
    memberSince: 'Μέλος από',
    profileTitle: 'Στοιχεία Προφίλ',
    profileBasics: 'Βασικά στοιχεία',
    profileBasicsDesc: 'Πώς θα σας βρει ο θεραπευτής.',
    profileAddress: 'Διεύθυνση για τα ραντεβού',
    profileAddressDesc: 'Συμπληρώνεται αυτόματα όταν κλείνετε ραντεβού. Μπορείτε να την αλλάξετε εδώ οποτεδήποτε.',
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
    tabAppointments: 'Appointments',
    tabRequests: 'Requests',
    tabServices: 'Services',
    tabProfile: 'Profile',
    tabsHintRequests: 'Requests = waiting for the therapist to respond.',
    tabsHintAppointments: 'Appointments = confirmed by the therapist.',
    releaseBannerTitle: (n) => `You have ${n} ${n === 1 ? 'session' : 'sessions'} to approve`,
    releaseBannerDesc: (amt) => `Your therapist marked them as done. Confirm to release the payment (${amt}€ in total).`,
    statPending: 'Pending requests',
    statActive: 'Confirmed',
    statCompleted: 'Completed',
    statToRelease: 'To release',
    ctaTitle: 'Need physiotherapy?',
    ctaDesc: 'Find a therapist and book a session at your home',
    ctaBtn: 'Book an appointment',
    nextAppointment: 'Your next appointment',
    withTherapist: 'with',
    atHome: 'at your home',
    at: 'at',
    awaitingTherapist: 'Awaiting confirmation from your therapist',
    cancelAppointment: 'Cancel appointment',
    noShow: 'Did not come',
    reportIssue: 'Report',
    reschedule: 'Change time',
    reschedulePending: 'Reschedule proposal pending',
    reschedulePendingYours: 'You sent a reschedule proposal',
    rescheduleReview: 'Review the proposal',
    rescheduleTo: (d) => `Proposed new time: ${d}`,
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
    noRequests: "You haven't sent a request yet.",
    deadEndRejected: 'This therapist is not available for that appointment.',
    deadEndExpired: 'The therapist did not reply in time.',
    deadEndAction: 'See other available therapists — your details are already filled in.',
    deadEndBtn: 'See other therapists',
    matchesTitle: (n) => n === 1 ? 'We found 1 available therapist' : `We found ${n} available therapists`,
    matchesToday: 'available today',
    matchesPick: 'Choose',
    today: 'Today',
    deadlineLabel: 'Reply by',
    deadlineLeft: (t) => `${t} left`,
    deadlinePassed: 'The deadline has passed',
    sameDayTag: 'Same day',
    physiotherapy: 'Physiotherapy',
    pendingApproval: (n) => `${n} to approve`,
    total: 'Session cost',
    sessions: (n) => `Sessions (${n})`,
    yourReview: 'Your review',
    cancelledByTherapist: 'Cancelled by the therapist',
    reviewVerifiedNote: 'Your review will be labelled "From a verified session".',
    verifiedSession: 'From a verified session',
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
    bookAppointment: 'Book appointment',
    memberSince: 'Member since',
    profileTitle: 'Profile Details',
    profileBasics: 'Basic details',
    profileBasicsDesc: 'How your therapist reaches you.',
    profileAddress: 'Address for appointments',
    profileAddressDesc: 'Filled in automatically when you book. You can change it here any time.',
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
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},${C.brand})`, color: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function Badge({ label, bg, color, icon: Icon }) {
  return (
    <span style={{ background: bg, color, padding: '4px 12px', borderRadius: RAD.pill, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
          fill={i <= rating ? C.warn : 'none'}
          color={i <= rating ? C.warn : C.border}
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
    // αλλιώς πέφτουν στο fallback και δείχνουν «Εκκρεμεί».
    const k = isCancelled(key) ? 'cancelled' : key;
    const entry = map[k] || map[fallbackKey];
    return { ...entry, label: entry[lang] || entry.el };
  }

  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [reschedules, setReschedules] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);

  const [rematches, setRematches] = useState({});
  const [reportTarget, setReportTarget] = useState(null);
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

    // ΠΡΟΤΑΣΕΙΣ ΓΙΑ ΤΑ ΑΔΙΕΞΟΔΑ.
    // Το email λήξης δίνει ήδη τρεις συγκεκριμένους θεραπευτές. Χωρίς
    // αυτό, η ίδια η εφαρμογή θα ήταν λιγότερο χρήσιμη από το email της.
    const deadEnds = reqs.filter(r => ['declined', 'rejected', 'expired'].includes(r.status));
    const matchMap = {};
    await Promise.all(deadEnds.slice(0, 5).map(async (r) => {
      const { data } = await supabase.rpc('rematch_therapists', { p_request_id: r.id, p_limit: 3 });
      if (data && data.length) matchMap[r.id] = data;
    }));
    setRematches(matchMap);

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

    // Εκκρεμείς προτάσεις αλλαγής ώρας
    let rescheduleRows = [];
    if (bookingIds.length > 0) {
      const { data: rs } = await supabase
        .from('reschedule_requests')
        .select('*')
        .in('booking_id', bookingIds)
        .eq('status', 'pending');
      rescheduleRows = rs || [];
    }
    setReschedules(rescheduleRows);

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

  // Εκκρεμής πρόταση αλλαγής για συγκεκριμένο ραντεβού
  const pendingReschedule = (bookingId) =>
    reschedules.find(r => r.booking_id === bookingId && r.status === 'pending') || null;

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.page }}>
      <div style={{ fontSize: 18, color: C.textMuted }}>{tx.loading}</div>
    </div>
  );

  // Τα badges λένε στον χρήστη πού υπάρχει κάτι να δει, χωρίς να
  // χρειαστεί να ανοίξει κάθε tab.
  const TABS = [
    { id: 'appointments', label: tx.tabAppointments, Icon: Calendar, count: upcomingAppointments.length },
    { id: 'requests', label: tx.tabRequests, Icon: ClipboardList, count: pendingCount },
    { id: 'services', label: tx.tabServices, Icon: Stethoscope, count: 0 },
    { id: 'profile', label: tx.tabProfile, Icon: User, count: 0 },
  ];

  const profileInputStyle = { width: '100%', padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: C.text };
  const profileLabelStyle = { fontSize: 13, fontWeight: 600, color: C.brand, display: 'block', marginBottom: 5 };
  const sectionTitleStyle = { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 };
  const sectionDescStyle = { fontSize: 13, color: C.textMuted, marginBottom: 14 };

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
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: F.sans }}>
      <style>{`
        /* ΚΑΜΙΑ ΠΛΑΓΙΑ ΚΥΛΙΣΗ.
           Αρκεί ένα στοιχείο να ξεπεράσει το πλάτος για να
           εμφανιστεί κενό δεξιά σε όλη τη σελίδα. */
        html, body { max-width: 100%; overflow-x: hidden; }
        * { min-width: 0; }
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* OVERFLOW ΣΕ ΚΙΝΗΤΟ.
          Το header είχε σταθερό ύψος και δεν τύλιγε: σε 382px τα
          στοιχεία σπρώχνανε τη σελίδα πλάγια και εμφανιζόταν κενό
          δεξιά. Τώρα τυλίγει, το ύψος είναι ελάχιστο αντί για σταθερό,
          και το minWidth: 0 επιτρέπει στα παιδιά να συρρικνωθούν. */}
      <nav style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '10px 16px', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100, maxWidth: '100%', boxSizing: 'border-box' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 700, color: C.brand, textDecoration: 'none', minWidth: 0, flexShrink: 1 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
          PhysioHome
          <span style={{ fontSize: 13, fontWeight: 500, color: C.textMuted, marginLeft: 8, background: C.borderSoft, padding: '3px 12px', borderRadius: RAD.pill }}>{tx.roleBadge}</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          <LanguageSwitcher color={C.textMuted} hoverColor={C.brand} navHeight={64} />
          <a href="/"
            title={tx.backToSite}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: C.accent, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} />
            {tx.site}
          </a>
          <Avatar name={profile?.name || user?.email} size={38} />
          <button onClick={signOut} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{tx.signOut}</button>
        </div>
      </nav>

      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '24px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text }}>
            {tx.welcome(profile?.name?.split(' ')[0] || tx.welcomeFallback)}
          </h1>
          <p style={{ fontSize: 15, color: C.textMuted, marginTop: 4 }}>{tx.welcomeSub}</p>
        </div>

        {heldBookings.length > 0 && (
          <div style={{ background: `linear-gradient(135deg, ${C.warnBg}, ${C.warnBorder})`, border: `1px solid ${C.warn}`, borderRadius: RAD.card, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: RAD.button, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={28} color={C.warn} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.warn, marginBottom: 4 }}>
                {tx.releaseBannerTitle(heldBookings.length)}
              </div>
              <div style={{ fontSize: 14, color: C.warn, lineHeight: 1.5 }}>
                {tx.releaseBannerDesc(heldAmount.toFixed(2))}
              </div>
            </div>
          </div>
        )}

        {/* ΚΥΡΙΟ CTA — πάνω από τα στατιστικά.
            Ο ασθενής δεν μπαίνει για να δει αριθμούς· μπαίνει για να
            κλείσει ραντεβού. */}
        <div style={{ background: C.brand, borderRadius: RAD.card, padding: '22px 26px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.surface, marginBottom: 4 }}>{tx.ctaTitle}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{tx.ctaDesc}</div>
          </div>
          <a href="/dashboard/patient/new-request" style={{ background: C.surface, color: C.brand, padding: '13px 26px', borderRadius: RAD.button, fontSize: 15, fontWeight: 700, textDecoration: 'none', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {tx.ctaBtn}
            <ArrowRight size={16} />
          </a>
        </div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: tx.statPending, value: pendingCount, tone: pendingCount > 0 ? C.warn : C.textFaint },
            { label: tx.statActive, value: confirmedCount, tone: confirmedCount > 0 ? C.accent : C.textFaint },
            { label: tx.statCompleted, value: completedCount, tone: completedCount > 0 ? C.success : C.textFaint },
            ...(heldBookings.length > 0 ? [{ label: tx.statToRelease, value: `${heldAmount.toFixed(0)}€`, tone: C.warn }] : []),
          ].map(c => (
            /* Λευκές cards με λεπτή γραμμή accent στην κορυφή.
               Τρία διαφορετικά pastel blocks δίπλα-δίπλα έκαναν τη σελίδα
               να μοιάζει με admin panel. Το χρώμα μένει μόνο στο νούμερο,
               και ξεθωριάζει όταν η τιμή είναι μηδέν — δεν έχει νόημα να
               τραβάει το μάτι ένα «0». */
            <div key={c.label} style={{
              ...card({ padding: 0 }),
              flex: 1, minWidth: 140, overflow: 'hidden',
              borderTop: `3px solid ${c.tone}`,
            }}>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ ...T.eyebrow, marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: c.tone, lineHeight: 1 }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* TABS με badges */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 4, background: C.borderSoft, padding: 4, borderRadius: RAD.button, width: 'fit-content', flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const TabIcon = t.Icon;
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: isActive ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit', background: isActive ? C.surface : 'transparent', color: isActive ? C.text : C.textMuted, boxShadow: isActive ? '0 1px 3px rgba(15,23,42,0.08)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <TabIcon size={15} />
                  {t.label}
                  {t.count > 0 && (
                    <span style={{
                      background: isActive ? C.accent : C.textFaint,
                      color: C.surface, fontSize: 11, fontWeight: 700,
                      minWidth: 19, height: 19, borderRadius: RAD.pill,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 6px',
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Εξήγηση της διαφοράς αίτημα / ραντεβού.
              Νέος χρήστης δεν ξέρει γιατί υπάρχουν δύο λίστες. */}
          {(activeTab === 'appointments' || activeTab === 'requests') && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>
              {activeTab === 'requests' ? tx.tabsHintRequests : tx.tabsHintAppointments}
            </div>
          )}
        </div>

        {/* ═══ APPOINTMENTS TAB ═══ */}
        {activeTab === 'appointments' && (
          <div>
            {nextAppointment && (() => {
              const friendly = friendlyDateLabel(nextAppointment.session_date);
              const fullDate = formatFullDate(nextAppointment.session_date);
              return (
                <div style={{
                  background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brandSoft} 100%)`,
                  borderRadius: RAD.card, padding: '28px 32px', marginBottom: 24, color: C.surface,
                  boxShadow: '0 4px 20px rgba(26,46,68,0.14)',
                }}>
                  {/* Φυσική γλώσσα, όχι εγγραφή βάσης δεδομένων.
                      Serif επειδή είναι το ένα μεγάλο, ανθρώπινο heading της σελίδας. */}
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginBottom: 10 }}>
                    {tx.nextAppointment}
                  </div>

                  <div style={{ fontFamily: F.serif, fontSize: 'clamp(26px, 3.4vw, 34px)', color: C.surface, marginBottom: 6, lineHeight: 1.25 }}>
                    {friendly ? `${friendly.charAt(0)}${friendly.slice(1).toLowerCase()}, ` : ''}{fullDate}
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 600, color: C.surface, marginBottom: 20 }}>
                    {nextAppointment.session_time?.slice(0, 5)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    {nextAppointment.therapist?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Stethoscope size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 15.5 }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{tx.withTherapist} </span>
                          <strong style={{ fontWeight: 600 }}>{nextAppointment.therapist.name}</strong>
                        </span>
                        {nextAppointment.therapist.specialty && (
                          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>· {nextAppointment.therapist.specialty}</span>
                        )}
                      </div>
                    )}

                    {nextAppointment.request?.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MapPin size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 15 }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{tx.atHome}, </span>
                          {nextAppointment.request.address}
                          {nextAppointment.request.area && `, ${nextAppointment.request.area}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {nextAppointment.status === 'pending' && (
                    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255, 204, 0, 0.15)', borderRadius: 10, fontSize: 13, color: C.warnBg, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} />
                      {tx.awaitingTherapist}
                    </div>
                  )}

                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {(() => {
                        const rr = pendingReschedule(nextAppointment.id);
                        if (rr) {
                          // Ο χρήστης απαντά μόνο σε πρόταση του άλλου
                          const isMine = rr.requested_by_role === 'patient';
                          return (
                            <button
                              onClick={() => !isMine && setRescheduleTarget({ booking: nextAppointment, reschedule: rr, mode: 'respond' })}
                              style={{
                                background: isMine ? 'rgba(255,255,255,0.10)' : '#fff',
                                border: '1px solid rgba(255,255,255,0.35)',
                                color: isMine ? 'rgba(255,255,255,0.85)' : C.brand,
                                padding: '9px 20px', borderRadius: RAD.button,
                                fontSize: 13, fontWeight: 600,
                                cursor: isMine ? 'default' : 'pointer', fontFamily: 'inherit',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              <CalendarClock size={14} />
                              {isMine ? tx.reschedulePendingYours : tx.rescheduleReview}
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => setRescheduleTarget({ booking: nextAppointment, mode: 'propose' })}
                            style={{
                              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)',
                              color: 'rgba(255,255,255,0.9)', padding: '9px 20px', borderRadius: RAD.button,
                              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <CalendarClock size={14} />
                            {tx.reschedule}
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => setCancelBookingId(nextAppointment.id)}
                        style={{
                          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)',
                          color: 'rgba(255,255,255,0.9)', padding: '9px 20px', borderRadius: RAD.button,
                          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <XCircle size={14} />
                        {tx.cancelAppointment}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {!nextAppointment && upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center', color: C.textFaint, background: C.surface, borderRadius: RAD.card, border: `1px solid ${C.border}` }}>
                <Calendar size={48} color={C.border} style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 16, marginBottom: 8 }}>{tx.noAppointments}</div>
                <a href="/dashboard/patient/new-request" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 15 }}>
                  {tx.bookFirst}
                  <ArrowRight size={15} />
                </a>
              </div>
            )}

            {(upcomingAppointments.length > 0 || pastAppointments.length > 0) && (
              <div style={{ display: 'flex', gap: 4, background: C.border, padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 20 }}>
                <button onClick={() => setAppointmentsView('list')}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: appointmentsView === 'list' ? '#fff' : 'transparent', color: appointmentsView === 'list' ? C.text : C.textMuted, boxShadow: appointmentsView === 'list' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <List size={15} />
                  {tx.viewList}
                </button>
                <button onClick={() => setAppointmentsView('calendar')}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: appointmentsView === 'calendar' ? '#fff' : 'transparent', color: appointmentsView === 'calendar' ? C.text : C.textMuted, boxShadow: appointmentsView === 'calendar' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={15} />
                  {tx.viewCalendar}
                </button>
              </div>
            )}

            {appointmentsView === 'list' && (
              <>
                {upcomingAppointments.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textBody, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ChevronRight size={16} color={C.textMuted} />
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
                            background: C.surface, borderRadius: RAD.button,
                            border: isHeld ? `2px solid ${C.warn}` : `1px solid ${C.border}`,
                            padding: '18px 20px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 110 }}>
                                {friendly ? (
                                  <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 2 }}>{friendly}</div>
                                ) : null}
                                <div style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>{formatShortDate(apt.session_date)}</div>
                                <div style={{ fontSize: 17, color: C.text, fontWeight: 700, marginTop: 2 }}>{apt.session_time?.slice(0, 5)}</div>
                              </div>

                              <div style={{ flex: 1, minWidth: 200 }}>
                                {apt.therapist?.name && (
                                  <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Stethoscope size={15} color={C.accent} />
                                    {apt.therapist.name}
                                  </div>
                                )}
                                {apt.request?.address && (
                                  <div style={{ fontSize: 14, color: C.textMuted, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <MapPin size={13} />
                                    {apt.request.address}, {apt.request.area}
                                  </div>
                                )}
                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                                  {apt.status === 'completed' && (
                                    <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                  )}

                                  {apt.status !== 'completed' && !isCancelled(apt.status) && (() => {
                                    const rr = pendingReschedule(apt.id);
                                    const isMine = rr?.requested_by_role === 'patient';
                                    return (
                                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
                                        {rr ? (
                                          <button
                                            onClick={() => !isMine && setRescheduleTarget({ booking: apt, reschedule: rr, mode: 'respond' })}
                                            style={{
                                              background: isMine ? C.page : C.infoBg,
                                              border: `1px solid ${isMine ? C.border : C.infoBorder}`,
                                              color: isMine ? C.textFaint : C.info,
                                              padding: '5px 14px', borderRadius: RAD.pill, fontSize: 12.5,
                                              fontWeight: 600, cursor: isMine ? 'default' : 'pointer', fontFamily: 'inherit',
                                              display: 'inline-flex', alignItems: 'center', gap: 5,
                                            }}
                                          >
                                            <CalendarClock size={13} />
                                            {isMine ? tx.reschedulePendingYours : tx.rescheduleReview}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setRescheduleTarget({ booking: apt, mode: 'propose' })}
                                            style={{
                                              background: 'transparent', border: `1px solid ${C.border}`,
                                              color: C.textMuted, padding: '5px 14px', borderRadius: RAD.pill, fontSize: 12.5,
                                              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                              display: 'inline-flex', alignItems: 'center', gap: 5,
                                            }}
                                          >
                                            <CalendarClock size={13} />
                                            {tx.reschedule}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => setCancelBookingId(apt.id)}
                                          style={{
                                            background: 'transparent', border: `1px solid ${C.border}`,
                                            color: C.textMuted, padding: '5px 14px', borderRadius: RAD.pill, fontSize: 12.5,
                                            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                          }}
                                        >
                                          <XCircle size={13} />
                                          {tx.cancel}
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {isHeld && (
                              <div style={{ marginTop: 14, padding: 14, background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10 }}>
                                <div style={{ fontSize: 14, color: C.warn, fontWeight: 600, marginBottom: 4 }}>
                                  {tx.therapistSaysDone}
                                </div>
                                {daysLeft !== null && (
                                  <div style={{ fontSize: 13, color: C.warn, marginBottom: 12 }}>
                                    {daysLeft === 0 ? tx.autoReleaseToday : tx.autoReleaseIn(daysLeft)}
                                  </div>
                                )}
                                <button onClick={() => openReleaseModal(apt, apt.request)}
                                  style={{
                                    padding: '11px 22px', borderRadius: RAD.button, border: 'none', background: C.success,
                                    color: C.surface, fontSize: 15, fontWeight: 700, cursor: 'pointer',
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
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textBody, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ChevronLeft size={16} color={C.textMuted} />
                      {tx.past(pastAppointments.length)}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pastAppointments.map(apt => {
                        const bSt = statusLabel(BOOKING_STATUS, apt.status);
                        const payStatus = apt.payment_status || 'pending';
                        const payInfo = statusLabel(PAYMENT_STATUS, payStatus);

                        return (
                          <div key={apt.id} style={{
                            background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
                            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                          }}>
                            <div style={{ minWidth: 100 }}>
                              <div style={{ fontSize: 14, color: C.textBody, fontWeight: 600 }}>{formatShortDate(apt.session_date)}</div>
                              <div style={{ fontSize: 13, color: C.textFaint }}>{tx.at} {apt.session_time?.slice(0, 5)}</div>
                            </div>

                            <div style={{ flex: 1, minWidth: 150 }}>
                              {apt.therapist?.name && (
                                <div style={{ fontSize: 14, color: C.textBody }}>{apt.therapist.name}</div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                              {apt.status === 'completed' && payStatus !== 'pending' && (
                                <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                              )}
                            </div>

                            {/* Ο ασθενής μπορεί να δηλώσει ότι ο θεραπευτής
                                δεν ήρθε — είναι η βαρύτερη περίπτωση για την
                                πλατφόρμα και πρέπει να μπορεί να ειπωθεί. */}
                            {apt.status === 'confirmed' && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => setReportTarget({ mode: 'noshow', booking: apt, otherName: apt.therapist?.name })}
                                  style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.warnBorder}`, background: 'transparent', color: C.warn, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                  <UserX size={12} />
                                  {tx.noShow}
                                </button>
                                <button
                                  onClick={() => setReportTarget({ mode: 'issue', booking: apt, otherName: apt.therapist?.name })}
                                  style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                  <AlertCircle size={12} />
                                  {tx.reportIssue}
                                </button>
                              </div>
                            )}
                            {apt.status === 'completed' && (
                              <button
                                onClick={() => setReportTarget({ mode: 'issue', booking: apt, otherName: apt.therapist?.name })}
                                style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                <AlertCircle size={12} />
                                {tx.reportIssue}
                              </button>
                            )}

                            {isCancelled(apt.status) && apt.cancelled_reason && (
                              <div style={{ width: '100%', paddingTop: 8, marginTop: 4, borderTop: `1px solid ${C.borderSoft}`, fontSize: 12, color: C.danger }}>
                                {apt.status === 'cancelled_by_therapist' ? tx.cancelledByTherapist
                                  : apt.status === 'cancelled_by_patient' ? tx.cancelledByYou
                                  : tx.cancelledByAdmin}
                                {' · '}
                                <span style={{ fontStyle: 'italic', color: C.warn }}>{apt.cancelled_reason}</span>
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
              <div style={{ background: C.surface, borderRadius: RAD.card, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <button onClick={() => navigateMonth(-1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.brand, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                    <ChevronLeft size={16} />
                    {tx.prev}
                  </button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: C.text, textAlign: 'center' }}>
                    {MONTHS_FULL[lang][calendarMonth.month]} {calendarMonth.year}
                  </div>
                  <button onClick={() => navigateMonth(1)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.brand, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                    {tx.next}
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                  {DAYS_GRID[lang].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.textMuted, padding: 6 }}>{d}</div>
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
                          background: isToday ? C.infoBg : hasApts ? C.successBg : '#fff',
                          border: `1px solid ${isToday ? C.accent : hasApts ? C.successBorder : C.borderSoft}`,
                          borderRadius: 8, cursor: hasApts ? 'pointer' : 'default',
                          opacity: isPast && !hasApts ? 0.5 : 1, transition: 'all .15s',
                        }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? C.accent : C.text, marginBottom: 4 }}>{day}</div>
                        {dayApts.slice(0, 2).map((a, i) => (
                          <div key={i} style={{
                            fontSize: 10,
                            background: isCancelled(a.status) ? C.dangerBg : a.status === 'completed' ? C.infoBg : C.infoBg,
                            color: isCancelled(a.status) ? C.danger : a.status === 'completed' ? C.info : C.info,
                            padding: '2px 5px', borderRadius: 4, marginBottom: 2, fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {a.session_time?.slice(0, 5)}
                          </div>
                        ))}
                        {dayApts.length > 2 && (
                          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>+{dayApts.length - 2}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 14, fontSize: 12, color: C.textMuted, flexWrap: 'wrap' }}>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: C.infoBg, border: `1px solid ${C.accent}`, borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />{tx.today}</span>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />{tx.hasAppointment}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ REQUESTS TAB ═══ */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessionRequests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.textFaint, background: C.surface, borderRadius: RAD.card, border: `1px solid ${C.border}`, fontSize: 15 }}>
                {tx.noRequests}<br />
                <a href="/dashboard/patient/new-request" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {tx.bookFirst}
                  <ArrowRight size={14} />
                </a>
              </div>
            ) : sessionRequests.map(req => {
              const st = statusLabel(STATUS_MAP, req.status);
              // ΑΞΙΟΛΟΓΗΣΗ ΜΟΝΟ ΑΠΟ ΟΛΟΚΛΗΡΩΜΕΝΗ ΣΥΝΕΔΡΙΑ.
              // Παλιά επιτρεπόταν και μετά από ακύρωση του θεραπευτή, με το
              // σκεπτικό ότι είναι χρήσιμη πληροφορία. Δεν είναι αξιολόγηση
              // υπηρεσίας όμως: ο ασθενής δεν είδε ποτέ τον θεραπευτή.
              // Οι ακυρώσεις μετριούνται στα reliability metrics.
              // Ο ίδιος κανόνας επιβάλλεται πλέον και στη βάση (RLS).
              const completedBooking = req.bookings.find(b => b.status === 'completed');
              const canReview = !!completedBooking && !req.review;

              // ΑΔΙΕΞΟΔΟ: το αίτημα απορρίφθηκε ή έληξε.
              // Χωρίς διέξοδο, ο ασθενής βλέπει «Απορρίφθηκε» και πρέπει να
              // ξαναρχίσει από την αρχή — να ξαναγράψει πρόβλημα, διεύθυνση
              // και ώρα. Τα περισσότεροι απλά φεύγουν.
              const isDeadEnd = ['declined', 'rejected', 'expired'].includes(req.status);
              const retryUrl = `/dashboard/patient/new-request?retry=${req.id}`;
              const matches = rematches[req.id] || [];

              // ΑΝΤΙΣΤΡΟΦΗ ΜΕΤΡΗΣΗ.
              // Χωρίς αυτή, ο ασθενής βλέπει «Εκκρεμεί» και δεν ξέρει αν
              // περιμένει δέκα λεπτά ή δύο μέρες. Οι περισσότεροι
              // υποθέτουν ότι κάτι δεν πάει καλά και φεύγουν.
              let deadlineText = null;
              let deadlineUrgent = false;
              if (req.status === 'pending' && req.expires_at) {
                const ms = new Date(req.expires_at).getTime() - Date.now();
                if (ms <= 0) {
                  deadlineText = tx.deadlinePassed;
                  deadlineUrgent = true;
                } else {
                  const h = Math.floor(ms / 3600000);
                  const m = Math.floor((ms % 3600000) / 60000);
                  deadlineText = tx.deadlineLeft(h > 0 ? `${h}ω ${m}λ` : `${m} λεπτά`);
                  deadlineUrgent = ms < 2 * 3600000;
                }
              }
              const reqHeldBookings = req.bookings.filter(b => b.payment_status === 'held');

              return (
                <div key={req.id} style={{ background: C.surface, borderRadius: RAD.card, border: reqHeldBookings.length > 0 ? `2px solid ${C.warn}` : `1px solid ${C.border}`, overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{req.problem_type || tx.physiotherapy}</span>
                      <Badge label={st.label} bg={st.bg} color={st.color} />
                      {req.is_same_day && req.status === 'pending' && (
                        <Badge label={tx.sameDayTag} bg={C.warnBg} color={C.warn} />
                      )}
                      {deadlineText && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600,
                          color: deadlineUrgent ? C.danger : C.textMuted,
                        }}>
                          <Clock size={12} />
                          {deadlineText}
                        </span>
                      )}
                      {reqHeldBookings.length > 0 && (
                        <Badge label={tx.pendingApproval(reqHeldBookings.length)} bg={C.warnBg} color={C.warn} icon={AlertCircle} />
                      )}
                      <span style={{ fontSize: 12, color: C.textFaint, marginLeft: 'auto' }}>{new Date(req.created_at).toLocaleDateString(loc)}</span>
                    </div>

                    {/* ΔΙΕΞΟΔΟΣ ΑΠΟ ΤΟ ΑΔΙΕΞΟΔΟ.
                        Το ?retry= κρατάει περιστατικό, περιοχή και διεύθυνση,
                        ώστε ο ασθενής να μη χρειαστεί να τα ξαναγράψει. */}
                    {isDeadEnd && (
                      <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: RAD.input, padding: '14px 16px', marginBottom: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                          {req.status === 'expired' ? tx.deadEndExpired : tx.deadEndRejected}
                        </div>
                        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                          {tx.deadEndAction}
                        </div>
                        {/* ΣΥΓΚΕΚΡΙΜΕΝΟΙ θεραπευτές, όχι «ξαναψάξε».
                            Ίδια πρόταση με το email που μόλις έλαβε. */}
                        {matches.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.success, marginBottom: 10 }}>
                              {tx.matchesTitle(matches.length)}
                              {matches.some(m => m.same_day) ? ` ${tx.matchesToday}` : ''}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {matches.map(m => (
                                <a key={m.therapist_id}
                                  href={`/dashboard/patient/new-request?retry=${req.id}&therapist=${m.therapist_id}`}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: C.surface, border: `1px solid ${C.border}`,
                                    borderRadius: RAD.input, padding: '11px 14px',
                                    textDecoration: 'none',
                                  }}>
                                  <Avatar name={m.name} size={34} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.name}</div>
                                    <div style={{ fontSize: 12, color: C.textMuted }}>
                                      {m.same_day ? tx.today : new Date(m.next_slot_date).toLocaleDateString(loc, { day: '2-digit', month: 'short' })}
                                      {m.next_slot_time ? ` ${String(m.next_slot_time).slice(0, 5)}` : ''}
                                      {m.price ? ` · ${Math.round(Number(m.price))}€` : ''}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.accent, whiteSpace: 'nowrap' }}>
                                    {tx.matchesPick}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <a href={retryUrl} style={{ ...btn(matches.length > 0 ? 'secondary' : 'primary', { padding: '10px 20px', fontSize: 13.5, textDecoration: 'none' }) }}>
                          {tx.deadEndBtn}
                          <ArrowRight size={15} />
                        </a>
                      </div>
                    )}

                    {req.therapist?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Avatar name={req.therapist.name} size={32} />
                        <div>
                          <div style={{ fontSize: 15, color: C.brand, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Stethoscope size={14} color={C.accent} />
                            {req.therapist.name}
                          </div>
                          {req.therapist.specialty && (
                            <div style={{ fontSize: 13, color: C.textMuted }}>{req.therapist.specialty}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {req.address && (
                      <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} />
                        {req.address}, {req.area}
                      </div>
                    )}
                    {req.total_cost && (
                      <div style={{ fontSize: 14, color: C.success, fontWeight: 600, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Euro size={13} strokeWidth={2.5} />
                        {tx.total}: {req.total_cost}€
                      </div>
                    )}
                    {req.problem_description && <div style={{ fontSize: 14, color: C.textBody, background: C.page, padding: '10px 14px', borderRadius: 8, borderLeft: `3px solid ${C.border}`, marginTop: 6 }}>{req.problem_description}</div>}
                  </div>

                  {req.bookings.length > 0 && (
                    <div style={{ padding: '0 20px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
                              background: isHeld ? C.warnBg : isCancelled(b.status) ? C.dangerBg : C.page,
                              borderRadius: 8, fontSize: 14,
                              border: isHeld ? `1px solid ${C.warnBorder}` : isCancelled(b.status) ? `1px solid ${C.dangerBorder}` : 'none',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ color: C.text, fontWeight: 500 }}>
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
                                <div style={{ paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12.5, color: C.danger, lineHeight: 1.6 }}>
                                  <strong>
                                    {b.status === 'cancelled_by_therapist' ? tx.cancelledByTherapist
                                      : b.status === 'cancelled_by_patient' ? tx.cancelledByYou
                                      : tx.cancelledByAdmin}
                                  </strong>
                                  <div style={{ marginTop: 3, color: C.warn }}>
                                    {tx.cancelReason}{' '}
                                    {b.cancelled_reason
                                      ? <span style={{ fontStyle: 'italic' }}>{b.cancelled_reason}</span>
                                      : <span style={{ color: C.textFaint }}>{tx.noReason}</span>}
                                  </div>
                                </div>
                              )}

                              {isHeld && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 8, borderTop: `1px solid ${C.warnBorder}`, flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: 13, color: C.warn, fontWeight: 600, marginBottom: 2 }}>
                                      {tx.therapistSaysDone}
                                    </div>
                                    {daysLeft !== null && (
                                      <div style={{ fontSize: 12, color: C.warn }}>
                                        {daysLeft === 0 ? tx.autoReleaseToday : tx.autoReleaseIn(daysLeft)}
                                      </div>
                                    )}
                                  </div>
                                  <button onClick={() => openReleaseModal(b, req)}
                                    style={{
                                      padding: '10px 20px', borderRadius: RAD.button, border: 'none', background: C.success,
                                      color: C.surface, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
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
                    <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.borderSoft}`, background: C.warnBg }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.warn, textTransform: 'uppercase', letterSpacing: '.05em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} strokeWidth={3} />
                          {tx.yourReview}
                        </span>
                        <Stars rating={req.review.rating} size={16} />
                      </div>
                      {req.review.comment && (
                        <p style={{ fontSize: 14, color: C.warn, fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{req.review.comment}</p>
                      )}
                    </div>
                  ) : canReview ? (
                    <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.borderSoft}`, background: C.page, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 14, color: C.textBody }}>
                        {tx.howWasIt(req.therapist?.name || tx.therapistFallback)}
                        <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 3 }}>
                          {tx.reviewVerifiedNote}
                        </div>
                      </div>
                      <button onClick={() => openReviewModal(req)}
                        style={btn('primary', { padding: '10px 20px', fontSize: 14 })}>
                        <Star size={14} strokeWidth={2} />
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
              <h2 style={{ fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 4 }}>{tx.servicesTitle}</h2>
              <p style={{ fontSize: 14, color: C.textMuted }}>{tx.servicesDesc}</p>
            </div>

            {services.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.textFaint, background: C.surface, borderRadius: RAD.card, border: `1px solid ${C.border}`, fontSize: 14 }}>
                {tx.noServices}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {services.map(s => {
                  const title = (lang === 'en' ? (s.title_en || s.title_el) : s.title_el);
                  const desc = (lang === 'en' ? (s.desc_en || s.desc_el) : s.desc_el);
                  return (
                    <div key={s.id} style={{ background: C.surface, borderRadius: RAD.card, border: `1px solid ${C.border}`, padding: 20, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: RAD.button, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Stethoscope size={22} color={C.accent} strokeWidth={2} />
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{title}</h3>
                      </div>
                      {desc && (
                        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{desc}</p>
                      )}
                      <a href="/dashboard/patient/new-request" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', background: C.brand, color: C.surface, padding: '11px 18px', borderRadius: 25, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
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
          <div style={{ background: C.surface, borderRadius: RAD.card, border: `1px solid ${C.border}`, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.borderSoft}` }}>
              <Avatar name={editProfile.name || user?.email} size={64} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 21, fontWeight: 700, color: C.text }}>{editProfile.name || '—'}</div>
                <div style={{ fontSize: 15, color: C.textMuted, wordBreak: 'break-word' }}>{user?.email}</div>
                <div style={{ fontSize: 13, color: C.textFaint, marginTop: 4 }}>
                  {tx.memberSince} {user?.created_at ? new Date(user.created_at).toLocaleDateString(loc) : '—'}
                </div>
              </div>
            </div>

            {/* ── ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ ──
                Χωρισμένα από τη διεύθυνση. Ο χρήστης δεν χρειάζεται να
                δώσει πλήρη διεύθυνση μόλις φτιάξει λογαριασμό. */}
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <User size={16} color={C.accent} />
                <h3 style={sectionTitleStyle}>{tx.profileBasics}</h3>
              </div>
              <p style={sectionDescStyle}>{tx.profileBasicsDesc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={profileLabelStyle}>{tx.fullName} *</label>
                  <input value={editProfile.name} onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))} style={profileInputStyle} placeholder={tx.fullNamePh} />
                </div>
                <div>
                  <label style={profileLabelStyle}>{tx.phone}</label>
                  <input value={editProfile.phone} onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))} style={profileInputStyle} placeholder={tx.phonePh} />
                </div>
              </div>
            </div>

            {/* ── ΔΙΕΥΘΥΝΣΗ ── */}
            <div style={{ paddingTop: 22, borderTop: `1px solid ${C.borderSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Home size={16} color={C.accent} />
                <h3 style={sectionTitleStyle}>{tx.profileAddress}</h3>
              </div>
              <p style={sectionDescStyle}>{tx.profileAddressDesc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={profileLabelStyle}>{tx.address}</label>
                  <input value={editProfile.address} onChange={e => setEditProfile(p => ({ ...p, address: e.target.value }))} style={profileInputStyle} placeholder={tx.addressPh} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={profileLabelStyle}>{tx.area}</label>
                    <input value={editProfile.area} onChange={e => setEditProfile(p => ({ ...p, area: e.target.value }))} style={profileInputStyle} placeholder={tx.areaPh} />
                  </div>
                  <div>
                    <label style={profileLabelStyle}>{tx.postal}</label>
                    <input value={editProfile.postal_code} onChange={e => setEditProfile(p => ({ ...p, postal_code: e.target.value }))} style={profileInputStyle} placeholder={tx.postalPh} />
                  </div>
                </div>

                <div>
                  <label style={profileLabelStyle}>{tx.city}</label>
                  <input value={editProfile.city} onChange={e => setEditProfile(p => ({ ...p, city: e.target.value }))} style={profileInputStyle} placeholder={tx.cityPh} />
                </div>
              </div>
            </div>

            {profileMsg && (
              <div style={{
                marginTop: 18,
                background: profileMsg.type === 'success' ? C.successBg : C.dangerBg,
                border: `1px solid ${profileMsg.type === 'success' ? C.successBorder : C.dangerBorder}`,
                borderRadius: 8, padding: '12px 16px', fontSize: 14,
                color: profileMsg.type === 'success' ? C.success : C.danger,
                fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {profileMsg.type === 'success' && <Check size={14} strokeWidth={3} />}
                {profileMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                style={{
                  background: C.brand, color: C.surface, padding: '13px 32px', borderRadius: RAD.button,
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
        )}
      </div>

      {/* Calendar day-detail modal */}
      {selectedAppointment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedAppointment(null); }}>
          <div style={{ background: C.surface, borderRadius: 20, padding: 0, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{formatFullDate(selectedAppointment.date)}</h2>
              <button onClick={() => setSelectedAppointment(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textFaint, display: 'flex', alignItems: 'center' }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedAppointment.appointments.map(apt => {
                const bSt = statusLabel(BOOKING_STATUS, apt.status);
                return (
                  <div key={apt.id} style={{ background: C.page, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                      {tx.at} {apt.session_time?.slice(0, 5)}
                    </div>
                    {apt.therapist?.name && (
                      <div style={{ fontSize: 14, color: C.textBody, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Stethoscope size={14} color={C.accent} />
                        {apt.therapist.name}
                      </div>
                    )}
                    {apt.request?.address && (
                      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
          <div style={{ background: C.surface, borderRadius: 20, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Wallet size={30} color={C.success} strokeWidth={2.2} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12, textAlign: 'center' }}>{tx.releaseTitle}</h2>
            <p style={{ fontSize: 15, color: C.textMuted, marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
              {tx.releaseDesc(releaseModal.request?.therapist?.name || tx.therapistFallback)}
            </p>

            <div style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: RAD.button, padding: '18px 22px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.success, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                {tx.releaseAmount}
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: C.success }}>
                {parseFloat(releaseModal.booking?.session_amount || 0).toFixed(2)}€
              </div>
              {releaseModal.booking?.session_date && (
                <div style={{ fontSize: 13, color: C.success, marginTop: 6 }}>
                  {tx.session}: {new Date(releaseModal.booking.session_date + 'T12:00:00').toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' })} {tx.at} {releaseModal.booking.session_time?.slice(0, 5)}
                </div>
              )}
            </div>

            <div style={{ background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: C.warn, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={16} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>{tx.releaseWarnLabel}</strong> {tx.releaseWarn}</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReleaseModal(null)} disabled={releasing}
                style={{ flex: 1, padding: '14px', borderRadius: RAD.button, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 15, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {tx.dismiss}
              </button>
              <button onClick={confirmRelease} disabled={releasing}
                style={{ flex: 2, padding: '14px', borderRadius: RAD.button, border: 'none', background: releasing ? C.textFaint : C.success, color: C.surface, fontSize: 15, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
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
          <div style={{ background: C.surface, borderRadius: 20, padding: 32, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, marginBottom: 8 }}>{tx.reviewTitle}</h2>
            <p style={{ fontSize: 15, color: C.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
              {tx.howWasIt(reviewModal.therapist_name)}
            </p>

            <div style={{ marginBottom: 20, padding: '16px 20px', background: C.warnBg, borderRadius: RAD.button, border: `1px solid ${C.warnBorder}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.warn, marginBottom: 10 }}>{tx.rating} *</div>
              <Stars rating={reviewForm.rating} onChange={r => setReviewForm(p => ({ ...p, rating: r }))} size={36} />
              {reviewForm.rating > 0 && (
                <div style={{ fontSize: 13, color: C.warn, marginTop: 8 }}>
                  {RATING_WORDS[lang][reviewForm.rating]}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>{tx.comment}</label>
              <textarea rows={4} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                placeholder={tx.commentPh}
                maxLength={500}
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: C.text }} />
              <div style={{ fontSize: 12, color: C.textFaint, textAlign: 'right', marginTop: 4 }}>{reviewForm.comment.length}/500</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReviewModal(null)} disabled={submittingReview}
                style={{ flex: 1, padding: '13px', borderRadius: RAD.button, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 15, fontWeight: 600, cursor: submittingReview ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {tx.dismiss}
              </button>
              <button onClick={submitReview} disabled={!reviewForm.rating || submittingReview}
                style={{ flex: 2, padding: '13px', borderRadius: RAD.button, border: 'none', background: reviewForm.rating ? C.warn : C.border, color: reviewForm.rating ? '#fff' : C.textFaint, fontSize: 15, fontWeight: 600, cursor: reviewForm.rating ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                <Star size={15} fill={reviewForm.rating ? '#fff' : C.textFaint} strokeWidth={0} />
                {submittingReview ? tx.submitting : tx.submit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal αλλαγής ώρας */}
      {rescheduleTarget && (
        <RescheduleModal
          booking={{
            id: rescheduleTarget.booking.id,
            therapist_id: rescheduleTarget.booking.therapist_id || rescheduleTarget.booking.request?.therapist_id,
            session_date: rescheduleTarget.booking.session_date,
            session_time: rescheduleTarget.booking.session_time,
          }}
          reschedule={rescheduleTarget.reschedule}
          mode={rescheduleTarget.mode}
          lang={lang}
          onClose={() => setRescheduleTarget(null)}
          onDone={() => { setRescheduleTarget(null); init(); }}
        />
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

      {reportTarget && (
        <ReportModal
          mode={reportTarget.mode}
          booking={reportTarget.booking}
          otherName={reportTarget.otherName}
          lang={lang}
          onClose={() => setReportTarget(null)}
          onDone={() => { setReportTarget(null); if (user) loadRequests(user.id); }}
        />
      )}

    </div>
  );
}