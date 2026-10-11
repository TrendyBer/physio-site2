// src/app/terms/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Όροι χρήσης',
  description:
    'Οι όροι χρήσης της πλατφόρμας Theralivo για ασθενείς και φυσικοθεραπευτές.',
  openGraph: {
    title: 'Όροι χρήσης | Theralivo',
    description: 'Οι όροι χρήσης της πλατφόρμας Theralivo για ασθενείς και φυσικοθεραπευτές.',
    url: '/terms',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
