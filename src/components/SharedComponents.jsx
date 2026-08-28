'use client';
import { useLang } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BookingButton from './BookingButton';

// ─── Footer ───────────────────────────────────────────────────────────────────
// ΔΕΝ υπάρχει πλέον δεύτερη υλοποίηση Footer εδώ.
// Το αρχείο αυτό είχε δικό του Footer, με διαφορετικά links από το Footer.jsx.
// Ανάλογα με το ποιο έκανε import η κάθε σελίδα, ο χρήστης έβλεπε άλλο μενού.
// Πλέον υπάρχει ΜΙΑ υλοποίηση, στο ./Footer.jsx, και εδώ γίνεται μόνο re-export
// ώστε να συνεχίσουν να δουλεύουν τα υπάρχοντα imports:
//     import { Footer } from '@/components/SharedComponents';
//     import Footer from '@/components/Footer';
// Και τα δύο δείχνουν πλέον στο ίδιο component.
export { default as Footer } from './Footer';

// ─── Contact ──────────────────────────────────────────────────────────────────
// Ίδια ιστορία με το Footer: υπήρχαν ΔΥΟ φόρμες επικοινωνίας.
// Η μία εδώ, η άλλη στο ./Contact.jsx — με ΔΙΑΦΟΡΕΤΙΚΑ ονόματα πεδίων στο
// POST προς /api/contact. Ανάλογα με ποια σελίδα φόρτωνε ποια, το email
// έφτανε είτε σωστά είτε με κενό όνομα και κενό μήνυμα.
// Πλέον υπάρχει ΜΙΑ υλοποίηση, στο ./Contact.jsx (με honeypot, έλεγχο
// email, rate-limit handling και modal επιβεβαίωσης), και εδώ γίνεται
// μόνο re-export ώστε να δουλεύουν και τα δύο imports.
export { default as Contact } from './Contact';

// ─── Partners ─────────────────────────────────────────────────────────────────
const PARTNERS_CACHE_KEY = 'cms_partners';
const PARTNERS_CACHE_TTL = 5 * 60 * 1000;

function PartnerLogo({ partner }) {
  if (partner.logo_url) {
    return (
      <img
        src={partner.logo_url}
        alt={partner.name}
        title={partner.name}
        style={{
          maxHeight: 40,
          maxWidth: 140,
          objectFit: 'contain',
          filter: 'grayscale(100%)',
          opacity: 0.65,
          transition: 'all .3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.filter = 'grayscale(0%)';
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.filter = 'grayscale(100%)';
          e.currentTarget.style.opacity = '0.65';
        }}
      />
    );
  }
  return (
    <span style={{ fontSize: 16, fontWeight: 600, color: '#6b7a8d', letterSpacing: '.02em' }}>
      {partner.name}
    </span>
  );
}

function PartnerItem({ partner }) {
  const wrapperStyle = { display: 'inline-flex', alignItems: 'center' };
  const linkStyle = { ...wrapperStyle, textDecoration: 'none' };

  if (partner.website_url) {
    return (
      <a href={partner.website_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        <PartnerLogo partner={partner} />
      </a>
    );
  }

  return (
    <div style={wrapperStyle}>
      <PartnerLogo partner={partner} />
    </div>
  );
}

export function Partners() {
  const { lang } = useLang();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const cached = sessionStorage.getItem(PARTNERS_CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < PARTNERS_CACHE_TTL && Array.isArray(value)) {
            setPartners(value);
            setLoading(false);
            return;
          }
        }
      } catch (_) {}

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('id, name, logo_url, website_url, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Partners fetch error:', error);
          setPartners([]);
        } else {
          const list = data || [];
          setPartners(list);
          if (list.length > 0) {
            try {
              sessionStorage.setItem(PARTNERS_CACHE_KEY, JSON.stringify({ value: list, timestamp: Date.now() }));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Partners fetch failed:', err);
        setPartners([]);
      }
      setLoading(false);
    }
    fetchPartners();
  }, []);

  if (loading || partners.length === 0) return null;

  return (
    <div style={{ background: '#f8fafb', padding: '36px 24px', borderTop: '1px solid #dce6f0', borderBottom: '1px solid #dce6f0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6b7a8d', marginBottom: 20, fontWeight: 500 }}>
          {lang === 'el' ? 'Οι Συνεργάτες μας' : 'Our Partners'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          {partners.map(p => (
            <PartnerItem key={p.id} partner={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CtaBanner ────────────────────────────────────────────────────────────────
export function CtaBanner() {
  const { lang } = useLang();
  const t = {
    el: {
      title: 'Έτοιμοι να Ξεκινήσετε το',
      titleEm: 'Ταξίδι Ανάρρωσής σας',
      desc: 'Στείλτε αίτημα για την πρώτη σας συνεδρία και ζήστε τη διαφορά της εξατομικευμένης φυσιοθεραπείας στο σπίτι.',
      cta: 'Κλείσε ραντεβού',
    },
    en: {
      title: 'Ready to Start Your',
      titleEm: 'Recovery Journey',
      desc: 'Send a request for your first session and experience the difference of personalized home physiotherapy.',
      cta: 'Book an appointment',
    },
  };
  const text = t[lang];
  return (
    <section style={{ background: '#1a2e44', padding: '60px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#fff', marginBottom: 16 }}>
          {text.title} <em style={{ fontStyle: 'italic', color: '#4a8ff5' }}>{text.titleEm}</em>?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 32, fontSize: 16 }}>{text.desc}</p>
        <BookingButton style={{ background: '#fff', color: '#1a2e44', padding: '14px 32px', borderRadius: 30, fontWeight: 600, fontSize: 15, display: 'inline-block', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {text.cta}
        </BookingButton>
      </div>
    </section>
  );
}

// ─── Faq ──────────────────────────────────────────────────────────────────────
export function Faq() {
  const { lang } = useLang();
  const [open, setOpen] = useState(null);
  const t = {
    el: {
      title: 'Συχνές', titleEm: 'Ερωτήσεις',
      desc: 'Δεν βρίσκετε αυτό που ψάχνετε; Είμαστε εδώ να βοηθήσουμε.',
      contact: 'Επικοινωνήστε μαζί μας',
      faqs: [
        { q: 'Χρειάζομαι παραπομπή για να κλείσω ραντεβού;', a: 'Όχι. Μπορείτε να στείλετε αίτημα για συνεδρία απευθείας, χωρίς παραπομπή ή διάγνωση.' },
        { q: 'Πώς κλείνεται το ραντεβού;', a: 'Επιλέγετε θεραπευτή και ώρα και στέλνετε αίτημα. Ο θεραπευτής το επιβεβαιώνει και το ραντεβού κλειδώνει. Θα ειδοποιηθείτε μόλις απαντήσει.' },
        { q: 'Τι γίνεται κατά την πρώτη επίσκεψη στο σπίτι;', a: 'Ο θεραπευτής θα αξιολογήσει την κατάστασή σας, θα συζητήσει τους στόχους σας και θα δημιουργήσει ένα εξατομικευμένο πλάνο θεραπείας.' },
        { q: 'Ποιες περιοχές εξυπηρετείτε;', a: 'Εξυπηρετούμε την Αθήνα και την Αττική. Στην αναζήτηση θα δείτε ποιοι θεραπευτές καλύπτουν τη δική σας περιοχή.' },
        { q: 'Πόσο κοστίζει μια συνεδρία;', a: 'Κάθε θεραπευτής ορίζει τη δική του τιμή, από €25 έως €50 ανά συνεδρία. Βλέπετε την ακριβή τιμή πριν στείλετε το αίτημα.' },
        { q: 'Πώς πληρώνω;', a: 'Πληρώνετε τον θεραπευτή απευθείας σε μετρητά μετά τη συνεδρία. Δεν χρεώνεστε τίποτα από την πλατφόρμα.' },
      ],
    },
    en: {
      title: 'Frequently', titleEm: 'Asked Questions',
      desc: "Can't find what you're looking for? We're here to help.",
      contact: 'Contact Us',
      faqs: [
        { q: 'Do I need a referral to book an appointment?', a: 'No. You can send a session request directly, without a referral or a diagnosis.' },
        { q: 'How does booking work?', a: 'You pick a therapist and a time and send a request. The therapist confirms it and the appointment is locked in. You are notified as soon as they reply.' },
        { q: 'What happens during the first home visit?', a: 'Your therapist will assess your condition, discuss your goals, and create a personalized treatment plan.' },
        { q: 'Which areas do you serve?', a: 'We serve Athens and Attica. The search shows you which therapists cover your own area.' },
        { q: 'How much does a session cost?', a: 'Each therapist sets their own price, between €25 and €50 per session. You see the exact price before you send the request.' },
        { q: 'How do I pay?', a: 'You pay the therapist directly in cash after the session. The platform charges you nothing.' },
      ],
    },
  };
  const text = t[lang];
  return (
    <>
      <style>{`
        .faq-item { border: 1px solid #dce6f0; border-radius: 12px; overflow: hidden; margin-bottom: 12px; cursor: pointer; background: #fff; }
        .faq-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; align-items: start; }
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div className="faq-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
              {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
            </h2>
            <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 28 }}>{text.desc}</p>
            <a href="/contact" style={{ display: 'inline-block', background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.contact}</a>
          </div>
          <div>
            {text.faqs.map((faq, i) => (
              <div key={i} className="faq-item" onClick={() => setOpen(open === i ? null : i)}>
                <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: open === i ? 700 : 500, color: '#1a2e44' }}>{faq.q}</span>
                  <span style={{ fontSize: 20, color: '#2a6fdb', flexShrink: 0, transition: 'transform .2s', transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </div>
                {open === i && <div style={{ padding: '0 24px 18px', fontSize: 14, color: '#6b7a8d', lineHeight: 1.7 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}