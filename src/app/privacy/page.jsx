'use client';
import { useState } from 'react';

// ⚠️ LEGAL REVIEW REQUIRED πριν το launch
// Placeholders προς αντικατάσταση:
// - {ΟΝΟΜΑ ΕΠΙΧΕΙΡΗΣΗΣ}     → πλήρες όνομα ιδιώτη/ατομικής επιχείρησης
// - {ΑΦΜ}                    → ΑΦΜ
// - {ΔΟΥ}                    → αρμόδια ΔΟΥ
// - support@physiohome.gr    → πραγματικό email επικοινωνίας
// - dpo@physiohome.gr        → email υπευθύνου προστασίας δεδομένων (αν διαφέρει)

const CONTENT = {
  el: {
    title: 'Πολιτική Απορρήτου',
    lastUpdated: 'Τελευταία ενημέρωση: 29 Απριλίου 2026',
    intro: 'Η παρούσα Πολιτική Απορρήτου περιγράφει τον τρόπο με τον οποίο η PhysioHome (εφεξής "η Πλατφόρμα") συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR — ΕΕ 2016/679) και τη σχετική ελληνική νομοθεσία (Ν. 4624/2019).',
    sections: [
      {
        h: '1. Υπεύθυνος Επεξεργασίας Δεδομένων',
        p: [
          'Υπεύθυνος Επεξεργασίας: {ΟΝΟΜΑ ΕΠΙΧΕΙΡΗΣΗΣ}, ατομική επιχείρηση με έδρα στην Αθήνα, Ελλάδα.',
          'ΑΦΜ: {ΑΦΜ} | ΔΟΥ: {ΔΟΥ}',
          'Επικοινωνία: support@physiohome.gr',
        ],
      },
      {
        h: '2. Τι Δεδομένα Συλλέγουμε',
        p: ['Συλλέγουμε τις παρακάτω κατηγορίες προσωπικών δεδομένων:'],
        list: [
          'Στοιχεία ταυτότητας: ονοματεπώνυμο, email, τηλέφωνο',
          'Στοιχεία διεύθυνσης: περιοχή, διεύθυνση, πόλη, ΤΚ (μόνο για ασθενείς, για τις κατ\' οίκον επισκέψεις)',
          'Επαγγελματικά στοιχεία (μόνο για θεραπευτές): ειδικότητα, άδεια ασκήσεως επαγγέλματος, βιογραφικό, πιστοποιητικά, χρόνια εμπειρίας',
          'Δεδομένα υγείας (μόνο για ασθενείς): περιγραφή προβλήματος που υποβάλετε εθελοντικά κατά την αίτηση συνεδρίας',
          'Δεδομένα συναλλαγών: ραντεβού, πληρωμές, αξιολογήσεις',
          'Τεχνικά δεδομένα: διεύθυνση IP, τύπος συσκευής, πρόγραμμα περιήγησης (μέσω cookies)',
        ],
      },
      {
        h: '3. Νομική Βάση Επεξεργασίας',
        p: ['Επεξεργαζόμαστε τα δεδομένα σας με τις εξής νομικές βάσεις:'],
        list: [
          'Συγκατάθεση (άρθ. 6 παρ. 1α GDPR): για δεδομένα υγείας και marketing communications',
          'Εκτέλεση σύμβασης (άρθ. 6 παρ. 1β GDPR): για τη διαχείριση του λογαριασμού σας και των ραντεβού',
          'Έννομο συμφέρον (άρθ. 6 παρ. 1στ GDPR): για ασφάλεια, βελτίωση υπηρεσιών, fraud prevention',
          'Νομική υποχρέωση (άρθ. 6 παρ. 1γ GDPR): για φορολογικά αρχεία και λογιστικές υποχρεώσεις',
        ],
      },
      {
        h: '4. Δεδομένα Υγείας — Ειδικές Κατηγορίες',
        p: [
          'Τα δεδομένα υγείας ανήκουν στις ειδικές κατηγορίες δεδομένων (άρθ. 9 GDPR). Συλλέγονται μόνο με τη ρητή συγκατάθεσή σας και χρησιμοποιούνται αποκλειστικά για:',
        ],
        list: [
          'Την παροχή της υπηρεσίας φυσιοθεραπείας που ζητήσατε',
          'Την επικοινωνία με τον θεραπευτή που έχετε επιλέξει',
        ],
        p2: ['Δεν διαβιβάζουμε δεδομένα υγείας σε τρίτους εκτός του θεραπευτή που έχετε επιλέξει.'],
      },
      {
        h: '5. Διάρκεια Διατήρησης',
        list: [
          'Δεδομένα λογαριασμού: όσο διατηρείτε ενεργό λογαριασμό',
          'Δεδομένα συναλλαγών (φορολογικά): 5 χρόνια από το τέλος του οικονομικού έτους',
          'Δεδομένα ραντεβού: 2 χρόνια μετά την ολοκλήρωση',
          'Cookies: όπως περιγράφεται στην Πολιτική Cookies',
          'Μετά τη διαγραφή λογαριασμού: τα δεδομένα ανωνυμοποιούνται ή διαγράφονται εντός 30 ημερών (εκτός φορολογικών υποχρεώσεων)',
        ],
      },
      {
        h: '6. Παραλήπτες Δεδομένων',
        p: ['Τα δεδομένα σας μπορεί να μοιραστούν με:'],
        list: [
          'Τον θεραπευτή που έχετε επιλέξει (μόνο τα απαραίτητα στοιχεία επικοινωνίας και υγείας)',
          'Παρόχους υπηρεσιών IT (Supabase για βάση δεδομένων, Vercel για hosting, Resend για email — όλοι GDPR-compliant)',
          'Παρόχους πληρωμών (Stripe — όταν ενεργοποιηθεί)',
          'Δημόσιες αρχές, εφόσον υφίσταται νομική υποχρέωση',
        ],
      },
      {
        h: '7. Τα Δικαιώματά σας (GDPR)',
        p: ['Έχετε τα εξής δικαιώματα:'],
        list: [
          'Πρόσβασης στα δεδομένα σας (άρθ. 15)',
          'Διόρθωσης ανακριβών δεδομένων (άρθ. 16)',
          'Διαγραφής ("δικαίωμα στη λήθη", άρθ. 17)',
          'Περιορισμού επεξεργασίας (άρθ. 18)',
          'Φορητότητας δεδομένων (άρθ. 20)',
          'Εναντίωσης στην επεξεργασία (άρθ. 21)',
          'Ανάκλησης συγκατάθεσης ανά πάσα στιγμή',
          'Υποβολής καταγγελίας στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (www.dpa.gr)',
        ],
        p2: ['Για άσκηση των δικαιωμάτων σας, επικοινωνήστε στο support@physiohome.gr. Θα απαντήσουμε εντός 30 ημερών.'],
      },
      {
        h: '8. Ασφάλεια Δεδομένων',
        p: [
          'Λαμβάνουμε τα κατάλληλα τεχνικά και οργανωτικά μέτρα για την προστασία των δεδομένων σας:',
        ],
        list: [
          'Κρυπτογράφηση κατά τη μεταφορά (HTTPS/TLS)',
          'Αυστηρός έλεγχος πρόσβασης με Row-Level Security policies',
          'Ασφαλής αποθήκευση αρχείων σε ιδιωτικά buckets',
          'Τακτικά backups',
          'Logging και παρακολούθηση συμβάντων ασφαλείας',
        ],
      },
      {
        h: '9. Αλλαγές στην Πολιτική',
        p: [
          'Μπορούμε να ενημερώσουμε την παρούσα Πολιτική. Οι σημαντικές αλλαγές θα ανακοινώνονται στο email σας τουλάχιστον 14 ημέρες πριν τεθούν σε ισχύ.',
        ],
      },
      {
        h: '10. Επικοινωνία',
        p: [
          'Για ερωτήσεις σχετικά με την παρούσα Πολιτική: support@physiohome.gr',
          'Υπεύθυνος Προστασίας Δεδομένων (DPO): dpo@physiohome.gr',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: April 29, 2026',
    intro: 'This Privacy Policy describes how PhysioHome (the "Platform") collects, uses, and protects your personal data in accordance with the General Data Protection Regulation (GDPR — EU 2016/679) and applicable Greek law (L. 4624/2019).',
    sections: [
      {
        h: '1. Data Controller',
        p: [
          'Data Controller: {BUSINESS NAME}, sole proprietorship based in Athens, Greece.',
          'VAT ID: {VAT ID} | Tax Office: {TAX OFFICE}',
          'Contact: support@physiohome.gr',
        ],
      },
      {
        h: '2. What Data We Collect',
        p: ['We collect the following categories of personal data:'],
        list: [
          'Identity data: full name, email, phone',
          'Address data: area, address, city, postal code (patients only, for home visits)',
          'Professional data (therapists only): specialty, license, CV, certifications, years of experience',
          'Health data (patients only): problem description voluntarily submitted during session requests',
          'Transaction data: appointments, payments, reviews',
          'Technical data: IP address, device type, browser (via cookies)',
        ],
      },
      {
        h: '3. Legal Basis for Processing',
        p: ['We process your data on the following legal bases:'],
        list: [
          'Consent (Art. 6(1)(a) GDPR): for health data and marketing communications',
          'Contract performance (Art. 6(1)(b) GDPR): for managing your account and appointments',
          'Legitimate interest (Art. 6(1)(f) GDPR): for security, service improvement, fraud prevention',
          'Legal obligation (Art. 6(1)(c) GDPR): for tax records and accounting',
        ],
      },
      {
        h: '4. Health Data — Special Categories',
        p: [
          'Health data falls under special categories of data (Art. 9 GDPR). It is collected only with your explicit consent and used exclusively for:',
        ],
        list: [
          'Providing the physiotherapy service you requested',
          'Communicating with the therapist you have selected',
        ],
        p2: ['We do not transfer health data to third parties other than the therapist you have chosen.'],
      },
      {
        h: '5. Retention Period',
        list: [
          'Account data: as long as you maintain an active account',
          'Transaction data (tax records): 5 years from the end of the fiscal year',
          'Appointment data: 2 years after completion',
          'Cookies: as described in the Cookie Policy',
          'After account deletion: data is anonymized or deleted within 30 days (excluding tax obligations)',
        ],
      },
      {
        h: '6. Data Recipients',
        p: ['Your data may be shared with:'],
        list: [
          'The therapist you have selected (only essential contact and health data)',
          'IT service providers (Supabase for database, Vercel for hosting, Resend for email — all GDPR-compliant)',
          'Payment providers (Stripe — when activated)',
          'Public authorities, where there is a legal obligation',
        ],
      },
      {
        h: '7. Your Rights (GDPR)',
        p: ['You have the following rights:'],
        list: [
          'Access to your data (Art. 15)',
          'Rectification of inaccurate data (Art. 16)',
          'Erasure ("right to be forgotten", Art. 17)',
          'Restriction of processing (Art. 18)',
          'Data portability (Art. 20)',
          'Objection to processing (Art. 21)',
          'Withdrawal of consent at any time',
          'Lodging a complaint with the Hellenic Data Protection Authority (www.dpa.gr)',
        ],
        p2: ['To exercise your rights, contact support@physiohome.gr. We will respond within 30 days.'],
      },
      {
        h: '8. Data Security',
        p: ['We take appropriate technical and organizational measures to protect your data:'],
        list: [
          'Encryption in transit (HTTPS/TLS)',
          'Strict access control with Row-Level Security policies',
          'Secure file storage in private buckets',
          'Regular backups',
          'Logging and monitoring of security events',
        ],
      },
      {
        h: '9. Policy Changes',
        p: [
          'We may update this Policy. Significant changes will be announced via email at least 14 days before they take effect.',
        ],
      },
      {
        h: '10. Contact',
        p: [
          'For questions about this Policy: support@physiohome.gr',
          'Data Protection Officer (DPO): dpo@physiohome.gr',
        ],
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState('el');
  const c = CONTENT[lang];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
        </a>
        <a href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← {lang === 'el' ? 'Επιστροφή' : 'Back'}</a>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {/* Language tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 24 }}>
          {['el', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding: '6px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#0F172A' : '#64748B', textTransform: 'uppercase' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a2e44', marginBottom: 8, fontFamily: 'Georgia, serif' }}>{c.title}</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>{c.lastUpdated}</p>

        {/* Intro */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24, fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
          {c.intro}
        </div>

        {/* Sections */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '32px 28px' }}>
          {c.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: i === c.sections.length - 1 ? 0 : 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 12 }}>{s.h}</h2>
              {s.p && s.p.map((p, j) => (
                <p key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 8 }}>{p}</p>
              ))}
              {s.list && (
                <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
                  ))}
                </ul>
              )}
              {s.p2 && s.p2.map((p, j) => (
                <p key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginTop: 8 }}>{p}</p>
              ))}
            </section>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          <a href="/terms" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Όροι Χρήσης' : 'Terms of Service'}</a>
          •
          <a href="/cookies" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Πολιτική Cookies' : 'Cookie Policy'}</a>
        </div>
      </div>
    </div>
  );
}