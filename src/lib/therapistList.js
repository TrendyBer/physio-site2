// src/lib/therapistList.js
// ─────────────────────────────────────────────────────────────
// Η λίστα θεραπευτών με βαθμολογίες, παθήσεις, κατάταξη και
// διαθεσιμότητα. ΚΟΙΝΗ για server και browser:
//   · ο server τη φορτώνει για να στείλει έτοιμη σελίδα (Google,
//     εργαλεία, γρήγορη πρώτη εμφάνιση)
//   · ο browser την ξαναφορτώνει για φρέσκια διαθεσιμότητα
// Επιστρέφει { therapists, conditionsMap } ή null σε σφάλμα.
// ─────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabase';
import { filterBookableSlots } from '@/lib/slots';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export async function loadTherapistList() {
  try {
    // ΠΗΓΗ: v_public_therapists — ΟΧΙ therapist_profiles.
    // Το view εκθέτει ΜΟΝΟ δημόσια πεδία και υπολογίζει το
    // is_publicly_visible λαμβάνοντας υπόψη και το admin override.
    const { data: ths, error } = await supabase
      .from('v_public_therapists')
      .select('*')
      .eq('is_publicly_visible', true)
      .order('created_at', { ascending: false });

    if (error || !ths) {
      console.error('Therapists fetch error:', error);
      return null;
    }

    const therapistIds = ths.map(t => t.id);
    let ratingsMap = {};
    let conditionsMap = {};
    let rankMap = {};
    let slotMap = {};

    if (therapistIds.length > 0) {
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('therapist_id, rating')
        .eq('is_published', true)
        .in('therapist_id', therapistIds);
      if (reviewsData) {
        reviewsData.forEach(rv => {
          if (!ratingsMap[rv.therapist_id]) ratingsMap[rv.therapist_id] = { sum: 0, count: 0 };
          ratingsMap[rv.therapist_id].sum += rv.rating;
          ratingsMap[rv.therapist_id].count += 1;
        });
      }

      const { data: tcData } = await supabase
        .from('therapist_conditions')
        .select('therapist_id, condition_id')
        .in('therapist_id', therapistIds);
      if (tcData) {
        tcData.forEach(tc => {
          if (!conditionsMap[tc.therapist_id]) conditionsMap[tc.therapist_id] = [];
          conditionsMap[tc.therapist_id].push(tc.condition_id);
        });
      }

      // Βάρος κατάταξης από τη συνδρομή.
      // Ρυθμίζεται ανά πλάνο από το admin: 0 = ουδέτερο, 200 = πάντα πρώτοι.
      const { data: rankData } = await supabase
        .from('v_therapist_ranking')
        .select('therapist_id, rank_weight, featured_listing')
        .in('therapist_id', therapistIds);
      if (rankData) {
        rankData.forEach(r => {
          rankMap[r.therapist_id] = {
            rank_weight: Number(r.rank_weight) || 0,
            featured: !!r.featured_listing,
          };
        });
      }

      // ΠΡΩΤΗ ΔΙΑΘΕΣΙΜΗ ΩΡΑ.
      // Το «πότε μπορεί να με δει» είναι από τα πρώτα που ρωτάει ο
      // ασθενής και η κάρτα δεν το έλεγε πουθενά.
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + 21);
      const { data: slotData } = await supabase
        .from('availability_slots')
        .select('therapist_id, date, start_time')
        .eq('is_blocked', false)
        .gte('date', todayISO())
        .lte('date', horizon.toISOString().split('T')[0])
        .in('therapist_id', therapistIds)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      if (slotData) {
        // Οι περασμένες ώρες της σημερινής μέρας δεν μετράνε ούτε ως
        // «πρώτη ελεύθερη ώρα» ούτε στο σύνολο.
        filterBookableSlots(slotData).forEach(s => {
          if (!slotMap[s.therapist_id]) {
            slotMap[s.therapist_id] = { next: { date: s.date, start_time: s.start_time }, count: 0, days: [] };
          }
          const m = slotMap[s.therapist_id];
          m.count += 1;
          // ΠΡΩΤΗ ΕΛΕΥΘΕΡΗ ΩΡΑ ΑΝΑ ΜΕΡΑ.
          // Ο ασθενής δεν θέλει λίστα με σαράντα ώρες — θέλει να δει
          // με μια ματιά ποιες μέρες μπορεί. Έξι μέρες αρκούν.
          if (m.days.length < 6 && !m.days.some(d => d.date === s.date)) {
            m.days.push({ date: s.date, start_time: s.start_time });
          }
        });
      }
    }

    const enriched = ths.map(t => {
      const stats = ratingsMap[t.id];
      const rank = rankMap[t.id];
      const sl = slotMap[t.id];
      return {
        ...t,
        avg_rating: stats ? stats.sum / stats.count : 0,
        review_count: stats ? stats.count : 0,
        rank_weight: rank ? rank.rank_weight : 0,
        featured: rank ? rank.featured : false,
        next_slot: sl ? sl.next : null,
        free_slots: sl ? sl.count : 0,
        slot_days: sl ? sl.days : [],
      };
    });
    return { therapists: enriched, conditionsMap };
  } catch (err) {
    console.error('Therapists fetch failed:', err);
    return null;
  }
}
