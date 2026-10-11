// src/app/therapists/[id]/page.jsx
// ═══════════════════════════════════════════════════════════════════
// Προφίλ θεραπευτή — SERVER.
//
// Φορτώνει στον server τα δημόσια στοιχεία, τις αξιολογήσεις και τις
// παθήσεις, και στέλνει έτοιμη σελίδα. Πριν, η σελίδα έφτανε άδεια και
// γέμιζε μόνο στον browser: το Google έβλεπε μόνο το footer.
//
// ΠΗΓΗ: v_public_therapists — ΟΧΙ therapist_profiles. Κανένα ιδιωτικό
// στοιχείο (ΑΦΜ, IBAN, άδεια) δεν φτάνει στη σελίδα.
// Η διαθεσιμότητα και όλη η λειτουργία ζουν στο TherapistProfileClient.jsx.
// ═══════════════════════════════════════════════════════════════════

import TherapistProfileClient from './TherapistProfileClient';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

async function loadProfile(id) {
  try {
    const { data: th } = await supabase
      .from('v_public_therapists')
      .select('*')
      .eq('id', id)
      .eq('is_publicly_visible', true)
      .maybeSingle();
    if (!th) return null;

    const [{ data: rv }, { data: tc }] = await Promise.all([
      supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('therapist_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('therapist_conditions')
        .select('condition_id')
        .eq('therapist_id', id),
    ]);

    const reviews = rv || [];
    let conditions = [];
    const conditionIds = (tc || []).map(x => x.condition_id);
    if (conditionIds.length > 0) {
      const { data: cn } = await supabase
        .from('conditions')
        .select('id, name_el')
        .in('id', conditionIds);
      conditions = (cn || []).map(c => c.name_el).filter(Boolean);
    }

    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

    return {
      therapist: { ...th, avg_rating: avg, review_count: count },
      reviews,
      conditions,
    };
  } catch (_) {
    // Αν ο server δεν φτάσει τη βάση, το προφίλ φορτώνει όπως πριν, στον browser.
    return null;
  }
}

export default async function TherapistProfilePage({ params }) {
  const { id } = await params;
  const initial = await loadProfile(id);
  return <TherapistProfileClient id={id} initial={initial} />;
}
