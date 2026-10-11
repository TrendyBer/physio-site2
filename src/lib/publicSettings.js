// src/lib/publicSettings.js
// ─────────────────────────────────────────────────────────────
// Οι ρυθμίσεις που επιτρέπεται να δει το site (email, τηλέφωνο,
// διεύθυνση, βασικοί όροι χρέωσης).
//
// ΓΙΑΤΙ ΟΧΙ ΑΠΕΥΘΕΙΑΣ ΑΠΟ ΤΟ platform_settings:
// Ο πίνακας δεν διαβάζεται από επισκέπτες/ασθενείς — έχει και
// οικονομικές ρυθμίσεις. Η RPC public_site_settings() δίνει μόνο
// συγκεκριμένα κλειδιά.
//
// Επιστρέφει το ίδιο σχήμα με το παλιό select('key, value'):
//   { data: [{ key, value }, ...] }  ή  { data: null } σε σφάλμα
// ώστε ο υπάρχων κώδικας να μη χρειάζεται άλλη αλλαγή.
// ─────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabase';

export async function fetchPublicSettings(keys) {
  const { data, error } = await supabase.rpc('public_site_settings');
  if (error || !data || typeof data !== 'object') {
    if (error) console.error('[public_site_settings]', error.message);
    return { data: null, error };
  }
  let rows = Object.entries(data).map(([key, value]) => ({ key, value }));
  if (Array.isArray(keys)) rows = rows.filter((r) => keys.includes(r.key));
  return { data: rows, error: null };
}
