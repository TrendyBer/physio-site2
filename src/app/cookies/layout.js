// src/app/cookies/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Πολιτική cookies',
  description:
    'Ποια cookies χρησιμοποιεί το Theralivo και πώς μπορείτε να τα διαχειριστείτε.',
  openGraph: {
    title: 'Πολιτική cookies | Theralivo',
    description: 'Ποια cookies χρησιμοποιεί το Theralivo και πώς μπορείτε να τα διαχειριστείτε.',
    url: '/cookies',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
