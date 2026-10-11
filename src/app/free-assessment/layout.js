// src/app/free-assessment/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Δωρεάν αξιολόγηση',
  description:
    'Συμπληρώστε τη φόρμα και η ομάδα του Theralivo θα επικοινωνήσει μαζί σας.',
  // Φόρμα — δεν χρειάζεται να εμφανίζεται στο Google.
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Δωρεάν αξιολόγηση | Theralivo',
    description: 'Συμπληρώστε τη φόρμα και η ομάδα του Theralivo θα επικοινωνήσει μαζί σας.',
    url: '/free-assessment',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
