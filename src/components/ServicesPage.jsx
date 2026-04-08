'use client';
import { useState } from 'react';
import { useLang } from '@/context/LanguageContext';

const services = [
  { id: 1, icon: '🦴', titleEl: 'Μυοσκελετική Φυσιοθεραπεία', titleEn: 'Musculoskeletal Physiotherapy', descEl: 'Θεραπεία για πόνο στη μέση, αυχένα, αρθρώσεις και καθημερινές μυοσκελετικές κακώσεις.', descEn: 'Treatment for back pain, neck pain, joint issues, and everyday musculoskeletal injuries.' },
  { id: 2, icon: '🏥', titleEl: 'Μετεγχειρητική Αποκατάσταση', titleEn: 'Post-Surgery Rehabilitation', descEl: 'Εξατομικευμένη υποστήριξη για αποκατάσταση δύναμης, κινητικότητας και λειτουργίας μετά το χειρουργείο.', descEn: 'Personalized support to restore strength, mobility, and function after surgery.' },
  { id: 3, icon: '⚽', titleEl: 'Αποκατάσταση Αθλητικών Τραυματισμών', titleEn: 'Sports Injury Recovery', descEl: 'Εστιασμένη αποκατάσταση για υποστήριξη της επούλωσης, πρόληψη επανατραυματισμού και ασφαλή επιστροφή στη δραστηριότητα.', descEn: 'Focused rehabilitation to support healing, prevent re-injury, and help you return to activity safely.' },
  { id: 4, icon: '👴', titleEl: 'Φροντίδα Ηλικιωμένων & Κινητικότητα', titleEn: 'Elderly Care and Mobility Support', descEl: 'Εξειδικευμένη φροντίδα για τη βελτίωση της ισορροπίας, κινητικότητας και ανεξαρτησίας στο σπίτι.', descEn: 'Specialized care to improve balance, mobility, and independence at home.' },
  { id: 5, icon: '🧠', titleEl: 'Νευρολογική Φυσιοθεραπεία', titleEn: 'Neurological Physiotherapy', descEl: 'Εξειδικευμένη φροντίδα για βελτίωση της κίνησης, ισορροπίας, συντονισμού και καθημερινής λειτουργίας.', descEn: 'Specialized care to improve movement, balance, coordination, and daily function.' },
  { id: 6, icon: '📋', titleEl: 'Προσωπική Αξιολόγηση', titleEn: 'Personal Assessment', descEl: 'Ολοκληρωμένη αξιολόγηση της κατάστασής σας για τη δημιουργία εξατομικευμένου πλάνου θεραπείας.', descEn: 'Comprehensive assessment of your condition to create a personalized treatment plan.' },
];

const conditions = [
  { el: 'Πόνος στη Μέση', en: 'Back Pain' },
  { el: 'Πόνος Αυχένα & Ώμων', en: 'Neck and Shoulder Pain' },
  { el: 'Μετεγχειρητική Αποκατάσταση', en: 'Post-Surgical Recovery' },
  { el: 'Νευρολογικές Παθήσεις', en: 'Neurological Conditions' },
  { el: 'Αθλητικοί Τραυματισμοί', en: 'Sports Injuries' },
  { el: 'Μειωμένη Κινητικότητα', en: 'Reduced Mobility' },
  { el: 'Προβλήματα Ισορροπίας', en: 'Balance Issues' },
  { el: 'Αρθρίτιδα', en: 'Arthritis' },
];

const faqs = {
  el: [
    { q: 'Χρειάζομαι παραπομπή;', a: 'Όχι, μπορείτε να κλείσετε ραντεβού απευθείας χωρίς παραπομπή γιατρού.' },
    { q: 'Πόσο διαρκεί μια συνεδρία;', a: 'Μια τυπική συνεδρία διαρκεί 45-60 λεπτά. Η πρώτη αξιολόγηση μπορεί να διαρκέσει έως 90 λεπτά.' },
    { q: 'Σε ποιες περιοχές δραστηριοποιείστε;', a: 'Εξυπηρετούμε την Αθήνα και την Αττική. Επικοινωνήστε μαζί μας για να επιβεβαιώσετε αν καλύπτουμε την περιοχή σας.' },
    { q: 'Τι πρέπει να έχω έτοιμο για την πρώτη επίσκεψη;', a: 'Οποιεσδήποτε ιατρικές εκθέσεις ή εξετάσεις σχετικές με την κατάστασή σας. Φορέστε άνετα ρούχα.' },
  ],
  en: [
    { q: 'Do I need a referral?', a: 'No, you can book directly without a doctor\'s referral.' },
    { q: 'How long does a session last?', a: 'A typical session lasts 45-60 minutes. The first assessment may take up to 90 minutes.' },
    { q: 'Which areas do you cover?', a: 'We serve Athens and Attica. Contact us to confirm we cover your area.' },
    { q: 'What should I have ready for the first visit?', a: 'Any medical reports or tests related to your condition. Wear comfortable clothing.' },
  ],
};

export default function ServicesPage() {
  const { lang } = useLang();
  const [openFaq, setOpenFaq] = useState(null);

  const t = {
    el: {
      heroTitle: 'Υπηρεσίες Φυσιοθεραπείας',
      heroTitleEm: 'Προσαρμοσμένες σε Εσάς',
      heroDesc: 'Από αποκατάσταση έως διαχείριση πόνου, φέρνουμε επαγγελματική φροντίδα στην πόρτα σας – εξατομικευμένη για τις συγκεκριμένες ανάγκες και στόχους σας.',
      cta: 'Κλείστε Ραντεβού',
      badges: ['🏠 Κατ\' οίκον Επισκέψεις', '⭐ Αποκατάσταση', '✓ Πιστοποιημένοι Επαγγελματίες', '📋 Εξατομικευμένα Πλάνα'],
      servicesTitle: 'Υπηρεσίες', servicesTitleEm: 'που Προσφέρουμε',
      servicesDesc: 'Εξατομικευμένη φροντίδα για ένα εύρος παθήσεων, παρεχόμενη στην άνεση του σπιτιού σας για να υποστηρίξει την ανάρρωση, κινητικότητα και μακροπρόθεσμα αποτελέσματα.',
      bookBtn: 'Κλείστε Ραντεβού →',
      howTitle: 'Απλά Βήματα για να', howTitleEm: 'Ξεκινήσετε',
      howDesc: 'Μια απλή διαδικασία για να σας συνδέσουμε με τη σωστή φροντίδα.',
      howCta: 'Κλείστε Ραντεβού',
      steps: [
        { num: '1', label: 'Βήμα 1', title: 'Υποβάλτε το Αίτημά σας', desc: 'Συμπληρώστε μια σύντομη φόρμα με τα στοιχεία και την κατάστασή σας.' },
        { num: '2', label: 'Βήμα 2', title: 'Αντιστοιχηθείτε με Θεραπευτή', desc: 'Η ομάδα μας σας αντιστοιχεί με τον κατάλληλο θεραπευτή.' },
        { num: '3', label: 'Βήμα 3', title: 'Λάβετε Φροντίδα στο Σπίτι', desc: 'Ο θεραπευτής σας επισκέπτεται στο σπίτι για εξατομικευμένη θεραπεία.' },
      ],
      condTitle: 'Παθήσεις που', condTitleEm: 'Αντιμετωπίζουμε',
      condDesc: 'Εξερευνήστε μερικές από τις πιο συνηθισμένες παθήσεις που αντιμετωπίζουμε μέσω εξατομικευμένης φυσιοθεραπείας στο σπίτι.',
      ctaBannerTitle: 'Ξεκινήστε με μια', ctaBannerTitleEm: 'Δωρεάν Αξιολόγηση',
      ctaBannerDesc: 'Δεν είστε σίγουροι ποια υπηρεσία είναι κατάλληλη για εσάς; Θα αξιολογήσουμε τις ανάγκες σας, θα απαντήσουμε στις ερωτήσεις σας και θα δημιουργήσουμε ένα εξατομικευμένο πλάνο θεραπείας.',
      ctaBannerBtn: 'Κλείστε Ραντεβού',
      faqTitle: 'Συχνές', faqTitleEm: 'Ερωτήσεις',
    },
    en: {
      heroTitle: 'Physiotherapy Services',
      heroTitleEm: 'Tailored to You',
      heroDesc: 'From rehabilitation to pain management, we bring professional care to your doorstep — personalized for your specific needs and goals.',
      cta: 'Request a Session',
      badges: ['🏠 Home Visits', '⭐ Rehabilitation Care', '✓ Licensed Professionals', '📋 Personalized Plans'],
      servicesTitle: 'Services', servicesTitleEm: 'We Offer',
      servicesDesc: 'Personalized care for a range of conditions, delivered in the comfort of your home to support recovery, mobility, and long-term results.',
      bookBtn: 'Request a Session →',
      howTitle: 'Simple Steps to', howTitleEm: 'Get Started',
      howDesc: 'A simple process to connect you with the right care.',
      howCta: 'Request a Session',
      steps: [
        { num: '1', label: 'Step 1', title: 'Submit Your Request', desc: 'Fill out a short form with your personal details and condition.' },
        { num: '2', label: 'Step 2', title: 'Get Matched with a Therapist', desc: 'Our team matches you with the right physiotherapist.' },
        { num: '3', label: 'Step 3', title: 'Receive Care at Home', desc: 'Your therapist visits you at home for personalized treatment.' },
      ],
      condTitle: 'Conditions We', condTitleEm: 'Commonly Support',
      condDesc: 'Explore some of the most common conditions and concerns we support through personalized physiotherapy at home.',
      ctaBannerTitle: 'Start With a', ctaBannerTitleEm: 'Free Assessment',
      ctaBannerDesc: 'Not sure which service is right for you? We\'ll evaluate your needs, answer your questions, and create a personalized treatment plan.',
      ctaBannerBtn: 'Request a Session',
      faqTitle: 'Frequently Asked', faqTitleEm: 'Questions',
    },
  };
  const text = t[lang];
  const faqList = faqs[lang];

  return (
    <>
      <style>{`
        .services-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .conditions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .cta-banner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
        @media (max-width: 768px) {
          .conditions-grid { grid-template-columns: 1fr; }
          .cta-banner-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(135deg, #e8f1fd 0%, #dceeff 100%)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
            {text.badges.map((b) => (
              <span key={b} style={{ background: '#fff', border: '1px solid #dce6f0', padding: '7px 16px', borderRadius: 20, fontSize: 13, color: '#1a2e44', fontWeight: 500 }}>{b}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4vw, 52px)', color: '#1a2e44', lineHeight: 1.15, marginBottom: 20 }}>
            {text.heroTitle}<br />
            <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.heroTitleEm}</em>
          </h1>
          <p style={{ fontSize: 17, color: '#4a5568', lineHeight: 1.7, marginBottom: 32, maxWidth: 560 }}>{text.heroDesc}</p>
          <a href="/contact" style={{ background: '#1a2e44', color: '#fff', padding: '14px 32px', borderRadius: 30, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>{text.cta}</a>
        </div>
      </section>

      {/* ===== SERVICES LIST ===== */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', marginBottom: 12 }}>
            {text.servicesTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.servicesTitleEm}</em>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 48, maxWidth: 600 }}>{text.servicesDesc}</p>
          <div className="services-grid">
            {services.map((s) => (
              <div key={s.id} style={{ display: 'flex', gap: 24, padding: 24, border: '1px solid #dce6f0', borderRadius: 16, alignItems: 'flex-start', transition: 'all .3s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(26,46,68,0.08)'; e.currentTarget.style.borderColor = '#2a6fdb'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#dce6f0'; }}
              >
                {/* Image placeholder */}
                <div style={{ width: 120, height: 90, borderRadius: 12, background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a2e44', marginBottom: 8 }}>
                    {lang === 'el' ? s.titleEl : s.titleEn}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6, marginBottom: 16 }}>
                    {lang === 'el' ? s.descEl : s.descEn}
                  </p>
                  <a href="/contact" style={{ fontSize: 14, color: '#2a6fdb', fontWeight: 500, textDecoration: 'none' }}>
                    {text.bookBtn}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', marginBottom: 12 }}>
            {text.howTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.howTitleEm}</em>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 48, maxWidth: 500 }}>{text.howDesc}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 700 }}>
            {text.steps.map((step, i) => (
              <div key={step.num} style={{ display: 'flex', gap: 20, padding: '24px 0', borderBottom: i < text.steps.length - 1 ? '1px solid #dce6f0' : 'none' }}>
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: '#1a2e44', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{step.num}</div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2a6fdb', fontWeight: 600, marginBottom: 4 }}>{step.label}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1a2e44', marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <a href="/contact" style={{ background: '#1a2e44', color: '#fff', padding: '12px 28px', borderRadius: 30, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>{text.howCta}</a>
          </div>
        </div>
      </section>

      {/* ===== CONDITIONS ===== */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', marginBottom: 12 }}>
            {text.condTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.condTitleEm}</em>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 40, maxWidth: 560 }}>{text.condDesc}</p>
          <div className="conditions-grid">
            {conditions.map((c) => (
              <div key={c.en} style={{ padding: '16px 20px', border: '1px solid #dce6f0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e8f1fd'; e.currentTarget.style.borderColor = '#2a6fdb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#dce6f0'; }}
              >
                <div style={{ width: 4, height: 40, borderRadius: 2, background: '#2a6fdb', flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 500, color: '#1a2e44' }}>{lang === 'el' ? c.el : c.en}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section style={{ padding: '60px 24px', background: '#1a2e44' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="cta-banner-grid">
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#fff', marginBottom: 12 }}>
                {text.ctaBannerTitle} <em style={{ fontStyle: 'italic', color: '#4a8ff5' }}>{text.ctaBannerTitleEm}</em>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.7 }}>{text.ctaBannerDesc}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a href="/contact" style={{ background: '#fff', color: '#1a2e44', padding: '14px 32px', borderRadius: 30, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>{text.ctaBannerBtn}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', marginBottom: 40 }}>
            {text.faqTitle} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.faqTitleEm}</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 760 }}>
            {faqList.map((faq, i) => (
              <div key={i} style={{ border: '1px solid #dce6f0', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: openFaq === i ? '#e8f1fd' : '#fff', border: 'none', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, color: openFaq === i ? '#2a6fdb' : '#1a2e44' }}>
                  {faq.q}
                  <span style={{ fontSize: 20, flexShrink: 0, marginLeft: 12, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .3s', display: 'inline-block' }}>+</span>
                </button>
                {openFaq === i && <div style={{ padding: '0 24px 20px', fontSize: 14, color: '#6b7a8d', lineHeight: 1.7 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
