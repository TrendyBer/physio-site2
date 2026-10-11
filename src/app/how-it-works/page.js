// src/app/how-it-works/page.js
// «Πώς λειτουργεί» — SERVER. Φορτώνει τα κείμενα του admin και στέλνει
// έτοιμη σελίδα. Η λειτουργία ζει στο HowItWorksClient.jsx.

import HowItWorksClient from './HowItWorksClient';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

export default async function HowItWorksPage() {
  let cms = null;
  try {
    const { data } = await supabase
      .from('site_content')
      .select('section, content_el, content_en')
      .eq('page', 'howitworks');
    if (data?.length) cms = data;
  } catch (_) {}
  return <HowItWorksClient initialCms={cms} />;
}
