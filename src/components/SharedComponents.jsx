'use client';
import { useLang } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, MapPin, Check, AlertTriangle } from 'lucide-react';
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

// ─── Shared settings hook ─────────────────────────────────────────────────────
const CACHE_KEY = 'cms_platform_settings';
const CACHE_TTL = 5 * 60 * 1000;

const SETTING_DEFAULTS = {
  platform_name: 'PhysioHome',
  email: 'info@physiohome.gr',
  phone: '+30 210 123 4567',
  address: 'Αθήνα & Αττική, Ελλάδα',
};

function usePlatformSettings() {
  const [settings, setSettings] = useState(SETTING_DEFAULTS);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setSettings(prev => ({ ...prev, ...value }));
            return;
          }
        }
      } catch (_) {}

      const { data } = await supabase.from('platform_settings').select('key, value');
      if (data) {
        const s = {};
        data.forEach(row => { s[row.key] = row.value; });
        setSettings(prev => ({ ...prev, ...s }));
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: s, timestamp: Date.now() }));
        } catch (_) {}
      }
    }
    fetchSettings();
  }, []);

  return settings;
}

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

// ─── Contact ──────────────────────────────────────────────────────────────────
// Η φόρμα ΣΤΕΛΝΕΙ πραγματικά, μέσω /api/contact (Resend).
// Πριν έκανε μόνο alert() και το μήνυμα χανόταν — ο επισκέπτης νόμιζε
// ότι επικοινώνησε μαζί μας και περίμενε απάντηση που δεν θα ερχόταν ποτέ.
export function Contact() {
  const { lang } = useLang();
  const settings = usePlatformSettings();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', service: '', message: '',
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const t = {
    el: {
      title: 'Επικοινωνήστε', titleEm: 'μαζί μας',
      desc: 'Συμπληρώστε τη φόρμα και θα επικοινωνήσουμε μαζί σας εντός 24 ωρών.',
      phone: 'Τηλέφωνο', area: 'Περιοχή Εξυπηρέτησης',
      firstName: 'Όνομα', lastName: 'Επώνυμο', message: 'Μήνυμα',
      service: 'Υπηρεσία', selectService: 'Επιλέξτε Υπηρεσία',
      services: ['Μυοσκελετική Φυσιοθεραπεία', 'Μετεγχειρητική Αποκατάσταση', 'Αποκατάσταση Αθλητικών Τραυματισμών', 'Νευρολογική Αποκατάσταση', 'Άλλο'],
      send: 'Αποστολή', sending: 'Αποστολή...',
      successMsg: 'Ευχαριστούμε! Λάβαμε το μήνυμά σας και θα επικοινωνήσουμε εντός 24 ωρών.',
      errorMsg: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά ή στείλτε μας email απευθείας.',
      required: 'Συμπληρώστε όνομα, email και μήνυμα.',
    },
    en: {
      title: 'Contact', titleEm: 'Us',
      desc: 'Fill out the form and we will get back to you within 24 hours.',
      phone: 'Phone', area: 'Service Area',
      firstName: 'First Name', lastName: 'Last Name', message: 'Message',
      service: 'Service', selectService: 'Select Service',
      services: ['Musculoskeletal Physiotherapy', 'Post-Surgery Rehabilitation', 'Sports Injury Recovery', 'Neurological Rehabilitation', 'Other'],
      send: 'Send', sending: 'Sending...',
      successMsg: 'Thank you. We received your message and will get back to you within 24 hours.',
      errorMsg: 'Something went wrong. Please try again or email us directly.',
      required: 'Please fill in your name, email and message.',
    },
  };
  const text = t[lang];

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', boxSizing: 'border-box', background: '#fff' };

  async function submit() {
    if (!form.firstName.trim() || !form.email.trim() || !form.message.trim()) {
      setResult({ ok: false, text: text.required });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.service || '',
          message: form.message.trim(),
        }),
      });
      if (!res.ok) throw new Error('request_failed');
      setResult({ ok: true, text: text.successMsg });
      setForm({ firstName: '', lastName: '', email: '', phone: '', service: '', message: '' });
    } catch (err) {
      console.error('Contact form error:', err);
      setResult({ ok: false, text: text.errorMsg });
    }
    setSending(false);
  }

  return (
    <>
      <style>{`
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; gap: 32px; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <section id="contact" style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="contact-grid">
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 32 }}>{text.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={20} color="#2a6fdb" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>Email</div>
                    <a href={`mailto:${settings.email}`} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{settings.email}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={20} color="#2a6fdb" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>{text.phone}</div>
                    <a href={`tel:${settings.phone}`} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{settings.phone}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={20} color="#2a6fdb" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>{text.area}</div>
                    <span style={{ fontWeight: 500, color: '#1a2e44' }}>{settings.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #dce6f0', padding: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.firstName}</label>
                    <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.lastName}</label>
                    <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.phone}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.service}</label>
                  <select value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} style={inputStyle}>
                    <option value="">{text.selectService}</option>
                    {text.services.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.message}</label>
                  <textarea rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {result && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    background: result.ok ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${result.ok ? '#BBF7D0' : '#FECACA'}`,
                    borderRadius: 8, padding: '11px 14px', fontSize: 13,
                    color: result.ok ? '#15803D' : '#DC2626', lineHeight: 1.5,
                  }}>
                    {result.ok
                      ? <Check size={15} strokeWidth={3} style={{ flexShrink: 0, marginTop: 1 }} />
                      : <AlertTriangle size={15} strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 1 }} />}
                    <span>{result.text}</span>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={sending}
                  style={{ width: '100%', background: sending ? '#64748b' : '#1a2e44', color: '#fff', padding: 14, borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: sending ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {sending ? text.sending : text.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}