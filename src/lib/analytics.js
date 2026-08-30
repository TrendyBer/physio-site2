// src/lib/analytics.js
// ═══════════════════════════════════════════════════════════════════
// GA4 events, με σεβασμό στη συγκατάθεση.
//
// ΓΙΑΤΙ ΔΕΝ ΚΑΛΟΥΜΕ ΑΠΕΥΘΕΙΑΣ ΤΟ gtag ΣΤΙΣ ΣΕΛΙΔΕΣ:
//   1. Αν δεν έχει φορτώσει το script, το gtag είναι undefined και η
//      σελίδα σκάει. Εδώ ελέγχεται μία φορά.
//   2. Τα ονόματα των events πρέπει να είναι ΑΚΡΙΒΩΣ τα ίδια παντού.
//      Ένα 'booking_submitted' αντί για 'booking_request_submitted'
//      σπάει σιωπηλά το funnel και το ανακαλύπτεις μήνες μετά.
//   3. Η συγκατάθεση ελέγχεται σε ένα σημείο.
//
// ΤΟ client_id ΚΑΙ ΓΙΑΤΙ ΕΧΕΙ ΣΗΜΑΣΙΑ:
// Το booking_confirmed συμβαίνει στον browser του ΘΕΡΑΠΕΥΤΗ. Αν το
// στέλναμε από εκεί, το GA4 θα το απέδιδε στη δική του συνεδρία και η
// διαφήμιση που έφερε τον ΑΣΘΕΝΗ δεν θα έπαιρνε ποτέ credit.
// Γι' αυτό αποθηκεύουμε το client_id του ασθενή πάνω στο αίτημα και
// στέλνουμε το conversion server-side, με το σωστό id.
// ═══════════════════════════════════════════════════════════════════

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Τα ΜΟΝΑ έγκυρα ονόματα. Χρησιμοποίησε τις σταθερές, όχι strings.
export const EV = {
  PATIENT_SIGNUP_STARTED:      'patient_signup_started',
  PATIENT_SIGNUP_COMPLETED:    'patient_signup_completed',
  BOOKING_STARTED:             'booking_started',
  THERAPIST_PROFILE_VIEWED:    'therapist_profile_viewed',
  THERAPIST_SELECTED:          'therapist_selected',
  SLOT_SELECTED:               'slot_selected',
  BOOKING_REQUEST_SUBMITTED:   'booking_request_submitted',
  BOOKING_CONFIRMED:           'booking_confirmed',
  BOOKING_COMPLETED:           'booking_completed',
  THERAPIST_SIGNUP_STARTED:    'therapist_signup_started',
  THERAPIST_SIGNUP_COMPLETED:  'therapist_signup_completed',
  THERAPIST_ONBOARDING_COMPLETED: 'therapist_onboarding_completed',
};

function hasConsent() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('cookie_consent') === 'accepted';
  } catch (_) {
    return false;
  }
}

/**
 * Στέλνει event στο GA4.
 * Σιωπηλό αν λείπει συγκατάθεση ή GA_ID — δεν σπάει ποτέ τη σελίδα.
 */
export function track(event, params = {}) {
  if (typeof window === 'undefined') return;
  if (!GA_ID || !hasConsent()) return;
  if (typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', event, {
      ...params,
      // Ίδια χρονική βάση με τη βάση δεδομένων, για διασταύρωση
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[analytics]', err);
  }
}

/**
 * Το GA client_id του τρέχοντος επισκέπτη.
 *
 * Το αποθηκεύουμε πάνω στο αίτημα, ώστε το booking_confirmed που
 * στέλνεται από τον server να αποδίδεται στη ΣΩΣΤΗ συνεδρία —
 * του ασθενή, όχι του θεραπευτή που πάτησε «Αποδοχή».
 */
export function getClientId() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !GA_ID || typeof window.gtag !== 'function') {
      resolve(null);
      return;
    }
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v || null); } };
    // Αν το GA δεν απαντήσει σε 1s, προχωράμε χωρίς αυτό.
    // Μια αργή απάντηση δεν πρέπει να κρατάει την υποβολή κράτησης.
    setTimeout(() => finish(null), 1000);
    try {
      window.gtag('get', GA_ID, 'client_id', finish);
    } catch (_) {
      finish(null);
    }
  });
}

/**
 * UTM παράμετροι από το URL, αποθηκευμένες για όλη τη συνεδρία.
 *
 * ΓΙΑΤΙ sessionStorage: ο επισκέπτης προσγειώνεται με ?utm_source=google,
 * περιηγείται, εγγράφεται, και κλείνει ραντεβού τρεις σελίδες μετά. Αν
 * διαβάζαμε μόνο το τρέχον URL, το conversion δεν θα είχε πηγή.
 */
export function captureUtm() {
  if (typeof window === 'undefined') return;
  try {
    const p = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
    const found = {};
    keys.forEach((k) => { const v = p.get(k); if (v) found[k] = v; });
    if (Object.keys(found).length > 0) {
      sessionStorage.setItem('utm', JSON.stringify(found));
    }
  } catch (_) {}
}

export function getUtm() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem('utm') || '{}');
  } catch (_) {
    return {};
  }
}

/** Ενημερώνει το Consent Mode μετά την απόφαση του χρήστη. */
export function updateConsent(accepted) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const v = accepted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: v,
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
  });
}