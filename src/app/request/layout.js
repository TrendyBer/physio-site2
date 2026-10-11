// src/app/request/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Αίτημα για φυσικοθεραπεία στο σπίτι',
  description:
    'Στείλτε αίτημα για φυσικοθεραπεία στον χώρο σας.',
  // Φόρμα — δεν χρειάζεται να εμφανίζεται στο Google.
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Αίτημα για φυσικοθεραπεία στο σπίτι | Theralivo',
    description: 'Στείλτε αίτημα για φυσικοθεραπεία στον χώρο σας.',
    url: '/request',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
