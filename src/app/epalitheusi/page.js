// src/app/epalitheusi/page.js
// «Πώς επαληθεύουμε τους φυσικοθεραπευτές».
// ΚΑΝΟΝΑΣ: γράφεται ΜΟΝΟ ό,τι γίνεται πραγματικά στην πλατφόρμα σήμερα
// (ανέβασμα άδειας → χειροκίνητος έλεγχος από το admin → δημόσιο προφίλ).
// Αν αλλάξει η διαδικασία, αλλάζει και αυτό το κείμενο.

import InfoPage from '@/components/InfoPage';

export const metadata = {
  title: 'Πώς επαληθεύουμε τους φυσικοθεραπευτές',
  description: 'Τι ελέγχει το Theralivo πριν εμφανιστεί ένας φυσικοθεραπευτής στην πλατφόρμα, τι σημαίνει η ένδειξη «Επαληθευμένη επαγγελματική άδεια» και τι δεν σημαίνει.',
  alternates: { canonical: '/epalitheusi' },
};

const CONTENT = {
  el: {
    eyebrow: 'Επαλήθευση',
    title: 'Πώς επαληθεύουμε τους φυσικοθεραπευτές',
    lead: 'Πριν ένας φυσικοθεραπευτής εμφανιστεί στο Theralivo, η ομάδα μας ελέγχει ότι έχει δικαίωμα άσκησης του επαγγέλματος. Εδώ εξηγούμε τι ακριβώς ελέγχουμε — και τι όχι.',
    sections: [
      {
        h: '1. Υποβολή της άδειας ασκήσεως επαγγέλματος',
        p: ['Κατά την εγγραφή, ο φυσικοθεραπευτής ανεβάζει αντίγραφο της άδειας ασκήσεως επαγγέλματος. Το έγγραφο αποθηκεύεται σε ιδιωτικό χώρο και δεν δημοσιεύεται ποτέ.'],
      },
      {
        h: '2. Έλεγχος από την ομάδα του Theralivo',
        p: ['Η άδεια ελέγχεται από άνθρωπο, όχι αυτόματα: ότι πρόκειται για άδεια ασκήσεως επαγγέλματος φυσικοθεραπευτή και ότι αντιστοιχεί στα στοιχεία του προφίλ. Ο έλεγχος γίνεται συνήθως εντός 48 ωρών.'],
      },
      {
        h: '3. Μόνο τότε το προφίλ γίνεται δημόσιο',
        p: ['Ένας φυσικοθεραπευτής εμφανίζεται στους ασθενείς μόνο αφού ολοκληρωθεί ο έλεγχος και συμπληρωθούν τα βασικά στοιχεία του προφίλ του. Στο προφίλ του εμφανίζεται τότε η ένδειξη «Επαληθευμένη επαγγελματική άδεια».'],
      },
      {
        h: 'Τι σημαίνει — και τι δεν σημαίνει — η ένδειξη',
        list: [
          'Σημαίνει ότι ελέγξαμε την άδεια ασκήσεως επαγγέλματος του φυσικοθεραπευτή.',
          'Δεν αποτελεί εγγύηση θεραπευτικού αποτελέσματος. Κάθε φυσικοθεραπευτής είναι ανεξάρτητος επαγγελματίας και είναι υπεύθυνος για τις υπηρεσίες που παρέχει.',
        ],
      },
      {
        h: 'Μετά την εγγραφή',
        list: [
          'Αξιολογήσεις γράφουν μόνο ασθενείς που είχαν ραντεβού μέσω της πλατφόρμας.',
          'Μετά από κάθε συνεδρία, ο ασθενής επιβεβαιώνει ότι πραγματοποιήθηκε.',
          'Επαναλαμβανόμενες ακυρώσεις της τελευταίας στιγμής καταγράφονται και μπορεί να οδηγήσουν σε προσωρινή παύση του λογαριασμού.',
          'Μπορείτε να μας αναφέρετε οποιοδήποτε πρόβλημα από τον λογαριασμό σας ή στο info@theralivo.com. Κάθε αναφορά εξετάζεται από την ομάδα μας.',
        ],
      },
    ],
    cta: {
      title: 'Βρείτε φυσικοθεραπευτή για το περιστατικό σας',
      desc: 'Περιγράψτε τι σας ενοχλεί και δείτε ποιοι επαληθευμένοι φυσικοθεραπευτές εξυπηρετούν την περιοχή σας.',
      href: '/find-help',
      label: 'Ξεκινήστε',
    },
  },
  en: {
    eyebrow: 'Verification',
    title: 'How we verify physiotherapists',
    lead: 'Before a physiotherapist appears on Theralivo, our team checks that they are licensed to practise. Here is exactly what we check — and what we do not.',
    sections: [
      { h: '1. Licence submission', p: ['When registering, the physiotherapist uploads a copy of their professional licence. The document is stored privately and is never published.'] },
      { h: '2. Review by the Theralivo team', p: ['The licence is reviewed by a person, not automatically: that it is a physiotherapy practising licence and that it matches the profile details. Reviews are usually completed within 48 hours.'] },
      { h: '3. Only then does the profile go public', p: ['A physiotherapist is shown to patients only after the review is complete and the core profile details are filled in. The profile then shows the “Verified professional licence” badge.'] },
      { h: 'What the badge means — and what it does not', list: [
        'It means we have checked the physiotherapist’s professional licence.',
        'It is not a guarantee of treatment outcomes. Each physiotherapist is an independent professional responsible for the services they provide.',
      ] },
      { h: 'After registration', list: [
        'Only patients who had an appointment through the platform can leave reviews.',
        'After each session, the patient confirms that it took place.',
        'Repeated last-minute cancellations are recorded and may lead to a temporary account pause.',
        'You can report any problem from your account or at info@theralivo.com. Every report is reviewed by our team.',
      ] },
    ],
    cta: { title: 'Find a physiotherapist for your condition', desc: 'Tell us what is bothering you and see which verified physiotherapists serve your area.', href: '/find-help', label: 'Get started' },
  },
};

export default function VerificationPage() {
  return <InfoPage content={CONTENT} />;
}
