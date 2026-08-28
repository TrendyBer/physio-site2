'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Activity, ArrowRight } from 'lucide-react';
import BookingButton from './BookingButton';

// Οι τιμές ΔΕΝ ανήκουν εδώ. Κάθε θεραπευτής ορίζει τη δική του τιμή
// (25€–50€) και ο ασθενής τη βλέπει στην κάρτα του θεραπευτή. Τα παλιά
// «€30 / €40 / €20» ήταν σταθερά νούμερα που δεν αντιστοιχούσαν σε
// κανέναν — και το €20 ήταν κάτω από το επιτρεπτό ελάχιστο.
const DEFAULT = {
  el: {
    title: 'Υπηρεσίες', titleEm: 'Φυσιοθεραπείας',
    desc: 'Εξατομικευμένη φροντίδα για ένα εύρος περιστατικών, στο σπίτι σας.',
    viewAll: 'Δείτε όλα τα περιστατικά', cta: 'Κλείσε ραντεβού',
    services: [
      { title: 'Μυοσκελετική Φυσιοθεραπεία', desc: 'Θεραπεία για πόνο στη μέση, στον αυχένα και στις αρθρώσεις.', image_url: '' },
      { title: 'Μετεγχειρητική Αποκατάσταση', desc: 'Εξατομικευμένη υποστήριξη για την ανάκτηση δύναμης μετά το χειρουργείο.', image_url: '' },
      { title: 'Αποκατάσταση Αθλητικών Τραυματισμών', desc: 'Στοχευμένη αποκατάσταση για επιστροφή στην άθληση.', image_url: '' },
    ],
  },
  en: {
    title: 'Physiotherapy', titleEm: 'Services We Offer',
    desc: 'Personalized care for a range of cases, at your home.',
    viewAll: 'Browse all conditions', cta: 'Book an appointment',
    services: [
      { title: 'Musculoskeletal Physiotherapy', desc: 'Treatment for back pain, neck pain and joint issues.', image_url: '' },
      { title: 'Post-Surgery Rehabilitation', desc: 'Personalized support to restore strength after surgery.', image_url: '' },
      { title: 'Sports Injury Recovery', desc: 'Focused rehabilitation to get you back to your sport.', image_url: '' },
    ],
  },
};

export default function Services() {
  const { lang } = useLang();
  const [data, setData] = useState(DEFAULT);

  useEffect(() => {
    async function fetchData() {
      const { data: row } = await supabase
        .from('site_content')
        .select('content_el, content_en')
        .eq('page', 'homepage')
        .eq('section', 'services')
        .single();
      if (row) setData({ el: row.content_el, en: row.content_en });
    }
    fetchData();
  }, []);

  const text = data[lang] || DEFAULT[lang];

  return (
    <>
      <style>{`
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .services-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .services-grid { grid-template-columns: 1fr; } }
        .service-card { border-radius: 16px; overflow: hidden; border: 1px solid #dce6f0; transition: all .3s; background: #fff; }
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
            {/* Έδειχνε σε /services, που πλέον κάνει redirect στο /find-help.
                Στέλνουμε τον χρήστη κατευθείαν εκεί — ένα βήμα λιγότερο. */}
            <a href="/find-help" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {text.viewAll}
              <ArrowRight size={15} />
            </a>
          </div>
          <div className="services-grid">
            {(text.services || []).map((s, i) => (
              <div key={i} className="service-card">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.title} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover' }} />
                ) : (
                  <div style={{ aspectRatio: '16/10', background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={34} color="#2a6fdb" strokeWidth={1.6} />
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 16, lineHeight: 1.6 }}>{s.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <BookingButton style={{ fontSize: 13, padding: '8px 16px', borderRadius: 20, background: '#1a2e44', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                      {text.cta}
                    </BookingButton>
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