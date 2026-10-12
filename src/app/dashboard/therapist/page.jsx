'use client';
import { useState, useEffect, useRef } from 'react';
import ProfileChecklist from '@/components/ProfileChecklist';
import CancelBookingModal from '@/components/CancelBookingModal';
import { VIEW_SITE_KEY } from '@/components/TherapistGuard';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RescheduleModal from '@/components/RescheduleModal';
import { searchAreas, canonicalArea, phonetic } from '@/lib/areas';
import ConditionPicker from '@/components/ConditionPicker';
import { C, R as RAD, T, F, MAX_WIDTH, card, btn, badge } from '@/lib/tokens';
import ReportModal from '@/components/ReportModal';
import StepPlan from '@/components/onboarding/StepPlan';
import Logo, { BRAND } from '@/components/Logo';
import EmailVerifyBanner from '@/components/EmailVerifyBanner';
import AvailabilityCalendar from '@/components/therapist/AvailabilityCalendar';
import {
  LayoutDashboard, ClipboardList, Calendar, MapPin, Target, Star, User, Clock, AlertTriangle, UserX,
  Upload, Home, MessageSquare, Check, X, Lock, CalendarClock, ChevronLeft, ChevronRight,
  Plus, Lightbulb, Camera, Pencil, CheckCircle2, Save, FileText, GraduationCap, Award, Eye, Trash2,
  Wallet, Hourglass, CalendarDays, List, Globe, Info, Copy, Ban, Repeat, CreditCard, LogOut,
} from 'lucide-react';

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

// ─── Status maps ──────────────────────────────────────────────────────
// ΟΡΟΛΟΓΙΑ (ίδια σε ΟΛΟ το προϊόν):
//   Αίτημα → Επιβεβαιωμένο ραντεβού → Ολοκληρωμένη συνεδρία → Αξιολόγηση
const STATUS = {
  pending:   { el: 'Εκκρεμεί',        en: 'Pending',   bg: C.warnBg, color: C.warn },
  confirmed: { el: 'Επιβεβαιωμένο',   en: 'Confirmed', bg: C.infoBg, color: C.info },
  completed: { el: 'Ολοκληρώθηκε',    en: 'Completed', bg: C.infoBg, color: C.info },
  cancelled: { el: 'Ακυρώθηκε',       en: 'Cancelled', bg: C.dangerBg, color: C.danger },
  no_show:   { el: 'Δεν εμφανίστηκε', en: 'No show',   bg: C.dangerBg, color: C.danger },
};

const PAYMENT_STATUS = {
  pending:  { el: 'Σε αναμονή',            en: 'Awaiting',         bg: C.borderSoft, color: C.textBody, icon: Hourglass },
  held:     { el: 'Αναμονή επιβεβαίωσης',  en: 'Awaiting confirm', bg: C.warnBg, color: C.warn, icon: Hourglass },
  released: { el: 'Ολοκληρώθηκε',          en: 'Closed',           bg: C.successBg, color: C.success, icon: CheckCircle2 },
  refunded: { el: 'Επιστράφηκε',           en: 'Refunded',         bg: C.dangerBg, color: C.danger, icon: X },
  disputed: { el: 'Υπό εξέταση',           en: 'Under review',     bg: C.dangerBg, color: C.danger, icon: AlertTriangle },
};

// ─── Translations ─────────────────────────────────────────────────────
const TX = {
  el: {
    roleBadge: 'Φυσικοθεραπευτής',
    site: 'Site',
    viewSiteTitle: 'Δες το site όπως το βλέπει ο ασθενής',
    signOut: 'Αποσύνδεση',
    loading: 'Φόρτωση...',
    awaitingApproval: 'Εκκρεμεί έγκριση admin',
    unknown: 'Άγνωστος',

    tabOverview: 'Επισκόπηση',
    tabRequests: 'Αιτήματα',
    tabAppointments: 'Ραντεβού',
    tabAvailability: 'Διαθεσιμότητα',
    tabProfile: 'Προφίλ',

    todayTitle: 'Σήμερα',
    todayNewRequests: 'νέα αιτήματα',
    todayNewRequest: 'νέο αίτημα',
    todayReschedules: 'προτάσεις αλλαγής ώρας',
    todayReschedule: 'πρόταση αλλαγής ώρας',
    todayNothing: 'Είσαι εντάξει για σήμερα.',
    todayNothingSub: 'Θα σε ενημερώσουμε μόλις έρθει νέο αίτημα ή αλλαγή σε ραντεβού.',
    seeRequests: 'Δες τα αιτήματα',
    todaySchedule: 'Το πρόγραμμά σου σήμερα',
    noSessionsToday: 'Δεν έχεις ραντεβού σήμερα.',
    financeTitle: 'Οικονομικά',
    earningsUpcoming: 'Αναμενόμενα',
    earningsUpcomingSub: (n) => `${n} ${n === 1 ? 'επιβεβαιωμένη συνεδρία' : 'επιβεβαιωμένες συνεδρίες'}`,
    earningsDone: 'Εισπραγμένα',
    earningsDoneSub: (n) => `${n} ${n === 1 ? 'ολοκληρωμένη συνεδρία' : 'ολοκληρωμένες συνεδρίες'}`,
    owedTitle: 'Οφειλή πλατφόρμας',
    owedNone: 'Καμία οφειλή',
    owedOpenShort: 'Ανεξόφλητα',
    howPaymentsWork: 'Πώς λειτουργούν οι πληρωμές',

    payModalTitle: 'Πώς λειτουργούν οι πληρωμές',
    payModalCash: 'Ο ασθενής σε πληρώνει απευθείας σε μετρητά μετά από κάθε συνεδρία. Η πλατφόρμα δεν κρατάει τίποτα από το ποσό της συνεδρίας.',
    payModalYourPrice: 'Η τιμή σου ανά συνεδρία',
    payModalSubscription: 'Μηνιαία συνδρομή',
    payModalFirstFee: 'Τέλος νέου ασθενή',
    payModalPerNewPatient: 'ανά νέο ασθενή',
    payModalFeeExplain: 'Χρεώνεσαι μία φορά για κάθε νέο ασθενή, με κάρτα, τη στιγμή που αποδέχεσαι το αίτημα. Στις επόμενες συνεδρίες με τον ίδιο ασθενή δεν χρεώνεσαι ξανά.',
    payModalOpen: 'Ανεξόφλητα αυτή τη στιγμή',
    payModalPromo: 'Κωδικός προσφοράς',
    payModalPromoUntil: (d) => `έως ${d}`,
    noPlan: 'Χωρίς ενεργή συνδρομή',
    close: 'Κλείσιμο',

    requestsPending: 'Εκκρεμούν απάντηση',
    requestsAll: 'Όλα',
    noRequestsYet: 'Δεν υπάρχουν αιτήματα ακόμα',
    noPendingRequests: 'Δεν εκκρεμεί κανένα αίτημα.',
    details: 'Λεπτομέρειες',
    hideDetails: 'Απόκρυψη',
    noDescription: 'Χωρίς περιγραφή',
    notes: 'Πρόσβαση:',
    reject: 'Απόρριψη',
    acceptRequest: 'Αποδοχή',
    accepting: 'Αποδοχή...',
    cancelWholeRequest: 'Ακύρωση ραντεβού',
    youEarn: 'Εισπράττεις',
    respondFast: 'Απάντησε γρήγορα — ο ασθενής περιμένει.',
    acceptWithFee: (fee) => `Αποδοχή · ${fee}€`,
    feeNotice: (fee) => `Νέος ασθενής: τέλος ${fee}€, με κάρτα κατά την αποδοχή.`,
    acceptErr: {
      expired: 'Η προθεσμία απάντησης έληξε. Το αίτημα δεν μπορεί πλέον να γίνει αποδεκτό.',
      too_late: 'Η ώρα του ραντεβού έχει ήδη περάσει.',
      not_pending: 'Το αίτημα δεν περιμένει πλέον απάντηση.',
      forbidden: 'Δεν έχεις πρόσβαση σε αυτό το αίτημα.',
      not_approved: 'Η πληρωμή γίνεται μόλις εγκριθεί το προφίλ σου.',
      payments_unavailable: 'Οι πληρωμές δεν είναι διαθέσιμες αυτή τη στιγμή. Δοκίμασε σε λίγο.',
      generic: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.',
    },
    paySuccessFee: 'Η πληρωμή ολοκληρώθηκε. Το ραντεβού επιβεβαιώνεται...',
    paySuccessFeeDone: 'Η πληρωμή ολοκληρώθηκε και το ραντεβού επιβεβαιώθηκε. Θα λάβεις απόδειξη στο email σου.',
    paySuccessPlan: 'Η πληρωμή ολοκληρώθηκε. Το πακέτο σου ενεργοποιήθηκε και το προφίλ σου εμφανίζεται στους ασθενείς.',
    payCancel: 'Η πληρωμή ακυρώθηκε. Δεν χρεώθηκες τίποτα.',
    activateTitle: 'Ενεργοποίηση λογαριασμού',
    activateDesc: (plan, price) => `Το προφίλ σου εγκρίθηκε. Για να εμφανίζεσαι στους ασθενείς, ολοκλήρωσε την πληρωμή του πακέτου «${plan}» (${price}€ για τον πρώτο μήνα).`,
    activateBtn: 'Πληρωμή & ενεργοποίηση',
    activating: 'Μεταφορά στην πληρωμή...',
    activateWaiting: (plan) => `Διάλεξες το πακέτο «${plan}». Η πληρωμή γίνεται μόλις εγκριθεί το προφίλ σου — δεν χρεώνεσαι τίποτα μέχρι τότε.`,
    dismiss: 'Κλείσιμο',
    secPlan: 'Πακέτο',
    planTitle: 'Το πακέτο σου',
    planName: 'Πακέτο',
    planMonthly: 'Μηνιαία συνδρομή',
    planFee: 'Τέλος νέου ασθενή',
    planStatus: 'Κατάσταση',
    planSince: 'Τρέχουσα περίοδος από',
    planStatuses: { active: 'Ενεργό', trialing: 'Δοκιμαστική περίοδος', past_due: 'Ληξιπρόθεσμη πληρωμή', exempt: 'Εξαίρεση' },
    planFree: 'Δωρεάν',
    changePlan: 'Αλλαγή πακέτου',
    choosePlan: 'Επιλογή πακέτου',
    noActivePlan: 'Δεν έχεις ενεργό πακέτο. Διάλεξε ένα για να εμφανίζεσαι στους ασθενείς.',
    planChanged: 'Το πακέτο σου άλλαξε.',
    planNextCharge: 'Επόμενη αυτόματη χρέωση',
    planFreeUntil: 'Δωρεάν έως',
    promoEndingTitle: (plan, d) => `Η δωρεάν περίοδος του ${plan} λήγει στις ${d}`,
    promoEndingDesc: (plan, price, d) => `Για να συνεχίσεις στο ${plan}, πρόσθεσε κάρτα. Η πρώτη χρέωση (${price}€/μήνα) θα γίνει στις ${d}, όχι νωρίτερα. Αν δεν κάνεις τίποτα, στη λήξη περνάς αυτόματα στο δωρεάν Basic.`,
    promoContinue: (plan) => `Συνέχεια στο ${plan}`,
    planEndsOn: 'Λήγει στις',
    planEndsNote: (d) => `Η αυτόματη χρέωση έχει σταματήσει. Το πακέτο σου ισχύει μέχρι τις ${d} και μετά περνάς αυτόματα στο δωρεάν πακέτο.`,
    planResume: 'Συνέχιση πακέτου',
    planResumed: 'Η συνδρομή σου συνεχίζεται κανονικά.',
    planDowngradeScheduled: (d) => d ? `Η αυτόματη χρέωση σταμάτησε. Το πακέτο σου ισχύει μέχρι τις ${d} και μετά περνάς στο δωρεάν.` : 'Η αυτόματη χρέωση σταμάτησε. Στο τέλος του μήνα περνάς στο δωρεάν πακέτο.',
    planPastDueNote: 'Η τελευταία μηνιαία χρέωση της κάρτας σου απέτυχε. Θα γίνει νέα προσπάθεια αυτόματα· αν δεν πετύχει, θα περάσεις στο δωρεάν πακέτο. Έλεγξε ότι η κάρτα σου είναι ενεργή.',
    planPendingNote: (name) => `Έχεις επιλέξει το πακέτο «${name}». Ενεργοποιείται με την ολοκλήρωση της πληρωμής — ως τότε ισχύει το τρέχον.`,
    billingSave: 'Αποθήκευση στοιχείων',

    nextAppointment: 'Επόμενο Ραντεβού',
    at: 'στις',
    awaitingYourConfirm: 'Αναμένει την επιβεβαίωσή σου στα Αιτήματα',
    noAppointments: 'Δεν έχεις ραντεβού ακόμα',
    noAppointmentsSub: 'Όταν έρθουν αιτήματα από ασθενείς, θα εμφανιστούν εδώ.',
    viewUpcoming: 'Σήμερα & επόμενα',
    viewPast: 'Παλαιότερα',
    viewCalendar: 'Ημερολόγιο',
    upcoming: (n) => `Επερχόμενα (${n})`,
    past: (n) => `Παλαιότερα (${n})`,
    noUpcoming: 'Δεν έχεις επερχόμενα ραντεβού.',
    noPast: 'Δεν υπάρχουν παλαιότερα ραντεβού.',
    markDone: 'Η συνεδρία έγινε',
    toConfirmTitle: (n) => n === 1 ? '1 συνεδρία περιμένει επιβεβαίωση' : `${n} συνεδρίες περιμένουν επιβεβαίωση`,
    toConfirmSub: 'Πάτησε «Η συνεδρία έγινε» για να περάσει από τα αναμενόμενα στα εισπραγμένα.',
    cancel: 'Ακύρωση',
    reschedule: 'Αλλαγή ώρας',
    noShow: 'Δεν εμφανίστηκε',
    reportIssue: 'Αναφορά',
    reschedulePendingYours: 'Στείλατε πρόταση',
    rescheduleReview: 'Δες την πρόταση',
    awaitingRelease: 'Αναμονή επιβεβαίωσης από τον ασθενή',
    autoReleaseToday: 'Κλείνει αυτόματα σήμερα',
    disputedTitle: 'Ο ασθενής δήλωσε ότι η συνεδρία δεν έγινε',
    disputedSub: 'Η ομάδα του Theralivo θα επικοινωνήσει μαζί σου για να το ξεκαθαρίσουμε.',
    autoReleaseIn: (d) => `Κλείνει αυτόματα σε ${d} μέρες`,
    cancelledBy: { therapist: 'Ακυρώθηκε από εσάς', patient: 'Ακυρώθηκε από τον ασθενή', admin: 'Ακυρώθηκε από την πλατφόρμα' },
    prev: 'Προηγ.',
    next: 'Επόμ.',
    today: 'Σήμερα',
    hasAppointment: 'Έχει ραντεβού',

    availTitle: 'Διαθεσιμότητα',
    availDesc: 'Δήλωσε μία φορά το εβδομαδιαίο σου πρόγραμμα και δημιούργησε ώρες για όσες εβδομάδες θέλεις.',
    modeWeekly: 'Εβδομαδιαίο πρόγραμμα',
    modeGrid: 'Λεπτομερής ρύθμιση',
    weeklyTitle: 'Το εβδομαδιαίο σου πρόγραμμα',
    weeklyDesc: 'Πρόσθεσε ένα μπλοκ ανά ημέρα. Μπορείς να έχεις πρωί και απόγευμα ξεχωριστά.',
    noBlocks: 'Δεν έχεις δηλώσει ώρες ακόμα. Πρόσθεσε το πρώτο σου μπλοκ.',
    day: 'Ημέρα',
    from: 'Από',
    to: 'Έως',
    duration: 'Διάρκεια',
    minutesShort: 'λεπτά',
    addBlock: 'Προσθήκη',
    removeBlock: 'Αφαίρεση',
    errBlockTime: 'Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.',
    generateTitle: 'Δημιουργία ωρών',
    generateDesc: 'Γεμίζει το ημερολόγιό σου από το εβδομαδιαίο πρόγραμμα. Δεν πειράζει ώρες που έχουν ήδη κλειστεί.',
    weeksAhead: 'Για πόσες εβδομάδες;',
    weeks: 'εβδομάδες',
    generateBtn: 'Δημιουργία ωρών',
    generating: 'Δημιουργία...',
    generatedOk: (n) => `Δημιουργήθηκαν ${n} νέες ώρες.`,
    generatedNone: 'Δεν χρειάστηκε καμία νέα ώρα — το ημερολόγιο ήταν ήδη γεμάτο.',
    copyWeekTitle: 'Αντιγραφή εβδομάδας',
    copyWeekDesc: 'Παίρνει τις ελεύθερες ώρες αυτής της εβδομάδας και τις επαναλαμβάνει στις επόμενες.',
    copyWeekBtn: 'Αντιγραφή',
    copying: 'Αντιγραφή...',
    copiedOk: (n) => `Αντιγράφηκαν ${n} ώρες.`,
    exceptionsTitle: 'Ημέρες που δεν δουλεύεις',
    exceptionsDesc: 'Διακοπές, αργίες, προσωπικές υποχρεώσεις. Οι ελεύθερες ώρες της ημέρας αφαιρούνται.',
    noExceptions: 'Δεν έχεις δηλώσει εξαιρέσεις.',
    exceptionNote: 'Σημείωση (προαιρετικό)',
    exceptionNotePh: 'π.χ. διακοπές',
    addException: 'Προσθήκη ημέρας',
    gridDesc: 'Κλικάρετε για να ορίσετε ή να αφαιρέσετε μεμονωμένες ώρες. Ώρες ανά 30 λεπτά, 09:00–21:00.',
    week: 'Εβδομάδα',
    hour: 'Ώρα',
    legendAvailable: 'Διαθέσιμο',
    legendBooked: 'Κλειστό (κράτηση)',
    legendUnavailable: 'Μη διαθέσιμο',
    errAuth: 'Η σύνδεσή σου έληξε. Συνδέσου ξανά.',
    errRange: 'Το διάστημα είναι πολύ μεγάλο.',

    secBasics: 'Βασικά στοιχεία',
    secBilling: 'Οικονομικά στοιχεία',
    billingTitle: 'Οικονομικά στοιχεία',
    billingDesc: 'Χρειάζονται μόνο αν εκδίδεις παραστατικό ή θέλεις να λαμβάνεις πληρωμές μέσω τραπέζης. Δεν είναι απαραίτητα για να δέχεσαι ραντεβού.',
    billingPrivacy: 'Τα στοιχεία αυτά δεν εμφανίζονται ποτέ δημόσια. Τα βλέπει μόνο η ομάδα του Theralivo.',
    fIban: 'IBAN',
    fIbanPh: 'GR00 0000 0000 0000 0000 0000 000',
    fPayoutName: 'Δικαιούχος λογαριασμού',
    fPayoutNamePh: 'Όπως αναγράφεται στην τράπεζα',
    fTaxId: 'ΑΦΜ',
    fTaxOffice: 'ΔΟΥ',
    fLegalName: 'Επωνυμία',
    fLegalNamePh: 'Αν τιμολογείς ως εταιρεία',
    fBillingAddress: 'Έδρα',
    fBillingAddressPh: 'Οδός, αριθμός, ΤΚ, πόλη',
    fKad: 'ΚΑΔ',
    fKadPh: 'Κωδικός Αριθμός Δραστηριότητας',
    billingSaved: 'Τα στοιχεία αποθηκεύτηκαν',
    errIban: 'Το IBAN φαίνεται λανθασμένο. Έλεγξέ το ή άφησέ το κενό.',
    errTaxId: 'Το ΑΦΜ πρέπει να έχει 9 ψηφία.',
    secAreas: 'Περιοχές',
    secConditions: 'Περιστατικά',
    secDocuments: 'Δικαιολογητικά',
    secReviews: 'Αξιολογήσεις',

    approvedShort: 'Επαληθευμένος',
    docsPending: 'Δικαιολογητικά εκκρεμούν',
    awaitingAdmin: 'Αναμένει έγκριση admin',
    verifiedMeaning: 'Το σήμα σημαίνει ότι η επαγγελματική σου άδεια έχει επαληθευτεί από την ομάδα μας.',
    photoHintA: 'Πάτησε',
    photoHintB: 'για αλλαγή φωτογραφίας (max 5MB)',
    editProfile: 'Επεξεργασία',
    cancelEdit: 'Ακύρωση',
    fullName: 'Ονοματεπώνυμο',
    specialty: 'Ειδικότητα',
    baseArea: 'Περιοχή Έδρας',
    pricePerSession: 'Τιμή/Συνεδρία (€25–€50)',
    priceShort: 'Τιμή συνεδρίας',
    yearsExperience: 'Χρόνια Εμπειρίας',
    yearsPh: 'π.χ. 5',
    bio: 'Σχετικά με τον Θεραπευτή',
    save: 'Αποθήκευση',
    saving: 'Αποθήκευση...',
    yearsUnit: (n) => `${n} χρόνια`,
    keepsAll: 'Κρατάς ολόκληρο το ποσό — ο ασθενής πληρώνει μετρητά.',

    areasTitle: 'Περιοχές Εξυπηρέτησης',
    areasDesc: 'Επίλεξε τις περιοχές που εξυπηρετείς. Οι ασθενείς σε αυτές τις περιοχές θα σε βρίσκουν.',
    areasSoonLabel: 'Σύντομα:',
    areasSoon: 'Ορισμός ακτίνας εξυπηρέτησης σε χάρτη (π.χ. 8 km από τη Νέα Σμύρνη).',
    areasSelected: (n) => `Επιλεγμένες περιοχές (${n})`,
    areasEmpty: 'Δεν έχεις επιλέξει ακόμα περιοχές. Ξεκίνα γράφοντας παρακάτω.',
    addArea: 'Προσθήκη περιοχής',
    areaPh: 'π.χ. Παγκράτι, Κολωνάκι...',
    add: 'Προσθήκη',
    areaHint: 'Πληκτρολόγησε για προτάσεις. Μπορείς να γράψεις και δικές σου περιοχές.',

    reviewsCount: (n) => `${n} ${n === 1 ? 'αξιολόγηση' : 'αξιολογήσεις'}`,
    noReviews: 'Δεν έχεις αξιολογήσεις ακόμη.',
    noReviewsSub: 'Θα εμφανιστούν εδώ μόλις οι ασθενείς σου αφήσουν την πρώτη.',

    documents: 'Δικαιολογητικά',
    manage: 'Διαχείριση',
    license: 'Άδεια Εξασκήσεως',
    uploaded: 'Ανέβηκε',
    missingRequired: 'Λείπει (υποχρεωτικό)',
    cv: 'Βιογραφικό',
    optional: 'Προαιρετικό',
    certifications: 'Πιστοποιητικά',
    optionalPlural: 'Προαιρετικά',
    filesCount: (n) => `${n} αρχείο/α`,

    doneModalTitle: 'Ολοκληρώθηκε η συνεδρία;',
    doneModalDesc: (n) => `Επιβεβαιώνεις ότι έγινε η συνεδρία με τον/την ${n};`,
    sessionAmount: 'Ποσό συνεδρίας',
    doneModalWarn: 'Ο ασθενής θα ειδοποιηθεί και θα έχει',
    doneModalWarnDays: '7 μέρες',
    doneModalWarnEnd: 'να επιβεβαιώσει. Αν δεν απαντήσει, η συνεδρία κλείνει αυτόματα.',
    marking: 'Καταχώρηση...',
    confirmDone: 'Ναι, ολοκληρώθηκε',

    docsModalWarnA: 'Η Άδεια Εξασκήσεως είναι υποχρεωτική.',
    docsModalWarnB: 'Μόλις την ανεβάσεις, η αίτησή σου στέλνεται στον admin για έγκριση.',
    fileHint: 'PDF, JPG, PNG · max 10 MB',
    chooseFile: 'Επιλογή Αρχείου',
    choose: 'Επιλογή',
    uploading: 'Upload...',
    view: 'Προβολή',
    remove: 'Διαγραφή',
    optionalParen: '(προαιρετικό)',
    optionalMulti: '(προαιρετικά, πολλαπλά αρχεία)',
    certLabel: (i) => `Πιστοποιητικό ${i}`,
    certHint: 'Πρόσθεσε πιστοποιήσεις, σεμινάρια, εξειδικεύσεις',

    errImageType: 'Παρακαλώ επίλεξε εικόνα (JPG, PNG, WEBP).',
    errImageSize: 'Η εικόνα είναι πολύ μεγάλη. Μέγιστο μέγεθος: 5 MB.',
    errFileType: 'Επιτρέπονται μόνο: PDF, JPG, PNG',
    errFileSize: 'Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 10 MB.',
    errUpload: 'Σφάλμα upload: ',
    errUpdate: 'Σφάλμα ενημέρωσης: ',
    errPrefix: 'Σφάλμα: ',
    confirmDelete: 'Διαγραφή αρχείου;',
    condSaved: (n) => `Αποθηκεύτηκαν ${n} ${n === 1 ? 'περιστατικό' : 'περιστατικά'}`,
    condUnsaved: 'Έχεις αλλαγές χωρίς αποθήκευση',
  },
  en: {
    roleBadge: 'Physiotherapist',
    site: 'Site',
    viewSiteTitle: 'See the site as a patient sees it',
    signOut: 'Sign out',
    loading: 'Loading...',
    awaitingApproval: 'Awaiting admin approval',
    unknown: 'Unknown',

    tabOverview: 'Overview',
    tabRequests: 'Requests',
    tabAppointments: 'Appointments',
    tabAvailability: 'Availability',
    tabProfile: 'Profile',

    todayTitle: 'Today',
    todayNewRequests: 'new requests',
    todayNewRequest: 'new request',
    todayReschedules: 'reschedule proposals',
    todayReschedule: 'reschedule proposal',
    todayNothing: "You're all set for today.",
    todayNothingSub: "We'll let you know as soon as a new request or a change comes in.",
    seeRequests: 'See requests',
    todaySchedule: 'Your schedule today',
    noSessionsToday: 'No appointments today.',
    financeTitle: 'Finances',
    earningsUpcoming: 'Expected',
    earningsUpcomingSub: (n) => `${n} confirmed ${n === 1 ? 'session' : 'sessions'}`,
    earningsDone: 'Collected',
    earningsDoneSub: (n) => `${n} completed ${n === 1 ? 'session' : 'sessions'}`,
    owedTitle: 'Owed to platform',
    owedNone: 'Nothing owed',
    owedOpenShort: 'Outstanding',
    howPaymentsWork: 'How payments work',

    payModalTitle: 'How payments work',
    payModalCash: 'Your patient pays you directly in cash after each session. The platform takes nothing from the session amount.',
    payModalYourPrice: 'Your price per session',
    payModalSubscription: 'Monthly subscription',
    payModalFirstFee: 'New patient fee',
    payModalPerNewPatient: 'per new patient',
    payModalFeeExplain: 'You are charged once per new patient, by card, when you accept the request. Follow-up sessions with the same patient are not charged again.',
    payModalOpen: 'Currently outstanding',
    payModalPromo: 'Promo code',
    payModalPromoUntil: (d) => `until ${d}`,
    noPlan: 'No active subscription',
    close: 'Close',

    requestsPending: 'Awaiting your reply',
    requestsAll: 'All',
    noRequestsYet: 'No requests yet',
    noPendingRequests: 'No requests are waiting for you.',
    details: 'Details',
    hideDetails: 'Hide',
    noDescription: 'No description',
    notes: 'Access:',
    reject: 'Decline',
    acceptRequest: 'Accept',
    accepting: 'Accepting...',
    cancelWholeRequest: 'Cancel appointment',
    youEarn: 'You earn',
    respondFast: 'Reply quickly — the patient is waiting.',
    acceptWithFee: (fee) => `Accept · €${fee}`,
    feeNotice: (fee) => `New patient: €${fee} fee, paid by card when you accept.`,
    acceptErr: {
      expired: 'The reply deadline has passed. This request can no longer be accepted.',
      too_late: 'The appointment time has already passed.',
      not_pending: 'This request is no longer awaiting a reply.',
      forbidden: 'You do not have access to this request.',
      not_approved: 'Payment opens as soon as your profile is approved.',
      payments_unavailable: 'Payments are unavailable right now. Please try again shortly.',
      generic: 'Something went wrong. Please try again.',
    },
    paySuccessFee: 'Payment complete. Confirming the appointment...',
    paySuccessFeeDone: 'Payment complete and the appointment is confirmed. A receipt is on its way to your email.',
    paySuccessPlan: 'Payment complete. Your plan is active and your profile is now visible to patients.',
    payCancel: 'Payment cancelled. You have not been charged.',
    activateTitle: 'Activate your account',
    activateDesc: (plan, price) => `Your profile has been approved. To appear to patients, complete the payment for the "${plan}" plan (€${price} for the first month).`,
    activateBtn: 'Pay & activate',
    activating: 'Opening payment...',
    activateWaiting: (plan) => `You chose the "${plan}" plan. Payment opens once your profile is approved — nothing is charged until then.`,
    dismiss: 'Dismiss',
    secPlan: 'Plan',
    planTitle: 'Your plan',
    planName: 'Plan',
    planMonthly: 'Monthly subscription',
    planFee: 'New patient fee',
    planStatus: 'Status',
    planSince: 'Current period since',
    planStatuses: { active: 'Active', trialing: 'Trial', past_due: 'Payment overdue', exempt: 'Exempt' },
    planFree: 'Free',
    changePlan: 'Change plan',
    choosePlan: 'Choose a plan',
    noActivePlan: 'You have no active plan. Pick one to appear to patients.',
    planChanged: 'Your plan has been changed.',
    planNextCharge: 'Next automatic charge',
    planFreeUntil: 'Free until',
    promoEndingTitle: (plan, d) => `Your free ${plan} period ends on ${d}`,
    promoEndingDesc: (plan, price, d) => `To stay on ${plan}, add a card. The first charge (€${price}/month) will be on ${d}, not before. If you do nothing, you move automatically to the free Basic plan when it ends.`,
    promoContinue: (plan) => `Continue with ${plan}`,
    planEndsOn: 'Ends on',
    planEndsNote: (d) => `Automatic charging has stopped. Your plan is valid until ${d}, then you move to the free plan automatically.`,
    planResume: 'Keep my plan',
    planResumed: 'Your subscription continues as normal.',
    planDowngradeScheduled: (d) => d ? `Automatic charging has stopped. Your plan is valid until ${d}, then you move to the free plan.` : 'Automatic charging has stopped. At the end of the month you move to the free plan.',
    planPastDueNote: 'Your last monthly card charge failed. It will be retried automatically; if it does not succeed, you will move to the free plan. Please check that your card is active.',
    planPendingNote: (name) => `You have chosen the "${name}" plan. It activates once the payment is complete — until then your current plan applies.`,
    billingSave: 'Save details',

    nextAppointment: 'Next Appointment',
    at: 'at',
    awaitingYourConfirm: 'Awaiting your confirmation under Requests',
    noAppointments: "You don't have any appointments yet",
    noAppointmentsSub: 'When patient requests come in, they will appear here.',
    viewUpcoming: 'Today & upcoming',
    viewPast: 'Past',
    viewCalendar: 'Calendar',
    upcoming: (n) => `Upcoming (${n})`,
    past: (n) => `Past (${n})`,
    noUpcoming: 'No upcoming appointments.',
    noPast: 'No past appointments.',
    markDone: 'Session done',
    toConfirmTitle: (n) => n === 1 ? '1 session awaiting confirmation' : `${n} sessions awaiting confirmation`,
    toConfirmSub: 'Tap “Session done” to move it from expected to collected.',
    cancel: 'Cancel',
    reschedule: 'Change time',
    noShow: 'No-show',
    reportIssue: 'Report',
    reschedulePendingYours: 'Proposal sent',
    rescheduleReview: 'Review proposal',
    awaitingRelease: 'Awaiting confirmation from the patient',
    autoReleaseToday: 'Closes automatically today',
    disputedTitle: 'The patient said this session did not take place',
    disputedSub: 'The Theralivo team will contact you to clear it up.',
    autoReleaseIn: (d) => `Closes automatically in ${d} days`,
    cancelledBy: { therapist: 'Cancelled by you', patient: 'Cancelled by the patient', admin: 'Cancelled by the platform' },
    prev: 'Prev',
    next: 'Next',
    today: 'Today',
    hasAppointment: 'Has appointment',

    availTitle: 'Availability',
    availDesc: 'Declare your weekly schedule once, then generate hours for as many weeks as you like.',
    modeWeekly: 'Weekly schedule',
    modeGrid: 'Fine tuning',
    weeklyTitle: 'Your weekly schedule',
    weeklyDesc: 'Add one block per day. You can have morning and afternoon separately.',
    noBlocks: "You haven't declared any hours yet. Add your first block.",
    day: 'Day',
    from: 'From',
    to: 'To',
    duration: 'Duration',
    minutesShort: 'min',
    addBlock: 'Add',
    removeBlock: 'Remove',
    errBlockTime: 'The end time must be after the start time.',
    generateTitle: 'Generate hours',
    generateDesc: 'Fills your calendar from the weekly schedule. It never touches hours that are already booked.',
    weeksAhead: 'For how many weeks?',
    weeks: 'weeks',
    generateBtn: 'Generate hours',
    generating: 'Generating...',
    generatedOk: (n) => `Created ${n} new hours.`,
    generatedNone: 'No new hours were needed — your calendar was already full.',
    copyWeekTitle: 'Copy week',
    copyWeekDesc: "Takes this week's free hours and repeats them in the following weeks.",
    copyWeekBtn: 'Copy',
    copying: 'Copying...',
    copiedOk: (n) => `Copied ${n} hours.`,
    exceptionsTitle: "Days you don't work",
    exceptionsDesc: 'Holidays, time off, personal commitments. Free hours on that day are removed.',
    noExceptions: 'No exceptions declared.',
    exceptionNote: 'Note (optional)',
    exceptionNotePh: 'e.g. holiday',
    addException: 'Add day',
    gridDesc: 'Click to set or remove individual hours. 30-minute slots, 09:00–21:00.',
    week: 'Week',
    hour: 'Time',
    legendAvailable: 'Available',
    legendBooked: 'Blocked (booked)',
    legendUnavailable: 'Unavailable',
    errAuth: 'Your session expired. Please sign in again.',
    errRange: 'That range is too large.',

    secBasics: 'Basic details',
    secBilling: 'Billing details',
    billingTitle: 'Billing details',
    billingDesc: 'Only needed if you issue invoices or want to receive bank payments. Not required to accept appointments.',
    billingPrivacy: 'These details are never shown publicly. Only the Theralivo team can see them.',
    fIban: 'IBAN',
    fIbanPh: 'GR00 0000 0000 0000 0000 0000 000',
    fPayoutName: 'Account holder',
    fPayoutNamePh: 'As it appears at your bank',
    fTaxId: 'Tax ID (ΑΦΜ)',
    fTaxOffice: 'Tax office (ΔΟΥ)',
    fLegalName: 'Legal name',
    fLegalNamePh: 'If you invoice as a company',
    fBillingAddress: 'Registered address',
    fBillingAddressPh: 'Street, number, postcode, city',
    fKad: 'Activity code (ΚΑΔ)',
    fKadPh: 'Business activity code',
    billingSaved: 'Details saved',
    errIban: 'That IBAN looks wrong. Check it or leave it empty.',
    errTaxId: 'Tax ID must be 9 digits.',
    secAreas: 'Areas',
    secConditions: 'Cases',
    secDocuments: 'Documents',
    secReviews: 'Reviews',

    approvedShort: 'Verified',
    docsPending: 'Documents pending',
    awaitingAdmin: 'Awaiting admin approval',
    verifiedMeaning: 'The badge means your professional licence has been verified by our team.',
    photoHintA: 'Click',
    photoHintB: 'to change your photo (max 5MB)',
    editProfile: 'Edit',
    cancelEdit: 'Cancel',
    fullName: 'Full Name',
    specialty: 'Specialty',
    baseArea: 'Base Area',
    pricePerSession: 'Price/Session (€25–€50)',
    priceShort: 'Session price',
    yearsExperience: 'Years of Experience',
    yearsPh: 'e.g. 5',
    bio: 'About the therapist',
    save: 'Save',
    saving: 'Saving...',
    yearsUnit: (n) => `${n} years`,
    keepsAll: 'You keep the full amount — the patient pays cash.',

    areasTitle: 'Service Areas',
    areasDesc: 'Choose the areas you cover. Patients in those areas will find you.',
    areasSoonLabel: 'Coming soon:',
    areasSoon: 'Set a service radius on a map (e.g. 8 km from Nea Smyrni).',
    areasSelected: (n) => `Selected areas (${n})`,
    areasEmpty: "You haven't selected any areas yet. Start typing below.",
    addArea: 'Add an area',
    areaPh: 'e.g. Pangrati, Kolonaki...',
    add: 'Add',
    areaHint: 'Type to see suggestions. You can also enter your own areas.',

    reviewsCount: (n) => `${n} ${n === 1 ? 'review' : 'reviews'}`,
    noReviews: "You don't have any reviews yet.",
    noReviewsSub: 'They will appear here once your patients leave the first one.',

    documents: 'Documents',
    manage: 'Manage',
    license: 'Practising Licence',
    uploaded: 'Uploaded',
    missingRequired: 'Missing (required)',
    cv: 'CV',
    optional: 'Optional',
    certifications: 'Certifications',
    optionalPlural: 'Optional',
    filesCount: (n) => `${n} file(s)`,

    doneModalTitle: 'Session completed?',
    doneModalDesc: (n) => `Do you confirm the session with ${n} took place?`,
    sessionAmount: 'Session amount',
    doneModalWarn: 'The patient will be notified and will have',
    doneModalWarnDays: '7 days',
    doneModalWarnEnd: 'to confirm. If they do not respond, the session closes automatically.',
    marking: 'Saving...',
    confirmDone: 'Yes, it is done',

    docsModalWarnA: 'The Practising Licence is required.',
    docsModalWarnB: 'Once you upload it, your application is sent to the admin for approval.',
    fileHint: 'PDF, JPG, PNG · max 10 MB',
    chooseFile: 'Choose File',
    choose: 'Choose',
    uploading: 'Uploading...',
    view: 'View',
    remove: 'Delete',
    optionalParen: '(optional)',
    optionalMulti: '(optional, multiple files)',
    certLabel: (i) => `Certificate ${i}`,
    certHint: 'Add certifications, seminars, specializations',

    errImageType: 'Please choose an image (JPG, PNG, WEBP).',
    errImageSize: 'That image is too large. Maximum size: 5 MB.',
    errFileType: 'Only PDF, JPG and PNG are allowed',
    errFileSize: 'That file is too large. Maximum size: 10 MB.',
    errUpload: 'Upload error: ',
    errUpdate: 'Update error: ',
    errPrefix: 'Error: ',
    confirmDelete: 'Delete this file?',
    condSaved: (n) => `Saved ${n} ${n === 1 ? 'case' : 'cases'}`,
    condUnsaved: 'You have unsaved changes',
  },
};

// Το status ΔΕΝ έχει ποτέ σκέτο 'cancelled'. Το check constraint της βάσης
// επιτρέπει μόνο: cancelled_by_therapist | cancelled_by_patient |
// cancelled_by_admin. Έλεγχος με === 'cancelled' δεν ταιριάζει ΠΟΤΕ.
const isCancelled = (s) => String(s || '').startsWith('cancelled');

function Avatar({ name, photoUrl, size = 48 }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},${C.brand})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function Badge({ label, bg, color, icon: Icon }) {
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: RAD.pill, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

function ReviewStars({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= (rating || 0) ? C.warn : 'none'} color={i <= (rating || 0) ? C.warn : C.border} strokeWidth={2} />
      ))}
    </span>
  );
}

function daysUntilAutoRelease(autoReleaseAt) {
  if (!autoReleaseAt) return null;
  const now = new Date();
  const target = new Date(autoReleaseAt);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// Το ποσό που εισπράττει ο θεραπευτής. Ο ασθενής πληρώνει μετρητά και η
// πλατφόρμα δεν κρατάει τίποτα από τη συνεδρία, οπότε το net_to_therapist
// είναι συχνά κενό — τότε ισχύει ολόκληρο το session_amount.
function bookingAmount(b) {
  return parseFloat(b?.net_to_therapist ?? b?.session_amount ?? 0) || 0;
}

// ─── ΠΕΡΙΣΤΑΤΙΚΑ ──────────────────────────────────────────────────────
// Ξεχωριστό component γιατί έχει δικό του state αποθήκευσης.
// Το ConditionPicker είναι controlled και δεν γράφει μόνο του στη βάση.
function TherapistConditionsSection({ userId, specialty, lang, tx }) {
  const [selected, setSelected] = useState([]);
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('therapist_conditions')
        .select('condition_id')
        .eq('therapist_id', userId);
      const ids = (data || []).map(r => r.condition_id);
      setSelected(ids);
      setOriginal(ids);
      setLoading(false);
    })();
  }, [userId]);

  const changed =
    selected.length !== original.length ||
    selected.some(id => !original.includes(id));

  async function save() {
    if (!userId) return;
    setSaving(true);
    setMsg(null);

    const toAdd = selected.filter(id => !original.includes(id));
    const toRemove = original.filter(id => !selected.includes(id));

    try {
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('therapist_conditions')
          .insert(toAdd.map(cid => ({ therapist_id: userId, condition_id: cid })));
        if (error) throw error;
      }
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('therapist_conditions')
          .delete()
          .eq('therapist_id', userId)
          .in('condition_id', toRemove);
        if (error) throw error;
      }
      setOriginal([...selected]);
      setMsg({ type: 'success', text: tx.condSaved(selected.length) });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      console.error('Save conditions error:', err);
      setMsg({ type: 'error', text: tx.errPrefix + (err.message || '') });
    }
    setSaving(false);
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>{tx.loading}</div>;
  }

  return (
    <div>
      <ConditionPicker
        value={selected}
        onChange={setSelected}
        lang={lang}
        specialty={specialty}
        minRequired={3}
        showDemand={true}
      />

      {(changed || msg) && (
        <div style={{ position: 'sticky', bottom: 0, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {msg ? (
            <div style={{
              background: msg.type === 'success' ? C.successBg : C.dangerBg,
              border: `1px solid ${msg.type === 'success' ? C.successBorder : C.dangerBorder}`,
              borderRadius: 8, padding: '8px 14px', fontSize: 13,
              color: msg.type === 'success' ? C.success : C.danger,
              fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center', gap: 7,
            }}>
              {msg.type === 'success' ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
              {msg.text}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.textMuted, flex: 1 }}>{tx.condUnsaved}</div>
          )}
          {changed && (
            <button onClick={save} disabled={saving}
              style={{ background: C.brand, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: RAD.button, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Save size={15} strokeWidth={2.2} />
              {saving ? tx.saving : tx.save}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function TherapistDashboard() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;
  const loc = LOCALE[lang] || LOCALE.el;

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
    return `${DAYS[lang][d.getDay()]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
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

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [openCharges, setOpenCharges] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileSection, setProfileSection] = useState('basics');
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef();
  const tabsRef = useRef();

  const [appointmentsView, setAppointmentsView] = useState('upcoming');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const [requestFilter, setRequestFilter] = useState('pending');
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [accepting, setAccepting] = useState(null);
  // Πληρωμές (Stripe)
  const [fees, setFees] = useState({});            // requestId → τέλος νέου ασθενή
  const [actionError, setActionError] = useState(null);
  const [payNotice, setPayNotice] = useState(null);
  const [pendingSub, setPendingSub] = useState(null);
  const [activating, setActivating] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [reschedules, setReschedules] = useState([]);

  const [doneModal, setDoneModal] = useState(null);
  const [marking, setMarking] = useState(false);
  const [payModal, setPayModal] = useState(false);

  const [docsModal, setDocsModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const licenseInputRef = useRef();
  const cvInputRef = useRef();
  const certInputRef = useRef();

  // ΟΙΚΟΝΟΜΙΚΑ ΣΤΟΙΧΕΙΑ
  // Το ΚΑΔ δεν έχει σταθερό όνομα στήλης σε όλες τις εγκαταστάσεις.
  // Αντί να μαντέψουμε (και το update να σκάει ολόκληρο, χάνοντας ΚΑΙ τα
  // υπόλοιπα πεδία), εντοπίζουμε ποια στήλη υπάρχει πραγματικά στο profile.
  // Αν δεν υπάρχει καμία, το πεδίο απλά δεν εμφανίζεται.
  const KAD_CANDIDATES = ['kad', 'kad_code', 'activity_code', 'business_activity'];
  const kadKey = profile ? KAD_CANDIDATES.find(k => k in profile) : null;

  const [billingForm, setBillingForm] = useState({});
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingMsg, setBillingMsg] = useState(null);

  const [reportTarget, setReportTarget] = useState(null);
  const [areaInput, setAreaInput] = useState('');
  const [savingAreas, setSavingAreas] = useState(false);
  const [areaSuggestions, setAreaSuggestions] = useState([]);


  useEffect(() => {
    if (!profile) return;
    const next = {
      iban: profile.iban || '',
      payout_name: profile.payout_name || '',
      tax_id: profile.tax_id || '',
      tax_office: profile.tax_office || '',
      legal_name: profile.legal_name || '',
      billing_address: profile.billing_address || '',
    };
    if (kadKey) next[kadKey] = profile[kadKey] || '';
    setBillingForm(next);
  }, [profile, kadKey]);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    setUser(user);

    const { data: prof } = await supabase.from('therapist_profiles').select('*').eq('id', user.id).single();
    setProfile(prof || {});
    setProfileForm(prof || {});

    await loadRequests(user.id);
    await reloadSlots(user.id);

    const { data: revs } = await supabase.from('reviews').select('*')
      .eq('therapist_id', user.id).eq('is_published', true)
      .order('created_at', { ascending: false });
    setReviews(revs || []);

    await loadSubscription(user.id);

    const { data: charges } = await supabase
      .from('payments')
      .select('id, amount, status, paid, fee_type, created_at')
      .eq('therapist_id', user.id)
      .eq('paid', false);
    setOpenCharges(charges || []);

    setLoading(false);

    // Επιστροφή από τη σελίδα πληρωμής του Stripe (χωρίς await: η
    // σελίδα εμφανίζεται αμέσως, η επιβεβαίωση έρχεται σε λίγα δευτ.)
    handleReturnFromPayment(user.id);
  }

  async function loadSubscription(uid) {
    // Συνδρομή — για το ποσό μηνιαίας χρέωσης και το τέλος νέου ασθενή
    const { data: sub } = await supabase
      .from('therapist_subscriptions')
      .select('*, subscription_plans(name_el, name_en, price_monthly, first_session_fee)')
      .eq('therapist_id', uid)
      .in('status', ['trialing', 'active', 'past_due', 'exempt'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(sub || null);

    // Πακέτο που επιλέχθηκε αλλά περιμένει πληρωμή
    const { data: psub } = await supabase
      .from('therapist_subscriptions')
      .select('id, effective_price, plan_snapshot')
      .eq('therapist_id', uid)
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setPendingSub(psub || null);
  }

  async function handleReturnFromPayment(uid) {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('payment');
    const kind = params.get('kind');
    if (!result) return;

    // Καθαρίζουμε τη διεύθυνση — ένα refresh δεν πρέπει να ξαναδείχνει το μήνυμα
    window.history.replaceState(null, '', window.location.pathname);

    if (result === 'cancel') {
      setPayNotice({ type: 'info', text: tx.payCancel });
      return;
    }

    if (kind === 'plan_activation') {
      setPayNotice({ type: 'success', text: tx.paySuccessPlan });
    } else {
      setActiveTab('requests');
      setPayNotice({ type: 'success', text: tx.paySuccessFee });
    }

    // Το Stripe ειδοποιεί τον server σε λίγα δευτερόλεπτα. Ανανεώνουμε
    // μερικές φορές ώστε ο θεραπευτής να δει το αποτέλεσμα χωρίς refresh.
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      await loadRequests(uid);
      if (kind === 'plan_activation') await loadSubscription(uid);
    }
    if (kind !== 'plan_activation') {
      setPayNotice({ type: 'success', text: tx.paySuccessFeeDone });
    }
  }

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
    };
  }

  // Μετά την «Επιβεβαίωση αλλαγής» στο StepPlan.
  // Πληρωμένο πακέτο → ανοίγει αμέσως η πληρωμή (το τρέχον μένει ενεργό
  // μέχρι να πληρωθεί). Δωρεάν πακέτο → η αλλαγή ισχύει ήδη.
  async function onPlanChanged(result) {
    setChangingPlan(false);
    await loadSubscription(user.id);
    if (result?.status === 'downgrade_scheduled') {
      const d = result.period_end ? new Date(result.period_end).toLocaleDateString(lang === 'en' ? 'en-GB' : 'el-GR') : null;
      setPayNotice({ type: 'success', text: tx.planDowngradeScheduled(d) });
      return;
    }
    if (result?.status === 'pending_payment' && profile?.is_approved) {
      await activatePlan();
      return;
    }
    setPayNotice({ type: 'success', text: tx.planChanged });
  }

  // «Συνέχεια στο Plus» μετά από δωρεάν προσφορά χωρίς κάρτα:
  // νέα επιλογή του ίδιου πακέτου στην κανονική τιμή → πληρωμή, με την
  // πρώτη χρέωση στη λήξη της προσφοράς (το ορίζει ο server).
  async function continueAfterPromo() {
    if (!subscription?.plan_id) return;
    setActivating(true);
    setPayNotice(null);
    const { error } = await supabase.rpc('activate_subscription', {
      p_plan_id: subscription.plan_id,
      p_promo_code: null,
      p_agreement_version: 'v3',
    });
    if (error) {
      setActivating(false);
      setPayNotice({ type: 'error', text: tx.acceptErr.generic });
      return;
    }
    await activatePlan();
  }

  // «Συνέχιση πακέτου»: ακυρώνει τη διακοπή πριν λήξει ο μήνας
  async function resumePlan() {
    setActivating(true);
    try {
      const res = await fetch('/api/stripe/plan-cancel', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ action: 'undo' }),
      });
      if (res.ok) {
        await loadSubscription(user.id);
        setPayNotice({ type: 'success', text: tx.planResumed });
      } else {
        setPayNotice({ type: 'error', text: tx.acceptErr.generic });
      }
    } catch (_) {
      setPayNotice({ type: 'error', text: tx.acceptErr.generic });
    }
    setActivating(false);
  }

  async function activatePlan() {
    setActivating(true);
    setPayNotice(null);
    try {
      const res = await fetch('/api/stripe/activate-plan', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ lang }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.url) { window.location.href = json.url; return; }
      if (json.activated) {
        await loadSubscription(user.id);
        setPayNotice({ type: 'success', text: tx.paySuccessPlan });
      } else {
        setPayNotice({ type: 'error', text: tx.acceptErr[json.error] || tx.acceptErr.generic });
      }
    } catch (_) {
      setPayNotice({ type: 'error', text: tx.acceptErr.generic });
    }
    setActivating(false);
  }

  async function reloadSlots(uid) {
    const id = uid || user?.id;
    if (!id) return;
    const { data } = await supabase.from('availability_slots').select('*').eq('therapist_id', id);
    setSlots(data || []);
  }

  async function loadRequests(therapistId) {
    const { data: reqs } = await supabase
      .from('session_requests')
      // ΡΗΤΗ λίστα πεδίων, ΟΧΙ select('*').
      // Ο πίνακας έχει contact_phone και contact_email — με αστερίσκο
      // ταξίδευαν στον browser του θεραπευτή χωρίς να τα ζητήσει κανείς.
      .select('id, patient_id, therapist_id, problem_type, problem_description, condition_id, address, area, postal_code, floor_info, notes, session_type, package_size, total_cost, status, type, contact_name, assigned_at, notified_at, responded_at, sla_due_at, created_at, needs_support')
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

    // ΣΤΟΙΧΕΙΑ ΑΣΘΕΝΗ ΜΕΣΩ RPC, ΟΧΙ ΑΠΕΥΘΕΙΑΣ ΑΠΟ ΤΟΝ ΠΙΝΑΚΑ.
    // Η therapist_patient_info επιστρέφει ΜΟΝΟ όσα επιτρέπονται:
    // όνομα πάντα, πλήρη διεύθυνση μόνο μετά την αποδοχή, τηλέφωνο ποτέ.
    // Έτσι η προστασία ζει στη βάση και δεν παρακάμπτεται από την κονσόλα.
    const { data: pinfo } = await supabase.rpc('therapist_patient_info', {
      p_request_ids: reqs.map(r => r.id),
    });
    const infoMap = {};
    (pinfo || []).forEach(i => { infoMap[i.request_id] = i; });

    const bookingIds = (bks || []).map(b => b.id);
    if (bookingIds.length > 0) {
      const { data: rs } = await supabase
        .from('reschedule_requests')
        .select('*')
        .in('booking_id', bookingIds)
        .eq('status', 'pending');
      setReschedules(rs || []);
    } else {
      setReschedules([]);
    }

    const combined = reqs.map(req => {
      const reqBookings = (bks || []).filter(b => b.request_id === req.id);
      const info = infoMap[req.id];
      return {
        ...req,
        bookings: reqBookings,
        patient_name: info?.patient_name || req.contact_name || null,
        // Η διεύθυνση έρχεται από το RPC: null όσο το αίτημα εκκρεμεί.
        address: info?.address ?? null,
        floor_info: info?.floor_info ?? null,
        address_revealed: !!info?.is_revealed,
      };
    });

    setRequests(combined);

    // Τέλος νέου ασθενή για κάθε αίτημα που περιμένει απάντηση, ώστε ο
    // θεραπευτής να το ξέρει ΠΡΙΝ πατήσει «Αποδοχή». Μόνο όταν οι
    // πληρωμές είναι ενεργές — αλλιώς δεν χρεώνεται τίποτα.
    const pend = combined.filter(r => r.status === 'pending');
    const { data: mode } = await supabase.rpc('stripe_mode');
    if (mode && mode !== 'off' && pend.length > 0) {
      const entries = await Promise.all(pend.map(async r => {
        const { data } = await supabase.rpc('new_patient_fee_for_request', { p_request_id: r.id });
        return [r.id, Number(data || 0)];
      }));
      setFees(Object.fromEntries(entries));
    } else {
      setFees({});
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) { alert(tx.errImageType); return; }
    if (file.size > 5 * 1024 * 1024) { alert(tx.errImageSize); return; }

    setUploadingPhoto(true);
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `therapist-photos/${user.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      alert(tx.errUpload + uploadError.message);
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
    if (!allowedTypes.includes(file.type)) { alert(tx.errFileType); return; }
    if (file.size > 10 * 1024 * 1024) { alert(tx.errFileSize); return; }

    setUploadingDoc(kind);
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = kind === 'cert' ? `${kind}-${Date.now()}.${ext}` : `${kind}.${ext}`;
    const path = `${user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('therapist-documents')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      alert(tx.errUpload + uploadError.message);
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
      alert(tx.errUpdate + updateError.message);
      setUploadingDoc(null);
      return;
    }

    setProfile(p => ({ ...p, ...updates }));
    setUploadingDoc(null);
  }

  async function removeDocument(kind, certPath = null) {
    if (!confirm(tx.confirmDelete)) return;

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
    if (error) { alert(tx.errPrefix + error.message); return null; }
    return data.signedUrl;
  }

  async function viewDocument(path) {
    const url = await getSignedUrl(path);
    if (url) window.open(url, '_blank');
  }

  // Φωνητική αναζήτηση: «kolon», «κολον», «kolwn» -> «Κολωνάκι»
  function handleAreaInputChange(value) {
    setAreaInput(value);
    if (value.trim().length > 0) {
      setAreaSuggestions(searchAreas(value, 6, profile?.service_areas || []));
    } else {
      setAreaSuggestions([]);
    }
  }

  async function addArea(area) {
    // Αποθηκεύουμε την ΕΠΙΣΗΜΗ γραφή. Αν ο θεραπευτής γράψει «kolonaki»
    // ή «κολονακι», μπαίνει «Κολωνάκι» — ώστε να ταιριάζει παντού.
    const cleaned = (canonicalArea(area) || area).trim();
    if (!cleaned) return;
    const current = profile?.service_areas || [];
    if (current.some(a => phonetic(a) === phonetic(cleaned))) {
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

  async function saveBilling() {
    const iban = (billingForm.iban || '').replace(/\s/g, '').toUpperCase();
    const taxId = (billingForm.tax_id || '').replace(/\D/g, '');

    // Ήπιος έλεγχος: μπλοκάρουμε μόνο ό,τι είναι σίγουρα λάθος.
    // Κενό πεδίο επιτρέπεται — τίποτα εδώ δεν είναι υποχρεωτικό.
    if (iban && !/^GR\d{25}$/.test(iban) && iban.length > 0 && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
      setBillingMsg({ type: 'error', text: tx.errIban });
      return;
    }
    if (taxId && taxId.length !== 9) {
      setBillingMsg({ type: 'error', text: tx.errTaxId });
      return;
    }

    setSavingBilling(true);
    setBillingMsg(null);

    const payload = {
      iban: iban || null,
      payout_name: billingForm.payout_name?.trim() || null,
      tax_id: taxId || null,
      tax_office: billingForm.tax_office?.trim() || null,
      legal_name: billingForm.legal_name?.trim() || null,
      billing_address: billingForm.billing_address?.trim() || null,
    };
    if (kadKey) payload[kadKey] = billingForm[kadKey]?.trim() || null;

    const { error } = await supabase.from('therapist_profiles').update(payload).eq('id', user.id);
    setSavingBilling(false);

    if (error) {
      setBillingMsg({ type: 'error', text: tx.errPrefix + error.message });
      return;
    }

    setProfile(p => ({ ...p, ...payload }));
    setBillingMsg({ type: 'success', text: tx.billingSaved });
    setTimeout(() => setBillingMsg(null), 3000);
  }

  // Κάθε αίτημα αφορά ΜΙΑ συνεδρία. Η αποδοχή επιβεβαιώνει και το
  // ραντεβού — ο θεραπευτής δεν χρειάζεται δεύτερη οθόνη για να
  // διαλέξει ώρα, γιατί η ώρα είναι ήδη μία.
  //
  // Η αποδοχή γίνεται πλέον ΑΠΟ ΤΟΝ SERVER. Αν ο ασθενής είναι νέος και
  // το πακέτο έχει τέλος, ο server επιστρέφει σελίδα πληρωμής και η
  // αποδοχή ολοκληρώνεται αμέσως μετά την πληρωμή. Ο browser δεν
  // αποφασίζει ποτέ αν ή πόσο πληρώνει ο θεραπευτής.
  async function confirmRequest(request) {
    setAccepting(request.id);
    setActionError(null);
    try {
      const res = await fetch('/api/stripe/accept-request', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ requestId: request.id, lang }),
      });
      const json = await res.json().catch(() => ({}));

      if (json.url) { window.location.href = json.url; return; }

      if (!res.ok || !json.accepted) {
        setActionError({ id: request.id, text: tx.acceptErr[json.error] || tx.acceptErr.generic });
      }
      await loadRequests(user.id);
    } catch (_) {
      setActionError({ id: request.id, text: tx.acceptErr.generic });
    }
    setAccepting(null);
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
      alert(tx.errPrefix + error.message);
      setMarking(false);
      return;
    }

    await loadRequests(user.id);
    setMarking(false);
    setDoneModal(null);
  }

  // Η ακύρωση γίνεται ΑΠΟΚΛΕΙΣΤΙΚΑ μέσω των RPC cancel_booking() /
  // cancel_request(). Η βάση επιβάλλει τους κανόνες: ξεμπλοκάρει slot,
  // καταγράφει ιστορικό, δίνει strike αν είναι <24h.
  function openCancelRequestModal(request) {
    setCancelTarget({ requestId: request.id });
  }

  function openCancelBookingModal(booking) {
    setCancelTarget({ bookingId: booking.id });
  }

  async function onCancelDone() {
    setCancelTarget(null);
    await loadRequests(user.id);
    await reloadSlots();
  }

  // Ο guard στο layout πετάει τον θεραπευτή πίσω στον πίνακα.
  // Αυτό το flag τον αφήνει να δει το site — σβήνει όταν κλείσει το tab.
  function viewSite() {
    sessionStorage.setItem(VIEW_SITE_KEY, '1');
    router.push('/');
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const pendingReschedule = (bookingId) =>
    reschedules.find(r => r.booking_id === bookingId && r.status === 'pending') || null;

  const allBookings = requests.flatMap(r => r.bookings.map(b => ({ ...b, request: r })));
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pendingCount = pendingRequests.length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const pricePerSession = profile?.price_per_session || 0;

  // Το τέλος νέου ασθενή: το κλειδωμένο του θεραπευτή υπερισχύει του
  // τρέχοντος fee του πλάνου — ό,τι συμφώνησε όταν έκανε εγγραφή.
  // ΠΡΑΓΜΑΤΙΚΗ τιμή πρώτα: το effective_* είναι ό,τι πληρώνει σήμερα,
  // μετά την εφαρμογή του κωδικού προσφοράς. Το *_locked είναι η τιμή
  // καταλόγου που θα ισχύσει όταν λήξει η προσφορά.
  const firstSessionFee = Number(
    subscription?.effective_first_session_fee
    ?? subscription?.first_session_fee_locked
    ?? subscription?.subscription_plans?.first_session_fee
    ?? 0
  );
  const listFirstSessionFee = Number(
    subscription?.first_session_fee_locked
    ?? subscription?.subscription_plans?.first_session_fee
    ?? 0
  );
  const monthlyPrice = Number(subscription?.effective_price ?? subscription?.price_locked ?? 0);
  // Δωρεάν ΜΟΝΟ λόγω προσφοράς, χωρίς κάρτα (π.χ. FOUNDERS100).
  // Τις τελευταίες 7 μέρες εμφανίζεται «Συνέχεια στο …».
  const isPromoFree = !!subscription
    && Number(subscription.effective_price || 0) <= 0
    && Number(subscription.price_locked || 0) > 0
    && !!subscription.promo_ends_at
    && !subscription.stripe_subscription_id;
  const promoEndsMs = isPromoFree ? new Date(subscription.promo_ends_at).getTime() : 0;
  const promoEndingSoon = isPromoFree && !pendingSub
    && promoEndsMs > Date.now() && promoEndsMs - Date.now() <= 7 * 86400000;
  const promoEndDate = isPromoFree ? new Date(subscription.promo_ends_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'el-GR') : '';
  const promoPlanName = (lang === 'en'
    ? (subscription?.subscription_plans?.name_en || subscription?.subscription_plans?.name_el)
    : subscription?.subscription_plans?.name_el) || '';
  const listMonthlyPrice = Number(subscription?.price_locked ?? 0);
  const promoActive = !!subscription?.promo_code_text
    && (!subscription?.promo_ends_at || new Date(subscription.promo_ends_at) > new Date());

  // ── ΕΣΟΔΑ ──────────────────────────────────────────────────────────
  // Ο ασθενής πληρώνει ΜΕΤΡΗΤΑ απευθείας. Δεν υπάρχει escrow.
  //   αναμενόμενα = επιβεβαιωμένες συνεδρίες που δεν έγιναν ακόμα
  //   εισπραγμένα = ολοκληρωμένες
  const sumAmount = (arr) => arr.reduce((s, b) => s + bookingAmount(b), 0);

  const upcomingPaidBookings = allBookings.filter(b => b.status === 'confirmed');
  const completedBookings = allBookings.filter(b => b.status === 'completed');

  const upcomingEarnings = sumAmount(upcomingPaidBookings);
  const collectedEarnings = sumAmount(completedBookings);

  // ── ΟΦΕΙΛΕΣ ΠΡΟΣ ΤΗΝ ΠΛΑΤΦΟΡΜΑ ────────────────────────────────────
  // Ανεξόφλητες γραμμές στο payments: τέλη νέου ασθενή. ΔΕΝ αφαιρούνται
  // από τα έσοδα των συνεδριών — είναι ξεχωριστή υποχρέωση.
  const owedTotal = openCharges.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  const sortedAppointments = [...allBookings].sort((a, b) => {
    const aDate = a.session_date + 'T' + (a.session_time || '00:00');
    const bDate = b.session_date + 'T' + (b.session_time || '00:00');
    return aDate.localeCompare(bDate);
  });

  const now = new Date();

  // Μια ΕΠΙΒΕΒΑΙΩΜΕΝΗ συνεδρία που πέρασε μένει εδώ μέχρι ο θεραπευτής να
  // πατήσει «Η συνεδρία έγινε» (ή να δηλώσει μη εμφάνιση). Πριν, περνούσε
  // αμέσως στα «Παλαιότερα», όπου δεν υπάρχουν κουμπιά: το «έγινε» δεν
  // εμφανιζόταν ποτέ και τα έσοδα έμεναν για πάντα «αναμενόμενα».
  const upcomingAppointments = sortedAppointments.filter(a => {
    if (isCancelled(a.status)) return false;
    const d = new Date(a.session_date + 'T' + (a.session_time || '00:00'));
    return d >= now || a.payment_status === 'held' || a.status === 'confirmed';
  });

  const pastAppointments = sortedAppointments.filter(a => {
    const d = new Date(a.session_date + 'T' + (a.session_time || '00:00'));
    return d < now && a.payment_status !== 'held' && a.status !== 'pending' && a.status !== 'confirmed';
  }).reverse();

  // Το «επόμενο» είναι πάντα ΜΕΛΛΟΝΤΙΚΟ — όχι κάποιο που πέρασε και
  // περιμένει επιβεβαίωση.
  const nextAppointment = upcomingAppointments.find(a =>
    (a.status === 'confirmed' || a.status === 'pending')
    && new Date(a.session_date + 'T' + (a.session_time || '00:00')) >= now
  );

  // Συνεδρίες που ΠΕΡΑΣΑΝ και περιμένουν «Η συνεδρία έγινε»
  const toConfirm = upcomingAppointments.filter(a =>
    a.status === 'confirmed'
    && a.payment_status !== 'held'
    && new Date(a.session_date + 'T' + (a.session_time || '00:00')) < now
  );

  const todayStr = todayISO();

  const todaysAppointments = sortedAppointments.filter(a =>
    a.session_date === todayStr && !isCancelled(a.status) && a.status !== 'completed'
  );

  // Προτάσεις αλλαγής ώρας που περιμένουν ΕΜΕΝΑ, όχι όσες έστειλα εγώ
  const incomingReschedules = reschedules.filter(r => r.requested_by_role !== 'therapist');

  const hasLicense = !!profile?.license_url;
  const hasCv = !!profile?.cv_url;
  const certCount = (profile?.certifications_urls || []).length;

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.page }}>
      <div style={{ fontSize: 16, color: C.textMuted }}>{tx.loading}</div>
    </div>
  );

  // ΠΕΝΤΕ tabs, όχι οκτώ. Περιοχές, περιστατικά, δικαιολογητικά και
  // αξιολογήσεις ζουν πλέον μέσα στο Προφίλ — είναι ρυθμίσεις, όχι
  // καθημερινή δουλειά.
  const TABS = [
    { id: 'overview', label: tx.tabOverview, Icon: LayoutDashboard, count: 0 },
    { id: 'requests', label: tx.tabRequests, Icon: ClipboardList, count: pendingCount },
    { id: 'appointments', label: tx.tabAppointments, Icon: Calendar, count: 0 },
    { id: 'availability', label: tx.tabAvailability, Icon: CalendarDays, count: 0 },
    { id: 'profile', label: tx.tabProfile, Icon: User, count: 0 },
  ];

  const PROFILE_SECTIONS = [
    { id: 'basics', label: tx.secBasics, Icon: User },
    { id: 'plan', label: tx.secPlan, Icon: Wallet },
    { id: 'billing', label: tx.secBilling, Icon: CreditCard },
    { id: 'areas', label: tx.secAreas, Icon: MapPin },
    { id: 'conditions', label: tx.secConditions, Icon: Target },
    { id: 'documents', label: tx.secDocuments, Icon: FileText },
    { id: 'reviews', label: tx.secReviews, Icon: Star },
  ];

  // Το checklist στέλνει keys που πρέπει να μεταφραστούν στη νέα δομή.
  function goToChecklistTarget(key) {
    if (key === 'availability' || key === 'calendar') { setActiveTab('availability'); return; }
    if (key === 'areas' || key === 'conditions') { setActiveTab('profile'); setProfileSection(key); return; }
    if (key === 'reviews') { setActiveTab('profile'); setProfileSection('reviews'); return; }
    // Πόλη, όνομα, τιμή, σπουδές — όλα ζουν στα βασικά στοιχεία.
    setActiveTab('profile');
    setProfileSection('basics');
    setEditProfile(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        /* ΚΑΜΙΑ ΠΛΑΓΙΑ ΚΥΛΙΣΗ.
           Αρκεί ένα στοιχείο να ξεπεράσει το πλάτος για να
           εμφανιστεί κενό δεξιά σε όλη τη σελίδα. */
        html, body { max-width: 100%; overflow-x: hidden; }
        * { min-width: 0; }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tabs-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .tabs-scroll::-webkit-scrollbar { display: none; }
        /* ΠΛΑΓΙΟ ΜΕΝΟΥ: μόνο σε μεγάλη οθόνη. Σε tablet/κινητό μένουν
           τα οριζόντια tabs, που χωράνε και δουλεύουν με το δάχτυλο. */
        .td-shell { display: flex; min-height: 100vh; }
        .td-side { display: none; }
        .td-main { flex: 1; min-width: 0; }
        @media (min-width: 1024px) {
          .td-side { display: flex; flex-direction: column; width: 244px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; background: #fff; border-right: 1px solid ${C.border}; padding: 20px 14px; overflow-y: auto; }
          .td-tabs { display: none; }
          .td-nav-logo { display: none !important; }
        }
        .td-item { display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px 12px; border-radius: 11px; border: none; background: transparent; color: ${C.textBody}; font-size: 14.5px; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left; transition: background .15s; }
        .td-item:hover { background: ${C.surfaceAlt}; }
        .td-item.on { background: ${C.accentSoft}; color: ${C.accent}; }
        .td-sub { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 12px 7px 38px; border-radius: 9px; border: none; background: transparent; color: ${C.textMuted}; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; text-align: left; }
        .td-sub:hover { color: ${C.text}; }
        .td-sub.on { color: ${C.accent}; font-weight: 700; }
        @media (max-width: 720px) {
          .req-actions { flex-direction: column !important; align-items: stretch !important; }
          .req-actions button { width: 100%; }
          .req-actions .req-hint { margin-right: 0 !important; margin-bottom: 4px; }
        }
      `}</style>

      <div className="td-shell">
      {/* ═══ ΠΛΑΓΙΟ ΜΕΝΟΥ (υπολογιστής) ═══ */}
      <aside className="td-side" aria-label={lang === 'en' ? 'Dashboard navigation' : 'Πλοήγηση πίνακα'}>
        <a href="/" style={{ display: 'inline-flex', padding: '2px 8px 18px' }} aria-label={BRAND}>
          <Logo variant="primary" tone="dark" size={30} />
        </a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {TABS.map(t => {
            const TabIcon = t.Icon;
            const on = activeTab === t.id;
            return (
              <div key={t.id}>
                <button className={`td-item${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined}
                  onClick={() => { setActiveTab(t.id); window.scrollTo({ top: 0 }); }}>
                  <TabIcon size={18} />
                  <span style={{ flex: 1 }}>{t.label}</span>
                  {t.count > 0 && (
                    <span style={{ background: on ? C.accent : C.warn, color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: RAD.pill, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{t.count}</span>
                  )}
                </button>
                {t.id === 'profile' && on && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, margin: '3px 0 6px' }}>
                    {PROFILE_SECTIONS.map(sec => (
                      <button key={sec.id} className={`td-sub${profileSection === sec.id ? ' on' : ''}`} onClick={() => setProfileSection(sec.id)}>
                        {sec.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{lang === 'en' ? 'Need help?' : 'Χρειάζεσαι βοήθεια;'}</div>
            <div style={{ fontSize: 12, color: C.textMuted, margin: '3px 0 10px', lineHeight: 1.45 }}>{lang === 'en' ? 'Our team is here for you.' : 'Η ομάδα μας είναι εδώ για σένα.'}</div>
            <a href="/contact" style={{ display: 'block', padding: '9px 0', borderRadius: 10, background: C.accentSoft, color: C.accent, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{lang === 'en' ? 'Contact us' : 'Επικοινωνία'}</a>
          </div>
          <button className="td-item" onClick={signOut} style={{ color: C.textMuted, fontSize: 13.5 }}>
            <LogOut size={16} />{tx.signOut}
          </button>
        </div>
      </aside>

      <div className="td-main">
      {/* Ίδια διόρθωση overflow με τον πίνακα ασθενή */}
      <nav style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '10px 16px', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100, maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 1 }}>
          <span className="td-nav-logo" style={{ display: 'inline-flex' }}><Logo variant="primary" tone="dark" size={28} /></span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, background: C.borderSoft, padding: '2px 10px', borderRadius: RAD.pill, whiteSpace: 'nowrap' }}>{tx.roleBadge}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          {!profile?.is_approved && hasLicense && (
            <span style={{ background: C.warnBg, color: C.warn, padding: '4px 12px', borderRadius: RAD.pill, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} />
              {tx.awaitingApproval}
            </span>
          )}
          <LanguageSwitcher color={C.textMuted} hoverColor={C.brand} navHeight={60} />
          <button onClick={viewSite} title={tx.viewSiteTitle}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
            <Globe size={13} />
            {tx.site}
          </button>
          <Avatar name={profile?.name || user?.email} photoUrl={profile?.photo_url} size={36} />
          <button onClick={signOut} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{tx.signOut}</button>
        </div>
      </nav>

      <div style={{ maxWidth: activeTab === 'availability' ? 1480 : MAX_WIDTH, margin: '0 auto', padding: '24px clamp(12px, 3vw, 28px)' }}>

        {/* Το checklist είναι ΠΑΝΩ από τα tabs. Χωρίς scroll, ο θεραπευτής
            πατάει «Συμπλήρωσε», το tab αλλάζει σωστά, αλλά αυτός βλέπει
            το ίδιο checklist και νομίζει ότι δεν έγινε τίποτα. */}
        <EmailVerifyBanner profile={profile} email={user?.email} role="therapist" lang={lang} />

        <ProfileChecklist
          onGoToTab={(tab) => {
            goToChecklistTarget(tab);
            setTimeout(() => {
              if (tabsRef.current?.offsetParent) tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 60);
          }}
          onOpenDocuments={() => setDocsModal(true)}
        />

        {payNotice && (() => {
          const tone = payNotice.type === 'success'
            ? { bg: C.successBg, br: C.successBorder, fg: C.success, Icon: CheckCircle2 }
            : payNotice.type === 'error'
              ? { bg: C.dangerBg, br: C.dangerBorder, fg: C.danger, Icon: AlertTriangle }
              : { bg: C.infoBg, br: C.infoBorder, fg: C.info, Icon: Info };
          return (
            <div style={{ background: tone.bg, border: `1px solid ${tone.br}`, borderRadius: 12, padding: '13px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: tone.fg, fontWeight: 600 }}>
              <tone.Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{payNotice.text}</span>
              <button onClick={() => setPayNotice(null)} title={tx.dismiss}
                style={{ background: 'transparent', border: 'none', color: tone.fg, cursor: 'pointer', display: 'flex', padding: 2 }}>
                <X size={16} />
              </button>
            </div>
          );
        })()}

        {/* Πακέτο που περιμένει πληρωμή. Πριν την έγκριση: μόνο ενημέρωση.
            Μετά την έγκριση: κουμπί πληρωμής — χωρίς αυτή δεν εμφανίζεται
            στους ασθενείς. */}
        {pendingSub && (() => {
          const planName = (lang === 'en'
            ? (pendingSub.plan_snapshot?.name_en || pendingSub.plan_snapshot?.name_el)
            : pendingSub.plan_snapshot?.name_el) || '';
          const price = Number(pendingSub.effective_price || 0);
          const priceTxt = price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
          const approved = !!profile?.is_approved;
          return (
            <div style={{ background: approved ? C.warnBg : C.infoBg, border: `1px solid ${approved ? C.warnBorder : C.infoBorder}`, borderRadius: RAD.card, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <CreditCard size={22} color={approved ? C.warn : C.info} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 220 }}>
                {approved && (
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.warn, marginBottom: 3 }}>{tx.activateTitle}</div>
                )}
                <div style={{ fontSize: 13.5, color: approved ? C.warn : C.info, lineHeight: 1.55 }}>
                  {approved ? tx.activateDesc(planName, priceTxt) : tx.activateWaiting(planName)}
                </div>
              </div>
              {approved && (
                <button onClick={activatePlan} disabled={activating}
                  style={{ padding: '11px 22px', borderRadius: RAD.button, border: 'none', background: activating ? C.textFaint : C.brand, color: '#fff', fontSize: 14, fontWeight: 700, cursor: activating ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                  <CreditCard size={15} />
                  {activating ? tx.activating : tx.activateBtn}
                </button>
              )}
            </div>
          );
        })()}

        <div ref={tabsRef} className="tabs-scroll td-tabs" style={{ marginBottom: 24, scrollMarginTop: 76 }}>
          <div style={{ display: 'flex', gap: 4, background: C.border, padding: 4, borderRadius: 12, width: 'fit-content', minWidth: 'min-content' }}>
            {TABS.map(t => {
              const TabIcon = t.Icon;
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: isActive ? '#fff' : 'transparent', color: isActive ? C.text : C.textMuted, boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <TabIcon size={14} />
                  {t.label}
                  {t.count > 0 && (
                    <span style={{ background: isActive ? C.accent : C.textFaint, color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 19, height: 19, borderRadius: RAD.pill, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ ΕΠΙΣΚΟΠΗΣΗ ═══ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Μόνο ό,τι χρειάζεται ΣΗΜΕΡΑ. Τα υπόλοιπα ζουν στα tabs. */}
            <div style={{ background: '#fff', borderRadius: RAD.card, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <Clock size={17} color={C.accent} />
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{tx.todayTitle}</span>
                <span style={{ fontSize: 13, color: C.textFaint, marginLeft: 'auto' }}>{formatFullDate(todayStr)}</span>
              </div>

              {pendingCount === 0 && todaysAppointments.length === 0 && incomingReschedules.length === 0 && toConfirm.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                  <CheckCircle2 size={34} color={C.successBorder} style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.textBody, marginBottom: 4 }}>{tx.todayNothing}</div>
                  <div style={{ fontSize: 13, color: C.textFaint }}>{tx.todayNothingSub}</div>
                </div>
              ) : (
                <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 12, flexWrap: 'wrap' }}>
                      <ClipboardList size={18} color={C.warn} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.warn }}>
                        {pendingCount} {pendingCount === 1 ? tx.todayNewRequest : tx.todayNewRequests}
                      </span>
                      <button onClick={() => setActiveTab('requests')}
                        style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: RAD.button, border: 'none', background: C.warn, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {tx.seeRequests}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* Συνεδρίες που πέρασαν: χωρίς «έγινε» τα έσοδα μένουν
                      «αναμενόμενα» και δεν περνούν ποτέ στα εισπραγμένα. */}
                  {toConfirm.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 12, flexWrap: 'wrap' }}>
                      <CheckCircle2 size={18} color={C.success} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 200 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.success }}>{tx.toConfirmTitle(toConfirm.length)}</span>
                        <span style={{ fontSize: 12.5, color: C.success }}>{tx.toConfirmSub}</span>
                      </div>
                      <button onClick={() => { setActiveTab('appointments'); setAppointmentsView('upcoming'); }}
                        style={{ padding: '8px 18px', borderRadius: RAD.button, border: 'none', background: C.success, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {tx.tabAppointments}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {incomingReschedules.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: 12, flexWrap: 'wrap' }}>
                      <CalendarClock size={18} color={C.info} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.info }}>
                        {incomingReschedules.length} {incomingReschedules.length === 1 ? tx.todayReschedule : tx.todayReschedules}
                      </span>
                      <button onClick={() => setActiveTab('appointments')}
                        style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: RAD.button, border: 'none', background: C.info, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {tx.tabAppointments}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 9 }}>
                      {tx.todaySchedule}
                    </div>
                    {todaysAppointments.length === 0 ? (
                      <div style={{ fontSize: 13.5, color: C.textFaint, fontStyle: 'italic', padding: '10px 0' }}>{tx.noSessionsToday}</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {todaysAppointments.map(apt => {
                          const st = statusLabel(STATUS, apt.status);
                          return (
                            <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: C.page, borderRadius: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 16, fontWeight: 700, color: C.text, minWidth: 52 }}>
                                {apt.session_time?.slice(0, 5)}
                              </span>
                              <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>
                                {apt.request?.patient_name || tx.unknown}
                              </span>
                              <span style={{ fontSize: 13, color: C.textMuted, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <MapPin size={12} />
                                {apt.request?.area}
                              </span>
                              <span style={{ marginLeft: 'auto' }}>
                                <Badge label={st.label} bg={st.bg} color={st.color} />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{tx.financeTitle}</span>
                {/* Το μακροσκελές κείμενο για τις πληρωμές έγινε modal.
                    Μετά από δύο-τρεις χρήσεις είναι θόρυβος. */}
                <button onClick={() => setPayModal(true)}
                  style={{ background: 'transparent', border: 'none', color: C.accent, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0 }}>
                  <Info size={13} />
                  {tx.howPaymentsWork}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {/* Λευκές cards με λεπτό accent στην κορυφή, όχι τρία
                    διαφορετικά pastel blocks δίπλα-δίπλα. Το χρώμα μπαίνει
                    μόνο στο νούμερο και στη γραμμή — λιγότερο «λογιστική»
                    εμφάνιση, πιο premium. */}
                {[
                  { label: tx.earningsUpcoming, value: upcomingEarnings,  sub: tx.earningsUpcomingSub(upcomingPaidBookings.length), tone: C.accent },
                  { label: tx.earningsDone,     value: collectedEarnings, sub: tx.earningsDoneSub(completedBookings.length),        tone: C.success },
                  { label: tx.owedTitle,        value: owedTotal,         sub: owedTotal > 0 ? tx.owedOpenShort : tx.owedNone,      tone: owedTotal > 0 ? C.warn : C.textFaint },
                ].map((c) => (
                  <div key={c.label} style={{
                    ...card({ padding: 0 }),
                    flex: 1, minWidth: 190, overflow: 'hidden',
                    borderTop: `3px solid ${c.tone}`,
                  }}>
                    <div style={{ padding: '18px 20px' }}>
                      <div style={{ ...T.eyebrow, marginBottom: 8 }}>{c.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: c.tone, lineHeight: 1 }}>
                        {c.value.toFixed(2)}€
                      </div>
                      <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 6 }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ΑΙΤΗΜΑΤΑ ═══ */}
        {activeTab === 'requests' && (
          <div>
            <div style={{ display: 'flex', gap: 4, background: C.border, padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 18 }}>
              {[['pending', tx.requestsPending, pendingCount], ['all', tx.requestsAll, 0]].map(([id, label, count]) => (
                <button key={id} onClick={() => setRequestFilter(id)}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: requestFilter === id ? '#fff' : 'transparent', color: requestFilter === id ? C.text : C.textMuted, boxShadow: requestFilter === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {label}
                  {count > 0 && (
                    <span style={{ background: C.warn, color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: RAD.pill, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{count}</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(() => {
                const list = requestFilter === 'pending' ? pendingRequests : requests;
                if (list.length === 0) {
                  return (
                    <div style={{ padding: 40, textAlign: 'center', color: C.textFaint, background: '#fff', borderRadius: RAD.card, border: `1px solid ${C.border}`, fontSize: 14 }}>
                      {requestFilter === 'pending' ? tx.noPendingRequests : tx.noRequestsYet}
                    </div>
                  );
                }

                return list.map(req => {
                  const st = statusLabel(STATUS, req.status);
                  const isPending = req.status === 'pending';
                  const hasActiveBookings = req.bookings.some(b => b.status === 'confirmed' || b.status === 'pending');
                  const name = req.patient_name || tx.unknown;
                  const booking = req.bookings[0];
                  const amount = req.bookings.reduce((s, b) => s + bookingAmount(b), 0) || Number(req.total_cost || 0);
                  const isOpen = expandedRequest === req.id;
                  const fee = Number(fees[req.id] || 0);
                  const feeTxt = fee % 1 === 0 ? fee.toFixed(0) : fee.toFixed(2);

                  return (
                    <div key={req.id} style={{
                      background: '#fff', borderRadius: RAD.card,
                      border: isPending ? `2px solid ${C.warnBorder}` : `1px solid ${C.border}`,
                      overflow: 'hidden',
                    }}>
                      {/* ΤΑ ΠΑΝΤΑ ΓΙΑ ΤΗΝ ΑΠΟΦΑΣΗ, ΣΕ ΜΙΑ ΟΘΟΝΗ.
                          Ο θεραπευτής δεν πρέπει να ανοίγει τρεις σελίδες
                          για να καταλάβει αν θέλει το περιστατικό. */}
                      <div style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                          <Avatar name={name} size={46} />
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{name}</span>
                              <Badge label={st.label} bg={st.bg} color={st.color} />
                              <span style={{ fontSize: 11.5, color: C.textFaint, marginLeft: 'auto' }}>
                                {new Date(req.created_at).toLocaleDateString(loc)}
                              </span>
                            </div>

                            {req.problem_type && (
                              <div style={{ fontSize: 14, fontWeight: 600, color: C.brand, marginBottom: 6 }}>
                                {req.problem_type}
                              </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 16px', fontSize: 13, color: C.textMuted, marginBottom: 10 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <MapPin size={13} />
                                {req.area}{req.postal_code ? `, ${req.postal_code}` : ''}
                              </span>
                              {booking && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.brand, fontWeight: 600 }}>
                                  <Calendar size={13} />
                                  {formatShortDate(booking.session_date)} {tx.at} {booking.session_time?.slice(0, 5)}
                                </span>
                              )}
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.success, fontWeight: 700 }}>
                                <Wallet size={13} />
                                {tx.youEarn} {amount.toFixed(0)}€
                              </span>
                            </div>

                            <button onClick={() => setExpandedRequest(isOpen ? null : req.id)}
                              style={{ background: 'transparent', border: 'none', color: C.accent, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {isOpen ? tx.hideDetails : tx.details}
                              <ChevronRight size={13} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.borderSoft}`, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, color: C.textBody }}>
                            <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 7 }}>
                              <Home size={14} color={C.textMuted} style={{ marginTop: 1, flexShrink: 0 }} />
                              <span>
                                {req.address}, {req.area}{req.postal_code ? `, ${req.postal_code}` : ''}
                                {req.floor_info && <span style={{ color: C.textFaint }}> · {req.floor_info}</span>}
                              </span>
                            </div>
                            {/* Το τηλέφωνο εμφανίζεται ΜΟΝΟ αφού αποδεχτεί.
                                Πριν από αυτό δεν έχει λόγο να το ξέρει. */}
                            {/* Το τηλέφωνο του ασθενή δεν εμφανίζεται ποτέ — ούτε πριν ούτε μετά την αποδοχή. */}
                            <div style={{ background: C.page, padding: '10px 14px', borderRadius: 8, borderLeft: `3px solid ${C.border}`, lineHeight: 1.6 }}>
                              {req.problem_description || tx.noDescription}
                            </div>
                            {req.notes && (
                              <div style={{ fontSize: 12.5, color: C.textMuted, display: 'inline-flex', alignItems: 'flex-start', gap: 7 }}>
                                <MessageSquare size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                                <span>{tx.notes} {req.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {(isPending || hasActiveBookings) && (
                        <div className="req-actions" style={{ padding: '14px 20px', borderTop: `1px solid ${C.borderSoft}`, background: isPending ? C.warnBg : C.page, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {isPending && (
                            <>
                              <span className="req-hint" style={{ fontSize: 12.5, color: C.warn, marginRight: 'auto' }}>
                                {fee > 0 ? tx.feeNotice(feeTxt) : tx.respondFast}
                              </span>
                              <button onClick={() => openCancelRequestModal(req)}
                                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.dangerBorder}`, background: '#fff', color: C.danger, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                                <X size={14} strokeWidth={2.5} />
                                {tx.reject}
                              </button>
                              <button onClick={() => confirmRequest(req)} disabled={accepting === req.id}
                                style={{ padding: '10px 26px', borderRadius: 8, border: 'none', background: accepting === req.id ? C.textFaint : C.success, color: '#fff', fontSize: 13, fontWeight: 700, cursor: accepting === req.id ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                                <Check size={14} strokeWidth={3} />
                                {accepting === req.id ? tx.accepting : (fee > 0 ? tx.acceptWithFee(feeTxt) : tx.acceptRequest)}
                              </button>
                            </>
                          )}
                          {!isPending && hasActiveBookings && (
                            <button onClick={() => openCancelRequestModal(req)}
                              style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.dangerBorder}`, background: 'transparent', color: C.danger, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              {tx.cancelWholeRequest}
                            </button>
                          )}
                        </div>
                      )}

                      {actionError?.id === req.id && (
                        <div style={{ padding: '11px 20px', borderTop: `1px solid ${C.dangerBorder}`, background: C.dangerBg, color: C.danger, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                          {actionError.text}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ═══ ΡΑΝΤΕΒΟΥ ═══ */}
        {activeTab === 'appointments' && (
          <div>
            {nextAppointment && appointmentsView === 'upcoming' && (() => {
              const friendly = friendlyDateLabel(nextAppointment.session_date);
              const fullDate = formatFullDate(nextAppointment.session_date);
              return (
                <div style={{
                  background: `linear-gradient(135deg, ${C.brand} 0%, ${C.accent} 100%)`,
                  borderRadius: RAD.card, padding: '28px 32px', marginBottom: 20, color: '#fff',
                  boxShadow: '0 8px 32px rgba(26, 46, 68, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    {tx.nextAppointment}
                  </div>

                  {friendly && (
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '-.02em' }}>{friendly}</div>
                  )}

                  <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>{fullDate}</div>

                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
                    {tx.at} {nextAppointment.session_time?.slice(0, 5)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <User size={18} color="rgba(255,255,255,0.7)" />
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{nextAppointment.request?.patient_name || tx.unknown}</span>
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
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{nextAppointment.request.floor_info}</span>
                      </div>
                    )}

                    {nextAppointment.request?.problem_type && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Target size={18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{nextAppointment.request.problem_type}</span>
                      </div>
                    )}

                  </div>

                  {nextAppointment.status === 'pending' && (
                    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255, 204, 0, 0.15)', borderRadius: 10, fontSize: 13, color: C.warnBg, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} />
                      {tx.awaitingYourConfirm}
                    </div>
                  )}
                </div>
              );
            })()}

            {!nextAppointment && upcomingAppointments.length === 0 && pastAppointments.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: C.textFaint, background: '#fff', borderRadius: RAD.card, border: `1px solid ${C.border}` }}>
                <Calendar size={48} color={C.border} style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 16, marginBottom: 8 }}>{tx.noAppointments}</div>
                <div style={{ fontSize: 13 }}>{tx.noAppointmentsSub}</div>
              </div>
            ) : (
              <>
                {/* Το προεπιλεγμένο view είναι «Σήμερα & επόμενα».
                    Ο θεραπευτής ρωτάει «ποιον έχω σήμερα», όχι «τι έγινε
                    τον Μάρτιο». Το μηνιαίο ημερολόγιο είναι δευτερεύον. */}
                <div className="tabs-scroll" style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 4, background: C.border, padding: 4, borderRadius: 10, width: 'fit-content' }}>
                    {[['upcoming', tx.viewUpcoming, List], ['past', tx.viewPast, Clock], ['calendar', tx.viewCalendar, CalendarDays]].map(([id, label, Icon]) => (
                      <button key={id} onClick={() => setAppointmentsView(id)}
                        style={{ padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: appointmentsView === id ? '#fff' : 'transparent', color: appointmentsView === id ? C.text : C.textMuted, boxShadow: appointmentsView === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {appointmentsView === 'upcoming' && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.textBody, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
                      {tx.upcoming(upcomingAppointments.length)}
                    </h3>
                    {upcomingAppointments.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: C.textFaint, background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}>
                        {tx.noUpcoming}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {upcomingAppointments.map(apt => {
                          const bSt = statusLabel(STATUS, apt.status);
                          const payStatus = apt.patient_confirmation === 'disputed' ? 'disputed' : (apt.payment_status || 'pending');
                          const payInfo = statusLabel(PAYMENT_STATUS, payStatus);
                          const isHeld = apt.payment_status === 'held';
                          const daysLeft = isHeld ? daysUntilAutoRelease(apt.auto_release_at) : null;
                          const friendly = friendlyDateLabel(apt.session_date);
                          const isPast = new Date(apt.session_date + 'T' + (apt.session_time || '00:00')) < new Date();
                          const canMarkDone = apt.status === 'confirmed' && isPast && apt.payment_status !== 'held';
                          // Το no-show δηλώνεται μόνο σε ραντεβού που ΠΕΡΑΣΕ.
                          // Ο ακριβής φραγμός (15 λεπτά μετά) επιβάλλεται στη βάση.
                          const canReport = apt.status === 'confirmed' && isPast;

                          return (
                            <div key={apt.id} style={{
                              background: '#fff', borderRadius: 12,
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
                                  <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <User size={15} color={C.accent} />
                                    {apt.request?.patient_name || tx.unknown}
                                  </div>
                                  {apt.request?.address && (
                                    <div style={{ fontSize: 14, color: C.textMuted, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                      <MapPin size={13} />
                                      {apt.request.address}, {apt.request.area}
                                      {apt.request.postal_code && `, ${apt.request.postal_code}`}
                                    </div>
                                  )}
                                  {apt.request?.floor_info && (
                                    <div style={{ fontSize: 13, color: C.textFaint, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                      <Home size={12} />
                                      {apt.request.floor_info}
                                    </div>
                                  )}
                                  {apt.request?.problem_type && (
                                    <div style={{ fontSize: 13, color: C.textBody, background: C.page, padding: '6px 10px', borderRadius: 6, marginTop: 6, display: 'inline-block' }}>
                                      {apt.request.problem_type}
                                    </div>
                                  )}
                                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                                    {apt.status === 'completed' && (
                                      <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                    )}
                                    <span style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>
                                      {bookingAmount(apt).toFixed(0)}€
                                    </span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                  {canReport && (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                      <button
                                        onClick={() => setReportTarget({ mode: 'noshow', booking: apt, otherName: apt.request?.patient_name })}
                                        style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.warnBorder}`, background: 'transparent', color: C.warn, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                        <UserX size={13} />
                                        {tx.noShow}
                                      </button>
                                      <button
                                        onClick={() => setReportTarget({ mode: 'issue', booking: apt, otherName: apt.request?.patient_name })}
                                        style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                        <AlertTriangle size={13} />
                                        {tx.reportIssue}
                                      </button>
                                    </div>
                                  )}
                                  {canMarkDone && (
                                    <button onClick={() => openDoneModal(apt, apt.request)}
                                      style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: C.success, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                      <Check size={14} strokeWidth={3} />
                                      {tx.markDone}
                                    </button>
                                  )}
                                  {apt.status === 'confirmed' && !isPast && (() => {
                                    const rr = pendingReschedule(apt.id);
                                    const isMine = rr?.requested_by_role === 'therapist';
                                    return (
                                      <>
                                        {rr ? (
                                          <button
                                            onClick={() => !isMine && setRescheduleTarget({ booking: apt, reschedule: rr, mode: 'respond' })}
                                            style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${isMine ? C.border : C.infoBorder}`, background: isMine ? C.page : C.infoBg, color: isMine ? C.textFaint : C.info, fontSize: 12, fontWeight: 600, cursor: isMine ? 'default' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                            <CalendarClock size={13} />
                                            {isMine ? tx.reschedulePendingYours : tx.rescheduleReview}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setRescheduleTarget({ booking: apt, mode: 'propose' })}
                                            style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                            <CalendarClock size={13} />
                                            {tx.reschedule}
                                          </button>
                                        )}
                                        <button onClick={() => openCancelBookingModal(apt)}
                                          style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.dangerBorder}`, background: 'transparent', color: C.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                          {tx.cancel}
                                        </button>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Ο ασθενής απάντησε «Όχι, δεν έγινε» στο «Έγινε η συνεδρία;» */}
                              {isHeld && apt.patient_confirmation === 'disputed' && (
                                <div style={{ marginTop: 14, padding: 12, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 10, fontSize: 13, color: C.danger, lineHeight: 1.5 }}>
                                  <div style={{ fontWeight: 700, marginBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <AlertTriangle size={13} />
                                    {tx.disputedTitle}
                                  </div>
                                  <div>{tx.disputedSub}</div>
                                </div>
                              )}
                              {isHeld && apt.patient_confirmation !== 'disputed' && (
                                <div style={{ marginTop: 14, padding: 12, background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10 }}>
                                  <div style={{ fontSize: 13, color: C.warn, fontWeight: 600, marginBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Hourglass size={13} />
                                    {tx.awaitingRelease}
                                  </div>
                                  {daysLeft !== null && (
                                    <div style={{ fontSize: 12, color: C.warn }}>
                                      {daysLeft === 0 ? tx.autoReleaseToday : tx.autoReleaseIn(daysLeft)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {appointmentsView === 'past' && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.textBody, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
                      {tx.past(pastAppointments.length)}
                    </h3>
                    {pastAppointments.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: C.textFaint, background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}>
                        {tx.noPast}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pastAppointments.map(apt => {
                          const bSt = statusLabel(STATUS, apt.status);
                          const payStatus = apt.patient_confirmation === 'disputed' ? 'disputed' : (apt.payment_status || 'pending');
                          const payInfo = statusLabel(PAYMENT_STATUS, payStatus);

                          return (
                            <div key={apt.id} style={{
                              background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`,
                              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                            }}>
                              <div style={{ minWidth: 100 }}>
                                <div style={{ fontSize: 14, color: C.textBody, fontWeight: 600 }}>{formatShortDate(apt.session_date)}</div>
                                <div style={{ fontSize: 13, color: C.textFaint }}>{tx.at} {apt.session_time?.slice(0, 5)}</div>
                              </div>

                              <div style={{ flex: 1, minWidth: 150 }}>
                                <div style={{ fontSize: 14, color: C.textBody, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <User size={12} color={C.textMuted} />
                                  {apt.request?.patient_name || tx.unknown}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Badge label={bSt.label} bg={bSt.bg} color={bSt.color} />
                                {apt.status === 'completed' && payStatus !== 'pending' && (
                                  <Badge label={payInfo.label} bg={payInfo.bg} color={payInfo.color} icon={payInfo.icon} />
                                )}
                                {apt.status === 'completed' && (
                                  <span style={{ fontSize: 12, color: C.success, fontWeight: 700 }}>
                                    +{bookingAmount(apt).toFixed(2)}€
                                  </span>
                                )}
                              </div>

                              {isCancelled(apt.status) && apt.cancelled_reason && (
                                <div style={{ width: '100%', paddingTop: 8, marginTop: 4, borderTop: `1px solid ${C.borderSoft}`, fontSize: 12, color: C.danger }}>
                                  {tx.cancelledBy[apt.cancelled_by_role] || tx.cancelledBy.admin}
                                  {' · '}
                                  <span style={{ fontStyle: 'italic', color: C.warn }}>{apt.cancelled_reason}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {appointmentsView === 'calendar' && (
                  <div style={{ background: '#fff', borderRadius: RAD.card, border: `1px solid ${C.border}`, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => navigateMonth(-1)}
                        style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.brand, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                        <ChevronLeft size={16} />
                        {tx.prev}
                      </button>
                      <div style={{ fontSize: 19, fontWeight: 700, color: C.text, textAlign: 'center' }}>
                        {MONTHS_FULL[lang][calendarMonth.month]} {calendarMonth.year}
                      </div>
                      <button onClick={() => navigateMonth(1)}
                        style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.brand, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
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
                            onClick={() => hasApts && setSelectedDay({ date: dateStr, appointments: dayApts })}
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
              </>
            )}
          </div>
        )}

        {/* ═══ ΔΙΑΘΕΣΙΜΟΤΗΤΑ ═══ */}
        {activeTab === 'availability' && (
          <AvailabilityCalendar
            userId={user?.id}
            lang={lang}
            slots={slots}
            requests={requests}
            onSlotsChanged={() => reloadSlots()}
            onOpenTab={(tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {/* ═══ ΠΡΟΦΙΛ ═══ */}
        {activeTab === 'profile' && (
          <div>
            <div className="tabs-scroll" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 4, background: C.border, padding: 4, borderRadius: 10, width: 'fit-content' }}>
                {PROFILE_SECTIONS.map(s => {
                  const SIcon = s.Icon;
                  const isActive = profileSection === s.id;
                  return (
                    <button key={s.id} onClick={() => setProfileSection(s.id)}
                      style={{ padding: '8px 15px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: isActive ? '#fff' : 'transparent', color: isActive ? C.text : C.textMuted, boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      <SIcon size={14} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: RAD.card, border: `1px solid ${C.border}`, padding: 26 }}>

              {profileSection === 'basics' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={profile?.name} photoUrl={profile?.photo_url} size={80} />
                      <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                        style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: C.accent, border: '2px solid #fff', color: '#fff', cursor: uploadingPhoto ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {uploadingPhoto ? <Clock size={12} /> : <Camera size={13} />}
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{profile?.name || '—'}</div>
                      <div style={{ fontSize: 14, color: C.textMuted }}>{profile?.specialty} · {profile?.area}</div>
                      <div style={{ marginTop: 6 }}>
                        {profile?.is_approved
                          ? <Badge label={tx.approvedShort} bg={C.infoBg} color={C.info} icon={CheckCircle2} />
                          : !hasLicense
                            ? <Badge label={tx.docsPending} bg={C.warnBg} color={C.warn} icon={AlertTriangle} />
                            : <Badge label={tx.awaitingAdmin} bg={C.warnBg} color={C.warn} icon={Clock} />}
                      </div>
                      {/* «Εγκεκριμένος» δεν έλεγε τίποτα στον θεραπευτή.
                          Τώρα λέει τι σημαίνει το σήμα. */}
                      {profile?.is_approved && (
                        <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 6, lineHeight: 1.5 }}>
                          {tx.verifiedMeaning}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {tx.photoHintA} <Camera size={11} /> {tx.photoHintB}
                      </div>
                    </div>
                    <button onClick={() => setEditProfile(!editProfile)}
                      style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: editProfile ? C.borderSoft : '#fff', color: C.textBody, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                      {editProfile ? tx.cancelEdit : <><Pencil size={13} />{tx.editProfile}</>}
                    </button>
                  </div>

                  {editProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        {[['name', tx.fullName], ['specialty', tx.specialty], ['area', tx.baseArea]].map(([k, l]) => (
                          <div key={k}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5 }}>{l}</label>
                            <input value={profileForm[k] || ''} onChange={e => setProfileForm(p => ({ ...p, [k]: e.target.value }))}
                              style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.text, boxSizing: 'border-box' }} />
                          </div>
                        ))}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5 }}>{tx.pricePerSession}</label>
                          <input type="number" min={25} max={50} value={profileForm.price_per_session || ''} onChange={e => setProfileForm(p => ({ ...p, price_per_session: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.text, boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5 }}>{tx.yearsExperience}</label>
                          <input type="number" min={0} max={60} value={profileForm.years_experience || ''} onChange={e => setProfileForm(p => ({ ...p, years_experience: e.target.value }))}
                            placeholder={tx.yearsPh}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.text, boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5 }}>{tx.bio}</label>
                        <textarea rows={4} value={profileForm.bio || ''} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.text, resize: 'vertical', boxSizing: 'border-box' }} />
                      </div>
                      <button onClick={saveProfile} disabled={saving}
                        style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: RAD.button, border: 'none', background: C.brand, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                        <Save size={14} />
                        {saving ? tx.saving : tx.save}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        [tx.specialty, profile?.specialty],
                        [tx.baseArea, profile?.area],
                        [tx.yearsExperience, profile?.years_experience ? tx.yearsUnit(profile.years_experience) : '—'],
                        [tx.priceShort, profile?.price_per_session ? `${profile.price_per_session}€` : '—'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.borderSoft}`, fontSize: 14, gap: 12 }}>
                          <span style={{ color: C.textMuted }}>{label}</span>
                          <span style={{ fontWeight: 600, color: C.text, textAlign: 'right' }}>{value || '—'}</span>
                        </div>
                      ))}

                      {/* Δεν αφαιρείται προμήθεια από τη συνεδρία. Το παλιό
                          «Καθαρά/Συνεδρία μετά την προμήθεια» ήταν λάθος. */}
                      <div style={{ fontSize: 12.5, color: C.success, background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Wallet size={14} />
                        {tx.keepsAll}
                      </div>

                      {profile?.bio && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>{tx.bio}</div>
                          <p style={{ fontSize: 14, color: C.textBody, lineHeight: 1.7, background: C.page, padding: '12px 16px', borderRadius: 8 }}>{profile.bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ═══ ΠΑΚΕΤΟ ═══
                  Η αλλαγή χρησιμοποιεί την ΙΔΙΑ οθόνη με την εγγραφή
                  (StepPlan), ώστε κανόνες, προσφορές και σύμβαση να είναι
                  πάντα ίδια. */}
              {profileSection === 'plan' && (
                changingPlan ? (
                  <StepPlan
                    lang={lang}
                    userId={user?.id}
                    mode="change"
                    currentPlanId={subscription?.plan_id || null}
                    currentSub={subscription}
                    onBack={() => setChangingPlan(false)}
                    onDone={onPlanChanged}
                  />
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <Wallet size={15} color={C.accent} />
                        {tx.planTitle}
                      </div>
                      <button onClick={() => setChangingPlan(true)}
                        style={{ padding: '9px 20px', borderRadius: RAD.button, border: 'none', background: C.brand, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Repeat size={14} />
                        {subscription ? tx.changePlan : tx.choosePlan}
                      </button>
                    </div>

                    {pendingSub && (
                      <div style={{ background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '11px 15px', marginBottom: 16, fontSize: 13, color: C.warn, lineHeight: 1.55, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <Hourglass size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{tx.planPendingNote(
                          (lang === 'en'
                            ? (pendingSub.plan_snapshot?.name_en || pendingSub.plan_snapshot?.name_el)
                            : pendingSub.plan_snapshot?.name_el) || ''
                        )}</span>
                      </div>
                    )}

                    {!subscription ? (
                      <div style={{ padding: 20, textAlign: 'center', background: C.page, borderRadius: 10, color: C.textMuted, fontSize: 13.5 }}>
                        {tx.noActivePlan}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[
                          [tx.planName, (lang === 'en'
                            ? (subscription.subscription_plans?.name_en || subscription.subscription_plans?.name_el)
                            : subscription.subscription_plans?.name_el) || '—'],
                          [tx.planStatus, tx.planStatuses[subscription.status] || subscription.status],
                          [tx.planMonthly, monthlyPrice > 0 ? `${monthlyPrice.toFixed(2)}€` : tx.planFree],
                          [tx.planFee, `${firstSessionFee.toFixed(2)}€`],
                          ...(subscription.current_period_start
                            ? [[tx.planSince, new Date(subscription.current_period_start).toLocaleDateString(loc)]]
                            : []),
                          ...(isPromoFree && subscription.promo_ends_at
                            ? [[tx.planFreeUntil, new Date(subscription.promo_ends_at).toLocaleDateString(loc)]]
                            : []),
                          // Αυτόματη ανανέωση: πότε χρεώνεται ξανά — ή πότε λήγει
                          ...(subscription.stripe_subscription_id && subscription.current_period_end
                            ? [[subscription.cancel_at_period_end ? tx.planEndsOn : tx.planNextCharge,
                                new Date(subscription.current_period_end).toLocaleDateString(loc)]]
                            : []),
                          ...(promoActive
                            ? [[tx.payModalPromo, `${subscription.promo_code_text}${subscription.promo_ends_at ? ' ' + tx.payModalPromoUntil(new Date(subscription.promo_ends_at).toLocaleDateString(loc)) : ''}`]]
                            : []),
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.borderSoft}`, fontSize: 14 }}>
                            <span style={{ color: C.textMuted }}>{label}</span>
                            <span style={{ fontWeight: 600, color: C.text, textAlign: 'right' }}>{value}</span>
                          </div>
                        ))}

                        {promoEndingSoon && (
                          <div style={{ marginTop: 14, background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '13px 15px' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.warn, marginBottom: 4 }}>
                              {tx.promoEndingTitle(promoPlanName, promoEndDate)}
                            </div>
                            <div style={{ fontSize: 13, color: C.warn, lineHeight: 1.55, marginBottom: 10 }}>
                              {tx.promoEndingDesc(promoPlanName, listMonthlyPrice.toFixed(2), promoEndDate)}
                            </div>
                            <button onClick={continueAfterPromo} disabled={activating}
                              style={{ padding: '9px 18px', borderRadius: RAD.button, border: 'none', background: C.brand, color: '#fff', fontSize: 13, fontWeight: 600, cursor: activating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                              {tx.promoContinue(promoPlanName)}
                            </button>
                          </div>
                        )}

                        {subscription.status === 'past_due' && (
                          <div style={{ marginTop: 14, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 10, padding: '11px 15px', fontSize: 13, color: C.danger, lineHeight: 1.55 }}>
                            {tx.planPastDueNote}
                          </div>
                        )}

                        {subscription.stripe_subscription_id && subscription.cancel_at_period_end && (
                          <div style={{ marginTop: 14, background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: C.warn, lineHeight: 1.55, flex: 1, minWidth: 200 }}>
                              {tx.planEndsNote(subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString(loc) : '—')}
                            </span>
                            <button onClick={resumePlan} disabled={activating}
                              style={{ padding: '8px 16px', borderRadius: RAD.button, border: 'none', background: C.brand, color: '#fff', fontSize: 13, fontWeight: 600, cursor: activating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              {tx.planResume}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              )}

              {/* ═══ ΟΙΚΟΝΟΜΙΚΑ ΣΤΟΙΧΕΙΑ ═══
                  Τα κείμενα, το state και η saveBilling υπήρχαν ήδη·
                  έλειπε μόνο το έντυπο. */}
              {profileSection === 'billing' && (() => {
                const field = (key, label, placeholder, extra = {}) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5 }}>{label}</label>
                    <input
                      value={billingForm[key] || ''}
                      onChange={e => setBillingForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder || ''}
                      {...extra}
                      style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.text, boxSizing: 'border-box' }}
                    />
                  </div>
                );
                return (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <CreditCard size={15} color={C.accent} />
                      {tx.billingTitle}
                    </div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14, lineHeight: 1.55 }}>{tx.billingDesc}</div>

                    <div style={{ background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12.5, color: C.info, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Lock size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{tx.billingPrivacy}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                      {field('payout_name', tx.fPayoutName, tx.fPayoutNamePh)}
                      {field('iban', tx.fIban, tx.fIbanPh, { autoComplete: 'off' })}
                      {field('tax_id', tx.fTaxId, '', { inputMode: 'numeric', maxLength: 11 })}
                      {field('tax_office', tx.fTaxOffice, '')}
                      {field('legal_name', tx.fLegalName, tx.fLegalNamePh)}
                      {field('billing_address', tx.fBillingAddress, tx.fBillingAddressPh)}
                      {kadKey && field(kadKey, tx.fKad, tx.fKadPh)}
                    </div>

                    {billingMsg && (
                      <div style={{
                        background: billingMsg.type === 'success' ? C.successBg : C.dangerBg,
                        border: `1px solid ${billingMsg.type === 'success' ? C.successBorder : C.dangerBorder}`,
                        color: billingMsg.type === 'success' ? C.success : C.danger,
                        borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14,
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}>
                        {billingMsg.type === 'success' ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} />}
                        {billingMsg.text}
                      </div>
                    )}

                    <button onClick={saveBilling} disabled={savingBilling}
                      style={{ padding: '10px 24px', borderRadius: RAD.button, border: 'none', background: savingBilling ? C.textFaint : C.brand, color: '#fff', fontSize: 14, fontWeight: 600, cursor: savingBilling ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                      <Save size={14} />
                      {savingBilling ? tx.saving : tx.billingSave}
                    </button>
                  </>
                );
              })()}

              {profileSection === 'areas' && (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <MapPin size={15} color={C.accent} />
                    {tx.areasTitle}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 18 }}>{tx.areasDesc}</div>

                  <div style={{ background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: 10, padding: '11px 15px', marginBottom: 18, fontSize: 12, color: C.info, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Lightbulb size={14} color={C.info} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span><strong>{tx.areasSoonLabel}</strong> {tx.areasSoon}</span>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>
                      {tx.areasSelected((profile?.service_areas || []).length)}
                    </div>
                    {(profile?.service_areas || []).length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', background: C.page, borderRadius: 10, color: C.textFaint, fontSize: 13, fontStyle: 'italic' }}>
                        {tx.areasEmpty}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(profile?.service_areas || []).map(area => (
                          <div key={area} style={{ background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: RAD.button, padding: '6px 8px 6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.info, fontWeight: 500 }}>
                            <MapPin size={12} />
                            {area}
                            <button onClick={() => removeArea(area)} disabled={savingAreas}
                              style={{ background: 'transparent', border: 'none', color: C.info, cursor: 'pointer', padding: 0, marginLeft: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%' }}>
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                      {tx.addArea}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={areaInput}
                        onChange={e => handleAreaInputChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && areaInput.trim()) { e.preventDefault(); addArea(areaInput); } }}
                        placeholder={tx.areaPh}
                        style={{ flex: 1, padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.text }}
                      />
                      <button onClick={() => addArea(areaInput)} disabled={!areaInput.trim() || savingAreas}
                        style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: !areaInput.trim() ? C.border : C.brand, color: '#fff', fontSize: 13, fontWeight: 600, cursor: !areaInput.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={14} strokeWidth={2.5} />
                        {tx.add}
                      </button>
                    </div>

                    {areaSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 100, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 240, overflowY: 'auto' }}>
                        {areaSuggestions.map(s => (
                          <div key={s} onClick={() => addArea(s)}
                            style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={12} color={C.textFaint} />
                            {s}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Lightbulb size={12} />
                      {tx.areaHint}
                    </div>
                  </div>
                </>
              )}

              {profileSection === 'conditions' && (
                <TherapistConditionsSection
                  userId={user?.id}
                  specialty={profile?.specialty}
                  lang={lang}
                  tx={tx}
                />
              )}

              {profileSection === 'documents' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <FileText size={15} color={C.accent} />
                      {tx.documents}
                    </div>
                    <button onClick={() => setDocsModal(true)}
                      style={{ background: C.brand, border: 'none', borderRadius: RAD.button, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={13} />
                      {tx.manage}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: hasLicense ? C.successBg : C.warnBg, border: `1px solid ${hasLicense ? C.successBorder : C.warnBorder}`, borderRadius: 10, fontSize: 13 }}>
                      {hasLicense ? <CheckCircle2 size={16} color={C.success} /> : <AlertTriangle size={16} color={C.warn} />}
                      <strong>{tx.license}</strong>
                      <span style={{ marginLeft: 'auto', color: hasLicense ? C.success : C.warn, fontWeight: 600, fontSize: 12 }}>
                        {hasLicense ? tx.uploaded : tx.missingRequired}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.page, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13 }}>
                      {hasCv ? <CheckCircle2 size={16} color={C.success} /> : <span style={{ width: 16, height: 16, display: 'inline-block', borderRadius: '50%', background: C.border }} />}
                      <span>{tx.cv}</span>
                      <span style={{ marginLeft: 'auto', color: C.textMuted, fontSize: 12 }}>{hasCv ? tx.uploaded : tx.optional}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.page, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13 }}>
                      {certCount > 0 ? <CheckCircle2 size={16} color={C.success} /> : <span style={{ width: 16, height: 16, display: 'inline-block', borderRadius: '50%', background: C.border }} />}
                      <span>{tx.certifications}</span>
                      <span style={{ marginLeft: 'auto', color: C.textMuted, fontSize: 12 }}>{certCount > 0 ? tx.filesCount(certCount) : tx.optionalPlural}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Χωρίς reviews δεν έχει νόημα να δείχνουμε δύο άδεια KPI
                  cards με «—» και «0». Ένα καθαρό empty state αρκεί. */}
              {profileSection === 'reviews' && (
                reviews.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Star size={38} color={C.border} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.textBody, marginBottom: 5 }}>{tx.noReviews}</div>
                    <div style={{ fontSize: 13, color: C.textFaint }}>{tx.noReviewsSub}</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${C.borderSoft}`, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 34, fontWeight: 700, color: C.warn, lineHeight: 1 }}>{avgRating}</div>
                      <div>
                        <ReviewStars rating={Math.round(Number(avgRating))} size={16} />
                        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{tx.reviewsCount(reviews.length)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {reviews.map(r => (
                        <div key={r.id} style={{ padding: '14px 16px', background: C.page, borderRadius: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                            <ReviewStars rating={r.rating} size={13} />
                            <span style={{ fontSize: 12, color: C.textFaint }}>{new Date(r.created_at).toLocaleDateString(loc)}</span>
                          </div>
                          {r.comment && <p style={{ fontSize: 14, color: C.textBody, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
      </div>
      </div>

      {/* ═══ MODAL: ΠΩΣ ΛΕΙΤΟΥΡΓΟΥΝ ΟΙ ΠΛΗΡΩΜΕΣ ═══ */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setPayModal(false); }}>
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ padding: '22px 26px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={17} color={C.success} />
                {tx.payModalTitle}
              </h2>
              <button onClick={() => setPayModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textFaint, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 12, padding: '14px 16px', fontSize: 13.5, color: C.success, lineHeight: 1.65 }}>
                {tx.payModalCash}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: C.textMuted }}>{tx.payModalYourPrice}</span>
                  <strong style={{ color: C.text }}>{pricePerSession}€</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: C.textMuted }}>{tx.payModalSubscription}</span>
                  <strong style={{ color: C.text }}>
                    {subscription
                      ? (monthlyPrice > 0 ? `${monthlyPrice.toFixed(2)}€` : '0€')
                      : tx.noPlan}
                    {subscription && promoActive && listMonthlyPrice > monthlyPrice && (
                      <span style={{ marginLeft: 8, fontWeight: 400, color: C.textFaint, fontSize: 12, textDecoration: 'line-through' }}>
                        {listMonthlyPrice.toFixed(2)}€
                      </span>
                    )}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: C.textMuted }}>{tx.payModalFirstFee}</span>
                  <strong style={{ color: C.text }}>
                    {firstSessionFee.toFixed(2)}€
                    {promoActive && listFirstSessionFee > firstSessionFee && (
                      <span style={{ marginLeft: 8, fontWeight: 400, color: C.textFaint, fontSize: 12, textDecoration: 'line-through' }}>
                        {listFirstSessionFee.toFixed(2)}€
                      </span>
                    )}
                    <span style={{ fontWeight: 400, color: C.textFaint, fontSize: 12 }}> {tx.payModalPerNewPatient}</span>
                  </strong>
                </div>
                {/* Τι ισχύει σήμερα και μέχρι πότε. Χωρίς αυτό, ο θεραπευτής
                    βλέπει «0€» και δεν ξέρει ότι είναι προσωρινό. */}
                {subscription && promoActive && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: C.textMuted }}>{tx.payModalPromo}</span>
                    <strong style={{ color: C.info }}>
                      {subscription.promo_code_text}
                      {subscription.promo_ends_at && (
                        <span style={{ fontWeight: 400, color: C.textFaint, fontSize: 12 }}>
                          {' '}{tx.payModalPromoUntil(new Date(subscription.promo_ends_at).toLocaleDateString(loc))}
                        </span>
                      )}
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 10, borderTop: `1px solid ${C.borderSoft}` }}>
                  <span style={{ color: C.textMuted }}>{tx.payModalOpen}</span>
                  <strong style={{ color: owedTotal > 0 ? C.warn : C.success, fontSize: 15 }}>{owedTotal.toFixed(2)}€</strong>
                </div>
              </div>

              <div style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Lightbulb size={13} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{tx.payModalFeeExplain}</span>
              </div>
            </div>

            <div style={{ padding: '14px 26px', borderTop: `1px solid ${C.borderSoft}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setPayModal(false)}
                style={{ background: C.brand, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: RAD.button, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {tx.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar day-detail modal */}
      {selectedDay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedDay(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 0, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{formatFullDate(selectedDay.date)}</h2>
              <button onClick={() => setSelectedDay(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textFaint, display: 'flex', alignItems: 'center' }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedDay.appointments.map(apt => {
                const bSt = statusLabel(STATUS, apt.status);
                return (
                  <div key={apt.id} style={{ background: C.page, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                      {tx.at} {apt.session_time?.slice(0, 5)}
                    </div>
                    <div style={{ fontSize: 14, color: C.textBody, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} color={C.accent} />
                      {apt.request?.patient_name || tx.unknown}
                    </div>
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

      {/* MARK AS DONE MODAL */}
      {doneModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setDoneModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={28} color={C.success} strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 12, textAlign: 'center' }}>{tx.doneModalTitle}</h2>
            <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
              {tx.doneModalDesc(doneModal.request?.patient_name || tx.unknown)}
            </p>

            {/* Ο ασθενής πληρώνει μετρητά — δεν αφαιρείται προμήθεια εδώ. */}
            <div style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.success, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                {tx.sessionAmount}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.success }}>
                {bookingAmount(doneModal.booking).toFixed(2)}€
              </div>
            </div>

            <div style={{ background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: C.warn, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Hourglass size={14} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{tx.doneModalWarn} <strong>{tx.doneModalWarnDays}</strong> {tx.doneModalWarnEnd}</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDoneModal(null)} disabled={marking}
                style={{ flex: 1, padding: '12px', borderRadius: RAD.button, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: marking ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {tx.cancel}
              </button>
              <button onClick={markBookingDone} disabled={marking}
                style={{ flex: 2, padding: '12px', borderRadius: RAD.button, border: 'none', background: marking ? C.textFaint : C.success, color: '#fff', fontSize: 14, fontWeight: 600, cursor: marking ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                <Check size={14} strokeWidth={3} />
                {marking ? tx.marking : tx.confirmDone}
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
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color={C.accent} />
                {tx.documents}
              </h2>
              <button onClick={() => setDocsModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textFaint, display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: C.warn, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={16} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>{tx.docsModalWarnA}</strong> {tx.docsModalWarnB}</span>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap size={15} color={C.accent} />
                  {tx.license} <span style={{ color: C.danger }}>*</span>
                </div>
                {hasLicense ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 10, flexWrap: 'wrap' }}>
                    <CheckCircle2 size={18} color={C.success} />
                    <span style={{ fontSize: 13, color: C.success, fontWeight: 600, flex: 1 }}>{tx.uploaded}</span>
                    <button onClick={() => viewDocument(profile.license_url)}
                      style={{ background: 'transparent', border: `1px solid ${C.successBorder}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: C.success, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                      <Eye size={12} />
                      {tx.view}
                    </button>
                    <button onClick={() => removeDocument('license')}
                      style={{ background: 'transparent', border: `1px solid ${C.dangerBorder}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: C.danger, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                      <Trash2 size={12} />
                      {tx.remove}
                    </button>
                  </div>
                ) : (
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{tx.fileHint}</div>
                    <button onClick={() => licenseInputRef.current?.click()} disabled={uploadingDoc === 'license'}
                      style={{ background: C.brand, color: '#fff', border: 'none', borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={12} />
                      {uploadingDoc === 'license' ? tx.uploading : tx.chooseFile}
                    </button>
                    <input ref={licenseInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDocument(e.target.files[0], 'license')} style={{ display: 'none' }} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} color={C.accent} />
                  {tx.cv} <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>{tx.optionalParen}</span>
                </div>
                {hasCv ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: 10, flexWrap: 'wrap' }}>
                    <CheckCircle2 size={18} color={C.info} />
                    <span style={{ fontSize: 13, color: C.info, fontWeight: 600, flex: 1 }}>{tx.uploaded}</span>
                    <button onClick={() => viewDocument(profile.cv_url)}
                      style={{ background: 'transparent', border: `1px solid ${C.infoBorder}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: C.info, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                      <Eye size={12} />
                      {tx.view}
                    </button>
                    <button onClick={() => removeDocument('cv')}
                      style={{ background: 'transparent', border: `1px solid ${C.dangerBorder}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: C.danger, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontFamily: 'inherit' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{tx.fileHint}</div>
                    <button onClick={() => cvInputRef.current?.click()} disabled={uploadingDoc === 'cv'}
                      style={{ background: 'transparent', color: C.brand, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={12} />
                      {uploadingDoc === 'cv' ? tx.uploading : tx.choose}
                    </button>
                    <input ref={cvInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDocument(e.target.files[0], 'cv')} style={{ display: 'none' }} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Award size={15} color={C.accent} />
                  {tx.certifications} <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>{tx.optionalMulti}</span>
                </div>
                {(profile?.certifications_urls || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    {(profile.certifications_urls || []).map((path, idx) => (
                      <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.page, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                        <FileText size={14} color={C.textMuted} />
                        <span style={{ fontSize: 12, color: C.textBody, flex: 1 }}>{tx.certLabel(idx + 1)}</span>
                        <button onClick={() => viewDocument(path)}
                          style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: C.brand, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontFamily: 'inherit' }}>
                          <Eye size={12} />
                        </button>
                        <button onClick={() => removeDocument('cert', path)}
                          style={{ background: 'transparent', border: `1px solid ${C.dangerBorder}`, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: C.danger, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontFamily: 'inherit' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{tx.certHint}</div>
                  <button onClick={() => certInputRef.current?.click()} disabled={uploadingDoc === 'cert'}
                    style={{ background: 'transparent', color: C.brand, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={12} strokeWidth={2.5} />
                    {uploadingDoc === 'cert' ? tx.uploading : tx.add}
                  </button>
                  <input ref={certInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDocument(e.target.files[0], 'cert')} style={{ display: 'none' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.borderSoft}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDocsModal(false)}
                style={{ background: C.brand, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: RAD.button, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {tx.close}
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
            therapist_id: rescheduleTarget.booking.therapist_id || user?.id,
            session_date: rescheduleTarget.booking.session_date,
            session_time: rescheduleTarget.booking.session_time,
          }}
          reschedule={rescheduleTarget.reschedule}
          mode={rescheduleTarget.mode}
          lang={lang}
          onClose={() => setRescheduleTarget(null)}
          onDone={() => { setRescheduleTarget(null); loadRequests(user.id); reloadSlots(); }}
        />
      )}

      {/* Modal ακύρωσης — η βάση επιβάλλει τους κανόνες και τα strikes */}
      {cancelTarget && (
        <CancelBookingModal
          bookingId={cancelTarget.bookingId}
          requestId={cancelTarget.requestId}
          onClose={() => setCancelTarget(null)}
          onDone={onCancelDone}
        />
      )}
      {reportTarget && (
        <ReportModal
          mode={reportTarget.mode}
          booking={reportTarget.booking}
          otherName={reportTarget.otherName}
          lang={lang}
          onClose={() => setReportTarget(null)}
          onDone={() => { setReportTarget(null); load(); }}
        />
      )}

    </div>
  );
}