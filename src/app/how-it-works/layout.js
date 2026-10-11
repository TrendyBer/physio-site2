// src/app/how-it-works/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Πώς λειτουργεί η φυσικοθεραπεία στο σπίτι',
  description:
    'Περιγράφετε τι σας ενοχλεί, επιλέγετε επαληθευμένο φυσικοθεραπευτή και κλείνετε ραντεβού στον χώρο σας. Δείτε βήμα-βήμα πώς λειτουργεί το Theralivo.',
  openGraph: {
    title: 'Πώς λειτουργεί η φυσικοθεραπεία στο σπίτι | Theralivo',
    description: 'Περιγράφετε τι σας ενοχλεί, επιλέγετε επαληθευμένο φυσικοθεραπευτή και κλείνετε ραντεβού στον χώρο σας. Δείτε βήμα-βήμα πώς λειτουργεί το Theralivo.',
    url: '/how-it-works',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
