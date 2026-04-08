'use client';
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';

const t = {
  el: {
    // Hero
    badge: 'Πώς Λειτουργεί',
    heroTitle: 'Επαγγελματική Φυσιοθεραπεία,',
    heroTitleEm: 'Απλά και Γρήγορα',
    heroDesc: 'Σχεδιάσαμε κάθε βήμα της διαδικασίας με γνώμονα την άνεση και την ανάρρωσή σας — από την κράτηση μέχρι τη θεραπεία, στο σπίτι σας.',
    heroBtn: 'Κλείστε Ραντεβού',
    heroBadges: ['Ευέλικτο Πρόγραμμα', 'Εύκολη Κράτηση', 'Αδειοδοτημένοι Επαγγελματίες', 'Εξατομικευμένη Φροντίδα'],

    // Steps
    stepsTitle: 'Απλά Βήματα για να',
    stepsTitleEm: 'Ξεκινήσετε',
    stepsDesc: 'Μια απλή, καθοδηγούμενη διαδικασία σχεδιασμένη να σας συνδέσει με τη σωστή φροντίδα — χωρίς άγχος ή πολυπλοκότητα.',
    stepsBtn: 'Κλείστε Ραντεβού',
    steps: [
      { num: 'Step 1', title: 'Υποβάλετε αίτημα', desc: 'Συμπληρώστε μια σύντομη φόρμα με τα στοιχεία και την κατάστασή σας. Αυτό μας βοηθά να κατανοήσουμε τις ανάγκες σας.' },
      { num: 'Step 2', title: 'Αντιστοιχιστείτε με φυσιοθεραπευτή', desc: 'Η ομάδα μας ελέγχει το αίτημά σας και σας αντιστοιχίζει με έναν κατάλληλο φυσιοθεραπευτή.' },
      { num: 'Step 3', title: 'Λαμβάνετε φροντίδα στο σπίτι', desc: 'Ο φυσιοθεραπευτής σας επιβεβαιώνει τη συνεδρία και έρχεται στο σπίτι σας για εξατομικευμένη θεραπεία.' },
    ],

    // Why Patients Choose Us
    whyTitle: 'Γιατί οι Ασθενείς',
    whyTitleEm: 'μας Επιλέγουν',
    whyDesc: 'Εστιάζουμε σε ό,τι πραγματικά έχει σημασία: σταθερή ανάρρωση, εξατομικευμένη προσοχή και μια άνετη, συνεπής εμπειρία από την πρώτη συνεδρία.',
    whyPoints: [
      { icon: '🎓', title: 'Πιστοποιημένοι επαγγελματίες φυσιοθεραπείας', desc: 'Έμπειροι ειδικοί που παρέχουν αξιόπιστη φροντίδα στην άνεση του σπιτιού σας.' },
      { icon: '❤️', title: 'Εξατομικευμένη φροντίδα για κάθε ασθενή', desc: 'Τα πλάνα θεραπείας και οι συνεδρίες προσαρμόζονται στην κατάσταση και τους στόχους κάθε ασθενή.' },
      { icon: '🛡️', title: 'Αξιόπιστη και εστιασμένη στον ασθενή υπηρεσία', desc: 'Μια επαγγελματική προσέγγιση που κάνει τη θεραπεία άνετη, αποτελεσματική και χωρίς άγχος.' },
    ],

    // Why Home
    homeTitle: 'Γιατί η Θεραπεία στο Σπίτι',
    homeTitleEm: 'Είναι πιο Πρακτική',
    homeDesc: 'Η υπηρεσία μας είναι σχεδιασμένη ώστε η φυσιοθεραπεία στο σπίτι να αισθάνεται απλή, υποστηρικτική και επαγγελματική.',
    homePoints: [
      { title: 'Το δικό σας περιβάλλον', desc: 'Ασκήσεις και συμβουλές προσαρμοσμένες στον χώρο διαβίωσής σας.' },
      { title: 'Καθημερινό πλαίσιο κίνησης', desc: 'Η θεραπεία αντικατοπτρίζει τον τρόπο που κινείστε στην καθημερινή ζωή.' },
      { title: 'Καλύτερη συνέχεια', desc: 'Οι συνεδρίες γίνονται εκεί που η ανάρρωση έχει τη μεγαλύτερη σημασία.' },
      { title: 'Λιγότερη διαταραχή', desc: 'Μπορείτε να εστιάσετε στη θεραπεία χωρίς ταλαιπωρία μετακίνησης.' },
    ],

    // Comparison
    compTitle: 'Κλινική ή',
    compTitleEm: 'Φροντίδα στο Σπίτι;',
    compDesc: 'Και οι δύο επιλογές μπορούν να υποστηρίξουν την ανάρρωση, αλλά η φυσιοθεραπεία στο σπίτι προσφέρει επιπλέον άνεση και εξατομικευμένη προσοχή.',
    compBtn: 'Κλείστε Ραντεβού',
    compHome: 'Φυσιοθεραπεία στο σπίτι',
    compClinic: 'Κλινική',
    compRows: [
      { label: 'Ευκολία', home: 'Φροντίδα στο σπίτι σας', clinic: 'Απαιτείται μετακίνηση' },
      { label: 'Ευελιξία', home: 'Ραντεβού που ταιριάζουν στο πρόγραμμά σας', clinic: 'Πιο σταθερές επιλογές' },
      { label: 'Εμπειρία ασθενή', home: 'Εξατομικευμένη υποστήριξη', clinic: 'Τυπική κλινική εμπειρία' },
      { label: 'Περιβάλλον', home: 'Ιδιωτικό και άνετο', clinic: 'Κλινική ατμόσφαιρα' },
      { label: 'Καθοδήγηση', home: 'Βασισμένη στο σπίτι σας', clinic: 'Γενική καθοδήγηση' },
    ],

    // CTA
    ctaTitle: 'Ξεκινήστε με μια Δωρεάν Αξιολόγηση',
    ctaDesc: 'Δεν είστε σίγουροι ποια υπηρεσία σας ταιριάζει; Θα αξιολογήσουμε τις ανάγκες σας και θα δημιουργήσουμε ένα εξατομικευμένο πλάνο θεραπείας.',
    ctaBtn: 'Δωρεάν Αξιολόγηση',

    // Blog
    blogTitle: 'Συμβουλές & Πόροι',
    blogTitleEm: 'Φυσιοθεραπείας',
    blogDesc: 'Εξερευνήστε εξειδικευμένες συμβουλές, tips ανάρρωσης και πρακτική καθοδήγηση.',
    blogBtn: 'Όλα τα Άρθρα',
    readMore: 'Διαβάστε περισσότερα',
    blogs: [
      { cat: 'Recovery Tips', time: '5 λεπτά', title: 'Πώς να υποστηρίξετε την ανάρρωση μετά από τραυματισμό στο σπίτι', desc: 'Απλές συνήθειες και πρακτικά βήματα που κάνουν τη διαδικασία ανάρρωσής σας πιο ομαλή.' },
      { cat: 'Recovery Tips', time: '5 λεπτά', title: 'Πότε ο επίμονος πόνος χρειάζεται επαγγελματική υποστήριξη', desc: 'Μάθετε να αναγνωρίζετε πότε ο πόνος επηρεάζει την καθημερινή ζωή και πότε χρειάζεστε βοήθεια.' },
      { cat: 'Recovery Tips', time: '5 λεπτά', title: 'Τι να περιμένετε από την πρώτη σας συνεδρία φυσιοθεραπείας στο σπίτι', desc: 'Μια σύντομη επισκόπηση του πώς λειτουργούν οι επισκέψεις στο σπίτι.' },
    ],

    // FAQ
    faqTitle: 'Συχνές Ερωτήσεις',
    faqTitleEm: '',
    faqDesc: 'Δεν βρίσκετε αυτό που ψάχνετε; Είμαστε εδώ να βοηθήσουμε.',
    faqBtn: 'Επικοινωνήστε μαζί μας',
    faqs: [
      { q: 'Πώς ξεκινάω;', a: 'Απλά υποβάλετε αίτημα μέσω της ιστοσελίδας με τα στοιχεία επικοινωνίας, την κατάσταση και τον προτιμώμενο χρόνο. Η ομάδα μας θα επανέλθει με τα επόμενα βήματα.' },
      { q: 'Τι γίνεται κατά την πρώτη επίσκεψη στο σπίτι;', a: 'Ο φυσιοθεραπευτής σας θα αξιολογήσει την κατάστασή σας, θα συζητήσει τους στόχους σας και θα ξεκινήσει ένα εξατομικευμένο πλάνο θεραπείας.' },
      { q: 'Ποιες παθήσεις αντιμετωπίζετε;', a: 'Αντιμετωπίζουμε ένα ευρύ φάσμα παθήσεων όπως πόνο στη μέση, μετεγχειρητική αποκατάσταση, νευρολογικές παθήσεις, αθλητικούς τραυματισμούς και πολλά άλλα.' },
      { q: 'Πώς κλείνω ραντεβού;', a: 'Μπορείτε να κλείσετε ραντεβού μέσω της φόρμας στη σελίδα μας. Η διαδικασία είναι γρήγορη και απλή.' },
      { q: 'Φέρνετε τον απαραίτητο εξοπλισμό;', a: 'Ναι! Οι φυσιοθεραπευτές μας έρχονται πλήρως εξοπλισμένοι για να παρέχουν αποτελεσματική θεραπεία στο σπίτι σας.' },
    ],
  },
  en: {
    badge: 'How It Works',
    heroTitle: 'Professional Physiotherapy,',
    heroTitleEm: 'Made Simple',
    heroDesc: 'We\'ve designed every step of the process with your comfort and recovery in mind — from booking to treatment, all in your own home.',
    heroBtn: 'Request a Session',
    heroBadges: ['Flexible Scheduling', 'Easy Booking', 'Licensed Professionals', 'Personalized Care'],

    stepsTitle: 'Simple Steps to',
    stepsTitleEm: 'Get Started',
    stepsDesc: 'A simple, guided process designed to connect you with the right care — without stress or complexity.',
    stepsBtn: 'Request a Session',
    steps: [
      { num: 'Step 1', title: 'Submit your request', desc: 'Fill out a short form with your personal details and condition. This helps us understand your needs and prepare for your session in advance.' },
      { num: 'Step 2', title: 'Get matched with a physiotherapist', desc: 'Our team carefully reviews your request and matches you with a qualified physiotherapist who best fits your condition, goals, and availability.' },
      { num: 'Step 3', title: 'Receive care at home', desc: 'Your physiotherapist will confirm the session details and visit you at home, providing personalized, one-to-one treatment in a comfortable environment.' },
    ],

    whyTitle: 'Why Patients',
    whyTitleEm: 'Choose Us',
    whyDesc: 'We focus on what truly matters: steady recovery, personalized attention, and a comfortable, consistent experience that supports you from your very first session.',
    whyPoints: [
      { icon: '🎓', title: 'Certified physiotherapy professionals', desc: 'Experienced specialists delivering trusted care in the comfort of your home.' },
      { icon: '❤️', title: 'Personalized care for every patient', desc: 'Treatment plans and sessions are adapted to each patient\'s condition and recovery goals.' },
      { icon: '🛡️', title: 'Reliable and patient-focused service', desc: 'A professional approach designed to make treatment comfortable, effective, and stress-free.' },
    ],

    homeTitle: 'Why Home-Based Treatment',
    homeTitleEm: 'Feels More Practical',
    homeDesc: 'Our service is designed to make physiotherapy at home feel simple, supportive, and professional from the first request to every session that follows.',
    homePoints: [
      { title: 'Your real environment', desc: 'Exercises and advice can be adapted to your actual living space.' },
      { title: 'Daily movement context', desc: 'Treatment reflects the way you move through everyday life.' },
      { title: 'Better continuity', desc: 'Sessions happen where recovery is most meaningful.' },
      { title: 'Less disruption', desc: 'You can focus on treatment without the hassle of travel.' },
    ],

    compTitle: 'Clinic Visit or',
    compTitleEm: 'Care at Home?',
    compDesc: 'Both options can support recovery, but home physiotherapy offers added comfort, convenience, and one-to-one attention in a familiar environment.',
    compBtn: 'Request a Session',
    compHome: 'At-home physiotherapy',
    compClinic: 'Clinic-based care',
    compRows: [
      { label: 'Convenience', home: 'Care delivered to your home', clinic: 'Travel to a clinic required' },
      { label: 'Flexibility', home: 'Appointments that suit your routine', clinic: 'More fixed scheduling options' },
      { label: 'Patient experience', home: 'Personalized support in a familiar setting', clinic: 'Standard clinic-based experience' },
      { label: 'Environment', home: 'Private and comfortable', clinic: 'More clinical atmosphere' },
      { label: 'Tailored guidance', home: 'Recommendations based on your home setup', clinic: 'Guidance given in a clinic context' },
    ],

    ctaTitle: 'Start With a Free Assessment',
    ctaDesc: 'Not sure which service is right for you? We\'ll evaluate your needs, answer your questions, and create a personalized treatment plan.',
    ctaBtn: 'Book Free Assessment',

    blogTitle: 'Physiotherapy',
    blogTitleEm: 'Tips and Resources',
    blogDesc: 'Explore expert advice, recovery tips, and practical guidance to help you manage pain, improve mobility, and support your recovery at home.',
    blogBtn: 'View All Articles',
    readMore: 'Read More',
    blogs: [
      { cat: 'Recovery Tips', time: '5 min read', title: 'How to support recovery after an injury at home', desc: 'Simple habits and practical steps that can help make your recovery process safer, smoother, and more effective.' },
      { cat: 'Recovery Tips', time: '5 min read', title: 'When persistent pain may need professional support', desc: 'Learn how to recognize when pain is affecting daily life and when physiotherapy may help improve comfort and movement.' },
      { cat: 'Recovery Tips', time: '5 min read', title: 'What to expect from your first home physiotherapy session', desc: 'A quick overview of how home visits work, what happens during a session, and how treatment is tailored to your needs.' },
    ],

    faqTitle: 'Frequently Asked',
    faqTitleEm: 'Questions',
    faqDesc: 'Can\'t find what you\'re looking for? We\'re happy to help — reach out anytime.',
    faqBtn: 'Contact Us',
    faqs: [
      { q: 'How do I get started?', a: 'Simply submit a request through the website with your contact details, condition, and preferred timing. Our team will review your information and get in touch with the next steps.' },
      { q: 'What happens during the first home visit?', a: 'Your physiotherapist will assess your condition, discuss your goals, and begin a personalized treatment plan tailored to your needs.' },
      { q: 'Which conditions do you treat?', a: 'We treat a wide range of conditions including back pain, post-surgical rehabilitation, neurological conditions, sports injuries, and more.' },
      { q: 'How do I book an appointment?', a: 'You can book through the form on our website. The process is quick and straightforward.' },
      { q: 'Do you bring the necessary equipment?', a: 'Yes! Our physiotherapists come fully equipped to provide effective treatment in your home.' },
    ],
  },
};

export default function HowItWorksPage() {
  const { lang } = useLang();
  const tx = t[lang];
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .why-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 32px; align-items: center; }
        .home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        @media (max-width: 1024px) {
          .why-grid { grid-template-columns: 1fr; }
          .blog-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .home-grid { grid-template-columns: 1fr; }
          .blog-grid { grid-template-columns: 1fr; }
        }
        .faq-item { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; cursor: pointer; }
        .faq-item + .faq-item { margin-top: 12px; }
        .blog-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; transition: all .3s; text-decoration: none; color: inherit; display: block; }
        .blog-card:hover { box-shadow: 0 8px 32px rgba(26,46,68,0.10); transform: translateY(-4px); }
        .comp-row:hover { background: #f8fafb; }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #e8f3ff 0%, #f0f7ff 100%)', padding: '80px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>{tx.badge}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 52px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {tx.heroTitle} <br /><em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.heroTitleEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#6b7a8d', maxWidth: 580, margin: '0 auto 32px' }}>{tx.heroDesc}</p>
          <a href="/request" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '14px 36px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{tx.heroBtn}</a>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
            {tx.heroBadges.map(b => (
              <div key={b} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 30, padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#1a2e44', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {tx.stepsTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.stepsTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{tx.stepsDesc}</p>
            <a href="/request" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{tx.stepsBtn}</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {tx.steps.map((step, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2a6fdb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{step.num}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{step.desc}</div>
                {i < tx.steps.length - 1 && <div style={{ height: 1, background: '#e2e8f0', marginTop: 20 }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY PATIENTS CHOOSE US ── */}
      <section style={{ background: '#f8fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2 }}>
              {tx.whyTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.whyTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, paddingTop: 8 }}>{tx.whyDesc}</p>
          </div>
          {/* Grid: left point, center image, right point + bottom point */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28, alignItems: 'start' }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{tx.whyPoints[0].title}</div>
                <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{tx.whyPoints[0].desc}</div>
              </div>
            </div>
            {/* Center image */}
            <div style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>
              📷 Photo
            </div>
            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{tx.whyPoints[1].title}</div>
                <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{tx.whyPoints[1].desc}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>{tx.whyPoints[2].title}</div>
                <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{tx.whyPoints[2].desc}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY HOME BASED ── */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {tx.homeTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.homeTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 32 }}>{tx.homeDesc}</p>
            <div className="home-grid">
              {tx.homePoints.map((p, i) => (
                <div key={i} style={{ background: '#f8fafb', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e44', marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 14 }}>
            📷 Photo
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ background: '#f8fafb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {tx.compTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.compTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', maxWidth: 600, margin: '0 auto' }}>{tx.compDesc}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f0f7ff' }}>
              <div style={{ padding: '16px 24px' }} />
              <div style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#1a2e44', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#e8f1fd' }}>{tx.compHome}</div>
              <div style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#6b7a8d' }}>{tx.compClinic}</div>
            </div>
            {/* Rows */}
            {tx.compRows.map((row, i) => (
              <div key={i} className="comp-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #e2e8f0', transition: 'background .2s' }}>
                <div style={{ padding: '16px 24px', fontWeight: 600, fontSize: 14, color: '#1a2e44' }}>{row.label}</div>
                <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 14, color: '#2a6fdb', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: 'rgba(232,241,253,0.3)' }}>{row.home}</div>
                <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 14, color: '#6b7a8d' }}>{row.clinic}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="/request" style={{ display: 'inline-block', background: '#1a2e44', color: '#fff', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{tx.compBtn}</a>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: '#1a2e44', borderRadius: 20, padding: '48px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#fff', lineHeight: 1.2 }}>{tx.ctaTitle}</h2>
            <div>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }}>{tx.ctaDesc}</p>
              <a href="/free-assessment" style={{ display: 'inline-block', background: '#fff', color: '#1a2e44', padding: '13px 32px', borderRadius: 30, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>{tx.ctaBtn}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG PREVIEW ── */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a2e44', marginBottom: 10 }}>
                {tx.blogTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.blogTitleEm}</em>
              </h2>
              <p style={{ fontSize: 15, color: '#6b7a8d', maxWidth: 560 }}>{tx.blogDesc}</p>
            </div>
            <a href="/blog" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1.5px solid #1a2e44', whiteSpace: 'nowrap' }}>{tx.blogBtn}</a>
          </div>
          <div className="blog-grid">
            {tx.blogs.map((post, i) => (
              <a key={i} href="/blog" className="blog-card">
                <div style={{ padding: '24px 24px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ background: '#e8f1fd', color: '#2a6fdb', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{post.cat}</span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{post.time}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e44', marginBottom: 10, lineHeight: 1.4 }}>{post.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.6, marginBottom: 16 }}>{post.desc}</p>
                  <span style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{tx.readMore} →</span>
                </div>
                <div style={{ margin: '20px 0 0', height: 160, background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 13 }}>📷 Photo</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)', padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px, 3vw, 36px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
              {tx.faqTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.faqTitleEm}</em>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 28 }}>{tx.faqDesc}</p>
            <a href="#contact" style={{ display: 'inline-block', background: 'transparent', color: '#1a2e44', padding: '11px 28px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{tx.faqBtn}</a>
          </div>
          <div>
            {tx.faqs.map((faq, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} style={{ background: openFaq === i ? '#fff' : '#fff', borderColor: openFaq === i ? '#2a6fdb' : '#e2e8f0' }}>
                <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: openFaq === i ? 700 : 500, color: '#1a2e44' }}>{faq.q}</span>
                  <span style={{ fontSize: 20, color: '#2a6fdb', flexShrink: 0, transition: 'transform .2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 18px', fontSize: 14, color: '#6b7a8d', lineHeight: 1.7 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}