'use client';
import { useLang } from '@/context/LanguageContext';
import { CheckCircle2, Shield, Star, Lock, Heart } from 'lucide-react';

const CONTENT = {
  el: {
    title: 'Γιατί μπορείτε να',
    titleEm: 'εμπιστευτείτε το PhysioHome',
    desc: 'Η φροντίδα στο σπίτι απαιτεί σιγουριά. Γι\u2019 αυτό δίνουμε έμφαση στον έλεγχο των επαγγελματιών, στη διαφάνεια των προφίλ και στην υποστήριξη κάθε ασθενή πριν και μετά τη συνεδρία.',
    cta: 'Δείτε τους φυσιοθεραπευτές',
    cards: [
      { icon: 'CheckCircle2', title: 'Ελεγμένα προφίλ θεραπευτών', desc: 'Οι φυσιοθεραπευτές καταχωρούν τα επαγγελματικά τους στοιχεία, την ειδικότητα, την περιοχή εξυπηρέτησης και την τιμή συνεδρίας. Τα στοιχεία ελέγχονται πριν το προφίλ γίνει διαθέσιμο στην πλατφόρμα.' },
      { icon: 'Shield', title: 'Άδεια ασκήσεως επαγγέλματος', desc: 'Η άδεια ασκήσεως είναι απαραίτητη για την έγκριση ενός θεραπευτή. Επιπλέον βιογραφικό και πιστοποιήσεις μπορούν να προστεθούν για πληρέστερη εικόνα του επαγγελματία.' },
      { icon: 'Star', title: 'Διαφανείς αξιολογήσεις', desc: 'Μετά από ολοκληρωμένες συνεδρίες, οι ασθενείς μπορούν να αξιολογούν την εμπειρία τους, βοηθώντας την κοινότητα να επιλέγει με μεγαλύτερη σιγουριά.' },
      { icon: 'Lock', title: 'Προστασία προσωπικών δεδομένων', desc: 'Τα στοιχεία σας χρησιμοποιούνται για τη διαχείριση του αιτήματος, την επικοινωνία και τον προγραμματισμό της συνεδρίας, σύμφωνα με την Πολιτική Απορρήτου.' },
      { icon: 'Heart', title: 'Υποστήριξη όταν τη χρειάζεστε', desc: 'Για απορίες, αλλαγές ή βοήθεια στην επιλογή θεραπευτή, υπάρχει σημείο επικοινωνίας ώστε η διαδικασία να παραμένει απλή και ξεκάθαρη.' },
    ],
  },
  en: {
    title: 'Why you can',
    titleEm: 'trust PhysioHome',
    desc: 'Home care requires confidence. That is why we focus on vetting professionals, keeping profiles transparent, and supporting every patient before and after a session.',
    cta: 'Browse physiotherapists',
    cards: [
      { icon: 'CheckCircle2', title: 'Vetted therapist profiles', desc: 'Physiotherapists submit their professional details, specialty, service area and session price. This information is reviewed before a profile goes live on the platform.' },
      { icon: 'Shield', title: 'Professional license', desc: 'A valid license is required to approve a therapist. A CV and additional certifications can be added optionally for a fuller professional profile.' },
      { icon: 'Star', title: 'Transparent reviews', desc: 'After completed sessions, patients can rate their experience, helping the community choose with greater confidence.' },
      { icon: 'Lock', title: 'Personal data protection', desc: 'Your information is used to manage your request, for communication and to schedule the session, in line with our Privacy Policy.' },
      { icon: 'Heart', title: 'Support when you need it', desc: 'For questions, changes or help choosing a therapist, there is a point of contact so the process stays simple and clear.' },
    ],
  },
};

const ICON_MAP = {
  CheckCircle2: CheckCircle2,
  Shield: Shield,
  Star: Star,
  Lock: Lock,
  Heart: Heart,
};

export default function TrustSection() {
  const { lang } = useLang();
  const text = CONTENT[lang] || CONTENT.el;

  return (
    <>
      <style>{`
        .trust-wrap { display: grid; grid-template-columns: 380px 1fr; gap: 48px; align-items: start; }
        @media (max-width: 900px) { .trust-wrap { grid-template-columns: 1fr; gap: 32px; } }
        .trust-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 640px) { .trust-cards { grid-template-columns: 1fr; } }
      `}</style>
      <section id="trust" style={{ padding: '80px 24px', background: '#faf9f6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="trust-wrap">
            <div style={{ position: 'sticky', top: 100 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 16 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 28 }}>{text.desc}</p>
              <a href="/therapists" style={{ display: 'inline-block', background: '#2a6fdb', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 30, textDecoration: 'none', transition: 'all .25s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a2e44'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2a6fdb'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {text.cta}
              </a>
            </div>

            <div className="trust-cards">
              {text.cards.map((card, i) => {
                const IconComp = ICON_MAP[card.icon] || CheckCircle2;
                const isLast = i === text.cards.length - 1;
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #dce6f0', borderRadius: 16, padding: 28, transition: 'all .3s', gridColumn: isLast && text.cards.length % 2 !== 0 ? '1 / -1' : 'auto' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a6fdb'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(26,46,68,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#dce6f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                      <IconComp size={22} color="#2a6fdb" strokeWidth={2.2} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1a2e44', marginBottom: 10 }}>{card.title}</h3>
                    <p style={{ fontSize: 14, color: '#6b7a8d', lineHeight: 1.6 }}>{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}