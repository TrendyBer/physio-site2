'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import CancelBookingModal from '@/components/CancelBookingModal';
import { useRouter } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RescheduleModal from '@/components/RescheduleModal';
import { C, R as RAD, T, F, MAX_WIDTH, card, btn, badge, input as inputStyle } from '@/lib/tokens';
import ReportModal from '@/components/ReportModal';
import Logo from '@/components/Logo';
import EmailVerifyBanner from '@/components/EmailVerifyBanner';
import { ClipboardList, Stethoscope, User, MapPin, Euro, Calendar, Star, Check, ArrowRight, Save, X, Hourglass, Wallet, AlertCircle, CheckCircle2, CalendarDays, List, ChevronLeft, ChevronRight, Clock, XCircle, Globe, CalendarClock, Home, UserX, ChevronDown, LogOut, FileText} from 'lucide-react';

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
  held:     { el: 'Περιμένει την απάντησή σου', en: 'Awaiting your answer', bg: C.warnBg, color: C.warn, icon: AlertCircle },
  released: { el: 'Επιβεβαιώθηκε',     en: 'Confirmed',     bg: C.successBg, color: C.success, icon: CheckCircle2 },
  refunded: { el: 'Επιστράφηκε',       en: 'Refunded',      bg: C.dangerBg, color: C.danger, icon: X },
  disputed: { el: 'Υπό εξέταση',       en: 'Under review',  bg: C.dangerBg, color: C.danger, icon: AlertCircle },
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
    welcome: (n) => `Καλώς ήρθες, ${n}`,
    welcomeFallback: 'Ασθενής',
    welcomeSub: 'Διαχειρίσου εύκολα τα ραντεβού και τα αιτήματά σου.',
    tabAppointments: 'Ραντεβού',
    tabRequests: 'Αιτήματα',
    tabServices: 'Υπηρεσίες',
    tabProfile: 'Προφίλ',
    tabHome: 'Αρχική',
    navLabel: 'Κύριο μενού',
    myProfile: 'Το προφίλ μου',
    confirmedBadge: 'Επιβεβαιωμένο',
    physioRole: 'Φυσικοθεραπευτής',
    viewDetails: 'Προβολή λεπτομερειών',
    bookNew: 'Κλείσε νέο ραντεβού',
    pendingHeroEyebrow: 'Το αίτημά σου περιμένει απάντηση',
    pendingHeroTitle: (n) => n || 'Ο φυσικοθεραπευτής θα απαντήσει σύντομα',
    replyBy: (t) => `Απάντηση έως ${t}`,
    viewRequest: 'Δες το αίτημα',
    upcomingTitle: 'Επερχόμενα ραντεβού',
    seeAll: 'Όλα τα ραντεβού',
    noAppointmentsDesc: 'Βρες τον κατάλληλο φυσικοθεραπευτή και προγραμμάτισε την πρώτη σου συνεδρία.',
    noUpcoming: 'Δεν έχεις επερχόμενο ραντεβού',
    noUpcomingDesc: 'Όποτε χρειαστείς, κλείνεις νέο ραντεβού σε λίγα λεπτά.',
    details: 'Λεπτομέρειες',
    pastLabel: 'ΕΧΕΙ ΓΙΝΕΙ',
    noPastYet: 'Δεν υπάρχουν ολοκληρωμένα ραντεβού ακόμα.',
    noRequestsDesc: 'Όταν στείλεις αίτημα σε φυσικοθεραπευτή, θα βλέπεις εδώ την πορεία του.',
    tabsHintRequests: 'Αιτήματα = περιμένουν απάντηση από τον φυσικοθεραπευτή.',
    tabsHintAppointments: 'Ραντεβού = έχουν επιβεβαιωθεί από τον φυσικοθεραπευτή.',
    releaseBannerTitle: (n) => n === 1 ? 'Έγινε η συνεδρία σου;' : `Έγιναν οι ${n} συνεδρίες σου;`,
    releaseBannerDesc: 'Ο φυσικοθεραπευτής δηλώνει ότι ολοκληρώθηκαν. Πες μας αν πραγματικά έγιναν — έτσι διασφαλίζουμε την ποιότητα της υπηρεσίας. Αν δεν απαντήσεις σε 7 ημέρες, θεωρείται ότι έγιναν.',
    answerYes: 'Ναι, έγινε',
    answerNo: 'Όχι, δεν έγινε',
    disputedNote: 'Δήλωσες ότι η συνεδρία δεν έγινε. Η ομάδα του Theralivo θα επικοινωνήσει μαζί σου.',
    disputedBadge: 'Υπό εξέταση',
    noTitle: 'Η συνεδρία δεν έγινε',
    noDesc: (n) => `Ο/Η ${n} δήλωσε ότι η συνεδρία έγινε. Πες μας τι συνέβη και η ομάδα του Theralivo θα επικοινωνήσει μαζί σου.`,
    notePh: 'Τι συνέβη; (προαιρετικό)',
    confirmNo: 'Αποστολή',
    errAnswer: 'Η απάντηση δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
    statPending: 'Εκκρεμή αιτήματα',
    statActive: 'Επιβεβαιωμένα',
    statCompleted: 'Ολοκληρωμένα',
    statToRelease: 'Προς επιβεβαίωση',
    ctaTitle: 'Χρειάζεσαι φυσικοθεραπεία;',
    ctaDesc: 'Βρες φυσικοθεραπευτή και κλείσε ραντεβού στον χώρο σου.',
    ctaBtn: 'Κλείσε ραντεβού',
    nextAppointment: 'Το επόμενο ραντεβού σου',
    withTherapist: 'με τον/την',
    atHome: 'στο σπίτι σου',
    at: 'στις',
    awaitingTherapist: 'Αναμονή επιβεβαίωσης από τον φυσικοθεραπευτή',
    cancelAppointment: 'Ακύρωση ραντεβού',
    noShow: 'Δεν ήρθε',
    reportIssue: 'Αναφορά',
    reschedule: 'Αλλαγή ώρας',
    reschedulePending: 'Εκκρεμεί πρόταση αλλαγής',
    reschedulePendingYours: 'Έστειλες πρόταση αλλαγής',
    rescheduleReview: 'Δες την πρόταση',
    rescheduleTo: (d) => `Προτεινόμενη νέα ώρα: ${d}`,
    cancel: 'Ακύρωση',
    noAppointments: 'Δεν έχεις ραντεβού ακόμα',
    bookFirst: 'Κλείσε το πρώτο σου ραντεβού',
    viewList: 'Λίστα',
    viewCalendar: 'Ημερολόγιο',
    upcoming: (n) => `Επερχόμενα Ραντεβού (${n})`,
    past: (n) => `Παλαιότερα Ραντεβού (${n})`,
    therapistSaysDone: 'Ο φυσικοθεραπευτής δηλώνει ότι η συνεδρία έγινε. Έγινε;',
    autoReleaseToday: 'Αν δεν απαντήσεις σήμερα, θεωρείται ότι έγινε',
    autoReleaseIn: (d) => `Αν δεν απαντήσεις σε ${d} ${d === 1 ? 'ημέρα' : 'ημέρες'}, θεωρείται ότι έγινε`,
        prev: 'Προηγ.',
    next: 'Επόμ.',
    today: 'Σήμερα',
    hasAppointment: 'Έχει ραντεβού',
    noRequests: 'Δεν έχεις αιτήματα ακόμα.',
    deadEndRejected: 'Ο φυσικοθεραπευτής δεν είναι διαθέσιμος για αυτό το ραντεβού.',
    deadEndExpired: 'Ο φυσικοθεραπευτής δεν απάντησε εγκαίρως.',
    deadEndAction: 'Δες άλλους διαθέσιμους φυσικοθεραπευτές — τα στοιχεία σου είναι ήδη συμπληρωμένα.',
    deadEndBtn: 'Δες άλλους φυσικοθεραπευτές',
    matchesTitle: (n) => n === 1 ? 'Βρήκαμε 1 διαθέσιμο φυσικοθεραπευτή' : `Βρήκαμε ${n} διαθέσιμους φυσικοθεραπευτές`,
    matchesToday: 'που μπορούν σήμερα',
    matchesPick: 'Επίλεξε',
    today: 'Σήμερα',
    deadlineLabel: 'Απάντηση έως',
    deadlineLeft: (t) => `Απομένουν ${t}`,
    deadlinePassed: 'Η προθεσμία πέρασε',
    sameDayTag: 'Αυθημερόν',
    physiotherapy: 'Φυσικοθεραπεία',
    pendingApproval: (n) => `${n} προς επιβεβαίωση`,
    total: 'Κόστος συνεδρίας',
    sessions: (n) => `Συνεδρίες (${n})`,
    yourReview: 'Η αξιολόγησή σου',
    cancelledByTherapist: 'Ακυρώθηκε από τον φυσικοθεραπευτή',
    reviewVerifiedNote: 'Η αξιολόγησή σου θα φέρει την ένδειξη «Από επαληθευμένη συνεδρία».',
    verifiedSession: 'Από επαληθευμένη συνεδρία',
    cancelledByYou: 'Ακυρώθηκε από εσένα',
    cancelledByAdmin: 'Ακυρώθηκε από την πλατφόρμα',
    cancelReason: 'Αιτιολογία:',
    noReason: 'Δεν δόθηκε αιτιολογία',
    reviewAfterCancel: 'Μπορείς να αξιολογήσεις την εμπειρία σου παρόλο που το ραντεβού ακυρώθηκε.',
    howWasIt: (n) => `Πώς ήταν η εμπειρία σου με τον/την ${n};`,
    therapistFallback: 'φυσικοθεραπευτή',
    leaveReview: 'Άφησε αξιολόγηση',
    servicesTitle: 'Υπηρεσίες Φυσικοθεραπείας',
    servicesDesc: 'Εξατομικευμένη φροντίδα για ένα εύρος παθήσεων.',
    noServices: 'Δεν υπάρχουν διαθέσιμες υπηρεσίες αυτή τη στιγμή.',
    bookAppointment: 'Κλείσε ραντεβού',
    memberSince: 'Μέλος από',
    profileTitle: 'Στοιχεία Προφίλ',
    profileBasics: 'Βασικά στοιχεία',
    profileBasicsDesc: 'Πώς θα σε βρει ο φυσικοθεραπευτής.',
    profileAddress: 'Διεύθυνση για τα ραντεβού',
    profileAddressDesc: 'Συμπληρώνεται αυτόματα όταν κλείνεις ραντεβού. Μπορείς να την αλλάξεις εδώ οποτεδήποτε.',
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
    releaseTitle: 'Η συνεδρία έγινε',
    releaseDesc: (n) => `Επιβεβαιώνεις ότι έγινε η συνεδρία με τον/την ${n};`,
    releaseAmount: 'Ποσό προς απελευθέρωση',
    session: 'Συνεδρία',
    releaseWarnLabel: 'Σημείωση:',
    releaseWarn: 'Η απάντησή σου καταγράφεται και δεν αλλάζει αργότερα.',
    releasing: 'Αποθήκευση...',
    confirmRelease: 'Ναι, έγινε',
    reviewTitle: 'Αξιολόγηση φυσικοθεραπευτή',
    rating: 'Βαθμολογία',
    comment: 'Σχόλιο (προαιρετικό)',
    commentPh: 'Μοιράσου την εμπειρία σου...',
    dismiss: 'Άκυρο',
    submit: 'Υποβολή',
    submitting: 'Αποστολή...',
    errNoRating: 'Επίλεξε βαθμολογία.',
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
    tabHome: 'Home',
    navLabel: 'Main menu',
    myProfile: 'My profile',
    confirmedBadge: 'Confirmed',
    physioRole: 'Physiotherapist',
    viewDetails: 'View details',
    bookNew: 'Book a new appointment',
    pendingHeroEyebrow: 'Your request is awaiting a reply',
    pendingHeroTitle: (n) => n || 'The physiotherapist will reply soon',
    replyBy: (t) => `Reply by ${t}`,
    viewRequest: 'View request',
    upcomingTitle: 'Upcoming appointments',
    seeAll: 'All appointments',
    noAppointmentsDesc: 'Find the right physiotherapist and schedule your first session.',
    noUpcoming: 'No upcoming appointment',
    noUpcomingDesc: 'Whenever you need one, booking takes a few minutes.',
    details: 'Details',
    pastLabel: 'PAST',
    noPastYet: 'No completed appointments yet.',
    noRequestsDesc: 'When you send a request to a physiotherapist, you will follow its progress here.',
    tabsHintRequests: 'Requests = waiting for the therapist to respond.',
    tabsHintAppointments: 'Appointments = confirmed by the therapist.',
    releaseBannerTitle: (n) => n === 1 ? 'Did your session take place?' : `Did your ${n} sessions take place?`,
    releaseBannerDesc: 'Your therapist marked them as done. Let us know if they actually took place — it helps us keep the service quality high. If you do not answer within 7 days, they are considered done.',
    answerYes: 'Yes, it did',
    answerNo: 'No, it did not',
    disputedNote: 'You told us this session did not take place. The Theralivo team will contact you.',
    disputedBadge: 'Under review',
    noTitle: 'The session did not take place',
    noDesc: (n) => `${n} marked this session as done. Tell us what happened and the Theralivo team will contact you.`,
    notePh: 'What happened? (optional)',
    confirmNo: 'Send',
    errAnswer: 'Your answer was not saved. Please try again.',
    statPending: 'Pending requests',
    statActive: 'Confirmed',
    statCompleted: 'Completed',
    statToRelease: 'To confirm',
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
    therapistSaysDone: 'Your therapist says this session took place. Did it?',
    autoReleaseToday: 'If you do not answer today, it is considered done',
    autoReleaseIn: (d) => `If you do not answer within ${d} ${d === 1 ? 'day' : 'days'}, it is considered done`,
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
    pendingApproval: (n) => `${n} to confirm`,
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
    releaseTitle: 'The session took place',
    releaseDesc: (n) => `Do you confirm that your session with ${n} took place?`,
    releaseAmount: 'Amount to release',
    session: 'Session',
    releaseWarnLabel: 'Note:',
    releaseWarn: 'Your answer is recorded and cannot be changed later.',
    releasing: 'Saving...',
    confirmRelease: 'Yes, it did',
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

function Avatar({ name, photoUrl, size = 44, ring = false }) {
  const ringStyle = ring ? { boxShadow: '0 0 0 3px rgba(255,255,255,0.35)' } : {};
  if (photoUrl) {
    return <img src={photoUrl} alt={name || ''} width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: C.borderSoft, ...ringStyle }} />;
  }
  return (
    <div aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},${C.brand})`, color: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, ...ringStyle }}>
      {(name || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

// Κλητική για το «Καλώς ήρθες, …»: Γιώργος → Γιώργο, Κώστας → Κώστα,
// Δημήτρης → Δημήτρη, Αλέξανδρος → Αλέξανδρε, Στέλιος → Στέλιο.
// Γυναικεία ονόματα και ό,τι δεν αναγνωρίζεται μένουν ως έχουν.
function vocative(name) {
  if (!name) return name;
  const n = name.trim();
  if (!/[\u0370-\u03FF\u1F00-\u1FFF]/.test(n)) return n;
  if (/(ας|ής|ης)$/.test(n)) return n.slice(0, -1);
  if (/ιος$/.test(n)) return n.slice(0, -1);
  if (/ος$/.test(n)) {
    const stem = n.slice(0, -2);
    const acc = stem.search(/[άέήίόύώΆΈΉΊΌΎΏ]/);
    if (acc < 0) return n.slice(0, -1);
    const after = stem.slice(acc + 1).replace(/αι|ει|οι|ου|αυ|ευ/g, 'α');
    const groups = (after.match(/[αεηιουω]+/g) || []).length;
    return groups === 0 ? n.slice(0, -1) : stem + 'ε';
  }
  return n;
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

// Περιμένει απάντηση από τον ασθενή στο «Έγινε η συνεδρία;»
// Όχι αν έχει ήδη απαντήσει, ούτε αν πέρασαν οι 7 ημέρες (τότε
// θεωρείται ότι έγινε και την κλείνει η βάση).
function needsAnswer(b) {
  if (!b || b.payment_status !== 'held' || b.patient_confirmation) return false;
  if (b.auto_release_at && new Date(b.auto_release_at) < new Date()) return false;
  return true;
}

// Τι δείχνει το badge πληρωμής/επιβεβαίωσης.
function paymentKey(b) {
  if (b.patient_confirmation === 'disputed') return 'disputed';
  if (b.payment_status === 'held' && !needsAnswer(b)) return 'released';
  return b.payment_status || 'pending';
}

function AnswerButtons({ tx, onYes, onNo, size = 'md' }) {
  const pad = size === 'sm' ? '9px 16px' : '11px 20px';
  const fs = size === 'sm' ? 13.5 : 15;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={onYes}
        style={{ padding: pad, borderRadius: RAD.button, border: 'none', background: C.success, color: C.surface, fontSize: fs, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
        <CheckCircle2 size={15} strokeWidth={2.5} />
        {tx.answerYes}
      </button>
      <button onClick={onNo}
        style={{ padding: pad, borderRadius: RAD.button, border: `1px solid ${C.border}`, background: C.surface, color: C.textBody, fontSize: fs, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
        <XCircle size={15} />
        {tx.answerNo}
      </button>
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
  const [activeTab, setActiveTab] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Κλείσιμο του μενού χρήστη με κλικ έξω ή Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  function goTab(id, anchorId) {
    setActiveTab(id);
    setTimeout(() => {
      const el = anchorId && document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 40);
  }
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [appointmentsView, setAppointmentsView] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [releaseModal, setReleaseModal] = useState(null); // { booking, request, mode: 'yes' | 'no' }
  const [disputeNote, setDisputeNote] = useState('');
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
    return d >= now || needsAnswer(a);
  });

  const pastAppointments = sortedAppointments.filter(a => {
    const d = new Date(a.session_date + 'T' + (a.session_time || '00:00'));
    return d < now && !needsAnswer(a) && a.status !== 'pending' && !(a.status === 'confirmed' && d >= now);
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

  function openReleaseModal(booking, request, mode = 'yes') {
    setDisputeNote('');
    setReleaseModal({ booking, request, mode });
  }

  // Η απάντηση πάει από τον server (/api/sessions/confirm): εκεί
  // ελέγχεται ότι το ραντεβού είναι του ασθενή και, στο «Όχι»,
  // ειδοποιείται η ομάδα με email.
  async function confirmRelease() {
    if (!releaseModal) return;
    setReleasing(true);
    const happened = releaseModal.mode !== 'no';

    let ok = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sessions/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          bookingId: releaseModal.booking.id,
          happened,
          note: happened ? '' : disputeNote,
        }),
      });
      // 409 = έχει ήδη απαντηθεί· απλώς ανανεώνουμε.
      ok = res.ok || res.status === 409;
    } catch (_) {}

    if (!ok) {
      alert(tx.errAnswer);
      setReleasing(false);
      return;
    }

    const request = releaseModal.request;
    await loadRequests(user.id);
    setReleasing(false);
    setReleaseModal(null);

    // Μετά το «Ναι», ευκαιρία για κριτική — αν δεν έχει γράψει ήδη.
    if (happened && request && !request.review) {
      setReviewModal({
        request,
        booking_id: releaseModal.booking.id,
        therapist_id: request.therapist_id,
        therapist_name: request.therapist?.name || tx.therapistFallback,
        wasCancelled: false,
      });
      setReviewForm({ rating: 0, comment: '' });
    }
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

  const heldBookings = allBookings.filter(needsAnswer);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.page }}>
      <div style={{ fontSize: 18, color: C.textMuted }}>{tx.loading}</div>
    </div>
  );

  // Τα badges λένε στον χρήστη πού υπάρχει κάτι να δει, χωρίς να
  // χρειαστεί να ανοίξει κάθε tab.
  const NAV = [
    { id: 'home', label: tx.tabHome, Icon: Home, count: 0 },
    { id: 'appointments', label: tx.tabAppointments, Icon: Calendar, count: upcomingAppointments.length },
    { id: 'requests', label: tx.tabRequests, Icon: ClipboardList, count: pendingCount },
    { id: 'services', label: tx.tabServices, Icon: Stethoscope, count: 0 },
  ];
  const PAGE_TITLE = {
    appointments: tx.tabAppointments, requests: tx.tabRequests,
    services: tx.tabServices, profile: tx.myProfile,
  };

  // ΚΑΡΤΑ ΚΟΡΥΦΗΣ ΣΤΗΝ ΑΡΧΙΚΗ
  const homeNext = upcomingAppointments.find(a =>
    a.status === 'confirmed' && new Date(a.session_date + 'T' + (a.session_time || '00:00')) >= now
  ) || null;
  const homePending = sessionRequests.find(r => r.status === 'pending') || null;

  // ΜΕΤΡΗΤΕΣ — ίδιος ορισμός με τις λίστες που ανοίγουν:
  //   Επιβεβαιωμένα = επερχόμενα ραντεβού σε κατάσταση «επιβεβαιωμένο»
  //   Ολοκληρωμένα  = ραντεβού (συνεδρίες) που ολοκληρώθηκαν
  const confirmedUpcomingCount = upcomingAppointments.filter(a => a.status === 'confirmed').length;
  const completedSessionsCount = allAppointments.filter(a => a.status === 'completed').length;

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
* { box-sizing: border-box; margin: 0; padding: 0; }
        .pd-header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.96); backdrop-filter: saturate(1.4) blur(8px); border-bottom: 1px solid ${C.border}; }
        .pd-header-in { max-width: ${MAX_WIDTH + 80}px; margin: 0 auto; display: flex; align-items: center; gap: 18px; padding: 10px clamp(14px, 3vw, 24px); min-height: 68px; }
        .pd-nav { display: flex; gap: 4px; }
        .pd-nav-desk { margin-left: 18px; }
        .pd-nav-mob { display: none; overflow-x: auto; padding: 0 12px 10px; -webkit-overflow-scrolling: touch; }
        .pd-nav-mob::-webkit-scrollbar { display: none; }
        .pd-navbtn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; border: none; background: transparent; color: ${C.textMuted}; font-size: 14.5px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: background .15s, color .15s; }
        .pd-navbtn:hover { color: ${C.brand}; background: ${C.surfaceAlt}; }
        .pd-navbtn.on { background: ${C.accentSoft}; color: ${C.accent}; }
        .pd-count { background: ${C.accent}; color: #fff; font-size: 11px; font-weight: 700; min-width: 19px; height: 19px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; }
        .pd-userbtn { display: flex; align-items: center; gap: 10px; padding: 5px 8px 5px 5px; border-radius: 14px; border: 1px solid transparent; background: transparent; cursor: pointer; font-family: inherit; text-align: left; }
        .pd-userbtn:hover { background: ${C.surfaceAlt}; border-color: ${C.border}; }
        .pd-menu { position: absolute; right: 0; top: calc(100% + 8px); width: 250px; background: #fff; border: 1px solid ${C.border}; border-radius: 14px; box-shadow: 0 16px 40px rgba(15,23,42,0.14); overflow: hidden; z-index: 200; }
        .pd-menuitem { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px; border: none; background: #fff; color: ${C.textBody}; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none; text-align: left; }
        .pd-menuitem:hover { background: ${C.surfaceAlt}; }
        @media (max-width: 899px) {
          .pd-nav-desk { display: none; }
          .pd-nav-mob { display: flex; }
          .pd-username { display: none; }
          .pd-header-in { min-height: 60px; }
        }

        .pd-hero { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; background: linear-gradient(120deg, ${C.brand} 0%, #23466e 100%); border-radius: 20px; padding: 24px 28px; margin-bottom: 20px; box-shadow: 0 8px 28px rgba(26,46,68,0.16); }
        .pd-hero-wait { background: linear-gradient(120deg, #1f3a5c 0%, #2b4f7a 100%); }
        .pd-hero-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.14); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pd-hero-actions { display: flex; flex-direction: column; align-items: stretch; gap: 8px; flex-shrink: 0; }
        .pd-hero-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 26px; border-radius: 14px; border: none; background: #fff; color: ${C.accent}; font-size: 15.5px; font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: none; white-space: nowrap; }
        .pd-hero-btn:hover { background: #f0f6ff; }
        .pd-hero-link { text-align: center; color: rgba(255,255,255,0.85); font-size: 13.5px; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .pd-pill-ok { display: inline-flex; align-items: center; gap: 5px; background: rgba(34,197,94,0.18); color: #bbf7d0; border: 1px solid rgba(134,239,172,0.4); padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        @media (max-width: 640px) {
          .pd-hero { padding: 20px; }
          .pd-hero-actions { width: 100%; }
        }

        .pd-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
        @media (max-width: 760px) { .pd-stats { gap: 8px; } }
        .pd-stat { display: flex; align-items: center; gap: 14px; min-height: 96px; padding: 16px 18px; background: #fff; border: 1px solid ${C.border}; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); cursor: pointer; font-family: inherit; transition: box-shadow .15s, border-color .15s, transform .15s; }
        .pd-stat:hover { border-color: ${C.accentBorder}; box-shadow: 0 6px 18px rgba(15,23,42,0.07); transform: translateY(-1px); }
        .pd-stat-icon { width: 54px; height: 54px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pd-stat-arrow { width: 34px; height: 34px; border-radius: 50%; background: ${C.surfaceAlt}; color: ${C.textMuted}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        @media (max-width: 760px) {
          .pd-stat { flex-direction: column; align-items: flex-start; gap: 8px; min-height: 0; padding: 12px; border-radius: 14px; }
          .pd-stat-icon { width: 38px; height: 38px; }
          .pd-stat-icon svg { width: 19px; height: 19px; }
          .pd-stat-label { font-size: 12.5px !important; line-height: 1.3; }
          .pd-stat-arrow { display: none; }
        }

        .pd-panel { background: #fff; border: 1px solid ${C.border}; border-radius: 18px; padding: 20px 22px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pd-empty-icon { width: 92px; height: 92px; border-radius: 50%; background: ${C.accentSoft}; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
        .pd-cta { display: inline-flex; align-items: center; gap: 8px; padding: 13px 26px; border-radius: 999px; background: ${C.accent}; color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 6px 16px rgba(42,111,219,0.25); }
        .pd-cta:hover { filter: brightness(1.06); }
        .pd-apt { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid ${C.border}; border-radius: 14px; flex-wrap: wrap; }
        .pd-apt-btn { padding: 9px 16px; border-radius: 10px; border: 1px solid ${C.border}; background: #fff; color: ${C.brand}; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .pd-apt-btn:hover { border-color: ${C.accentBorder}; color: ${C.accent}; }
        @media (max-width: 560px) {
          .pd-apt { display: grid; grid-template-columns: 48px minmax(0, 1fr); column-gap: 12px; row-gap: 10px; }
          .pd-apt-badge { grid-column: 2; justify-self: start; }
          .pd-apt-btn { grid-column: 1 / -1; width: 100%; }
        }
`}</style>

      {/* ═══ HEADER ═══
          Λογότυπο · κύριο μενού · χρήστης. Στο κινητό το μενού πέφτει σε
          δεύτερη γραμμή που κυλάει οριζόντια, με μεγάλα σημεία αφής. */}
      <header className="pd-header">
        <div className="pd-header-in">
          <a href="/" aria-label="Theralivo" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <Logo variant="primary" tone="dark" size={30} />
          </a>

          <nav className="pd-nav pd-nav-desk" aria-label={tx.navLabel}>
            {NAV.map(t => (
              <button key={t.id} className={`pd-navbtn${activeTab === t.id ? ' on' : ''}`} aria-current={activeTab === t.id ? 'page' : undefined} onClick={() => goTab(t.id)}>
                <t.Icon size={17} />
                {t.label}
                {t.count > 0 && <span className="pd-count">{t.count}</span>}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', minWidth: 0 }}>
            <span className="pd-lang"><LanguageSwitcher color={C.textMuted} hoverColor={C.brand} navHeight={64} /></span>
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button className="pd-userbtn" onClick={() => setMenuOpen(o => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
                <Avatar name={profile?.name || user?.email} size={38} />
                <span className="pd-username">
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{profile?.name?.split(' ')[0] || tx.welcomeFallback}</span>
                  <span style={{ display: 'block', fontSize: 12, color: C.textMuted }}>{tx.roleBadge}</span>
                </span>
                <ChevronDown size={16} color={C.textMuted} />
              </button>
              {menuOpen && (
                <div role="menu" className="pd-menu">
                  <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.borderSoft}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{profile?.name || tx.welcomeFallback}</div>
                    <div style={{ fontSize: 12.5, color: C.textMuted, wordBreak: 'break-all' }}>{user?.email}</div>
                  </div>
                  <button role="menuitem" className="pd-menuitem" onClick={() => { setMenuOpen(false); goTab('profile'); }}><User size={16} />{tx.myProfile}</button>
                  <a role="menuitem" className="pd-menuitem" href="/"><Globe size={16} />{tx.backToSite}</a>
                  <button role="menuitem" className="pd-menuitem" style={{ color: C.danger }} onClick={signOut}><LogOut size={16} />{tx.signOut}</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="pd-nav pd-nav-mob" aria-label={tx.navLabel}>
          {NAV.map(t => (
            <button key={t.id} className={`pd-navbtn${activeTab === t.id ? ' on' : ''}`} aria-current={activeTab === t.id ? 'page' : undefined} onClick={() => goTab(t.id)}>
              <t.Icon size={16} />
              {t.label}
              {t.count > 0 && <span className="pd-count">{t.count}</span>}
            </button>
          ))}
        </nav>
      </header>

      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '28px clamp(14px, 3vw, 24px) 48px' }}>

        {activeTab === 'home' ? (
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 'clamp(26px, 3.4vw, 34px)', fontWeight: 700, color: C.brand, letterSpacing: '-0.01em' }}>
              {tx.welcome(vocative(profile?.name?.split(' ')[0]) || tx.welcomeFallback)}
            </h1>
            <p style={{ fontSize: 15.5, color: C.textMuted, marginTop: 6 }}>{tx.welcomeSub}</p>
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.brand }}>{PAGE_TITLE[activeTab]}</h1>
            {(activeTab === 'appointments' || activeTab === 'requests') && (
              <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                {activeTab === 'requests' ? tx.tabsHintRequests : tx.tabsHintAppointments}
              </p>
            )}
          </div>
        )}

        <EmailVerifyBanner profile={profile} email={user?.email} role="patient" lang={lang} />

        {/* «ΕΓΙΝΕ Η ΣΥΝΕΔΡΙΑ;» — ο φυσικοθεραπευτής τη δήλωσε ολοκληρωμένη και
            ο ασθενής απαντά Ναι/Όχι, κατευθείαν από εδώ. Είναι
            το μόνο που ΠΡΕΠΕΙ να κάνει ο ασθενής, γι' αυτό μπαίνει
            στην Αρχική και στα Ραντεβού. */}
        {heldBookings.length > 0 && (activeTab === 'home' || activeTab === 'appointments') && (
          <div style={{ background: C.warnBg, border: `1px solid ${C.warn}`, borderRadius: RAD.card, padding: '18px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: RAD.button, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={24} color={C.warn} strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.warn, marginBottom: 4 }}>
                  {tx.releaseBannerTitle(heldBookings.length)}
                </div>
                <div style={{ fontSize: 14, color: C.warn, lineHeight: 1.5 }}>
                  {tx.releaseBannerDesc}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {heldBookings.map(b => {
                const req = sessionRequests.find(r => r.id === b.request_id);
                const d = new Date(b.session_date + 'T12:00:00');
                return (
                  <div key={b.id} style={{ background: C.surface, borderRadius: RAD.button, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{req?.therapist?.name || tx.therapistFallback}</div>
                      <div style={{ fontSize: 13, color: C.textMuted }}>
                        {d.toLocaleDateString(loc, { weekday: 'short', day: '2-digit', month: 'long' })} {tx.at} {b.session_time?.slice(0, 5)}
                      </div>
                    </div>
                    <AnswerButtons tx={tx} size="sm"
                      onYes={() => openReleaseModal(b, req, 'yes')}
                      onNo={() => openReleaseModal(b, req, 'no')} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ΑΡΧΙΚΗ ═══ */}
        {activeTab === 'home' && (
          <div>
            {/* ΚΑΡΤΑ ΚΟΡΥΦΗΣ — προσαρμόζεται στον ασθενή:
                  επιβεβαιωμένο ραντεβού → το επόμενο ραντεβού
                  εκκρεμές αίτημα        → η κατάστασή του
                  τίποτα                 → «Κλείσε ραντεβού» */}
            {homeNext ? (() => {
              const friendly = friendlyDateLabel(homeNext.session_date);
              return (
                <div className="pd-hero">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <Avatar name={homeNext.therapist?.name} photoUrl={homeNext.therapist?.photo_url} size={64} ring />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)' }}>{tx.nextAppointment}</span>
                        <span className="pd-pill-ok"><CheckCircle2 size={13} />{tx.confirmedBadge}</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{homeNext.therapist?.name || tx.therapistFallback}</div>
                      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>{tx.physioRole}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <CalendarDays size={17} color="rgba(255,255,255,0.8)" />
                        {friendly && friendly !== tx.pastLabel ? <span style={{ color: '#bfdbfe' }}>{friendly.charAt(0)}{friendly.slice(1).toLowerCase()} ·</span> : null}
                        {formatFullDate(homeNext.session_date)} · {homeNext.session_time?.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                  <div className="pd-hero-actions">
                    <button className="pd-hero-btn" onClick={() => goTab('appointments')}>{tx.viewDetails}<ArrowRight size={16} /></button>
                    <a className="pd-hero-link" href="/dashboard/patient/new-request">{tx.bookNew}</a>
                  </div>
                </div>
              );
            })() : homePending ? (() => {
              const b = homePending.bookings?.[0];
              const due = homePending.sla_due_at ? new Date(homePending.sla_due_at) : null;
              return (
                <div className="pd-hero pd-hero-wait">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Hourglass size={28} color="#fde68a" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{tx.pendingHeroEyebrow}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{tx.pendingHeroTitle(homePending.therapist?.name)}</div>
                      {homePending.therapist?.name && <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)' }}>{tx.physioRole}</div>}
                      {b && (
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <CalendarDays size={17} color="rgba(255,255,255,0.8)" />
                          {formatFullDate(b.session_date)} · {b.session_time?.slice(0, 5)}
                        </div>
                      )}
                      {due && due > new Date() && (
                        <div style={{ fontSize: 13, color: '#fde68a', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} />{tx.replyBy(due.toLocaleString(loc, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pd-hero-actions">
                    <button className="pd-hero-btn" onClick={() => goTab('requests')}>{tx.viewRequest}<ArrowRight size={16} /></button>
                    <a className="pd-hero-link" href="/dashboard/patient/new-request">{tx.bookNew}</a>
                  </div>
                </div>
              );
            })() : (
              <div className="pd-hero">
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 0 }}>
                  <div className="pd-hero-icon"><Stethoscope size={30} color="#fff" /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'clamp(19px, 2.4vw, 23px)', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{tx.ctaTitle}</div>
                    <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)' }}>{tx.ctaDesc}</div>
                  </div>
                </div>
                <div className="pd-hero-actions">
                  <a className="pd-hero-btn" href="/dashboard/patient/new-request">{tx.ctaBtn}<ArrowRight size={16} /></a>
                </div>
              </div>
            )}

            {/* ΤΡΕΙΣ ΚΑΡΤΕΣ — μετράνε ό,τι δείχνουν οι αντίστοιχες λίστες */}
            <div className="pd-stats">
              {[
                { key: 'requests', label: tx.statPending, value: pendingCount, Icon: FileText, tone: { bg: '#fff7ed', fg: '#ea580c' }, go: () => goTab('requests') },
                { key: 'confirmed', label: tx.statActive, value: confirmedUpcomingCount, Icon: CalendarDays, tone: { bg: '#ecfdf3', fg: '#16a34a' }, go: () => { setAppointmentsView('list'); goTab('appointments'); } },
                { key: 'done', label: tx.statCompleted, value: completedSessionsCount, Icon: CheckCircle2, tone: { bg: C.accentSoft, fg: C.accent }, go: () => { setAppointmentsView('list'); goTab('appointments', 'pd-past'); } },
              ].map(c => (
                <button key={c.key} className="pd-stat" onClick={c.go}>
                  <span className="pd-stat-icon" style={{ background: c.tone.bg, color: c.tone.fg }}><c.Icon size={24} /></span>
                  <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <span className="pd-stat-label" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.textBody }}>{c.label}</span>
                    <span style={{ display: 'block', fontSize: 30, fontWeight: 800, color: c.value > 0 ? C.brand : C.textFaint, lineHeight: 1.15 }}>{c.value}</span>
                  </span>
                  <span className="pd-stat-arrow"><ChevronRight size={18} /></span>
                </button>
              ))}
            </div>

            {/* ΕΠΕΡΧΟΜΕΝΑ */}
            <div className="pd-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.brand }}>{tx.upcomingTitle}</h2>
                {upcomingAppointments.length > 0 && (
                  <button onClick={() => goTab('appointments')} style={{ background: 'transparent', border: 'none', color: C.accent, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {tx.seeAll}<ChevronRight size={15} />
                  </button>
                )}
              </div>

              {upcomingAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 12px 18px' }}>
                  <div className="pd-empty-icon"><CalendarDays size={40} color={C.accent} /></div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.brand, marginBottom: 6 }}>{pastAppointments.length > 0 ? tx.noUpcoming : tx.noAppointments}</div>
                  <div style={{ fontSize: 14.5, color: C.textMuted, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.55 }}>
                    {pastAppointments.length > 0 ? tx.noUpcomingDesc : tx.noAppointmentsDesc}
                  </div>
                  <a href="/dashboard/patient/new-request" className="pd-cta">{pastAppointments.length > 0 ? tx.bookNew : tx.bookFirst}<ArrowRight size={16} /></a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcomingAppointments.slice(0, 3).map(apt => {
                    const st = statusLabel(BOOKING_STATUS, apt.status);
                    return (
                      <div key={apt.id} className="pd-apt">
                        <Avatar name={apt.therapist?.name} photoUrl={apt.therapist?.photo_url} size={48} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text }}>{apt.therapist?.name || tx.therapistFallback}</div>
                          <div style={{ fontSize: 13.5, color: C.textMuted, display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><CalendarDays size={14} />{formatFullDate(apt.session_date)}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={14} />{apt.session_time?.slice(0, 5)}</span>
                          </div>
                        </div>
                        <span className="pd-apt-badge"><Badge label={st.label} bg={st.bg} color={st.color} /></span>
                        <button className="pd-apt-btn" onClick={() => goTab('appointments')}>{tx.details}</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

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
              <div className="pd-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="pd-empty-icon"><CalendarDays size={40} color={C.accent} /></div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.brand, marginBottom: 6 }}>{tx.noAppointments}</div>
                <div style={{ fontSize: 14.5, color: C.textMuted, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.55 }}>{tx.noAppointmentsDesc}</div>
                <a href="/dashboard/patient/new-request" className="pd-cta">{tx.bookFirst}<ArrowRight size={16} /></a>
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
                        const payStatus = paymentKey(apt);
                        const payInfo = statusLabel(PAYMENT_STATUS, payStatus);
                        const isHeld = needsAnswer(apt);
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
                                <AnswerButtons tx={tx}
                                  onYes={() => openReleaseModal(apt, apt.request, 'yes')}
                                  onNo={() => openReleaseModal(apt, apt.request, 'no')} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pastAppointments.length === 0 && upcomingAppointments.length > 0 && (
                  <div id="pd-past" style={{ fontSize: 14, color: C.textMuted, padding: '4px 2px', scrollMarginTop: 140 }}>{tx.noPastYet}</div>
                )}

                {pastAppointments.length > 0 && (
                  <div id="pd-past" style={{ scrollMarginTop: 140 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textBody, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ChevronLeft size={16} color={C.textMuted} />
                      {tx.past(pastAppointments.length)}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pastAppointments.map(apt => {
                        const bSt = statusLabel(BOOKING_STATUS, apt.status);
                        const payStatus = paymentKey(apt);
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
              <div className="pd-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="pd-empty-icon"><ClipboardList size={38} color={C.accent} /></div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.brand, marginBottom: 6 }}>{tx.noRequests}</div>
                <div style={{ fontSize: 14.5, color: C.textMuted, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.55 }}>{tx.noRequestsDesc}</div>
                <a href="/dashboard/patient/new-request" className="pd-cta">{tx.bookFirst}<ArrowRight size={16} /></a>
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
              const reqHeldBookings = req.bookings.filter(needsAnswer);

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
                          const payStatus = paymentKey(b);
                          const payInfo = statusLabel(PAYMENT_STATUS, payStatus);
                          const isHeld = needsAnswer(b);
                          const isDisputed = b.patient_confirmation === 'disputed';
                          const daysLeft = isHeld ? daysUntilAutoRelease(b.auto_release_at) : null;

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
                                {b.status === 'completed' && (isDisputed
                                  ? <Badge label={tx.disputedBadge} bg={C.dangerBg} color={C.danger} icon={AlertCircle} />
                                  : <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                )}
                              </div>
                              {isDisputed && (
                                <div style={{ fontSize: 12.5, color: C.danger, lineHeight: 1.5 }}>{tx.disputedNote}</div>
                              )}

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
                                  <AnswerButtons tx={tx} size="sm"
                                    onYes={() => openReleaseModal(b, req, 'yes')}
                                    onNo={() => openReleaseModal(b, req, 'no')} />
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

      {/* «ΕΓΙΝΕ Η ΣΥΝΕΔΡΙΑ;» — επιβεβαίωση Ναι / Όχι */}
      {releaseModal && (() => {
        const isNo = releaseModal.mode === 'no';
        const tName = releaseModal.request?.therapist?.name || tx.therapistFallback;
        const bk = releaseModal.booking;
        return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget && !releasing) setReleaseModal(null); }}>
          <div style={{ background: C.surface, borderRadius: 20, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: isNo ? C.dangerBg : C.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              {isNo
                ? <XCircle size={30} color={C.danger} strokeWidth={2.2} />
                : <CheckCircle2 size={30} color={C.success} strokeWidth={2.2} />}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12, textAlign: 'center' }}>
              {isNo ? tx.noTitle : tx.releaseTitle}
            </h2>
            <p style={{ fontSize: 15, color: C.textMuted, marginBottom: 16, lineHeight: 1.6, textAlign: 'center' }}>
              {isNo ? tx.noDesc(tName) : tx.releaseDesc(tName)}
            </p>

            {bk?.session_date && (
              <div style={{ background: C.page, border: `1px solid ${C.border}`, borderRadius: RAD.button, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: C.text, textAlign: 'center', fontWeight: 600 }}>
                {tx.session}: {new Date(bk.session_date + 'T12:00:00').toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' })} {tx.at} {bk.session_time?.slice(0, 5)}
              </div>
            )}

            {isNo && (
              <textarea
                value={disputeNote}
                onChange={e => setDisputeNote(e.target.value)}
                placeholder={tx.notePh}
                rows={3}
                maxLength={1000}
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: C.text, resize: 'vertical', marginBottom: 16 }}
              />
            )}

            <div style={{ background: C.page, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: C.textMuted, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={16} color={C.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>{tx.releaseWarnLabel}</strong> {tx.releaseWarn}</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReleaseModal(null)} disabled={releasing}
                style={{ flex: 1, padding: '14px', borderRadius: RAD.button, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 15, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {tx.dismiss}
              </button>
              <button onClick={confirmRelease} disabled={releasing}
                style={{ flex: 2, padding: '14px', borderRadius: RAD.button, border: 'none', background: releasing ? C.textFaint : (isNo ? C.danger : C.success), color: C.surface, fontSize: 15, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                {isNo ? <XCircle size={16} strokeWidth={2.5} /> : <CheckCircle2 size={16} strokeWidth={2.5} />}
                {releasing ? tx.releasing : (isNo ? tx.confirmNo : tx.confirmRelease)}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

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