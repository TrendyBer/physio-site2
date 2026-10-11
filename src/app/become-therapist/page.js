// src/app/become-therapist/page.js
// «Γίνε συνεργάτης» — SERVER. Φορτώνει τα ενεργά πακέτα από το admin και
// στέλνει έτοιμη σελίδα. Η σελίδα ξαναχτίζεται το πολύ κάθε 5 λεπτά, άρα
// μια αλλαγή τιμής στο admin φαίνεται μέσα σε λίγα λεπτά.
// Η λειτουργία ζει στο BecomeTherapistClient.jsx.

import BecomeTherapistClient from './BecomeTherapistClient';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

export default async function BecomeTherapistPage() {
  let plans = null;
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id, name_el, name_en, description_el, description_en, price_monthly, first_session_fee, features_el, features_en, is_recommended, badge_label, display_order')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('display_order', { ascending: true });
    if (!error && data) plans = data;
  } catch (_) {}
  return <BecomeTherapistClient initialPlans={plans} />;
}
