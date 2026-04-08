'use client';
import { useLang } from '@/context/LanguageContext';

export default function Benefits() {
  const { lang } = useLang();
  const t = {
    el: {
      title: 'Φυσιοθεραπεία στο Σπίτι:', titleEm: 'Κύρια Οφέλη',
      desc: 'Η φυσιοθεραπεία στο σπίτι προσφέρει μια βολική και προσωπική προσέγγιση στην ανάρρωση σε οικείο περιβάλλον.',
      benefits: [
        { icon: '🏠', title: 'Μεγαλύτερη Άνεση', desc: 'Λάβετε θεραπεία σε οικείο, ιδιωτικό χώρο όπου μπορείτε να νιώσετε πιο χαλαροί και ήρεμοι.' },
        { icon: '⏱', title: 'Περισσότερη Ευκολία', desc: 'Αποφύγετε τον χρόνο μετακίνησης και τις επισκέψεις σε κλινική με επαγγελματική φροντίδα κατευθείαν στο σπίτι σας.' },
        { icon: '♥', title: 'Φροντίδα Προσαρμοσμένη σε Εσάς', desc: 'Κάθε συνεδρία προσαρμόζεται στην κατάστασή σας, τους στόχους σας και το οικιακό περιβάλλον σας.' },
        { icon: '✓', title: 'Συνεπής Υποστήριξη', desc: 'Οι επισκέψεις στο σπίτι διευκολύνουν τη συνέπεια στη θεραπεία και την τήρηση του πλάνου ανάρρωσης.' },
      ],
    },
    en: {
      title: 'Physiotherapy at Home:', titleEm: 'Key Benefits',
      desc: 'Home physiotherapy offers a convenient and personal approach to recovery in a familiar environment.',
      benefits: [
        { icon: '🏠', title: 'Greater Comfort', desc: 'Receive treatment in a familiar, private space where you can feel more relaxed and at ease.' },
        { icon: '⏱', title: 'More Convenience', desc: 'Avoid travel time and clinic visits by getting professional care delivered directly to your home.' },
        { icon: '♥', title: 'Care Tailored to You', desc: 'Each session is adapted to your condition, goals, and home environment for better results.' },
        { icon: '✓', title: 'Consistent Support', desc: 'Home visits make it easier to stay consistent with treatment and follow your recovery plan.' },
      ],
    },
  };
  const text = t[lang];

  return (
    <>
      <style>{`
        .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .benefits-img { border-radius: 24px; background: linear-gradient(135deg, #c8dff9 0%, #a0c4f4 100%); aspect-ratio: 1; display: flex; align-items: center; justify-content: center; color: #2a6fdb; font-size: 14px; }
        @media (max-width: 768px) { .benefits-grid { grid-template-columns: 1fr; gap: 32px; } .benefits-img { display: none; } }
      `}</style>
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="benefits-grid">
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 40 }}>{text.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {text.benefits.map((b) => (
                  <div key={b.title} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{b.icon}</div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44', marginBottom: 4 }}>{b.title}</h3>
                      <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="benefits-img">📷 {lang === 'el' ? 'Φωτογραφία' : 'Photo'}</div>
          </div>
        </div>
      </section>
    </>
  );
}
