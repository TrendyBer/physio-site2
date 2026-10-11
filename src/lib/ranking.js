// src/lib/ranking.js
// ═══════════════════════════════════════════════════════════════════
// Κατάταξη θεραπευτών — ΚΟΙΝΗ για τη λίστα θεραπευτών και τον οδηγό
// νέου αιτήματος του ασθενή.
//
// ΣΤΑΔΙΟ 1 — φιλτράρισμα (γίνεται ΠΡΙΝ, από κάθε σελίδα):
//   περιοχή, πάθηση/ειδικότητα και τα υπόλοιπα φίλτρα του ασθενή.
//   Κανένα πακέτο δεν παρακάμπτει αυτά τα κριτήρια.
//
// ΣΤΑΔΙΟ 2 — βαθμολογία 0–100, μόνο ανάμεσα στους κατάλληλους:
//   αξιολογήσεις 45% · συνδρομή 30% · διαθεσιμότητα 15% · εμπειρία 10%
//   Τα βάρη ρυθμίζονται από το platform_settings (ranking_weight_*).
//
// Ένας Basic με εξαιρετικές αξιολογήσεις μπορεί να προηγείται ενός Pro
// με χαμηλότερες. Το πακέτο βελτιώνει τη θέση, δεν την εγγυάται.
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_WEIGHTS = { rating: 45, subscription: 30, availability: 15, experience: 10 };

// Bayesian average: κάθε θεραπευτής ξεκινά σαν να είχε PRIOR_COUNT
// αξιολογήσεις με μέσο όρο PRIOR_MEAN. Έτσι ένα μοναδικό 5/5 δεν
// ξεπερνά αυτόματα σαράντα 4,9/5, και ο νέος θεραπευτής χωρίς κριτικές
// παίρνει ουδέτερη βαθμολογία, όχι μηδέν.
const PRIOR_MEAN = 4.0;
const PRIOR_COUNT = 5;

const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));

// Από τις ρυθμίσεις ({ key: value } ή [{ key, value }]) στα βάρη.
// Ό,τι λείπει ή δεν είναι αριθμός, κρατά την προεπιλογή.
export function weightsFromSettings(settings) {
  const map = Array.isArray(settings)
    ? Object.fromEntries(settings.map(r => [r.key, r.value]))
    : (settings || {});
  const w = { ...DEFAULT_WEIGHTS };
  for (const k of Object.keys(w)) {
    const v = Number(map[`ranking_weight_${k}`]);
    if (Number.isFinite(v) && v >= 0) w[k] = v;
  }
  return w;
}

export function ratingScore(avg, count) {
  const n = Number(count) || 0;
  const sum = (Number(avg) || 0) * n;
  const bayes = (PRIOR_MEAN * PRIOR_COUNT + sum) / (PRIOR_COUNT + n);
  return clamp(((bayes - 1) / 4) * 100);
}

// Από το «Βάρος κατάταξης» του πακέτου στο admin (Basic 0, Plus 50, Pro 100).
export function subscriptionScore(rankWeight) {
  return clamp(Number(rankWeight) || 0);
}

// Πραγματικές ελεύθερες ώρες τις επόμενες 3 εβδομάδες.
export function availabilityScore(freeSlots) {
  const n = Number(freeSlots) || 0;
  if (n <= 0) return 0;
  return clamp(40 + 60 * Math.min(n, 15) / 15);
}

// Εμπειρία στην πλατφόρμα: δημοσιευμένες αξιολογήσεις. Γράφονται ΜΟΝΟ
// μετά από ολοκληρωμένη συνεδρία, άρα μετράνε πραγματικές συνεδρίες.
export function experienceScore(reviewCount) {
  return clamp((Math.min(Number(reviewCount) || 0, 20) / 20) * 100);
}

// t: { avg_rating, review_count, rank_weight, free_slots }
export function rankScore(t, weights = DEFAULT_WEIGHTS) {
  const w = weights || DEFAULT_WEIGHTS;
  const total = (w.rating + w.subscription + w.availability + w.experience) || 1;
  const s =
    w.rating * ratingScore(t.avg_rating, t.review_count) +
    w.subscription * subscriptionScore(t.rank_weight) +
    w.availability * availabilityScore(t.free_slots) +
    w.experience * experienceScore(t.review_count);
  return Math.round((s / total) * 10) / 10;
}

// Ταξινόμηση κατά βαθμολογία· σε ισοβαθμία, πρώτα τα πλήρη προφίλ.
export function compareByRank(weights) {
  return (a, b) =>
    (rankScore(b, weights) - rankScore(a, weights)) ||
    ((b.is_profile_full ? 1 : 0) - (a.is_profile_full ? 1 : 0)) ||
    (new Date(b.created_at || 0) - new Date(a.created_at || 0));
}
