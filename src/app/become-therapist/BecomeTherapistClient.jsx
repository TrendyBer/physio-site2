'use client';
// src/app/become-therapist/BecomeTherapistClient.jsx
// ═══════════════════════════════════════════════════════════════════
// «Γίνε συνεργάτης» — σελίδα για φυσικοθεραπευτές.
//
// Σοβαρή B2B σελίδα συνεργασίας, όχι διαφημιστική landing page:
// λιτό hero χωρίς φωτογραφία, τρία συγκεκριμένα οφέλη, εικόνα του
// πραγματικού προϊόντος, ξεκάθαρα πακέτα, και ΜΟΝΟ ισχυρισμοί
// αξιοπιστίας που ισχύουν στην πλατφόρμα σήμερα.
//
// Δομή:
//   01 Hero · 02 Οφέλη · 03 Η πλατφόρμα στην πράξη · 04 Πώς λειτουργεί
//   05 Πακέτα · 06 Αξιοπιστία · 07 Συχνές ερωτήσεις · 08 Τελικό CTA
//
// ΤΑ ΠΑΚΕΤΑ ΔΙΑΒΑΖΟΝΤΑΙ ΑΠΟ ΤΗ ΒΑΣΗ — ό,τι είναι ενεργό στο admin
// εμφανίζεται εδώ, με τις ίδιες τιμές που βλέπει ο θεραπευτής στην
// εγγραφή. Ποτέ δύο διαφορετικές τιμές για το ίδιο πακέτο.
//
// ΧΩΡΙΣ CMS: η προηγούμενη έκδοση διάβαζε κείμενα από το
// site_content με page = 'therapists' — δηλαδή από τη σελίδα της
// δημόσιας λίστας θεραπευτών. Ένας νέος τίτλος εκεί από το admin θα
// άλλαζε ΚΑΙ αυτή τη σελίδα. Τα κείμενα είναι πλέον εδώ.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowRight, Check, ShieldCheck, Lock, Star, CreditCard,
  ClipboardList, CalendarDays, UserRound,
} from 'lucide-react';

const C = {
  navy: '#1a2e44', accent: '#2a6fdb', soft: '#eaf2fc', off: '#faf9f6',
  text: '#1a2e44', body: '#475569', muted: '#6b7a8d', faint: '#94a3b8',
  border: '#e5eaf0', line: '#eef2f6',
  green: '#15803D', greenBg: '#F0FDF4', greenBr: '#BBF7D0',
};

const TX = {
  el: {
    // 01 HERO
    eyebrow: 'Theralivo για φυσικοθεραπευτές',
    heroTitle: 'Η επαγγελματική σου παρουσία,',
    heroTitleEm: 'σε μία σύγχρονη πλατφόρμα.',
    heroDesc: 'Συνδέσου με ασθενείς που αναζητούν φυσικοθεραπεία στο σπίτι, διαχειρίσου τα αιτήματα ραντεβού σου και ανάπτυξε την επαγγελματική σου δραστηριότητα.',
    cta: 'Γίνε συνεργάτης',
    heroNote: 'Για επαγγελματίες φυσικοθεραπευτές με άδεια ασκήσεως επαγγέλματος',
    heroSecondary: 'Δες τα πακέτα',

    // 02 ΟΦΕΛΗ
    whyTitle: 'Γιατί να συνεργαστείς μαζί μας',
    benefits: [
      { title: 'Προσέγγισε νέους ασθενείς', desc: 'Απέκτησε παρουσία σε μια πλατφόρμα αφιερωμένη στη φυσικοθεραπεία κατ’ οίκον, στις περιοχές και στα περιστατικά που επιλέγεις εσύ.' },
      { title: 'Οργάνωσε τα ραντεβού σου', desc: 'Διαχειρίσου αιτήματα, ραντεβού και διαθεσιμότητα από ένα κεντρικό περιβάλλον, χωρίς τηλέφωνα και σημειώσεις.' },
      { title: 'Ανάδειξε την επαγγελματική σου ταυτότητα', desc: 'Παρουσίασε την εμπειρία, την εξειδίκευση και τις υπηρεσίες σου μέσα από το προσωπικό σου προφίλ.' },
    ],

    // 03 Η ΠΛΑΤΦΟΡΜΑ ΣΤΗΝ ΠΡΑΞΗ
    productTitle: 'Όλα όσα χρειάζεσαι,',
    productTitleEm: 'σε ένα σημείο.',
    productDesc: 'Ο πίνακας του φυσικοθεραπευτή είναι το σημείο όπου δουλεύεις καθημερινά: εκεί φτάνουν τα αιτήματα, εκεί ορίζεις πότε είσαι διαθέσιμος, εκεί βλέπεις τα έσοδά σου.',
    productPoints: [
      { title: 'Διαχείριση ραντεβού', desc: 'Βλέπεις κάθε αίτημα με το περιστατικό, την περιοχή και την ώρα, και αποφασίζεις αν θα το αναλάβεις.' },
      { title: 'Επαγγελματικό προφίλ', desc: 'Άδεια, ειδικότητα, περιστατικά, περιοχές και τιμή συνεδρίας, όπως τα βλέπουν οι ασθενείς.' },
      { title: 'Διαθεσιμότητα', desc: 'Ορίζεις τις ώρες σου και κλείνεις τις μέρες που λείπεις· τα αιτήματα έρχονται μόνο για ώρες που σε βολεύουν.' },
    ],
    mockCaption: 'Ενδεικτική απεικόνιση του πίνακα φυσικοθεραπευτή, με παραδείγματα.',
    mock: {
      tabs: ['Επισκόπηση', 'Αιτήματα', 'Ραντεβού', 'Διαθεσιμότητα', 'Προφίλ'],
      newRequest: 'Νέο αίτημα',
      reqCase: 'Οσφυαλγία',
      reqArea: 'Νέα Σμύρνη',
      reqWhen: 'Τρίτη · 18:00',
      accept: 'Αποδοχή',
      decline: 'Απόρριψη',
      expected: 'Αναμενόμενα',
      collected: 'Εισπραγμένα',
      expectedSub: '4 επιβεβαιωμένες συνεδρίες',
      collectedSub: '8 ολοκληρωμένες συνεδρίες',
      availability: 'Διαθεσιμότητα εβδομάδας',
      days: ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα'],
    },

    // 04 ΠΩΣ ΛΕΙΤΟΥΡΓΕΙ
    howTitle: 'Πώς λειτουργεί',
    howDesc: 'Από την εγγραφή μέχρι το πρώτο ραντεβού, σε τρία βήματα.',
    steps: [
      { title: 'Εγγραφή', desc: 'Δημιουργείς λογαριασμό και επιλέγεις πακέτο συνεργασίας. Η εγγραφή είναι δωρεάν.' },
      { title: 'Προφίλ', desc: 'Ανεβάζεις την άδεια ασκήσεως επαγγέλματος και συμπληρώνεις ειδικότητα, περιστατικά, περιοχές και τιμή. Ελέγχουμε την άδεια συνήθως εντός 48 ωρών.' },
      { title: 'Ραντεβού', desc: 'Μόλις εγκριθεί το προφίλ σου, εμφανίζεσαι στους ασθενείς και λαμβάνεις αιτήματα. Αποδέχεσαι όσα σε ενδιαφέρουν.' },
    ],

    // 05 ΠΑΚΕΤΑ
    plansTitle: 'Επίλεξε το πακέτο',
    plansTitleEm: 'που σου ταιριάζει',
    plansDesc: 'Όλα τα πακέτα, με τις πραγματικές τιμές και παροχές. Χωρίς αστερίσκους.',
    perMonth: '/μήνα',
    free: 'Χωρίς μηνιαία χρέωση',
    feeLine: (fee) => `${fee}€ ανά νέο ασθενή`,
    recommended: 'Προτεινόμενο',
    plansLoading: 'Φόρτωση πακέτων...',
    plansEmpty: 'Τα πακέτα θα είναι σύντομα διαθέσιμα. Μπορείς να γραφτείς ήδη και θα τα δεις στην εγγραφή.',
    termsTitle: 'Οι όροι, σε κάθε πακέτο',
    terms: [
      'Η αμοιβή της συνεδρίας είναι ολόκληρη δική σου. Ο ασθενής σε πληρώνει απευθείας, σε μετρητά, και την τιμή την ορίζεις εσύ, από 25€ έως 50€.',
      'Το πακέτο πληρώνεται με κάρτα μόλις εγκριθεί το προφίλ σου. Μέχρι τότε δεν χρεώνεσαι τίποτα.',
      'Το τέλος νέου ασθενή πληρώνεται με κάρτα τη στιγμή που αποδέχεσαι το αίτημα, μία φορά για κάθε νέο ασθενή. Οι επόμενες συνεδρίες μαζί του δεν χρεώνονται.',
      'Αν η αποδοχή δεν ολοκληρωθεί, για παράδειγμα επειδή ο ασθενής ακύρωσε στο μεταξύ, το ποσό επιστρέφεται αυτόματα.',
      'Οι όροι του πακέτου σου κλειδώνουν όταν το επιλέγεις. Μπορείς να αλλάξεις πακέτο όποτε θέλεις από τον πίνακά σου.',
    ],

    // 06 ΑΞΙΟΠΙΣΤΙΑ
    trustTitle: 'Μια πλατφόρμα σχεδιασμένη',
    trustTitleEm: 'για επαγγελματίες υγείας',
    trustDesc: 'Η ασφάλεια των πληροφοριών, η διαφάνεια στη συνεργασία και η επαγγελματική παρουσία είναι βασικές προτεραιότητες. Αυτό σημαίνει στην πράξη:',
    trust: [
      { title: 'Έλεγχος κάθε επαγγελματία', desc: 'Κανένα προφίλ δεν εμφανίζεται στους ασθενείς πριν ελέγξουμε την άδεια ασκήσεως επαγγέλματος. Τα εγκεκριμένα προφίλ φέρουν το σήμα «Επαληθευμένη επαγγελματική άδεια».' },
      { title: 'Προστασία δεδομένων', desc: 'Τα στοιχεία επικοινωνίας των ασθενών προστατεύονται σε επίπεδο βάσης δεδομένων και δεν εμφανίζονται δημόσια. Η επεξεργασία γίνεται σύμφωνα με τον GDPR.' },
      { title: 'Αξιολογήσεις μόνο από πραγματικές συνεδρίες', desc: 'Αξιολόγηση μπορεί να αφήσει μόνο ασθενής που ολοκλήρωσε συνεδρία μαζί σου. Δεν υπάρχουν ανώνυμες ή αγορασμένες κριτικές.' },
      { title: 'Ασφαλείς πληρωμές', desc: 'Οι πληρωμές με κάρτα γίνονται μέσω Stripe. Η πλατφόρμα δεν βλέπει ούτε αποθηκεύει τα στοιχεία της κάρτας σου.' },
    ],

    // 07 FAQ
    faqTitle: 'Συχνές ερωτήσεις',
    faqs: [
      { q: 'Πόσο κοστίζει να συμμετέχω;', a: 'Η εγγραφή είναι δωρεάν. Επιλέγεις το πακέτο που σου ταιριάζει, με τις τιμές που βλέπεις παραπάνω, και πληρώνεις ένα τέλος για κάθε νέο ασθενή. Το ποσό του τέλους εξαρτάται από το πακέτο.' },
      { q: 'Πότε και πώς πληρώνω;', a: 'Με κάρτα. Το πακέτο πληρώνεται μόλις εγκριθεί το προφίλ σου. Το τέλος νέου ασθενή πληρώνεται τη στιγμή που αποδέχεσαι το αίτημα, και η αποδοχή ολοκληρώνεται αμέσως μετά. Μπορείς να αποθηκεύσεις την κάρτα σου για τις επόμενες φορές.' },
      { q: 'Ποιος με πληρώνει για τη συνεδρία;', a: 'Ο ασθενής, απευθείας σε σένα, σε μετρητά, στο τέλος κάθε συνεδρίας. Η πλατφόρμα δεν κρατά τίποτα από το ποσό της συνεδρίας.' },
      { q: 'Μπορώ να απορρίψω ένα αίτημα;', a: 'Ναι. Βλέπεις το περιστατικό, την περιοχή και την ώρα πριν αποφασίσεις. Αν δεν σε βολεύει, το απορρίπτεις χωρίς συνέπειες και χωρίς χρέωση.' },
      { q: 'Τι γίνεται αν χρειαστεί να ακυρώσω ένα ραντεβού;', a: 'Μπορείς να ακυρώσεις από τον πίνακά σου. Ακύρωση λιγότερο από 24 ώρες πριν το ραντεβού καταγράφεται, γιατί ο ασθενής έχει ήδη οργανωθεί· τρεις τέτοιες καταγραφές μέσα σε έξι μήνες οδηγούν σε προσωρινή παύση του προφίλ.' },
      { q: 'Τι γίνεται όταν έχω διακοπές;', a: 'Δηλώνεις τις μέρες που λείπεις στον πίνακά σου και οι ώρες εκείνων των ημερών κλείνουν αυτόματα. Δεν λαμβάνεις αιτήματα για τότε.' },
      { q: 'Δεσμεύομαι για κάποιο διάστημα;', a: 'Όχι. Δεν υπάρχει ελάχιστη διάρκεια ούτε ελάχιστος αριθμός συνεδριών. Μπορείς να σταματήσεις να δέχεσαι αιτήματα όποτε θέλεις.' },
      { q: 'Πού απευθύνομαι αν χρειαστώ βοήθεια;', a: 'Γράψε μας στο info@theralivo.com. Απαντάμε σε κάθε μήνυμα, συνήθως την ίδια μέρα.' },
    ],

    // 08 ΤΕΛΙΚΟ CTA
    finalTitle: 'Δημιούργησε το επαγγελματικό σου προφίλ',
    finalDesc: 'Η εγγραφή είναι δωρεάν και δεν χρεώνεσαι τίποτα πριν εγκριθεί το προφίλ σου.',
    finalHave: 'Έχεις ήδη λογαριασμό;',
    finalLogin: 'Σύνδεση',
  },

  en: {
    eyebrow: 'Theralivo for physiotherapists',
    heroTitle: 'Your professional presence,',
    heroTitleEm: 'on one modern platform.',
    heroDesc: 'Connect with patients looking for physiotherapy at home, manage your appointment requests and grow your practice.',
    cta: 'Become a partner',
    heroNote: 'For licensed professional physiotherapists',
    heroSecondary: 'See the plans',

    whyTitle: 'Why partner with us',
    benefits: [
      { title: 'Reach new patients', desc: 'Be present on a platform dedicated to home physiotherapy, in the areas and for the cases you choose.' },
      { title: 'Organise your appointments', desc: 'Manage requests, appointments and availability from one place, without phone calls and notes.' },
      { title: 'Show your professional identity', desc: 'Present your experience, specialisation and services through your own profile.' },
    ],

    productTitle: 'Everything you need,',
    productTitleEm: 'in one place.',
    productDesc: 'The physiotherapist dashboard is where you work every day: requests arrive there, you set when you are available, and you see your earnings.',
    productPoints: [
      { title: 'Appointment management', desc: 'See every request with the case, area and time, and decide whether to take it.' },
      { title: 'Professional profile', desc: 'Licence, specialty, cases, areas and session price, as patients see them.' },
      { title: 'Availability', desc: 'Set your hours and block the days you are away; requests only come for times that suit you.' },
    ],
    mockCaption: 'Illustration of the physiotherapist dashboard, with example data.',
    mock: {
      tabs: ['Overview', 'Requests', 'Appointments', 'Availability', 'Profile'],
      newRequest: 'New request',
      reqCase: 'Low back pain',
      reqArea: 'Nea Smyrni',
      reqWhen: 'Tuesday · 18:00',
      accept: 'Accept',
      decline: 'Decline',
      expected: 'Expected',
      collected: 'Collected',
      expectedSub: '4 confirmed sessions',
      collectedSub: '8 completed sessions',
      availability: 'This week',
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
    },

    howTitle: 'How it works',
    howDesc: 'From sign-up to your first appointment, in three steps.',
    steps: [
      { title: 'Sign up', desc: 'Create an account and choose a partnership plan. Registration is free.' },
      { title: 'Profile', desc: 'Upload your professional licence and add your specialty, cases, areas and price. We usually verify your licence within 48 hours.' },
      { title: 'Appointments', desc: 'Once your profile is approved, patients can find you and you receive requests. Accept the ones you want.' },
    ],

    plansTitle: 'Choose the plan',
    plansTitleEm: 'that suits you',
    plansDesc: 'Every plan, with its real prices and features. No asterisks.',
    perMonth: '/month',
    free: 'No monthly charge',
    feeLine: (fee) => `€${fee} per new patient`,
    recommended: 'Recommended',
    plansLoading: 'Loading plans...',
    plansEmpty: 'Plans will be available shortly. You can already sign up and you will see them during registration.',
    termsTitle: 'The terms, on every plan',
    terms: [
      'The session fee is entirely yours. The patient pays you directly, in cash, and you set the price yourself, between €25 and €50.',
      'The plan is paid by card once your profile is approved. Nothing is charged before then.',
      'The new patient fee is paid by card when you accept the request, once for each new patient. Follow-up sessions with them are free.',
      'If the acceptance cannot be completed, for example because the patient cancelled in the meantime, the amount is refunded automatically.',
      'Your plan terms are locked when you choose it. You can change plan any time from your dashboard.',
    ],

    trustTitle: 'A platform designed',
    trustTitleEm: 'for health professionals',
    trustDesc: 'Information security, transparent partnership and professional presence are core priorities. In practice, this means:',
    trust: [
      { title: 'Every professional is checked', desc: 'No profile is shown to patients before we verify the professional licence. Approved profiles carry the “Verified professional licence” badge.' },
      { title: 'Data protection', desc: 'Patient contact details are protected at database level and never shown publicly. Data is processed in line with GDPR.' },
      { title: 'Reviews only from real sessions', desc: 'Only a patient who completed a session with you can leave a review. There are no anonymous or bought reviews.' },
      { title: 'Secure payments', desc: 'Card payments are handled by Stripe. The platform never sees or stores your card details.' },
    ],

    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What does it cost to join?', a: 'Registration is free. You choose the plan that suits you, at the prices shown above, and pay a fee for each new patient. The fee amount depends on the plan.' },
      { q: 'When and how do I pay?', a: 'By card. The plan is paid once your profile is approved. The new patient fee is paid when you accept the request, and the acceptance completes right after. You can save your card for next time.' },
      { q: 'Who pays me for the session?', a: 'The patient does, directly, in cash, at the end of each session. The platform takes nothing from the session amount.' },
      { q: 'Can I decline a request?', a: 'Yes. You see the case, the area and the time before you decide. If it does not suit you, decline it with no penalty and no charge.' },
      { q: 'What if I need to cancel an appointment?', a: 'You can cancel from your dashboard. A cancellation less than 24 hours before the appointment is recorded, because the patient has already planned around it; three such records within six months lead to a temporary pause of the profile.' },
      { q: 'What happens when I go on holiday?', a: 'Mark the days you are away in your dashboard and those hours close automatically. You receive no requests for them.' },
      { q: 'Am I locked into a contract?', a: 'No. There is no minimum term and no minimum number of sessions. You can stop accepting requests whenever you like.' },
      { q: 'Where can I get help?', a: 'Write to us at info@theralivo.com. We answer every message, usually the same day.' },
    ],

    finalTitle: 'Create your professional profile',
    finalDesc: 'Registration is free and nothing is charged before your profile is approved.',
    finalHave: 'Already have an account?',
    finalLogin: 'Log in',
  },
};

// ── Μικρά κοινά κομμάτια ────────────────────────────────────────────
function Section({ id, bg = '#fff', children, narrow }) {
  return (
    <section id={id} style={{ background: bg, padding: '80px 24px', scrollMarginTop: 80 }}>
      <div style={{ maxWidth: narrow ? 880 : 1080, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function H2({ children, em, center }) {
  return (
    <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', color: C.navy, lineHeight: 1.2, marginBottom: 14, textAlign: center ? 'center' : 'left' }}>
      {children}{em && <> <em style={{ color: C.accent }}>{em}</em></>}
    </h2>
  );
}

function Lead({ children, center, max = 620 }) {
  return (
    <p style={{ fontSize: 16.5, color: C.muted, lineHeight: 1.7, maxWidth: max, margin: center ? '0 auto' : 0, textAlign: center ? 'center' : 'left' }}>
      {children}
    </p>
  );
}

function CtaButton({ href, children, light }) {
  return (
    <a href={href} className="bt-cta" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: light ? '#fff' : C.navy, color: light ? C.navy : '#fff',
      padding: '15px 34px', borderRadius: 30, fontSize: 15.5, fontWeight: 700, textDecoration: 'none',
    }}>
      {children}
      <ArrowRight size={17} />
    </a>
  );
}

// ── Απεικόνιση του πίνακα ───────────────────────────────────────────
// HTML και όχι εικόνα: φαίνεται καθαρά σε κάθε οθόνη, ακολουθεί τη
// γλώσσα, και δεν παλιώνει όταν αλλάζει ο σχεδιασμός. Σημειώνεται
// καθαρά ως ενδεικτική — τα νούμερα είναι παραδείγματα.
function DashboardMock({ m }) {
  const slots = [[1, 1, 0, 1, 0], [1, 0, 1, 1, 1], [0, 1, 1, 0, 1]];
  return (
    <div aria-hidden="true" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px -30px rgba(26,46,68,0.35)' }}>
      {/* γραμμή παραθύρου */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderBottom: `1px solid ${C.line}`, background: C.off }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#dbe2ea' }} />)}
      </div>

      <div style={{ padding: 18 }}>
        {/* καρτέλες */}
        <div className="mock-tabs" style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 10, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {m.tabs.map((t, i) => (
            <span key={t} style={{ padding: '6px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: i === 1 ? '#fff' : 'transparent', color: i === 1 ? C.navy : C.muted, boxShadow: i === 1 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>{t}</span>
          ))}
        </div>

        <div className="mock-grid">
          {/* αίτημα */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8 }}>{m.newRequest}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{m.reqCase}</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 2 }}>{m.reqArea}</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>{m.reqWhen}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, background: C.navy, color: '#fff', fontSize: 12.5, fontWeight: 700 }}>{m.accept}</span>
              <span style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, border: `1px solid ${C.border}`, color: C.muted, fontSize: 12.5, fontWeight: 600 }}>{m.decline}</span>
            </div>
          </div>

          {/* έσοδα */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              [m.expected, '160€', m.expectedSub, C.accent],
              [m.collected, '320€', m.collectedSub, C.green],
            ].map(([label, value, sub, tone]) => (
              <div key={label} style={{ border: `1px solid ${C.border}`, borderTop: `3px solid ${tone}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: tone, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* διαθεσιμότητα */}
        <div style={{ marginTop: 14, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>{m.availability}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {m.days.map((d, di) => (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textAlign: 'center' }}>{d}</span>
                {slots.map((row, ri) => (
                  <span key={ri} style={{ height: 14, borderRadius: 4, background: row[di] ? C.soft : '#f4f6f8', border: `1px solid ${row[di] ? '#c9dcf6' : '#eef1f4'}` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Ο server (page.js) στέλνει έτοιμα τα πακέτα από το admin, ώστε να
// φαίνονται αμέσως — και στο Google — χωρίς «Φόρτωση πακέτων...».
export default function BecomeTherapistClient({ initialPlans = null }) {
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;

  const [plans, setPlans] = useState(initialPlans || []);
  const [loadingPlans, setLoadingPlans] = useState(!initialPlans);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('id, name_el, name_en, description_el, description_en, price_monthly, first_session_fee, features_el, features_en, is_recommended, badge_label, display_order')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('display_order', { ascending: true });
      setPlans(data || []);
      setLoadingPlans(false);
    })();
  }, []);

  // Στα ελληνικά τα δεκαδικά με κόμμα: 9,99€, όχι 9.99€.
  const money = (v) => {
    const n = Number(v || 0);
    const s = n % 1 === 0 ? String(n) : n.toFixed(2);
    return lang === 'en' ? s : s.replace('.', ',');
  };
  const pick = (p, key) => (lang === 'en' ? (p[`${key}_en`] || p[`${key}_el`]) : p[`${key}_el`]);
  const features = (p) => {
    const f = pick(p, 'features');
    return Array.isArray(f) ? f.filter(x => typeof x === 'string' && x.trim()) : [];
  };

  const registerHref = '/auth/register?role=therapist';
  const productIcons = [ClipboardList, UserRound, CalendarDays];
  const trustIcons = [ShieldCheck, Lock, Star, CreditCard];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .bt-cta { transition: transform .15s ease, box-shadow .15s ease; }
        .bt-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -12px rgba(26,46,68,0.45); }
        .bt-cta:focus-visible, .bt-link:focus-visible { outline: 3px solid ${C.accent}; outline-offset: 3px; }
        .bt-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
        .bt-product { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 56px; align-items: center; }
        .bt-product > * { min-width: 0; }
        .mock-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 12px; }
        .bt-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid ${C.border}; }
        .bt-step { padding: 28px 28px 0 0; }
        .bt-step + .bt-step { padding-left: 28px; border-left: 1px solid ${C.border}; }
        .bt-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
        .bt-trust { display: grid; grid-template-columns: 1fr 1fr; gap: 36px 48px; }
        .bt-faq { display: grid; grid-template-columns: 1fr 1fr; gap: 36px 56px; }
        @media (max-width: 900px) {
          .bt-3 { grid-template-columns: 1fr; gap: 28px; }
          .bt-product { grid-template-columns: minmax(0, 1fr); gap: 36px; }
          .bt-steps { grid-template-columns: 1fr; border-top: none; }
          .bt-step, .bt-step + .bt-step { padding: 22px 0; border-left: none; border-top: 1px solid ${C.border}; }
          .bt-trust, .bt-faq { grid-template-columns: 1fr; gap: 28px; }
        }
        @media (max-width: 520px) { .mock-grid { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: reduce) { .bt-cta { transition: none; } .bt-cta:hover { transform: none; } }
      `}</style>

      <Navbar />

      {/* ══ 01 HERO ══ λιτό, κεντραρισμένο, χωρίς φωτογραφία */}
      <section style={{ background: C.off, padding: '96px 24px 88px', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: '.06em', marginBottom: 20 }}>
            {tx.eyebrow}
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', color: C.navy, lineHeight: 1.12, marginBottom: 22 }}>
            {tx.heroTitle} <em style={{ color: C.accent }}>{tx.heroTitleEm}</em>
          </h1>
          <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, maxWidth: 620, margin: '0 auto 36px' }}>
            {tx.heroDesc}
          </p>
          <div style={{ display: 'flex', gap: 22, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <CtaButton href={registerHref}>{tx.cta}</CtaButton>
            <a href="#plans" className="bt-link" style={{ fontSize: 15, fontWeight: 600, color: C.navy, textDecoration: 'underline', textUnderlineOffset: 4 }}>
              {tx.heroSecondary}
            </a>
          </div>
          <div style={{ marginTop: 22, fontSize: 13.5, color: C.faint }}>{tx.heroNote}</div>
        </div>
      </section>

      {/* ══ 02 ΟΦΕΛΗ ══ τρία, όχι έξι */}
      <Section>
        <H2>{tx.whyTitle}</H2>
        <div className="bt-3" style={{ marginTop: 36 }}>
          {tx.benefits.map(b => (
            <div key={b.title} style={{ borderTop: `2px solid ${C.navy}`, paddingTop: 20 }}>
              <h3 style={{ fontSize: 18, color: C.navy, lineHeight: 1.35, marginBottom: 10 }}>{b.title}</h3>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ 03 Η ΠΛΑΤΦΟΡΜΑ ΣΤΗΝ ΠΡΑΞΗ ══ */}
      <Section bg={C.off}>
        <div className="bt-product">
          <div>
            <H2 em={tx.productTitleEm}>{tx.productTitle}</H2>
            <Lead>{tx.productDesc}</Lead>
            <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 22 }}>
              {tx.productPoints.map((pt, i) => {
                const Icon = productIcons[i];
                return (
                  <div key={pt.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} color={C.accent} strokeWidth={2} />
                    </span>
                    <div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{pt.title}</div>
                      <div style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65 }}>{pt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <figure>
            <DashboardMock m={tx.mock} />
            <figcaption style={{ fontSize: 12.5, color: C.faint, marginTop: 12, textAlign: 'center' }}>{tx.mockCaption}</figcaption>
          </figure>
        </div>
      </Section>

      {/* ══ 04 ΠΩΣ ΛΕΙΤΟΥΡΓΕΙ ══ πραγματική σειρά → αριθμημένα βήματα */}
      <Section>
        <H2>{tx.howTitle}</H2>
        <Lead>{tx.howDesc}</Lead>
        <ol className="bt-steps" style={{ listStyle: 'none', marginTop: 36 }}>
          {tx.steps.map((s, i) => (
            <li key={s.title} className="bt-step">
              <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 10 }}>{i + 1}</div>
              <h3 style={{ fontSize: 19, color: C.navy, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7 }}>{s.desc}</p>
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 40 }}>
          <CtaButton href={registerHref}>{tx.cta}</CtaButton>
        </div>
      </Section>

      {/* ══ 05 ΠΑΚΕΤΑ ══ από τη βάση, με τιμές, παροχές και όρους */}
      <Section id="plans" bg={C.off}>
        <H2 em={tx.plansTitleEm} center>{tx.plansTitle}</H2>
        <Lead center>{tx.plansDesc}</Lead>

        <div style={{ marginTop: 40 }}>
          {loadingPlans ? (
            <div style={{ textAlign: 'center', color: C.faint, fontSize: 14 }}>{tx.plansLoading}</div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, fontSize: 15 }}>{tx.plansEmpty}</div>
          ) : (
            <div className="bt-plans">
              {plans.map(p => {
                const monthly = Number(p.price_monthly || 0);
                const desc = pick(p, 'description');
                const feats = features(p);
                return (
                  <div key={p.id} style={{
                    position: 'relative', background: '#fff', borderRadius: 16, padding: '28px 26px',
                    border: p.is_recommended ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {p.is_recommended && (
                      <span style={{ position: 'absolute', top: -12, left: 24, background: C.navy, color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                        {p.badge_label || tx.recommended}
                      </span>
                    )}
                    <h3 style={{ fontSize: 20, color: C.navy, marginBottom: 6 }}>{pick(p, 'name')}</h3>
                    {desc && <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>{desc}</p>}

                    <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, lineHeight: 1.1, marginTop: desc ? 0 : 10 }}>
                      {monthly === 0
                        ? <span style={{ fontSize: 22, color: C.green }}>{tx.free}</span>
                        : <>{money(monthly)}€<span style={{ fontSize: 15, fontWeight: 500, color: C.muted }}>{tx.perMonth}</span></>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.accent, marginTop: 8 }}>
                      {tx.feeLine(money(p.first_session_fee))}
                    </div>

                    {feats.length > 0 && (
                      <ul style={{ listStyle: 'none', marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {feats.map((f, i) => (
                          <li key={i} style={{ display: 'flex', gap: 9, fontSize: 14, color: C.body, lineHeight: 1.5 }}>
                            <Check size={15} color={C.green} strokeWidth={2.6} style={{ flexShrink: 0, marginTop: 3 }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Οι όροι — ίδιοι για όλα τα πακέτα */}
        <div style={{ marginTop: 32, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '26px 28px' }}>
          <h3 style={{ fontSize: 16.5, color: C.navy, marginBottom: 16 }}>{tx.termsTitle}</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tx.terms.map((t, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14.5, color: C.body, lineHeight: 1.65 }}>
                <Check size={16} color={C.accent} strokeWidth={2.6} style={{ flexShrink: 0, marginTop: 3 }} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <CtaButton href={registerHref}>{tx.cta}</CtaButton>
        </div>
      </Section>

      {/* ══ 06 ΑΞΙΟΠΙΣΤΙΑ ══ μόνο ό,τι ισχύει σήμερα */}
      <Section>
        <H2 em={tx.trustTitleEm}>{tx.trustTitle}</H2>
        <Lead max={680}>{tx.trustDesc}</Lead>
        <div className="bt-trust" style={{ marginTop: 40 }}>
          {tx.trust.map((t, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={t.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={C.accent} strokeWidth={2} />
                </span>
                <div>
                  <h3 style={{ fontSize: 16.5, color: C.navy, marginBottom: 6 }}>{t.title}</h3>
                  <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.7 }}>{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ══ 07 ΣΥΧΝΕΣ ΕΡΩΤΗΣΕΙΣ ══ */}
      <Section bg={C.off}>
        <H2>{tx.faqTitle}</H2>
        <div className="bt-faq" style={{ marginTop: 36 }}>
          {tx.faqs.map(f => (
            <div key={f.q}>
              <h3 style={{ fontSize: 16, color: C.navy, marginBottom: 8, lineHeight: 1.4 }}>{f.q}</h3>
              <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ 08 ΤΕΛΙΚΟ CTA ══ */}
      <section style={{ background: C.navy, padding: '88px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
            {tx.finalTitle}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, marginBottom: 34 }}>
            {tx.finalDesc}
          </p>
          <CtaButton href={registerHref} light>{tx.cta}</CtaButton>
          <div style={{ marginTop: 22, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            {tx.finalHave}{' '}
            <a href="/auth/login" className="bt-link" style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {tx.finalLogin}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
