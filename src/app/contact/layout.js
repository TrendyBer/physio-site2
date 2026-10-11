// src/app/contact/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Επικοινωνία',
  description:
    'Επικοινωνήστε με την ομάδα του Theralivo για ερωτήσεις σχετικά με τη φυσικοθεραπεία στο σπίτι ή τη συνεργασία με φυσικοθεραπευτές.',
  openGraph: {
    title: 'Επικοινωνία | Theralivo',
    description: 'Επικοινωνήστε με την ομάδα του Theralivo για ερωτήσεις σχετικά με τη φυσικοθεραπεία στο σπίτι ή τη συνεργασία με φυσικοθεραπευτές.',
    url: '/contact',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
