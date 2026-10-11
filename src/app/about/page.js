// src/app/about/page.js
// «Σχετικά με το Theralivo» — ποιος είναι πίσω από την πλατφόρμα, τι
// πρόβλημα λύνει και πώς χρηματοδοτείται. Χωρίς υπερβολές: μόνο ό,τι ισχύει.

import InfoPage from '@/components/InfoPage';

export const metadata = {
  title: 'Σχετικά με το Theralivo',
  description: 'Τι είναι το Theralivo, γιατί δημιουργήθηκε, πώς επιλέγονται οι φυσικοθεραπευτές, ποιος είναι ο φορέας λειτουργίας και πώς επικοινωνείτε μαζί μας.',
  alternates: { canonical: '/about' },
};

const CONTENT = {
  el: {
    eyebrow: 'Σχετικά με εμάς',
    title: 'Σχετικά με το Theralivo',
    lead: 'Το Theralivo συνδέει ασθενείς σε Αθήνα και Αττική με επαληθευμένους φυσικοθεραπευτές που έρχονται στον χώρο τους.',
    sections: [
      {
        h: 'Γιατί δημιουργήθηκε',
        p: [
          'Η αναζήτηση φυσικοθεραπευτή για το σπίτι γίνεται συνήθως με συστάσεις και τηλέφωνα: δεν ξέρεις από πριν ποιος αναλαμβάνει το περιστατικό σου, πότε μπορεί να έρθει και πόσο θα κοστίσει.',
          'Στο Theralivo τα βλέπετε αυτά από την αρχή: ποιοι φυσικοθεραπευτές αναλαμβάνουν το πρόβλημά σας, ποιες περιοχές εξυπηρετούν, πότε είναι διαθέσιμοι, πόσο κοστίζει η συνεδρία και τι λένε άλλοι ασθενείς.',
        ],
      },
      {
        h: 'Πώς επιλέγονται οι φυσικοθεραπευτές',
        p: ['Κάθε φυσικοθεραπευτής υποβάλλει την άδεια ασκήσεως επαγγέλματος, την οποία ελέγχει η ομάδα μας πριν το προφίλ του γίνει δημόσιο.'],
        link: { href: '/epalitheusi', label: 'Δείτε πώς γίνεται η επαλήθευση' },
      },
      {
        h: 'Πώς λειτουργεί οικονομικά',
        list: [
          'Για τον ασθενή η χρήση της πλατφόρμας είναι δωρεάν. Την αμοιβή της συνεδρίας την πληρώνετε απευθείας στον φυσικοθεραπευτή.',
          'Το Theralivo χρηματοδοτείται από τους φυσικοθεραπευτές, μέσω συνδρομητικών πλάνων και ενός τέλους για κάθε νέο ασθενή.',
          'Η σειρά εμφάνισης συνδυάζει αξιολογήσεις, διαθεσιμότητα, εμπειρία και συνδρομητικό πλάνο — αλλά μόνο ανάμεσα σε φυσικοθεραπευτές που ταιριάζουν με τα κριτήριά σας.',
        ],
        link: { href: '/terms', label: 'Όροι Χρήσης' },
      },
      {
        h: 'Ποιος βρίσκεται πίσω από το Theralivo',
        p: [
          'Το Theralivo δημιουργήθηκε από φυσικοθεραπευτή, τον Νικόλαο Κυριακόπουλο, που γνωρίζει από πρώτο χέρι τι χρειάζεται ένας ασθενής όταν η θεραπεία γίνεται στο σπίτι.',
          'Είναι εμπορική ονομασία της ατομικής του επιχείρησης, με έδρα στο Ναύπλιο (ΑΦΜ 162062625, ΔΟΥ Ναυπλίου).',
          'Η πλατφόρμα λειτουργεί ως διαμεσολαβητής: δεν παρέχει η ίδια υπηρεσίες υγείας. Οι συνεδρίες παρέχονται από ανεξάρτητους, επαληθευμένους φυσικοθεραπευτές.',
        ],
      },
      {
        h: 'Επικοινωνία και υποστήριξη',
        p: ['Για οποιαδήποτε ερώτηση ή πρόβλημα, γράψτε μας στο info@theralivo.com ή μέσα από τη φόρμα επικοινωνίας.'],
        link: { href: '/contact', label: 'Φόρμα επικοινωνίας' },
      },
    ],
    cta: {
      title: 'Χρειάζεστε φυσικοθεραπεία στο σπίτι;',
      desc: 'Περιγράψτε τι σας ενοχλεί και δείτε ποιοι φυσικοθεραπευτές μπορούν να βοηθήσουν.',
      href: '/find-help',
      label: 'Βρείτε φυσικοθεραπευτή',
    },
  },
  en: {
    eyebrow: 'About us',
    title: 'About Theralivo',
    lead: 'Theralivo connects patients in Athens and Attica with verified physiotherapists who come to them.',
    sections: [
      { h: 'Why we built it', p: [
        'Finding a physiotherapist for home visits usually means recommendations and phone calls: you do not know in advance who will take on your case, when they can come or what it will cost.',
        'On Theralivo you see all of this up front: which physiotherapists treat your problem, the areas they serve, when they are available, the session price and what other patients say.',
      ] },
      { h: 'How physiotherapists are selected', p: ['Every physiotherapist submits their professional licence, which our team reviews before the profile goes public.'], link: { href: '/epalitheusi', label: 'See how verification works' } },
      { h: 'How it is funded', list: [
        'Using the platform is free for patients. You pay the session fee directly to the physiotherapist.',
        'Theralivo is funded by physiotherapists, through subscription plans and a fee for each new patient.',
        'The recommended order combines reviews, availability, experience and subscription plan — but only among physiotherapists who match your criteria.',
      ], link: { href: '/terms', label: 'Terms of Service' } },
      { h: 'Who is behind Theralivo', p: [
        'Theralivo was created by a physiotherapist, Nikolaos Kyriakopoulos, who knows first-hand what a patient needs when treatment happens at home.',
        'It is a trade name of his sole proprietorship, based in Nafplio, Greece (Tax ID 162062625, Nafplio Tax Office).',
        'The platform acts as an intermediary and does not provide healthcare services itself. Sessions are provided by independent, verified physiotherapists.',
      ] },
      { h: 'Contact and support', p: ['For any question or problem, email info@theralivo.com or use the contact form.'], link: { href: '/contact', label: 'Contact form' } },
    ],
    cta: { title: 'Need physiotherapy at home?', desc: 'Tell us what is bothering you and see which physiotherapists can help.', href: '/find-help', label: 'Find a physiotherapist' },
  },
};

export default function AboutPage() {
  return <InfoPage content={CONTENT} />;
}
