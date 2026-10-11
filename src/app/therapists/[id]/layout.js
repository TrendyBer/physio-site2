// src/app/therapists/[id]/layout.js
// Δίνει σε κάθε προφίλ θεραπευτή δικό του τίτλο και περιγραφή στο
// Google. Διαβάζει ΜΟΝΟ από το v_public_therapists (ίδια πηγή με τη
// σελίδα) — κανένα ιδιωτικό στοιχείο δεν φτάνει στα metadata.

import { supabase } from '@/lib/supabase';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const { data: th, error } = await supabase
      .from('v_public_therapists')
      .select('*')
      .eq('id', id)
      .eq('is_publicly_visible', true)
      .maybeSingle();

    if (error) return { title: 'Φυσικοθεραπευτής' };
    if (!th) return { title: 'Το προφίλ δεν βρέθηκε', robots: { index: false, follow: true } };

    const name = th.name || 'Φυσικοθεραπευτής';
    const title = `${name} – Φυσικοθεραπευτής κατ' οίκον`;
    const bio = th.bio && th.bio.trim().length > 20 ? th.bio.trim().replace(/\s+/g, ' ') : '';
    const description = bio
      ? bio.slice(0, 160)
      : `${name}${th.specialty ? `, ${th.specialty}` : ''}. Φυσικοθεραπεία στο σπίτι σε Αθήνα και Αττική μέσω Theralivo.`;

    return {
      title,
      description,
      alternates: { canonical: `/therapists/${id}` },
      openGraph: {
        title: `${title} | Theralivo`,
        description,
        url: `/therapists/${id}`,
        type: 'profile',
        locale: 'el_GR',
        siteName: 'Theralivo',
        ...(th.photo_url ? { images: [th.photo_url] } : {}),
      },
    };
  } catch (_) {
    return { title: 'Φυσικοθεραπευτής' };
  }
}

export default function Layout({ children }) {
  return children;
}
