// Κοινός έλεγχος για το αν μια ώρα είναι ακόμα κρατήσιμη.
//
// ΓΙΑΤΙ ΥΠΑΡΧΕΙ:
// Όλα τα queries στο availability_slots φιλτράριζαν με `date >= σήμερα`,
// που είναι έλεγχος ΗΜΕΡΑΣ, όχι ΩΡΑΣ. Στις 14:45 εμφανιζόταν ακόμα η ώρα
// των 10:00 της ίδιας μέρας — και ο ασθενής μπορούσε πραγματικά να την
// κλείσει. Ο θεραπευτής λάμβανε αίτημα για ώρα που είχε ήδη περάσει.
//
// Ο έλεγχος ζει ΕΔΩ και μόνο εδώ. Τέσσερις σελίδες τον χρησιμοποιούν
// (λίστα θεραπευτών, προφίλ, αρχική, οδηγός κράτησης) και αν ήταν
// αντιγραμμένος σε καθεμία θα ξεσυγχρονιζόταν στην πρώτη αλλαγή.

// Ελάχιστη προειδοποίηση κράτησης, σε λεπτά.
//
// Κατ' οίκον φυσικοθεραπεία σημαίνει μετακίνηση. Ο θεραπευτής πρέπει να
// δει το αίτημα, να απαντήσει, και να φτάσει. Δεν ζητάς στις 17:20
// συνεδρία στις 18:00.
//
// ΠΡΕΠΕΙ να ταιριάζει με το minimum_booking_notice στο platform_settings.
// Αν αποκλίνουν, ο ασθενής θα βλέπει ώρες που η βάση θα απορρίπτει —
// επιλέγει slot, πατάει «Κράτηση», και παίρνει σφάλμα χωρίς να καταλαβαίνει.
export const MIN_LEAD_MINUTES = 180;

// 'HH:MM:SS' ή 'HH:MM' -> Date στην τοπική ώρα
export function slotStart(dateStr, startTime) {
  if (!dateStr) return null;
  const t = String(startTime || '00:00:00');
  const hhmmss = t.length === 5 ? `${t}:00` : t.slice(0, 8);
  const d = new Date(`${dateStr}T${hhmmss}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isSlotBookable(dateStr, startTime, leadMinutes = MIN_LEAD_MINUTES) {
  const d = slotStart(dateStr, startTime);
  if (!d) return false;
  return d.getTime() - Date.now() >= leadMinutes * 60000;
}

// Φιλτράρει λίστα από rows του availability_slots
export function filterBookableSlots(slots, leadMinutes = MIN_LEAD_MINUTES) {
  return (slots || []).filter((s) => isSlotBookable(s.date, s.start_time, leadMinutes));
}