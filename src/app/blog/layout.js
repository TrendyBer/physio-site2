// src/app/blog/layout.js
// Δίνει στη σελίδα δικό της τίτλο και περιγραφή στο Google.
// Η ίδια η σελίδα είναι 'use client' και δεν μπορεί να ορίσει metadata,
// οπότε τα ορίζει αυτό το layout (server). Το «| Theralivo» το προσθέτει
// αυτόματα το template του κεντρικού layout.

export const metadata = {
  title: 'Άρθρα για φυσικοθεραπεία και αποκατάσταση',
  description:
    'Πρακτικά άρθρα για πόνο, τραυματισμούς, αποκατάσταση και άσκηση στο σπίτι, γραμμένα για ασθενείς.',
  openGraph: {
    title: 'Άρθρα για φυσικοθεραπεία και αποκατάσταση | Theralivo',
    description: 'Πρακτικά άρθρα για πόνο, τραυματισμούς, αποκατάσταση και άσκηση στο σπίτι, γραμμένα για ασθενείς.',
    url: '/blog',
    type: 'website',
    locale: 'el_GR',
    siteName: 'Theralivo',
  },
};

export default function Layout({ children }) {
  return children;
}
