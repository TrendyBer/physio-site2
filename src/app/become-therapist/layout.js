// src/app/become-therapist/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Γίνε συνεργάτης φυσικοθεραπευτής',
  description:
    'Για φυσικοθεραπευτές με άδεια ασκήσεως επαγγέλματος: επαγγελματικό προφίλ, αιτήματα ασθενών για επίσκεψη στο σπίτι και διαχείριση ραντεβού σε Αθήνα και Αττική.',
  openGraph: {
    title: 'Γίνε συνεργάτης φυσικοθεραπευτής | Theralivo',
    description: 'Για φυσικοθεραπευτές με άδεια ασκήσεως επαγγέλματος: επαγγελματικό προφίλ, αιτήματα ασθενών για επίσκεψη στο σπίτι και διαχείριση ραντεβού σε Αθήνα και Αττική.',
    url: '/become-therapist',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
