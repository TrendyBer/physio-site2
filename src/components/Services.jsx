'use client';
import { useLang } from '@/context/LanguageContext';

export default function Services() {
  const { lang } = useLang();
  const t = {
    el: {
      title: 'Υπηρεσίες', titleEm: 'Φυσιοθεραπείας',
      desc: 'Εξατομικευμένη φροντίδα για ένα εύρος παθήσεων, παρεχόμενη στην άνεση του σπιτιού σας.',
      viewAll: 'Όλες οι Υπηρεσίες', cta: 'Κλείστε Ραντεβού →',
      services: [
        { title: 'Μυοσκελετική Φυσιοθεραπεία', desc: 'Θεραπεία για πόνο στη μέση, αυχένα, αρθρώσεις και καθημερινές μυοσκελετικές κακώσεις.', price: '€30' },
        { title: 'Μετεγχειρητική Αποκατάσταση', desc: 'Εξατομικευμένη υποστήριξη για αποκατάσταση δύναμης, κινητικότητας και λειτουργίας μετά το χειρουργείο.', price: '€40' },
        { title: 'Αποκατάσταση Αθλητικών Τραυματισμών', desc: 'Εστιασμένη αποκατάσταση για υποστήριξη της επούλωσης, πρόληψη επανατραυματισμού και ασφαλή επιστροφή στη δραστηριότητα.', price: '€20' },
      ],
    },
    en: {
      title: 'Physiotherapy', titleEm: 'Services We Offer',
      desc: 'Personalized care for a range of conditions, delivered in the comfort of your home.',
      viewAll: 'View All Services', cta: 'Request a Session →',
      services: [
        { title: 'Musculoskeletal Physiotherapy', desc: 'Treatment for back pain, neck pain, joint issues, and everyday musculoskeletal injuries.', price: '€30' },
        { title: 'Post-Surgery Rehabilitation', desc: 'Personalized support to restore strength, mobility, and function after surgery.', price: '€40' },
        { title: 'Sports Injury Recovery', desc: 'Focused rehabilitation to support healing, prevent re-injury, and help you return to activity safely.', price: '€20' },
      ],
    },
  };
  const text = t[lang];

  return (
    <>
      <style>{`
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .services-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .services-grid { grid-template-columns: 1fr; } }
        .service-card { border-radius: 16px; overflow: hidden; border: 1px solid #dce6f0; transition: all .3s; }
        .service-card:hover { box-shadow: 0 12px 48px rgba(26,46,68,0.14); transform: translateY(-4px); }
      `}</style>
      <section id="services" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>{text.desc}</p>
            </div>
            <a href="/services" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.viewAll}</a>
          </div>
          <div className="services-grid">
            {text.services.map((s) => (
              <div key={s.title} className="service-card">
                <div style={{ aspectRatio: '16/10', background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 13 }}>📷</div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 16, lineHeight: 1.6 }}>{s.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <a href="/request" style={{ fontSize: 13, padding: '7px 14px', borderRadius: 20, background: '#1a2e44', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>{text.cta}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}