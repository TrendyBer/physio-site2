'use client';
import { useState } from 'react';

// ⚠️ LEGAL REVIEW REQUIRED πριν το launch
// Placeholders: {ΟΝΟΜΑ ΕΠΙΧΕΙΡΗΣΗΣ}, {ΑΦΜ}, support@physiohome.gr

const CONTENT = {
  el: {
    title: 'Όροι Χρήσης',
    lastUpdated: 'Τελευταία ενημέρωση: 2 Μαΐου 2026',
    intro: 'Καλώς ήρθατε στο PhysioHome. Οι παρόντες Όροι Χρήσης διέπουν τη χρήση της πλατφόρμας. Με την εγγραφή και χρήση της Πλατφόρμας, αποδέχεστε τους παρόντες όρους.',
    sections: [
      {
        h: '1. Γενικά Στοιχεία',
        p: [
          'Πάροχος: {ΟΝΟΜΑ ΕΠΙΧΕΙΡΗΣΗΣ}, ατομική επιχείρηση με έδρα στην Αθήνα, Ελλάδα.',
          'Επικοινωνία: support@physiohome.gr',
          'Η PhysioHome (εφεξής "η Πλατφόρμα") είναι μια διαδικτυακή πλατφόρμα που συνδέει ασθενείς με αδειούχους θεραπευτές φυσιοθεραπείας στην Αθήνα.',
        ],
      },
      {
        h: '2. Φύση της Υπηρεσίας',
        p: [
          'Η Πλατφόρμα λειτουργεί ως marketplace και διαμεσολαβητής. Δεν παρέχει η ίδια υπηρεσίες υγείας. Οι θεραπευτές που εγγράφονται είναι ανεξάρτητοι επαγγελματίες, υπεύθυνοι για την ποιότητα και νομιμότητα των υπηρεσιών τους.',
          'Η Πλατφόρμα δεν εγγυάται συγκεκριμένα θεραπευτικά αποτελέσματα.',
        ],
      },
      {
        h: '3. Εγγραφή και Λογαριασμός',
        list: [
          'Πρέπει να είστε τουλάχιστον 18 ετών για εγγραφή',
          'Παρέχετε ακριβή και ενημερωμένα στοιχεία',
          'Είστε υπεύθυνοι για την ασφάλεια του κωδικού σας',
          'Ένας λογαριασμός ανά άτομο',
          'Διατηρούμε το δικαίωμα αναστολής/διαγραφής λογαριασμών που παραβαίνουν τους όρους',
        ],
      },
      {
        h: '4. Όροι για Ασθενείς',
        list: [
          'Παρέχετε ειλικρινείς πληροφορίες για το πρόβλημα υγείας σας',
          'Η συμμετοχή σας σε θεραπεία είναι εθελοντική και υπ\' ευθύνη σας',
          'Πληρώνετε τις συμφωνημένες αμοιβές μέσω της Πλατφόρμας',
          'Δεν δικαιούστε επιστροφή χρημάτων μετά την ολοκλήρωση συνεδρίας (εκτός εξαιρέσεων κατωτέρω)',
          'Ακύρωση ραντεβού: δωρεάν εάν γίνει 24+ ώρες πριν, αλλιώς ισχύει χρέωση 50%',
        ],
      },
      {
        h: '5. Όροι για Θεραπευτές',
        p: ['Για να εγγραφείτε ως θεραπευτής, πρέπει να:'],
        list: [
          'Διαθέτετε εν ισχύει άδεια ασκήσεως επαγγέλματος φυσιοθεραπευτή',
          'Ανεβάσετε αντίγραφο της άδειας προς έλεγχο',
          'Παρέχετε ακριβή στοιχεία για την ειδικότητα και εμπειρία σας',
          'Τηρείτε τα ραντεβού που έχετε αποδεχθεί',
          'Παρέχετε υπηρεσίες σύμφωνα με τα επαγγελματικά πρότυπα',
          'Συμμορφώνεστε με τη νομοθεσία περί υγείας και GDPR',
        ],
      },
      {
        h: '6. Προμήθεια Πλατφόρμας — Πολιτική Anti-Bypass',
        p: ['Σημαντικό για τους θεραπευτές:'],
        list: [
          'Η Πλατφόρμα χρεώνει προμήθεια €3 ανά συνεδρία (ενδέχεται να αναπροσαρμοστεί με προηγούμενη ειδοποίηση)',
          'Απαγορεύεται αυστηρά η εκτός πλατφόρμας συμφωνία με ασθενείς που γνωρίσατε μέσω αυτής',
          'Σε περίπτωση παραβίασης (bypass): πρόστιμο έως €500 ανά περιστατικό + αποβολή',
          'Όλες οι κρατήσεις πρέπει να γίνονται μέσω της Πλατφόρμας',
        ],
      },
      {
        h: '7. Πληρωμές και Επιστροφές',
        list: [
          'Οι πληρωμές γίνονται μέσω της Πλατφόρμας με ασφαλή τρόπο',
          'Λειτουργία escrow: το ποσό κρατείται από την Πλατφόρμα και αποδεσμεύεται στον θεραπευτή μετά την ολοκλήρωση κάθε συνεδρίας και την επιβεβαίωση από τον ασθενή',
          'Αυτόματη απελευθέρωση: αν ο ασθενής δεν επιβεβαιώσει εντός 7 ημερών από την ολοκλήρωση της συνεδρίας, η πληρωμή απελευθερώνεται αυτόματα στον θεραπευτή',
          'Επιστροφή χρημάτων: επιτρέπεται εάν ο θεραπευτής ακυρώσει το ραντεβού',
          'Επιστροφή για παράλειψη υπηρεσίας: επικοινωνήστε στο support@physiohome.gr εντός 7 ημερών',
          'Οι αποφάσεις της Πλατφόρμας για διαφορές είναι τελικές',
        ],
      },
      {
        h: '8. Αξιολογήσεις',
        list: [
          'Οι αξιολογήσεις πρέπει να βασίζονται σε πραγματική εμπειρία',
          'Απαγορεύονται οι ψευδείς, υβριστικές ή παραπλανητικές αξιολογήσεις',
          'Η Πλατφόρμα διατηρεί το δικαίωμα αφαίρεσης αξιολογήσεων που παραβιάζουν τους όρους',
          'Οι αξιολογήσεις είναι δημόσιες και ανώνυμες (μόνο όνομα ασθενή εμφανίζεται)',
        ],
      },
      {
        h: '9. Απαγορευμένη Χρήση',
        p: ['Δεν επιτρέπεται:'],
        list: [
          'Παράνομες δραστηριότητες ή παραβίαση δικαιωμάτων τρίτων',
          'Αντιγραφή ή scraping του περιεχομένου',
          'Δοκιμές διείσδυσης χωρίς γραπτή άδεια',
          'Δημιουργία πολλαπλών λογαριασμών για παραπλάνηση',
          'Παρενόχληση άλλων χρηστών',
        ],
      },
      {
        h: '10. Ευθύνη και Αποζημίωση',
        p: [
          'Η Πλατφόρμα παρέχεται "ως έχει". Δεν εγγυόμαστε αδιάλειπτη λειτουργία ή ότι θα είναι απαλλαγμένη από σφάλματα.',
          'Δεν φέρουμε ευθύνη για:',
        ],
        list: [
          'Την ποιότητα ή το αποτέλεσμα των θεραπειών',
          'Διαφορές μεταξύ ασθενών και θεραπευτών',
          'Έμμεσες, τυχαίες ή επακόλουθες ζημίες',
        ],
        p2: ['Η συνολική ευθύνη μας περιορίζεται στο ποσό που έχετε καταβάλει στην Πλατφόρμα τους τελευταίους 12 μήνες.'],
      },
      {
        h: '11. Τροποποίηση Όρων',
        p: [
          'Διατηρούμε το δικαίωμα τροποποίησης των όρων. Οι σημαντικές αλλαγές θα ανακοινωθούν με email 14 ημέρες πριν την εφαρμογή.',
          'Η συνεχιζόμενη χρήση της Πλατφόρμας μετά την τροποποίηση συνιστά αποδοχή.',
        ],
      },
      {
        h: '12. Λύση Διαφορών — Δικαιοδοσία',
        p: [
          'Πρώτα προσπάθεια: φιλικός διακανονισμός μέσω support@physiohome.gr',
          'Σε περίπτωση μη επίλυσης: αρμόδια δικαστήρια Αθηνών, Ελλάδα.',
          'Εφαρμοστέο δίκαιο: ελληνικό.',
        ],
      },
      {
        h: '13. Επικοινωνία',
        p: [
          'Για ερωτήσεις σχετικά με τους όρους: support@physiohome.gr',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last updated: May 2, 2026',
    intro: 'Welcome to PhysioHome. These Terms of Service govern your use of the platform. By registering and using the Platform, you accept these terms.',
    sections: [
      {
        h: '1. General Information',
        p: [
          'Provider: {BUSINESS NAME}, sole proprietorship based in Athens, Greece.',
          'Contact: support@physiohome.gr',
          'PhysioHome (the "Platform") is an online platform connecting patients with licensed physiotherapists in Athens.',
        ],
      },
      {
        h: '2. Nature of the Service',
        p: [
          'The Platform operates as a marketplace and intermediary. It does not provide healthcare services itself. Registered therapists are independent professionals responsible for the quality and legality of their services.',
          'The Platform does not guarantee specific therapeutic outcomes.',
        ],
      },
      {
        h: '3. Registration and Account',
        list: [
          'You must be at least 18 years old to register',
          'Provide accurate and updated information',
          'You are responsible for the security of your password',
          'One account per person',
          'We reserve the right to suspend/delete accounts that violate the terms',
        ],
      },
      {
        h: '4. Terms for Patients',
        list: [
          'Provide truthful information about your health condition',
          'Your participation in therapy is voluntary and at your own risk',
          'Pay agreed fees through the Platform',
          'No refund after session completion (except as outlined below)',
          'Appointment cancellation: free if 24+ hours before, otherwise 50% charge applies',
        ],
      },
      {
        h: '5. Terms for Therapists',
        p: ['To register as a therapist, you must:'],
        list: [
          'Hold a valid physiotherapist license',
          'Upload a copy of the license for verification',
          'Provide accurate specialty and experience information',
          'Honor accepted appointments',
          'Provide services according to professional standards',
          'Comply with healthcare and GDPR legislation',
        ],
      },
      {
        h: '6. Platform Fee — Anti-Bypass Policy',
        p: ['Important for therapists:'],
        list: [
          'The Platform charges a €3 fee per session (subject to adjustment with prior notice)',
          'Off-platform agreements with patients met through the Platform are strictly prohibited',
          'In case of violation (bypass): fine up to €500 per incident + removal',
          'All bookings must be made through the Platform',
        ],
      },
      {
        h: '7. Payments and Refunds',
        list: [
          'Payments are made through the Platform securely',
          'Escrow function: the amount is held by the Platform and released to the therapist after each session is completed and confirmed by the patient',
          'Auto-release: if the patient does not confirm within 7 days of session completion, the payment is automatically released to the therapist',
          'Refunds: allowed if therapist cancels the appointment',
          'Refund for service failure: contact support@physiohome.gr within 7 days',
          'Platform decisions on disputes are final',
        ],
      },
      {
        h: '8. Reviews',
        list: [
          'Reviews must be based on actual experience',
          'False, abusive, or misleading reviews are prohibited',
          'The Platform reserves the right to remove reviews that violate the terms',
          'Reviews are public and partially anonymous (only patient first name shown)',
        ],
      },
      {
        h: '9. Prohibited Use',
        p: ['Not allowed:'],
        list: [
          'Illegal activities or violation of third-party rights',
          'Copying or scraping content',
          'Penetration testing without written permission',
          'Creating multiple accounts for deception',
          'Harassment of other users',
        ],
      },
      {
        h: '10. Liability and Indemnification',
        p: [
          'The Platform is provided "as is". We do not guarantee uninterrupted operation or error-free service.',
          'We are not liable for:',
        ],
        list: [
          'Quality or outcome of treatments',
          'Disputes between patients and therapists',
          'Indirect, incidental, or consequential damages',
        ],
        p2: ['Our total liability is limited to the amount you have paid to the Platform in the last 12 months.'],
      },
      {
        h: '11. Modification of Terms',
        p: [
          'We reserve the right to modify the terms. Significant changes will be announced via email 14 days before implementation.',
          'Continued use of the Platform after modification constitutes acceptance.',
        ],
      },
      {
        h: '12. Dispute Resolution — Jurisdiction',
        p: [
          'First attempt: amicable settlement via support@physiohome.gr',
          'If unresolved: competent courts of Athens, Greece.',
          'Applicable law: Greek.',
        ],
      },
      {
        h: '13. Contact',
        p: ['For questions about the terms: support@physiohome.gr'],
      },
    ],
  },
};

export default function TermsOfServicePage() {
  const [lang, setLang] = useState('el');
  const c = CONTENT[lang];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          PhysioHome
        </a>
        <a href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← {lang === 'el' ? 'Επιστροφή' : 'Back'}</a>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 24 }}>
          {['el', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding: '6px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#0F172A' : '#64748B', textTransform: 'uppercase' }}>
              {l}
            </button>
          ))}
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a2e44', marginBottom: 8, fontFamily: 'Georgia, serif' }}>{c.title}</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>{c.lastUpdated}</p>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24, fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
          {c.intro}
        </div>

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

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          <a href="/privacy" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Πολιτική Απορρήτου' : 'Privacy Policy'}</a>
          •
          <a href="/cookies" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Πολιτική Cookies' : 'Cookie Policy'}</a>
        </div>
      </div>
    </div>
  );
}