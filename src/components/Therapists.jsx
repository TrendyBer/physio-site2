'use client';
import { useState } from 'react';
import { useLang } from '@/context/LanguageContext';

const THERAPISTS_DATA = {
  el: [
    { id: 1, name: 'Dr. Anna Kowalska', title: 'Νευρολογική Φυσιοθεραπεύτρια', rating: '4.9', reviews: 12, desc: 'Υποστηρίζει την ανάρρωση μετά από εγκεφαλικό και νευρολογικές παθήσεις με εξατομικευμένη αποκατάσταση στο σπίτι.', experience: '8+ χρόνια εμπειρίας', tags: ['Αποκατάσταση μετά εγκεφαλικό', 'Ισορροπία', 'Κινητικότητα'], email: 'anna.k@physiohome.gr', area: 'Αθήνα', bio: 'Η Dr. Anna Kowalska είναι εξειδικευμένη νευρολογική φυσιοθεραπεύτρια με πάνω από 8 χρόνια εμπειρίας. Εργάζεται με ασθενείς που αντιμετωπίζουν νευρολογικές παθήσεις, παρέχοντας εξατομικευμένα προγράμματα αποκατάστασης στο σπίτι.' },
    { id: 2, name: 'Dr. Mark Jenkins', title: 'Μυοσκελετικός Φυσιοθεραπευτής', rating: '4.8', reviews: 25, desc: 'Αντιμετωπίζει πόνο στη μέση, τον αυχένα και αρθρώσεις, βοηθώντας στη βελτίωση της κίνησης.', experience: '10+ χρόνια εμπειρίας', tags: ['Πόνος στη μέση', 'Αυχένας', 'Αρθρώσεις'], email: 'mark.j@physiohome.gr', area: 'Αθήνα', bio: 'Ο Dr. Mark Jenkins ειδικεύεται στη μυοσκελετική φυσιοθεραπεία με έμφαση στην αντιμετώπιση χρόνιου πόνου και αθλητικών τραυματισμών. Με 10+ χρόνια εμπειρίας, έχει βοηθήσει εκατοντάδες ασθενείς να βελτιώσουν την ποιότητα ζωής τους.' },
    { id: 3, name: 'Maria Lopez', title: 'Φυσιοθεραπεύτρια Αποκατάστασης', rating: '4.7', reviews: 30, desc: 'Βοηθά ασθενείς να ανακάμψουν μετά από χειρουργείο, αποκαθιστώντας δύναμη και κινητικότητα στο σπίτι.', experience: '5+ χρόνια εμπειρίας', tags: ['Μετεγχειρητική', 'Δύναμη', 'Κινητικότητα'], email: 'maria.l@physiohome.gr', area: 'Πειραιάς', bio: 'Η Maria Lopez εξειδικεύεται στη μετεγχειρητική αποκατάσταση. Παρέχει ολοκληρωμένη φροντίδα που βοηθά τους ασθενείς να ανακτήσουν τη δύναμη και κινητικότητά τους στο άνετο περιβάλλον του σπιτιού τους.' },
    { id: 4, name: 'Dr. James Thompson', title: 'Αθλητικός Φυσιοθεραπευτής', rating: '4.9', reviews: 50, desc: 'Υποστηρίζει την ανάρρωση από τραυματισμούς και ασφαλή επιστροφή στη δραστηριότητα.', experience: '15+ χρόνια εμπειρίας', tags: ['Αθλητικοί τραυματισμοί', 'Αποκατάσταση', 'Πρόληψη'], email: 'james.t@physiohome.gr', area: 'Γλυφάδα', bio: 'Ο Dr. James Thompson είναι ένας από τους πιο έμπειρους αθλητικούς φυσιοθεραπευτές μας. Με 15+ χρόνια εμπειρίας, έχει εργαστεί με επαγγελματίες αθλητές και ερασιτέχνες, βοηθώντας τους να επιστρέψουν στην αγαπημένη τους δραστηριότητα.' },
  ],
  en: [
    { id: 1, name: 'Dr. Anna Kowalska', title: 'Neurological Physiotherapist', rating: '4.9', reviews: 12, desc: 'Supports recovery after stroke and neurological conditions with personalized home-based rehabilitation.', experience: '8+ years experience', tags: ['Stroke recovery', 'Balance training', 'Mobility'], email: 'anna.k@physiohome.gr', area: 'Athens', bio: 'Dr. Anna Kowalska is a specialized neurological physiotherapist with over 8 years of experience. She works with patients facing neurological conditions, providing personalized home-based rehabilitation programs.' },
    { id: 2, name: 'Dr. Mark Jenkins', title: 'Musculoskeletal Physiotherapist', rating: '4.8', reviews: 25, desc: 'Treats back pain, neck pain, and joint issues, helping improve movement and reduce discomfort.', experience: '10+ years experience', tags: ['Back pain', 'Neck pain', 'Joint therapy'], email: 'mark.j@physiohome.gr', area: 'Athens', bio: 'Dr. Mark Jenkins specializes in musculoskeletal physiotherapy with a focus on chronic pain management and sports injuries. With 10+ years of experience, he has helped hundreds of patients improve their quality of life.' },
    { id: 3, name: 'Maria Lopez', title: 'Rehabilitation Physiotherapist', rating: '4.7', reviews: 30, desc: 'Helps patients recover after surgery, restoring strength, mobility, and confidence at home.', experience: '5+ years experience', tags: ['Post-surgery', 'Strength recovery', 'Mobility'], email: 'maria.l@physiohome.gr', area: 'Piraeus', bio: 'Maria Lopez specializes in post-surgical rehabilitation. She provides comprehensive care that helps patients regain their strength and mobility in the comfort of their own home.' },
    { id: 4, name: 'Dr. James Thompson', title: 'Sports Physiotherapist', rating: '4.9', reviews: 50, desc: 'Supports injury recovery and safe return to activity with tailored rehabilitation plans.', experience: '15+ years experience', tags: ['Sports injuries', 'Recovery plans', 'Injury prevention'], email: 'james.t@physiohome.gr', area: 'Glyfada', bio: 'Dr. James Thompson is one of our most experienced sports physiotherapists. With 15+ years of experience working with professional and amateur athletes, he helps them safely return to their favorite activities.' },
  ],
};

function TherapistModal({ therapist, lang, onClose, onBook }) {
  if (!therapist) return null;
  const bookLabel = lang === 'el' ? 'Κλείστε Ραντεβού' : 'Book a Session';
  const closeLabel = lang === 'el' ? 'Κλείσιμο' : 'Close';
  const bioLabel = lang === 'el' ? 'Βιογραφικό' : 'About';
  const areaLabel = lang === 'el' ? 'Περιοχή' : 'Area';
  const reviewsLabel = lang === 'el' ? 'κριτικές' : 'reviews';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2e44', marginBottom: 4 }}>{therapist.name}</h2>
            <div style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 6 }}>{therapist.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ color: '#f59e0b' }}>★</span>
              <span style={{ fontWeight: 600, color: '#1a2e44' }}>{therapist.rating}</span>
              <span style={{ color: '#6b7a8d' }}>({therapist.reviews} {reviewsLabel})</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', padding: 4 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{bioLabel}</div>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '12px 14px', borderRadius: 8, borderLeft: '3px solid #dce6f0' }}>{therapist.bio}</p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{areaLabel}</div>
              <div style={{ fontSize: 14, color: '#1a2e44', fontWeight: 500 }}>{therapist.area}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 14, color: '#2a6fdb', fontWeight: 500 }}>{therapist.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#1a2e44', color: '#fff' }}>{therapist.experience}</span>
            {therapist.tags.map(tag => (
              <span key={tag} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: '#e8f1fd', color: '#2a6fdb', border: '1px solid #c8dff9' }}>{tag}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <a href="/request" style={{ flex: 1, background: '#1a2e44', color: '#fff', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>{bookLabel}</a>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: '#1a2e44', padding: '12px', borderRadius: 30, fontSize: 14, fontWeight: 600, border: '1.5px solid #dce6f0', cursor: 'pointer', fontFamily: 'inherit' }}>{closeLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Therapists() {
  const { lang } = useLang();
  const [selectedTherapist, setSelectedTherapist] = useState(null);

  const therapists = THERAPISTS_DATA[lang];

  const t = {
    el: {
      title: 'Οι', titleEm: 'Φυσιοθεραπευτές', titleEnd: 'μας',
      desc: 'Γνωρίστε έμπειρους, αδειοδοτημένους επαγγελματίες που παρέχουν εξατομικευμένη φροντίδα στο σπίτι σας.',
      viewAll: 'Όλοι οι Θεραπευτές', viewProfile: 'Δείτε Προφίλ',
    },
    en: {
      title: 'Our', titleEm: 'Physiotherapists', titleEnd: '',
      desc: 'Meet experienced, licensed professionals providing personalized care at home, focused on recovery, mobility, and long-term results.',
      viewAll: 'All Therapists', viewProfile: 'View Profile',
    },
  };
  const text = t[lang];

  return (
    <>
      <style>{`
        .therapists-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        @media (max-width: 640px) { .therapists-grid { grid-template-columns: 1fr; } }
        .th-card { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; padding: 24px; transition: all .3s; cursor: pointer; }
        .th-card:hover { box-shadow: 0 4px 24px rgba(26,46,68,0.08); transform: translateY(-4px); }
      `}</style>

      <section id="therapists" style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em> {text.titleEnd}
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>{text.desc}</p>
            </div>
            <a href="/therapists" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.viewAll}</a>
          </div>

          <div className="therapists-grid">
            {therapists.map((th) => (
              <div key={th.id} className="th-card" onClick={() => setSelectedTherapist(th)}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #c8dff9, #a0c4f4)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44' }}>{th.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 4 }}>{th.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                      <span style={{ color: '#f59e0b' }}>★</span>{th.rating}
                      <span style={{ color: '#6b7a8d' }}>({th.reviews})</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#6b7a8d', marginBottom: 16, lineHeight: 1.6 }}>{th.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#1a2e44', color: '#fff' }}>{th.experience}</span>
                  {th.tags.map((tag) => (
                    <span key={tag} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#e8f1fd', color: '#2a6fdb', border: '1px solid #c8dff9' }}>{tag}</span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 600 }}>{text.viewProfile} →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TherapistModal
        therapist={selectedTherapist}
        lang={lang}
        onClose={() => setSelectedTherapist(null)}
      />
    </>
  );
}