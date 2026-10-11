// src/app/therapists/page.js
// ═══════════════════════════════════════════════════════════════════
// Λίστα θεραπευτών — SERVER.
//
// Φορτώνει τους θεραπευτές στον server και στέλνει έτοιμη σελίδα.
// Πριν, η σελίδα έφτανε άδεια και γέμιζε μόνο στον browser: το Google
// και τα εργαλεία ανάγνωσης έβλεπαν «0 γραμμές».
//
// Η σελίδα ξαναχτίζεται το πολύ κάθε 5 λεπτά. Ο browser ανανεώνει
// αμέσως τη διαθεσιμότητα, οπότε ο επισκέπτης βλέπει πάντα φρέσκες ώρες.
// Όλη η λειτουργία (φίλτρα, αναζήτηση, ταξινόμηση) ζει στο
// TherapistsClient.jsx.
// ═══════════════════════════════════════════════════════════════════

import TherapistsClient from './TherapistsClient';
import { loadTherapistList } from '@/lib/therapistList';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

export default async function TherapistsPage() {
  let list = null;
  let cms = null;
  try {
    const [l, { data }] = await Promise.all([
      loadTherapistList(),
      supabase
        .from('site_content')
        .select('section, content_el, content_en')
        .eq('page', 'therapists'),
    ]);
    list = l;
    cms = data?.length ? data : null;
  } catch (_) {
    // Αν ο server δεν φτάσει τη βάση, η σελίδα φορτώνει όπως πριν, στον browser.
  }

  return <TherapistsClient initialData={list} initialCms={cms} />;
}
