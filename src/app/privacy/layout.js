// src/app/privacy/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Πολιτική απορρήτου',
  description:
    'Πώς το Theralivo συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα.',
  openGraph: {
    title: 'Πολιτική απορρήτου | Theralivo',
    description: 'Πώς το Theralivo συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα.',
    url: '/privacy',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
