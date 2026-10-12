'use client';
// src/components/therapist/AvailabilityCalendar.jsx
// ═══════════════════════════════════════════════════════════════════
// ΗΜΕΡΟΛΟΓΙΟ ΔΙΑΘΕΣΙΜΟΤΗΤΑΣ ΦΥΣΙΚΟΘΕΡΑΠΕΥΤΗ — εβδομάδα / ημέρα.
//
// ΠΗΓΗ ΑΛΗΘΕΙΑΣ: ο πίνακας availability_slots, όπως πριν. Κάθε ώρα που
// μπορεί να κλειστεί είναι ένα slot. Το ημερολόγιο απλώς τα ΔΕΙΧΝΕΙ:
//   • συνεχόμενα ελεύθερα slots → ένα πράσινο κουτί (π.χ. 17:00–20:00)
//   • slot με αίτημα σε αναμονή  → πορτοκαλί, με το όνομα του ασθενή
//   • slot με επιβεβαιωμένο ραντεβού → κόκκινο, με το όνομα του ασθενή
//   • ολόκληρη μέρα ρεπό          → γκρι στήλη
// Αν 17:00–20:00 είναι διαθέσιμο και κλειστεί το 18:00, φαίνεται αμέσως
// 17–18 διαθέσιμο · 18–19 ραντεβού · 19–20 διαθέσιμο.
//
// ΓΡΑΨΙΜΟ: μόνο μέσω των συναρτήσεων της βάσης:
//   add_availability_range  — νέο διάστημα, χωρίς επικαλύψεις
//   remove_free_slots       — αφαίρεση ΜΟΝΟ ελεύθερων ωρών
//   generate_availability_slots / copy_week_availability / clear_free_slots
// Ένα ραντεβού δεν αλλάζει ΠΟΤΕ από εδώ: για αλλαγή ή ακύρωση, ο
// φυσικοθεραπευτής πηγαίνει στα Ραντεβού, όπου ειδοποιείται ο ασθενής.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { C, R as RAD } from '@/lib/tokens';
import {
  ChevronLeft, ChevronRight, Plus, Copy, CalendarRange, CalendarOff, X, Trash2,
  Check, AlertTriangle, Clock, User, MapPin, ArrowRight, SlidersHorizontal, Repeat, Lightbulb,
} from 'lucide-react';

// ─── Κείμενα ─────────────────────────────────────────────────────────
const TX = {
  el: {
    title: 'Διαθεσιμότητα',
    subtitle: 'Οι ώρες που μπορούν να κλείσουν οι ασθενείς, τα ραντεβού σου και τα ρεπό, σε ένα ημερολόγιο.',
    today: 'Σήμερα', week: 'Εβδομάδα', day: 'Ημέρα',
    prevWeek: 'Προηγούμενη εβδομάδα', nextWeek: 'Επόμενη εβδομάδα', prevDay: 'Προηγούμενη ημέρα', nextDay: 'Επόμενη ημέρα',
    available: 'Διαθέσιμο', pending: 'Αίτημα σε αναμονή', booked: 'Ραντεβού', completed: 'Ολοκληρώθηκε', taken: 'Κλεισμένο',
    dayOff: 'Ρεπό', allDay: 'Όλη μέρα',
    tools: 'Εργαλεία', addShort: 'Προσθήκη',
    addTitle: 'Προσθήκη διαθεσιμότητας', addDesc: 'Ώρες για συγκεκριμένη ημερομηνία',
    copyTitle: 'Αντιγραφή εβδομάδας', copyDesc: 'Ίδιες ώρες σε επόμενες εβδομάδες',
    genTitle: 'Μελλοντικές εβδομάδες', genDesc: 'Από το σταθερό εβδομαδιαίο πρόγραμμα',
    excTitle: 'Ρεπό & άδειες', excDesc: 'Ολόκληρες μέρες χωρίς ραντεβού',
    legend: 'Υπόμνημα',
    legendFree: 'Διαθέσιμο', legendFreeSub: 'Μπορεί να κλειστεί από ασθενή',
    legendPending: 'Αίτημα σε αναμονή', legendPendingSub: 'Η ώρα κρατιέται μέχρι να απαντήσεις',
    legendBooked: 'Ραντεβού', legendBookedSub: 'Επιβεβαιωμένη συνεδρία',
    legendOff: 'Ρεπό / μη διαθέσιμο', legendOffSub: 'Δεν κλείνονται ραντεβού',
    tip: 'Πάτησε σε κενό σημείο του ημερολογίου για να προσθέσεις ώρες. Στον υπολογιστή μπορείς και να σύρεις για να επιλέξεις διάστημα.',
    date: 'Ημερομηνία', from: 'Από', to: 'Έως', duration: 'Διάρκεια συνεδρίας', min: "'",
    slotsPreview: (n, m) => n > 0 ? `Θα δημιουργηθούν ${n} ${n === 1 ? 'ώρα' : 'ώρες'} των ${m}'.` : 'Το διάστημα είναι μικρότερο από μία συνεδρία.',
    save: 'Αποθήκευση', cancel: 'Άκυρο', close: 'Κλείσιμο', saving: 'Αποθήκευση…',
    added: (c, s) => (c === 1 ? 'Προστέθηκε 1 ώρα' : `Προστέθηκαν ${c} ώρες`) + (s ? ` · ${s} παραλείφθηκ${s === 1 ? 'ε' : 'αν'} (πέφτ${s === 1 ? 'ει' : 'ουν'} πάνω σε υπάρχουσα ώρα ή έχ${s === 1 ? 'ει' : 'ουν'} περάσει)` : '') + '.',
    addedNone: 'Δεν προστέθηκε καμία ώρα: όλο το διάστημα πέφτει πάνω σε υπάρχουσες ώρες ή έχει περάσει.',
    errRange: 'Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.',
    errDayOff: 'Αυτή η μέρα είναι δηλωμένη ως ρεπό. Αφαίρεσε πρώτα το ρεπό.',
    errDate: 'Δεν μπορείς να προσθέσεις ώρες σε ημερομηνία που πέρασε.',
    errGeneric: 'Κάτι πήγε στραβά: ',
    freeBlock: 'Διαθέσιμο διάστημα',
    freeSlots: (n) => `${n} ${n === 1 ? 'ώρα' : 'ώρες'} που μπορούν να κλειστούν`,
    removeOne: 'Αφαίρεση αυτής της ώρας',
    removeAll: 'Αφαίρεση όλου του διαστήματος',
    confirmRemoveAll: (r) => `Να αφαιρεθεί όλο το διάστημα ${r};\n\nΣβήνονται μόνο ελεύθερες ώρες. Ραντεβού δεν επηρεάζονται.`,
    removed: (n) => `Αφαιρέθηκ${n === 1 ? 'ε' : 'αν'} ${n} ${n === 1 ? 'ώρα' : 'ώρες'}.`,
    changeRange: 'Αλλαγή ωρών',
    apply: 'Εφαρμογή',
    bookingTitle: 'Ραντεβού', pendingTitle: 'Αίτημα σε αναμονή',
    patient: 'Ασθενής', when: 'Ημερομηνία & ώρα', area: 'Περιοχή', status: 'Κατάσταση',
    bookingNote: 'Για αλλαγή ώρας ή ακύρωση, χρησιμοποίησε τα Ραντεβού. Έτσι ενημερώνεται και ο ασθενής.',
    pendingNote: 'Η ώρα κρατιέται για τον ασθενή μέχρι να αποδεχτείς ή να απορρίψεις το αίτημα.',
    openAppointments: 'Άνοιγμα στα Ραντεβού', openRequests: 'Άνοιγμα στα Αιτήματα',
    patientFallback: 'Ασθενής',
    copyBody: (w) => `Οι ώρες της εβδομάδας ${w} αντιγράφονται στις επόμενες εβδομάδες. Ώρες που πέφτουν πάνω σε υπάρχουσες και μέρες ρεπό παραλείπονται.`,
    copyWeeks: 'Για πόσες εβδομάδες', weeks: (n) => `${n} ${n === 1 ? 'εβδομάδα' : 'εβδομάδες'}`,
    copyBtn: 'Αντιγραφή', copying: 'Αντιγραφή…',
    copied: (n) => n > 0 ? `Αντιγράφηκαν ${n} ώρες.` : 'Δεν χρειάστηκε να αντιγραφεί κάτι: οι ώρες υπάρχουν ήδη.',
    copyEmpty: 'Η εβδομάδα που βλέπεις δεν έχει ώρες για αντιγραφή.',
    weeklyTitle: 'Σταθερό εβδομαδιαίο πρόγραμμα',
    weeklyDesc: 'Το ωράριο που επαναλαμβάνεται κάθε εβδομάδα. Από αυτό δημιουργούνται οι ώρες στο ημερολόγιο.',
    noBlocks: 'Δεν έχεις ορίσει ακόμα εβδομαδιαίο πρόγραμμα.',
    weekday: 'Ημέρα', addBlock: 'Προσθήκη', removeBlock: 'Αφαίρεση',
    errBlockOverlap: 'Αυτό το ωράριο πέφτει πάνω σε άλλο της ίδιας ημέρας.',
    genSection: 'Δημιουργία ωρών στο ημερολόγιο',
    genBody: 'Οι ώρες του προγράμματος μπαίνουν στο ημερολόγιο για τις επόμενες εβδομάδες. Ώρες που υπάρχουν ήδη, ραντεβού και ρεπό δεν επηρεάζονται.',
    genWeeks: 'Για τις επόμενες', genBtn: 'Δημιουργία ωρών', generating: 'Δημιουργία…',
    generated: (n) => n > 0 ? `Δημιουργήθηκαν ${n} νέες ώρες.` : 'Όλες οι ώρες υπήρχαν ήδη — δεν χρειάστηκε να δημιουργηθεί κάτι.',
    genNeedsBlocks: 'Πρόσθεσε πρώτα ένα ωράριο παραπάνω.',
    excBody: 'Σε μέρα ρεπό αφαιρούνται οι ελεύθερες ώρες και δεν δημιουργούνται νέες. Ραντεβού που υπάρχουν ήδη ΔΕΝ ακυρώνονται — αν χρειάζεται, ακύρωσέ τα από τα Ραντεβού.',
    excNote: 'Σημείωση (προαιρετικά)', excNotePh: 'π.χ. Άδεια', excAdd: 'Προσθήκη ρεπό',
    noExc: 'Δεν υπάρχουν μελλοντικά ρεπό.',
    excAdded: 'Το ρεπό προστέθηκε.',
    excHasBookings: (n) => `Προσοχή: εκείνη τη μέρα υπάρχ${n === 1 ? 'ει' : 'ουν'} ${n} ${n === 1 ? 'ραντεβού ή αίτημα' : 'ραντεβού ή αιτήματα'}. Δεν ακυρώνονται αυτόματα.`,
    removeExc: 'Αφαίρεση ρεπό',
    excRemoved: 'Το ρεπό αφαιρέθηκε. Μπορείς τώρα να προσθέσεις ώρες εκείνη τη μέρα.',
    confirmRemoveExc: 'Να αφαιρεθεί το ρεπό;',
    nothingThisWeek: 'Δεν υπάρχουν ώρες αυτή την εβδομάδα. Πρόσθεσε διαθεσιμότητα ή δημιούργησε ώρες από το εβδομαδιαίο πρόγραμμα.',
    loading: 'Φόρτωση…',
    hourLabel: 'Ώρα',
  },
  en: {
    title: 'Availability',
    subtitle: 'The hours patients can book, your appointments and days off, in one calendar.',
    today: 'Today', week: 'Week', day: 'Day',
    prevWeek: 'Previous week', nextWeek: 'Next week', prevDay: 'Previous day', nextDay: 'Next day',
    available: 'Available', pending: 'Pending request', booked: 'Appointment', completed: 'Completed', taken: 'Booked',
    dayOff: 'Day off', allDay: 'All day',
    tools: 'Tools', addShort: 'Add',
    addTitle: 'Add availability', addDesc: 'Hours on a specific date',
    copyTitle: 'Copy week', copyDesc: 'Same hours in the following weeks',
    genTitle: 'Future weeks', genDesc: 'From your recurring weekly schedule',
    excTitle: 'Days off & leave', excDesc: 'Whole days without appointments',
    legend: 'Legend',
    legendFree: 'Available', legendFreeSub: 'Patients can book it',
    legendPending: 'Pending request', legendPendingSub: 'Held until you reply',
    legendBooked: 'Appointment', legendBookedSub: 'Confirmed session',
    legendOff: 'Day off / unavailable', legendOffSub: 'No bookings',
    tip: 'Click an empty spot in the calendar to add hours. On a computer you can also drag to select a range.',
    date: 'Date', from: 'From', to: 'To', duration: 'Session length', min: ' min',
    slotsPreview: (n, m) => n > 0 ? `${n} ${n === 1 ? 'slot' : 'slots'} of ${m} min will be created.` : 'The range is shorter than one session.',
    save: 'Save', cancel: 'Cancel', close: 'Close', saving: 'Saving…',
    added: (c, s) => `Added ${c} ${c === 1 ? 'slot' : 'slots'}` + (s ? ` · ${s} skipped (overlapping an existing slot or in the past)` : '') + '.',
    addedNone: 'Nothing was added: the whole range overlaps existing slots or is in the past.',
    errRange: 'The end time must be after the start time.',
    errDayOff: 'This date is marked as a day off. Remove the day off first.',
    errDate: 'You cannot add hours to a past date.',
    errGeneric: 'Something went wrong: ',
    freeBlock: 'Available range',
    freeSlots: (n) => `${n} bookable ${n === 1 ? 'slot' : 'slots'}`,
    removeOne: 'Remove this slot',
    removeAll: 'Remove the whole range',
    confirmRemoveAll: (r) => `Remove the whole range ${r}?\n\nOnly free slots are removed. Appointments are not affected.`,
    removed: (n) => `Removed ${n} ${n === 1 ? 'slot' : 'slots'}.`,
    changeRange: 'Change hours',
    apply: 'Apply',
    bookingTitle: 'Appointment', pendingTitle: 'Pending request',
    patient: 'Patient', when: 'Date & time', area: 'Area', status: 'Status',
    bookingNote: 'To reschedule or cancel, use Appointments, so the patient is notified.',
    pendingNote: 'This slot is held for the patient until you accept or decline the request.',
    openAppointments: 'Open in Appointments', openRequests: 'Open in Requests',
    patientFallback: 'Patient',
    copyBody: (w) => `The hours of the week ${w} are copied to the following weeks. Overlapping slots and days off are skipped.`,
    copyWeeks: 'For how many weeks', weeks: (n) => `${n} ${n === 1 ? 'week' : 'weeks'}`,
    copyBtn: 'Copy', copying: 'Copying…',
    copied: (n) => n > 0 ? `Copied ${n} slots.` : 'Nothing needed copying: the slots already exist.',
    copyEmpty: 'The week you are viewing has no slots to copy.',
    weeklyTitle: 'Recurring weekly schedule',
    weeklyDesc: 'Your hours that repeat every week. Calendar slots are created from it.',
    noBlocks: 'You have not set a weekly schedule yet.',
    weekday: 'Day', addBlock: 'Add', removeBlock: 'Remove',
    errBlockOverlap: 'This overlaps another block on the same day.',
    genSection: 'Create slots in the calendar',
    genBody: 'Your schedule is added to the calendar for the coming weeks. Existing slots, appointments and days off are not affected.',
    genWeeks: 'For the next', genBtn: 'Create slots', generating: 'Creating…',
    generated: (n) => n > 0 ? `Created ${n} new slots.` : 'All slots already existed — nothing to create.',
    genNeedsBlocks: 'Add a schedule block above first.',
    excBody: 'On a day off, free slots are removed and no new ones are created. Existing appointments are NOT cancelled — cancel them from Appointments if needed.',
    excNote: 'Note (optional)', excNotePh: 'e.g. Leave', excAdd: 'Add day off',
    noExc: 'No upcoming days off.',
    excAdded: 'Day off added.',
    excHasBookings: (n) => `Note: there ${n === 1 ? 'is' : 'are'} ${n} ${n === 1 ? 'appointment or request' : 'appointments or requests'} on that day. They are not cancelled automatically.`,
    removeExc: 'Remove day off',
    excRemoved: 'Day off removed. You can now add hours on that day.',
    confirmRemoveExc: 'Remove this day off?',
    nothingThisWeek: 'No slots this week. Add availability or create slots from your weekly schedule.',
    loading: 'Loading…',
    hourLabel: 'Time',
  },
};

const DAY_NAMES = {
  el: ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const DAY_SHORT = {
  el: ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const MONTHS_GEN = {
  el: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_SHORT = {
  el: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

// Απαλά χρώματα των blocks — ίδιο σύστημα με τα tokens.
const TONE = {
  free:      { bg: '#ecfdf3', br: '#86efac', bar: '#22c55e', fg: '#166534', sub: '#15803d' },
  pending:   { bg: '#fff7ed', br: '#fdba74', bar: '#f97316', fg: '#9a3412', sub: '#c2410c' },
  booked:    { bg: '#fff1f2', br: '#fda4af', bar: '#f43f5e', fg: '#9f1239', sub: '#be123c' },
  completed: { bg: '#f1f5f9', br: '#cbd5e1', bar: '#64748b', fg: '#334155', sub: '#64748b' },
  taken:     { bg: '#f1f5f9', br: '#cbd5e1', bar: '#94a3b8', fg: '#334155', sub: '#64748b' },
  off:       { bg: '#f1f5f9', br: '#e2e8f0', bar: '#cbd5e1', fg: '#475569', sub: '#64748b' },
};

const DURATIONS = [30, 45, 60, 90];
const ROW_H = 26;            // ύψος 30 λεπτών σε pixels
const DEFAULT_FROM = 9 * 60; // 09:00
const DEFAULT_TO = 21 * 60;  // 21:00

// ─── Βοηθητικά ημερομηνιών (τοπική ώρα, χωρίς UTC εκπλήξεις) ─────────
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = dateOf(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const mondayOf = (iso) => { const d = dateOf(iso); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return isoOf(d); };
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
const toHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const todayIso = () => isoOf(new Date());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function useIsNarrow(px) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [px]);
  return narrow;
}

// ═══════════════════════════════════════════════════════════════════
export default function AvailabilityCalendar({ userId, lang = 'el', slots = [], requests = [], onSlotsChanged, onOpenTab }) {
  const tx = TX[lang] || TX.el;
  const isMobile = useIsNarrow(767);
  const isWide = useIsNarrow(1279) === false;

  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(todayIso());       // επιλεγμένη μέρα
  const [exceptions, setExceptions] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [msg, setMsg] = useState(null);
  const [modal, setModal] = useState(null);                // { kind, ... }
  const [toolsOpen, setToolsOpen] = useState(false);
  const [drag, setDrag] = useState(null);                  // { date, a, b } σε λεπτά
  const dragRef = useRef(null);

  // Στο κινητό ξεκινάμε σε προβολή ημέρας
  useEffect(() => { if (isMobile) setView('day'); }, [isMobile]);

  const flash = useCallback((type, text) => {
    setMsg({ type, text });
    clearTimeout(flash._t);
    flash._t = setTimeout(() => setMsg(null), 7000);
  }, []);

  const loadAux = useCallback(async () => {
    if (!userId) return;
    const [{ data: e }, { data: b }] = await Promise.all([
      supabase.from('therapist_schedule_exceptions').select('*').eq('therapist_id', userId).gte('date', addDays(todayIso(), -60)).order('date'),
      supabase.from('therapist_weekly_schedule').select('*').eq('therapist_id', userId).order('weekday').order('start_time'),
    ]);
    setExceptions(e || []);
    setBlocks(b || []);
  }, [userId]);

  useEffect(() => { loadAux(); }, [loadAux]);

  // ─── Ημέρες που φαίνονται ──────────────────────────────────────────
  const weekStart = mondayOf(anchor);
  const days = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [anchor];

  // ─── Ραντεβού ανά slot ─────────────────────────────────────────────
  const bookingBySlot = useMemo(() => {
    const map = {};
    for (const r of requests || []) {
      for (const b of r.bookings || []) {
        if (!b.slot_id) continue;
        if (String(b.status || '').startsWith('cancelled')) continue;
        map[b.slot_id] = { booking: b, request: r };
      }
    }
    return map;
  }, [requests]);

  const excByDate = useMemo(() => {
    const m = {};
    for (const e of exceptions) if (e.is_unavailable !== false) m[e.date] = e;
    return m;
  }, [exceptions]);

  // ─── Από slots σε blocks ανά μέρα ──────────────────────────────────
  const itemsByDay = useMemo(() => {
    const out = {};
    for (const d of days) out[d] = [];
    const visible = new Set(days);
    const byDay = {};
    for (const s of slots || []) {
      if (!visible.has(s.date)) continue;
      (byDay[s.date] ||= []).push(s);
    }
    for (const d of Object.keys(byDay)) {
      const list = byDay[d].slice().sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
      let run = null;
      const flush = () => { if (run) { out[d].push(run); run = null; } };
      for (const s of list) {
        const st = toMin(s.start_time);
        let en = toMin(s.end_time);
        if (en <= st) en = 24 * 60;
        const bk = bookingBySlot[s.id];
        if (!s.is_blocked && !bk) {
          if (run && run.kind === 'free' && run.end === st) {
            run.end = en; run.slots.push(s);
          } else {
            flush();
            run = { kind: 'free', date: d, start: st, end: en, slots: [s], key: s.id };
          }
        } else {
          flush();
          const status = bk?.booking?.status;
          const kind = !bk ? 'taken'
            : status === 'pending' ? 'pending'
            : status === 'completed' ? 'completed'
            : 'booked';
          out[d].push({ kind, date: d, start: st, end: en, slots: [s], key: s.id, booking: bk?.booking, request: bk?.request });
        }
      }
      flush();
    }
    return out;
  }, [slots, days.join(','), bookingBySlot]);

  // ─── Εύρος ωρών του πλέγματος ──────────────────────────────────────
  const [rangeFrom, rangeTo] = useMemo(() => {
    let lo = DEFAULT_FROM, hi = DEFAULT_TO;
    for (const d of days) for (const it of itemsByDay[d] || []) {
      lo = Math.min(lo, Math.floor(it.start / 60) * 60);
      hi = Math.max(hi, Math.ceil(it.end / 60) * 60);
    }
    return [Math.max(0, lo), Math.min(24 * 60, hi)];
  }, [itemsByDay]);
  const rows = (rangeTo - rangeFrom) / 30;
  const gridH = rows * ROW_H;

  const weekHasSlots = days.some(d => (itemsByDay[d] || []).length > 0);

  // ─── Πλοήγηση ──────────────────────────────────────────────────────
  const step = view === 'week' ? 7 : 1;
  const go = (n) => setAnchor(a => addDays(a, n * step));
  const goToday = () => setAnchor(todayIso());

  function rangeTitle() {
    if (view === 'day') {
      const d = dateOf(anchor);
      return `${DAY_NAMES[lang][d.getDay()]} ${d.getDate()} ${MONTHS_GEN[lang][d.getMonth()]}`;
    }
    const a = dateOf(days[0]), b = dateOf(days[6]);
    if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MONTHS_GEN[lang][a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${MONTHS_SHORT[lang][a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[lang][b.getMonth()]} ${b.getFullYear()}`;
  }

  // ─── Κενό σημείο: κλικ ή σύρσιμο → προσθήκη ───────────────────────
  const today = todayIso();
  const isPastCell = (date, m) => date < today || (date === today && m + 30 <= nowMin());

  function cellAt(e, date) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.max(0, Math.min(gridH - 1, e.clientY - rect.top));
    return rangeFrom + Math.floor(y / ROW_H) * 30;
  }

  function onGridDown(e, date) {
    if (e.button !== undefined && e.button !== 0) return;
    if (excByDate[date]) { openExceptionInfo(date); return; }
    const m = cellAt(e, date);
    if (isPastCell(date, m)) return;
    const d = { date, a: m, b: m, el: e.currentTarget };
    dragRef.current = d;
    setDrag({ date, a: m, b: m });
  }
  function onGridMove(e, date) {
    const d = dragRef.current;
    if (!d || d.date !== date) return;
    const m = cellAt(e, date);
    if (m !== d.b) { d.b = m; setDrag({ date, a: d.a, b: m }); }
  }
  useEffect(() => {
    function up() {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDrag(null);
      const lo = Math.min(d.a, d.b), hi = Math.max(d.a, d.b) + 30;
      const single = d.a === d.b;
      openAdd(d.date, lo, single ? Math.min(lo + 60, 24 * 60) : hi);
    }
    // Στο κινητό, όταν ο χρήστης κάνει scroll, ο browser ακυρώνει το
    // pointer: τότε ΔΕΝ ανοίγουμε προσθήκη.
    function cancel() { dragRef.current = null; setDrag(null); }
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); };
  });

  function openAdd(date, start, end) {
    setModal({ kind: 'add', date: date || (anchor < today ? today : anchor), start: start ?? 17 * 60, end: end ?? 20 * 60, minutes: 60 });
  }
  function openExceptionInfo(date) {
    setModal({ kind: 'excInfo', exc: excByDate[date] });
  }

  // ─── Ενέργειες ─────────────────────────────────────────────────────
  async function addRange({ date, start, end, minutes }) {
    if (end <= start) return { error: tx.errRange };
    const { data, error } = await supabase.rpc('add_availability_range', {
      p_date: date, p_start: toHHMM(start), p_end: toHHMM(end === 24 * 60 ? 24 * 60 - 1 : end), p_slot_minutes: minutes,
    });
    if (error) {
      const m = error.message || '';
      if (m.includes('day_off')) return { error: tx.errDayOff };
      if (m.includes('invalid_date')) return { error: tx.errDate };
      if (m.includes('invalid_range')) return { error: tx.errRange };
      return { error: tx.errGeneric + m };
    }
    return { created: Number(data?.created || 0), skipped: Number(data?.skipped || 0) };
  }

  async function removeSlots(ids) {
    const { data, error } = await supabase.rpc('remove_free_slots', { p_slot_ids: ids });
    if (error) return { error: tx.errGeneric + error.message };
    return { removed: Number(data || 0) };
  }

  async function refresh() { await onSlotsChanged?.(); }

  // ─── Απόδοση ───────────────────────────────────────────────────────
  const hourMarks = [];
  for (let m = rangeFrom; m < rangeTo; m += 60) hourMarks.push(m);

  const toolCards = [
    { key: 'copy', Icon: Copy, title: tx.copyTitle, desc: tx.copyDesc, onClick: () => setModal({ kind: 'copy' }) },
    { key: 'gen', Icon: CalendarRange, title: tx.genTitle, desc: tx.genDesc, onClick: () => setModal({ kind: 'gen' }) },
    { key: 'exc', Icon: CalendarOff, title: tx.excTitle, desc: tx.excDesc, onClick: () => setModal({ kind: 'exc' }) },
  ];

  const toolsPanel = (
    <div className="ac-tools">
      <button onClick={() => { setToolsOpen(false); openAdd(); }} className="ac-primary">
        <Plus size={18} strokeWidth={2.4} />
        {tx.addTitle}
      </button>
      {toolCards.map(({ key, Icon, title, desc, onClick }) => (
        <button key={key} onClick={() => { setToolsOpen(false); onClick(); }} className="ac-toolcard">
          <span className="ac-toolicon"><Icon size={18} /></span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
            <span style={{ display: 'block', fontSize: 12.5, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{desc}</span>
          </span>
          <ChevronRight size={16} color={C.textFaint} />
        </button>
      ))}

      <div className="ac-card" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 12 }}>{tx.legend}</div>
        {[
          ['free', tx.legendFree, tx.legendFreeSub],
          ['pending', tx.legendPending, tx.legendPendingSub],
          ['booked', tx.legendBooked, tx.legendBookedSub],
          ['off', tx.legendOff, tx.legendOffSub],
        ].map(([k, a, b]) => (
          <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: TONE[k].bg, border: `1.5px solid ${TONE[k].br}`, borderLeft: `4px solid ${TONE[k].bar}`, marginTop: 2, flexShrink: 0 }} />
            <span>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textBody }}>{a}</span>
              <span style={{ display: 'block', fontSize: 12, color: C.textMuted }}>{b}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{ background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: RAD.card, padding: '14px 16px', display: 'flex', gap: 10 }}>
        <Lightbulb size={16} color={C.info} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12.5, color: C.info, lineHeight: 1.55 }}>{tx.tip}</span>
      </div>
    </div>
  );

  return (
    <div className="ac-root">
      <style>{`
        .ac-root { font-family: inherit; }
        .ac-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
        @media (max-width: 1279px) { .ac-layout { grid-template-columns: minmax(0, 1fr); } }
        .ac-card { background: #fff; border: 1px solid ${C.border}; border-radius: ${RAD.card}px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .ac-tools { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 768px) and (max-width: 1279px) {
          .ac-tools { display: grid; grid-template-columns: 1fr 1fr; }
          .ac-tools .ac-primary { grid-column: 1 / -1; }
        }
        .ac-primary { display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%; padding: 15px 18px; border-radius: 14px; border: none; background: ${C.accent}; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(42,111,219,0.25); transition: filter .15s; }
        .ac-primary:hover { filter: brightness(1.06); }
        .ac-toolcard { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; border-radius: 14px; border: 1px solid ${C.border}; background: #fff; cursor: pointer; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
        .ac-toolcard:hover { border-color: ${C.accentBorder}; box-shadow: 0 2px 10px rgba(15,23,42,0.06); }
        .ac-toolicon { width: 38px; height: 38px; border-radius: 10px; background: ${C.accentSoft}; color: ${C.accent}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ac-iconbtn { width: 38px; height: 38px; border-radius: 10px; border: 1px solid ${C.border}; background: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: ${C.text}; }
        .ac-iconbtn:hover { background: ${C.surfaceAlt}; }
        .ac-seg { display: inline-flex; background: ${C.borderSoft}; border: 1px solid ${C.border}; border-radius: 11px; padding: 3px; }
        .ac-seg button { border: none; background: transparent; padding: 7px 16px; border-radius: 8px; font-size: 13.5px; font-weight: 600; color: ${C.textMuted}; cursor: pointer; font-family: inherit; }
        .ac-seg button.on { background: ${C.accent}; color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        .ac-block { position: absolute; left: 4px; right: 4px; border-radius: 9px; padding: 5px 8px; display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; overflow: hidden; cursor: pointer; text-align: left; font-family: inherit; transition: box-shadow .15s, transform .05s; }
        .ac-block:hover { box-shadow: 0 3px 10px rgba(15,23,42,0.12); z-index: 3; }
        .ac-block:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 1px; }
        .ac-input { width: 100%; height: 44px; padding: 0 12px; border: 1.5px solid ${C.border}; border-radius: 10px; font-size: 15px; font-family: inherit; color: ${C.text}; background: #fff; outline: none; box-sizing: border-box; }
        .ac-input:focus { border-color: ${C.accent}; }
        .ac-label { display: block; font-size: 12.5px; font-weight: 600; color: ${C.textMuted}; margin-bottom: 6px; }
        .ac-btn { height: 44px; padding: 0 20px; border-radius: 11px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 7px; white-space: nowrap; }
        .ac-btn-primary { background: ${C.brand}; color: #fff; border: 1px solid ${C.brand}; }
        .ac-btn-primary:disabled { background: ${C.textFaint}; border-color: ${C.textFaint}; cursor: wait; }
        .ac-btn-quiet { background: #fff; color: ${C.textBody}; border: 1px solid ${C.border}; }
        .ac-btn-danger { background: #fff; color: ${C.danger}; border: 1.5px solid ${C.dangerBorder}; }
        .ac-daychip { flex: 1; min-width: 44px; border: 1px solid ${C.border}; background: #fff; border-radius: 12px; padding: 7px 0; cursor: pointer; font-family: inherit; text-align: center; }
        .ac-daychip.on { background: ${C.accent}; border-color: ${C.accent}; color: #fff; }
      `}</style>

      {/* Τίτλος */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.brand, letterSpacing: '-0.01em', margin: 0 }}>{tx.title}</h2>
          <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>{tx.subtitle}</p>
        </div>
        {!isWide && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ac-btn ac-btn-quiet" onClick={() => setToolsOpen(true)}>
              <SlidersHorizontal size={16} />
              {tx.tools}
            </button>
            <button className="ac-btn ac-btn-primary" style={{ background: C.accent, borderColor: C.accent }} onClick={() => openAdd()}>
              <Plus size={16} strokeWidth={2.4} />
              {tx.addShort}
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div role="status" style={{
          background: msg.type === 'success' ? C.successBg : msg.type === 'warn' ? C.warnBg : C.dangerBg,
          border: `1px solid ${msg.type === 'success' ? C.successBorder : msg.type === 'warn' ? C.warnBorder : C.dangerBorder}`,
          color: msg.type === 'success' ? C.success : msg.type === 'warn' ? C.warn : C.danger,
          borderRadius: 12, padding: '12px 16px', fontSize: 13.5, fontWeight: 600, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 9,
        }}>
          {msg.type === 'success' ? <Check size={16} strokeWidth={3} /> : <AlertTriangle size={16} />}
          <span style={{ flex: 1 }}>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
        </div>
      )}

      <div className="ac-layout">
        {/* ═══ ΗΜΕΡΟΛΟΓΙΟ ═══ */}
        <div className="ac-card" style={{ overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="ac-iconbtn" onClick={() => go(-1)} aria-label={view === 'week' ? tx.prevWeek : tx.prevDay} title={view === 'week' ? tx.prevWeek : tx.prevDay}><ChevronLeft size={18} /></button>
              <button className="ac-iconbtn" onClick={() => go(1)} aria-label={view === 'week' ? tx.nextWeek : tx.nextDay} title={view === 'week' ? tx.nextWeek : tx.nextDay}><ChevronRight size={18} /></button>
            </div>
            <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: C.text, flex: 1, minWidth: 150 }}>{rangeTitle()}</div>
            <button className="ac-btn ac-btn-quiet" style={{ height: 38, padding: '0 14px', fontSize: 13.5 }} onClick={goToday}>{tx.today}</button>
            <div className="ac-seg" role="tablist">
              {[['week', tx.week], ['day', tx.day]].map(([v, l]) => (
                <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>
              ))}
            </div>
          </div>

          {/* Στην προβολή ημέρας: γρήγορη εναλλαγή μέσα στην εβδομάδα */}
          {view === 'day' && (
            <div style={{ display: 'flex', gap: 6, padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
              {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(d => {
                const dd = dateOf(d);
                const on = d === anchor;
                return (
                  <button key={d} className={`ac-daychip${on ? ' on' : ''}`} onClick={() => setAnchor(d)}>
                    <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: on ? '#fff' : (excByDate[d] ? C.textFaint : C.textMuted) }}>{DAY_SHORT[lang][dd.getDay()]}</span>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: on ? '#fff' : d === today ? C.accent : C.text }}>{dd.getDate()}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Επικεφαλίδες ημερών (μόνο εβδομάδα) */}
          {view === 'week' && (
            <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))`, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11.5, color: C.textFaint, padding: '12px 0 0 10px' }}>{tx.hourLabel}</div>
              {days.map(d => {
                const dd = dateOf(d);
                const isT = d === today;
                const off = excByDate[d];
                return (
                  <button key={d} onClick={() => { setAnchor(d); setView('day'); }}
                    style={{ border: 'none', borderLeft: `1px solid ${C.borderSoft}`, background: isT ? C.accentSoft : 'transparent', padding: '10px 4px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: isT ? C.accent : C.textMuted }}>{DAY_SHORT[lang][dd.getDay()]}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: isT ? C.accent : 'transparent', color: isT ? '#fff' : off ? C.textFaint : C.text, fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{dd.getDate()}</span>
                      <span style={{ fontSize: 12, color: C.textFaint }}>{MONTHS_SHORT[lang][dd.getMonth()]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Πλέγμα */}
          <div style={{ maxHeight: isMobile ? 'none' : 'calc(100vh - 230px)', minHeight: 360, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`, position: 'relative' }}>
              {/* Ώρες */}
              <div style={{ position: 'relative', height: gridH }}>
                {hourMarks.map(m => (
                  <div key={m} style={{ position: 'absolute', top: (m - rangeFrom) / 30 * ROW_H - 7, right: 8, fontSize: 11.5, color: C.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                    {m === rangeFrom ? '' : toHHMM(m)}
                  </div>
                ))}
                <div style={{ position: 'absolute', top: 4, right: 8, fontSize: 11.5, color: C.textMuted }}>{toHHMM(rangeFrom)}</div>
              </div>

              {days.map(d => {
                const off = excByDate[d];
                const isPastDay = d < today;
                const items = itemsByDay[d] || [];
                const showNow = d === today && nowMin() >= rangeFrom && nowMin() <= rangeTo;
                const sel = drag && drag.date === d ? { lo: Math.min(drag.a, drag.b), hi: Math.max(drag.a, drag.b) + 30 } : null;
                return (
                  <div key={d}
                    onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.dataset?.grid) onGridDown(e, d); }}
                    onPointerMove={(e) => onGridMove(e, d)}
                    style={{
                      position: 'relative', height: gridH, borderLeft: `1px solid ${C.borderSoft}`,
                      background: off ? `repeating-linear-gradient(135deg, #f8fafc, #f8fafc 8px, #f1f5f9 8px, #f1f5f9 16px)` : d === today ? 'rgba(234,242,252,0.35)' : '#fff',
                      cursor: off || isPastDay ? 'default' : 'cell', touchAction: 'pan-y', userSelect: 'none',
                    }}>
                    {/* Γραμμές 30' */}
                    {Array.from({ length: rows }, (_, i) => (
                      <div key={i} data-grid="1" style={{
                        position: 'absolute', left: 0, right: 0, top: i * ROW_H, height: ROW_H,
                        borderTop: `1px ${i % 2 === 0 ? 'solid' : 'dashed'} ${i % 2 === 0 ? C.border : C.borderSoft}`,
                        background: (isPastDay || (d === today && rangeFrom + (i + 1) * 30 <= nowMin())) && !off ? 'rgba(241,245,249,0.55)' : 'transparent',
                      }} />
                    ))}

                    {/* Ρεπό */}
                    {off && (
                      <button className="ac-block" onClick={() => openExceptionInfo(d)}
                        style={{ top: 6, bottom: 6, background: 'rgba(241,245,249,0.92)', border: `1px solid ${TONE.off.br}`, borderLeft: `4px solid ${TONE.off.bar}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TONE.off.sub }}>{tx.allDay}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TONE.off.fg }}>{tx.dayOff}</div>
                        {off.note && <div style={{ fontSize: 12, color: TONE.off.sub, marginTop: 2 }}>{off.note}</div>}
                      </button>
                    )}

                    {/* Blocks */}
                    {items.map(it => {
                      const top = (it.start - rangeFrom) / 30 * ROW_H + 1;
                      const h = Math.max(ROW_H - 3, (it.end - it.start) / 30 * ROW_H - 3);
                      const t = TONE[it.kind];
                      const label = it.kind === 'free' ? tx.available : it.kind === 'pending' ? tx.pending : it.kind === 'booked' ? tx.booked : it.kind === 'completed' ? tx.completed : tx.taken;
                      const name = it.request?.patient_name;
                      const compact = h < 44;
                      return (
                        <button key={it.key} className="ac-block"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setModal({ kind: it.kind === 'free' ? 'free' : 'booking', item: it })}
                          title={`${toHHMM(it.start)}–${toHHMM(it.end)} · ${label}${name ? ' · ' + name : ''}`}
                          style={{ top, height: h, background: t.bg, border: `1px solid ${t.br}`, borderLeft: `4px solid ${t.bar}`, opacity: isPastDay ? 0.7 : 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: t.fg, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                            {toHHMM(it.start)} – {toHHMM(it.end)}{compact && !name ? ` · ${label}` : ''}
                          </div>
                          {!compact && <div style={{ fontSize: 12.5, fontWeight: 600, color: t.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || label}</div>}
                          {!compact && name && h >= 62 && <div style={{ fontSize: 11.5, color: t.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>}
                          {compact && name && <div style={{ fontSize: 11.5, color: t.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>}
                        </button>
                      );
                    })}

                    {/* Επιλογή με σύρσιμο */}
                    {sel && (
                      <div style={{ position: 'absolute', left: 4, right: 4, top: (sel.lo - rangeFrom) / 30 * ROW_H + 1, height: (sel.hi - sel.lo) / 30 * ROW_H - 2, background: 'rgba(42,111,219,0.14)', border: `2px solid ${C.accent}`, borderRadius: 9, pointerEvents: 'none', zIndex: 4, padding: '4px 8px', fontSize: 12, fontWeight: 700, color: C.accent }}>
                        {toHHMM(sel.lo)} – {toHHMM(sel.hi)}
                      </div>
                    )}

                    {/* Τώρα */}
                    {showNow && (
                      <div style={{ position: 'absolute', left: 0, right: 0, top: (nowMin() - rangeFrom) / 30 * ROW_H, height: 2, background: C.danger, zIndex: 5, pointerEvents: 'none' }}>
                        <span style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: C.danger }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!weekHasSlots && !days.some(d => excByDate[d]) && (
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, fontSize: 13.5, color: C.textMuted, background: C.surfaceAlt }}>
              {tx.nothingThisWeek}
            </div>
          )}
        </div>

        {/* ═══ ΕΡΓΑΛΕΙΑ (δεξιά στη μεγάλη οθόνη) ═══ */}
        {isWide && toolsPanel}
      </div>

      {/* Εργαλεία σε drawer για tablet/κινητό */}
      {!isWide && toolsOpen && (
        <Sheet onClose={() => setToolsOpen(false)} title={tx.tools} closeLabel={tx.close}>
          {toolsPanel}
        </Sheet>
      )}

      {/* ═══ MODALS ═══ */}
      {modal?.kind === 'add' && (
        <AddModal tx={tx} lang={lang} initial={modal} today={today} excByDate={excByDate}
          onClose={() => setModal(null)}
          onSave={async (v) => {
            const r = await addRange(v);
            if (r.error) return r.error;
            setModal(null);
            await refresh();
            if (r.created === 0) flash('warn', tx.addedNone);
            else flash('success', tx.added(r.created, r.skipped));
            setAnchor(v.date);
            return null;
          }} />
      )}

      {modal?.kind === 'free' && (
        <FreeModal tx={tx} lang={lang} item={modal.item}
          onClose={() => setModal(null)}
          onRemove={async (ids) => {
            const r = await removeSlots(ids);
            if (r.error) return r.error;
            setModal(null);
            await refresh();
            flash('success', tx.removed(r.removed));
            return null;
          }}
          onChange={async ({ start, end, minutes }) => {
            const it = modal.item;
            const ids = it.slots.map(s => s.id);
            const r = await removeSlots(ids);
            if (r.error) return r.error;
            const a = await addRange({ date: it.date, start, end, minutes });
            if (a.error) {
              // Επαναφορά του αρχικού διαστήματος, για να μη χαθεί τίποτα
              const oldMin = Math.round((it.end - it.start) / it.slots.length);
              await addRange({ date: it.date, start: it.start, end: it.end, minutes: DURATIONS.includes(oldMin) ? oldMin : 60 });
              await refresh();
              return a.error;
            }
            setModal(null);
            await refresh();
            flash('success', tx.added(a.created, a.skipped));
            return null;
          }} />
      )}

      {modal?.kind === 'booking' && (
        <BookingModal tx={tx} lang={lang} item={modal.item}
          onClose={() => setModal(null)}
          onOpen={(tab) => { setModal(null); onOpenTab?.(tab); }} />
      )}

      {modal?.kind === 'copy' && (
        <CopyModal tx={tx} lang={lang} userId={userId} weekStart={weekStart}
          hasSlots={(slots || []).some(s => s.date >= weekStart && s.date <= addDays(weekStart, 6))}
          onClose={() => setModal(null)}
          onDone={async (n) => { setModal(null); await refresh(); flash('success', tx.copied(n)); }} />
      )}

      {modal?.kind === 'gen' && (
        <GenerateModal tx={tx} lang={lang} userId={userId} blocks={blocks} setBlocks={setBlocks}
          onClose={() => setModal(null)}
          onDone={async (n) => { setModal(null); await refresh(); flash('success', tx.generated(n)); }} />
      )}

      {(modal?.kind === 'exc' || modal?.kind === 'excInfo') && (
        <ExceptionsModal tx={tx} lang={lang} userId={userId} exceptions={exceptions} focus={modal.exc}
          slots={slots} bookingBySlot={bookingBySlot}
          onClose={() => setModal(null)}
          onChanged={async (text, type = 'success') => { await loadAux(); await refresh(); flash(type, text); }} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Κοινά: modal / sheet
// ═══════════════════════════════════════════════════════════════════
function Modal({ title, onClose, children, footer, width = 460 }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: width, maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px', borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.brand }}>{title}</div>
          <button onClick={onClose} aria-label="close" style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: C.borderSoft, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}><X size={17} /></button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.borderSoft}`, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children, closeLabel }) {
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.page, width: '100%', maxWidth: 720, maxHeight: '85vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '14px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.brand }}>{title}</div>
          <button onClick={onClose} className="ac-btn ac-btn-quiet" style={{ height: 38 }}>{closeLabel}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorLine({ text }) {
  if (!text) return null;
  return (
    <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, fontWeight: 600, marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />{text}
    </div>
  );
}

function timeOptions(fromMin = 6 * 60, toMin_ = 23 * 60 + 30) {
  const out = [];
  for (let m = fromMin; m <= toMin_; m += 15) out.push(m);
  return out;
}

function TimeSelect({ value, onChange, options, id }) {
  const opts = options.includes(value) ? options : [...options, value].sort((a, b) => a - b);
  return (
    <select id={id} className="ac-input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {opts.map(m => <option key={m} value={m}>{toHHMM(m)}</option>)}
    </select>
  );
}

function fmtLongDate(iso, lang) {
  const d = dateOf(iso);
  return `${DAY_NAMES[lang][d.getDay()]} ${d.getDate()} ${MONTHS_GEN[lang][d.getMonth()]}`;
}

// ─── Προσθήκη διαθεσιμότητας ────────────────────────────────────────
function AddModal({ tx, lang, initial, today, excByDate, onClose, onSave }) {
  const [date, setDate] = useState(initial.date < today ? today : initial.date);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(Math.max(initial.end, initial.start + 30));
  const [minutes, setMinutes] = useState(initial.minutes || 60);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const count = end > start ? Math.floor((end - start) / minutes) : 0;
  const isOff = !!excByDate[date];

  async function save() {
    if (end <= start) { setErr(tx.errRange); return; }
    setBusy(true); setErr(null);
    const e = await onSave({ date, start, end, minutes });
    setBusy(false);
    if (e) setErr(e);
  }

  return (
    <Modal title={tx.addTitle} onClose={onClose}
      footer={<>
        <button className="ac-btn ac-btn-quiet" onClick={onClose}>{tx.cancel}</button>
        <button className="ac-btn ac-btn-primary" onClick={save} disabled={busy || count === 0 || isOff}>{busy ? tx.saving : tx.save}</button>
      </>}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label className="ac-label" htmlFor="ac-date">{tx.date}</label>
          <input id="ac-date" type="date" className="ac-input" min={today} value={date} onChange={(e) => setDate(e.target.value || today)} />
          <div style={{ fontSize: 12.5, color: isOff ? C.danger : C.textMuted, marginTop: 5 }}>{isOff ? tx.errDayOff : fmtLongDate(date, lang)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="ac-label" htmlFor="ac-from">{tx.from}</label>
            <TimeSelect id="ac-from" value={start} options={timeOptions()} onChange={(v) => { setStart(v); if (end <= v) setEnd(Math.min(v + 60, 24 * 60 - 15)); }} />
          </div>
          <div>
            <label className="ac-label" htmlFor="ac-to">{tx.to}</label>
            <TimeSelect id="ac-to" value={end} options={timeOptions(6 * 60 + 30, 23 * 60 + 45)} onChange={setEnd} />
          </div>
        </div>
        <div>
          <span className="ac-label">{tx.duration}</span>
          <div className="ac-seg" style={{ width: '100%', display: 'flex' }}>
            {DURATIONS.map(m => (
              <button key={m} type="button" className={minutes === m ? 'on' : ''} style={{ flex: 1 }} onClick={() => setMinutes(m)}>{m}{tx.min}</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: count > 0 ? C.textBody : C.warn, background: C.surfaceAlt, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Clock size={15} color={C.textMuted} />{tx.slotsPreview(count, minutes)}
        </div>
      </div>
      <ErrorLine text={err} />
    </Modal>
  );
}

// ─── Ελεύθερο διάστημα: προβολή / αλλαγή / αφαίρεση ─────────────────
function FreeModal({ tx, lang, item, onClose, onRemove, onChange }) {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(false);
  const firstLen = toMin(item.slots[0].end_time) - toMin(item.slots[0].start_time);
  const [start, setStart] = useState(item.start);
  const [end, setEnd] = useState(item.end);
  const [minutes, setMinutes] = useState(DURATIONS.includes(firstLen) ? firstLen : 60);
  const range = `${toHHMM(item.start)}–${toHHMM(item.end)}`;
  const past = item.date < todayIso();

  async function run(kind, fn) {
    setBusy(kind); setErr(null);
    const e = await fn();
    setBusy(null);
    if (e) setErr(e);
  }

  return (
    <Modal title={tx.freeBlock} onClose={onClose}
      footer={!past && (editing ? <>
        <button className="ac-btn ac-btn-quiet" onClick={() => setEditing(false)}>{tx.cancel}</button>
        <button className="ac-btn ac-btn-primary" disabled={!!busy || end <= start} onClick={() => run('change', () => onChange({ start, end, minutes }))}>{busy === 'change' ? tx.saving : tx.apply}</button>
      </> : <>
        <button className="ac-btn ac-btn-danger" disabled={!!busy} onClick={() => { if (confirm(tx.confirmRemoveAll(range))) run('all', () => onRemove(item.slots.map(s => s.id))); }}>
          <Trash2 size={15} />{tx.removeAll}
        </button>
        <button className="ac-btn ac-btn-primary" onClick={() => setEditing(true)}>{tx.changeRange}</button>
      </>)}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: TONE.free.bg, border: `1px solid ${TONE.free.br}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: TONE.free.sub }}><Clock size={19} /></span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{range}</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>{fmtLongDate(item.date, lang)} · {tx.freeSlots(item.slots.length)}</div>
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ac-label">{tx.from}</label>
              <TimeSelect value={start} options={timeOptions()} onChange={(v) => { setStart(v); if (end <= v) setEnd(v + 60); }} />
            </div>
            <div>
              <label className="ac-label">{tx.to}</label>
              <TimeSelect value={end} options={timeOptions(6 * 60 + 30, 23 * 60 + 45)} onChange={setEnd} />
            </div>
          </div>
          <div>
            <span className="ac-label">{tx.duration}</span>
            <div className="ac-seg" style={{ width: '100%', display: 'flex' }}>
              {DURATIONS.map(m => (
                <button key={m} type="button" className={minutes === m ? 'on' : ''} style={{ flex: 1 }} onClick={() => setMinutes(m)}>{m}{tx.min}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>{tx.slotsPreview(end > start ? Math.floor((end - start) / minutes) : 0, minutes)}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {item.slots.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: TONE.free.bg, border: `1px solid ${TONE.free.br}` }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: TONE.free.fg, fontVariantNumeric: 'tabular-nums' }}>{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
              {!past && (
                <button onClick={() => run(s.id, () => onRemove([s.id]))} disabled={!!busy} title={tx.removeOne} aria-label={tx.removeOne}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.dangerBorder}`, background: '#fff', color: C.danger, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <ErrorLine text={err} />
    </Modal>
  );
}

// ─── Ραντεβού / αίτημα: μόνο προβολή ────────────────────────────────
function BookingModal({ tx, lang, item, onClose, onOpen }) {
  const pending = item.kind === 'pending';
  const t = TONE[item.kind] || TONE.booked;
  const name = item.request?.patient_name || tx.patientFallback;
  const status = pending ? tx.pending : item.kind === 'completed' ? tx.completed : item.kind === 'taken' ? tx.taken : tx.booked;
  return (
    <Modal title={pending ? tx.pendingTitle : tx.bookingTitle} onClose={onClose}
      footer={item.request && (
        <button className="ac-btn ac-btn-primary" onClick={() => onOpen(pending ? 'requests' : 'appointments')}>
          {pending ? tx.openRequests : tx.openAppointments}<ArrowRight size={15} />
        </button>
      )}>
      <div style={{ display: 'grid', gap: 12 }}>
        {[
          [User, tx.patient, item.request ? name : '—'],
          [Clock, tx.when, `${fmtLongDate(item.date, lang)} · ${toHHMM(item.start)}–${toHHMM(item.end)}`],
          ...(item.request?.area ? [[MapPin, tx.area, item.request.area]] : []),
        ].map(([Icon, l, v]) => (
          <div key={l} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: C.surfaceAlt, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, flexShrink: 0 }}><Icon size={16} /></span>
            <div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{v}</div>
            </div>
          </div>
        ))}
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: t.bg, border: `1px solid ${t.br}`, color: t.fg, fontSize: 12.5, fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.bar }} />{status}
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55, background: C.surfaceAlt, borderRadius: 10, padding: '10px 12px' }}>
          {pending ? tx.pendingNote : tx.bookingNote}
        </div>
      </div>
    </Modal>
  );
}

// ─── Αντιγραφή εβδομάδας ────────────────────────────────────────────
function CopyModal({ tx, lang, userId, weekStart, hasSlots, onClose, onDone }) {
  const [weeks, setWeeks] = useState(3);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const a = dateOf(weekStart), b = dateOf(addDays(weekStart, 6));
  const label = `${a.getDate()} ${MONTHS_SHORT[lang][a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[lang][b.getMonth()]}`;

  async function run() {
    setBusy(true); setErr(null);
    const { data, error } = await supabase.rpc('copy_week_availability', { p_therapist_id: userId, p_source_start: weekStart, p_weeks_ahead: weeks });
    setBusy(false);
    if (error) { setErr(tx.errGeneric + error.message); return; }
    onDone(Number(data || 0));
  }

  return (
    <Modal title={tx.copyTitle} onClose={onClose}
      footer={<>
        <button className="ac-btn ac-btn-quiet" onClick={onClose}>{tx.cancel}</button>
        <button className="ac-btn ac-btn-primary" onClick={run} disabled={busy || !hasSlots}><Copy size={15} />{busy ? tx.copying : tx.copyBtn}</button>
      </>}>
      <p style={{ fontSize: 14, color: C.textBody, lineHeight: 1.6, marginBottom: 14 }}>{tx.copyBody(label)}</p>
      {!hasSlots ? (
        <div style={{ fontSize: 13.5, color: C.warn, background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '10px 12px' }}>{tx.copyEmpty}</div>
      ) : (
        <div>
          <span className="ac-label">{tx.copyWeeks}</span>
          <div className="ac-seg" style={{ width: '100%', display: 'flex' }}>
            {[1, 2, 3, 4, 8].map(w => (
              <button key={w} type="button" className={weeks === w ? 'on' : ''} style={{ flex: 1 }} onClick={() => setWeeks(w)}>{w}</button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 6 }}>{tx.weeks(weeks)}</div>
        </div>
      )}
      <ErrorLine text={err} />
    </Modal>
  );
}

// ─── Εβδομαδιαίο πρόγραμμα + δημιουργία ωρών ────────────────────────
function GenerateModal({ tx, lang, userId, blocks, setBlocks, onClose, onDone }) {
  const [form, setForm] = useState({ weekday: 1, start: 9 * 60, end: 14 * 60, minutes: 60 });
  const [weeks, setWeeks] = useState(4);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  async function addBlock() {
    setErr(null);
    if (form.end <= form.start) { setErr(tx.errRange); return; }
    const clash = blocks.some(b => b.weekday === Number(form.weekday) && toMin(b.start_time) < form.end && form.start < toMin(b.end_time));
    if (clash) { setErr(tx.errBlockOverlap); return; }
    setBusy('add');
    const { data, error } = await supabase.from('therapist_weekly_schedule').insert([{
      therapist_id: userId, weekday: Number(form.weekday), start_time: toHHMM(form.start), end_time: toHHMM(form.end), slot_minutes: form.minutes, is_active: true,
    }]).select().single();
    setBusy(null);
    if (error) { setErr(tx.errGeneric + error.message); return; }
    setBlocks(prev => [...prev, data].sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.start_time.localeCompare(b.start_time)));
  }

  async function removeBlock(id) {
    setBusy(id);
    const { error } = await supabase.from('therapist_weekly_schedule').delete().eq('id', id);
    setBusy(null);
    if (error) { setErr(tx.errGeneric + error.message); return; }
    setBlocks(prev => prev.filter(b => b.id !== id));
  }

  async function generate() {
    setBusy('gen'); setErr(null);
    const from = todayIso();
    const to = addDays(from, weeks * 7);
    const { data, error } = await supabase.rpc('generate_availability_slots', { p_therapist_id: userId, p_from: from, p_to: to });
    setBusy(null);
    if (error) { setErr(tx.errGeneric + error.message); return; }
    onDone(Number(data || 0));
  }

  const sorted = blocks.slice().sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.start_time.localeCompare(b.start_time));

  return (
    <Modal title={tx.genTitle} onClose={onClose} width={560}
      footer={<button className="ac-btn ac-btn-quiet" onClick={onClose}>{tx.close}</button>}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}><Repeat size={16} color={C.accent} />{tx.weeklyTitle}</div>
      <p style={{ fontSize: 13, color: C.textMuted, margin: '4px 0 12px', lineHeight: 1.55 }}>{tx.weeklyDesc}</p>

      {sorted.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', background: C.surfaceAlt, borderRadius: 10, color: C.textMuted, fontSize: 13.5, marginBottom: 12 }}>{tx.noBlocks}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {sorted.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: TONE.free.bg, border: `1px solid ${TONE.free.br}`, borderRadius: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: TONE.free.fg, minWidth: 88 }}>{DAY_NAMES[lang][b.weekday]}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: TONE.free.fg, fontVariantNumeric: 'tabular-nums' }}>{b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}</span>
              <span style={{ fontSize: 12, color: TONE.free.sub, background: '#fff', border: `1px solid ${TONE.free.br}`, padding: '1px 8px', borderRadius: 999 }}>{b.slot_minutes}{tx.min}</span>
              <button onClick={() => removeBlock(b.id)} disabled={busy === b.id} aria-label={tx.removeBlock} title={tx.removeBlock}
                style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.dangerBorder}`, background: '#fff', color: C.danger, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, alignItems: 'end', paddingBottom: 18, borderBottom: `1px solid ${C.borderSoft}` }}>
        <div>
          <label className="ac-label">{tx.weekday}</label>
          <select className="ac-input" value={form.weekday} onChange={(e) => setForm(f => ({ ...f, weekday: Number(e.target.value) }))}>
            {[1, 2, 3, 4, 5, 6, 0].map(d => <option key={d} value={d}>{DAY_NAMES[lang][d]}</option>)}
          </select>
        </div>
        <div>
          <label className="ac-label">{tx.from}</label>
          <TimeSelect value={form.start} options={timeOptions()} onChange={(v) => setForm(f => ({ ...f, start: v, end: f.end <= v ? v + 60 : f.end }))} />
        </div>
        <div>
          <label className="ac-label">{tx.to}</label>
          <TimeSelect value={form.end} options={timeOptions(6 * 60 + 30, 23 * 60 + 45)} onChange={(v) => setForm(f => ({ ...f, end: v }))} />
        </div>
        <div>
          <label className="ac-label">{tx.duration}</label>
          <select className="ac-input" value={form.minutes} onChange={(e) => setForm(f => ({ ...f, minutes: Number(e.target.value) }))}>
            {DURATIONS.map(m => <option key={m} value={m}>{m}{tx.min}</option>)}
          </select>
        </div>
        <button className="ac-btn ac-btn-primary" onClick={addBlock} disabled={busy === 'add'}><Plus size={15} />{tx.addBlock}</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}><CalendarRange size={16} color={C.accent} />{tx.genSection}</div>
        <p style={{ fontSize: 13, color: C.textMuted, margin: '4px 0 12px', lineHeight: 1.55 }}>{tx.genBody}</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span className="ac-label">{tx.genWeeks}</span>
            <div className="ac-seg" style={{ width: '100%', display: 'flex' }}>
              {[2, 3, 4, 8, 12].map(w => (
                <button key={w} type="button" className={weeks === w ? 'on' : ''} style={{ flex: 1 }} onClick={() => setWeeks(w)}>{w}</button>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 6 }}>{tx.weeks(weeks)}</div>
          </div>
          <button className="ac-btn ac-btn-primary" style={{ background: C.accent, borderColor: C.accent }} onClick={generate} disabled={busy === 'gen' || blocks.length === 0}>
            <Check size={15} strokeWidth={3} />{busy === 'gen' ? tx.generating : tx.genBtn}
          </button>
        </div>
        {blocks.length === 0 && <div style={{ fontSize: 12.5, color: C.warn, marginTop: 8 }}>{tx.genNeedsBlocks}</div>}
      </div>
      <ErrorLine text={err} />
    </Modal>
  );
}

// ─── Ρεπό ───────────────────────────────────────────────────────────
function ExceptionsModal({ tx, lang, userId, exceptions, focus, slots, bookingBySlot, onClose, onChanged }) {
  const today = todayIso();
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const upcoming = exceptions.filter(e => e.date >= today || (focus && e.id === focus.id));
  const takenOn = (d) => (slots || []).filter(s => s.date === d && (s.is_blocked || bookingBySlot[s.id])).length;
  const warnCount = date ? takenOn(date) : 0;

  async function add() {
    if (!date) return;
    setBusy('add'); setErr(null);
    const { error } = await supabase.from('therapist_schedule_exceptions').upsert({
      therapist_id: userId, date, is_unavailable: true, note: note.trim() || null,
    }, { onConflict: 'therapist_id,date' });
    if (error) { setBusy(null); setErr(tx.errGeneric + error.message); return; }
    // Μόνο οι ΕΛΕΥΘΕΡΕΣ ώρες της ημέρας. Ραντεβού δεν αγγίζονται.
    await supabase.rpc('clear_free_slots', { p_therapist_id: userId, p_from: date, p_to: date });
    setBusy(null);
    const n = takenOn(date);
    setDate(''); setNote('');
    await onChanged(n > 0 ? `${tx.excAdded} ${tx.excHasBookings(n)}` : tx.excAdded, n > 0 ? 'warn' : 'success');
  }

  async function remove(id) {
    if (!confirm(tx.confirmRemoveExc)) return;
    setBusy(id); setErr(null);
    const { error } = await supabase.from('therapist_schedule_exceptions').delete().eq('id', id);
    setBusy(null);
    if (error) { setErr(tx.errGeneric + error.message); return; }
    await onChanged(tx.excRemoved);
    if (focus) onClose();
  }

  return (
    <Modal title={tx.excTitle} onClose={onClose} width={500}
      footer={<button className="ac-btn ac-btn-quiet" onClick={onClose}>{tx.close}</button>}>
      <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55, marginBottom: 14 }}>{tx.excBody}</p>

      {upcoming.length === 0 ? (
        <div style={{ padding: 14, textAlign: 'center', background: C.surfaceAlt, borderRadius: 10, color: C.textMuted, fontSize: 13.5, marginBottom: 14 }}>{tx.noExc}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {upcoming.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: focus?.id === e.id ? C.warnBg : C.surfaceAlt, border: `1px solid ${focus?.id === e.id ? C.warnBorder : C.border}` }}>
              <CalendarOff size={16} color={C.textMuted} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text }}>{fmtLongDate(e.date, lang)}</span>
                {e.note && <span style={{ display: 'block', fontSize: 12.5, color: C.textMuted }}>{e.note}</span>}
              </span>
              <button onClick={() => remove(e.id)} disabled={busy === e.id} className="ac-btn ac-btn-danger" style={{ height: 34, padding: '0 12px', fontSize: 12.5 }}>
                <Trash2 size={13} />{tx.removeExc}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, alignItems: 'end' }}>
        <div>
          <label className="ac-label">{tx.date}</label>
          <input type="date" className="ac-input" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="ac-label">{tx.excNote}</label>
          <input className="ac-input" value={note} placeholder={tx.excNotePh} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      {warnCount > 0 && (
        <div style={{ fontSize: 13, color: C.warn, background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 10, padding: '9px 12px', marginTop: 10 }}>{tx.excHasBookings(warnCount)}</div>
      )}
      <button className="ac-btn ac-btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={add} disabled={!date || busy === 'add'}>
        <Plus size={15} />{tx.excAdd}
      </button>
      <ErrorLine text={err} />
    </Modal>
  );
}
