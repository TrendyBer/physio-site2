/** @type {import('next').NextConfig} */
const nextConfig = {
  // ═══════════════════════════════════════════════════════════════════
  // ΑΝΑΚΑΤΕΥΘΥΝΣΕΙΣ
  //
  // /find-help/[slug] → /pathiseis/[slug]
  // Η παλιά σελίδα πάθησης καταργήθηκε· η /pathiseis είναι πλέον η
  // μοναδική (δίγλωσση). Η ανακατεύθυνση κρατά ζωντανό κάθε παλιό
  // σύνδεσμο — σε email, σε αποθηκευμένα αγαπημένα, στη Google.
  //
  // permanent: true → 308. Λέει στη Google «μετακόμισε οριστικά»,
  // οπότε μεταφέρει την αξία της παλιάς διεύθυνσης στη νέα.
  //
  // Το ?lang=en περνά αυτόματα: το Next.js κρατά τα query parameters.
  //
  // ΠΡΟΣΟΧΗ: η λίστα /find-help (χωρίς slug) ΔΕΝ επηρεάζεται — το
  // :slug απαιτεί ένα επιπλέον τμήμα στη διεύθυνση.
  // ═══════════════════════════════════════════════════════════════════
  async redirects() {
    return [
      {
        source: '/find-help/:slug',
        destination: '/pathiseis/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
