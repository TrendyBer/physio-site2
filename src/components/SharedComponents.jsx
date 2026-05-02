'use client';
import { useLang } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, MapPin } from 'lucide-react';
import BookingButton from './BookingButton';

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
    el: { title: 'Έτοιμοι να Ξεκινήσετε το', titleEm: 'Ταξίδι Ανάρρωσής σας', desc: 'Κλείστε την πρώτη σας συνεδρία σήμερα και ζήστε τη διαφορά της εξατομικευμένης φυσιοθεραπείας στο σπίτι.', cta: 'Κλείστε Ραντεβού →' },
    en: { title: 'Ready to Start Your', titleEm: 'Recovery Journey', desc: 'Request your first session today and experience the difference of personalized home physiotherapy.', cta: 'Request a Session →' },
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
        { q: 'Χρειάζομαι παραπομπή για να κλείσω συνεδρία;', a: 'Στις περισσότερες περιπτώσεις, μπορείτε να ζητήσετε συνεδρία φυσιοθεραπείας απευθείας χωρίς παραπομπή.' },
        { q: 'Τι γίνεται κατά την πρώτη επίσκεψη στο σπίτι;', a: 'Ο θεραπευτής σας θα αξιολογήσει την κατάστασή σας, θα συζητήσει τους στόχους σας και θα δημιουργήσει ένα εξατομικευμένο πλάνο θεραπείας.' },
        { q: 'Ποιες περιοχές εξυπηρετείτε;', a: 'Εξυπηρετούμε όλη την Αθήνα και την Αττική. Επικοινωνήστε μαζί μας για να επιβεβαιώσετε τη διαθεσιμότητα στην περιοχή σας.' },
        { q: 'Πόσο κοστίζει μια συνεδρία;', a: 'Οι τιμές ξεκινούν από €20/ώρα και διαφέρουν ανάλογα με τον τύπο θεραπείας. Επικοινωνήστε για προσφορά.' },
      ],
    },
    en: {
      title: 'Frequently', titleEm: 'Asked Questions',
      desc: "Can't find what you're looking for? We're here to help.",
      contact: 'Contact Us',
      faqs: [
        { q: 'Do I need a referral to book a session?', a: 'In most cases, you can request a physiotherapy session directly without a referral.' },
        { q: 'What happens during the first home visit?', a: 'Your therapist will assess your condition, discuss your goals, and create a personalized treatment plan.' },
        { q: 'Which areas do you serve?', a: 'We serve all of Athens and Attica. Contact us to confirm availability in your area.' },
        { q: 'How much does a session cost?', a: 'Prices start from €20/hour and vary depending on the type of therapy. Contact us for a quote.' },
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
export function Contact() {
  const { lang } = useLang();
  const settings = usePlatformSettings();

  const t = {
    el: {
      title: 'Επικοινωνήστε', titleEm: 'μαζί μας',
      desc: 'Συμπληρώστε τη φόρμα και θα επικοινωνήσουμε μαζί σας εντός 24 ωρών.',
      phone: 'Τηλέφωνο', area: 'Περιοχή Εξυπηρέτησης',
      firstName: 'Όνομα', lastName: 'Επώνυμο', message: 'Μήνυμα',
      service: 'Υπηρεσία', selectService: 'Επιλέξτε Υπηρεσία',
      services: ['Μυοσκελετική Φυσιοθεραπεία', 'Μετεγχειρητική Αποκατάσταση', 'Αποκατάσταση Αθλητικών Τραυματισμών'],
      send: 'Αποστολή Αιτήματος →', successMsg: 'Ευχαριστούμε! Θα επικοινωνήσουμε μαζί σας εντός 24 ωρών.',
    },
    en: {
      title: 'Contact', titleEm: 'Us',
      desc: 'Fill out the form and we will get back to you within 24 hours.',
      phone: 'Phone', area: 'Service Area',
      firstName: 'First Name', lastName: 'Last Name', message: 'Message',
      service: 'Service', selectService: 'Select Service',
      services: ['Musculoskeletal Physiotherapy', 'Post-Surgery Rehabilitation', 'Sports Injury Recovery'],
      send: 'Send Request →', successMsg: 'Thank you! We will contact you within 24 hours.',
    },
  };
  const text = t[lang];

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', boxSizing: 'border-box', background: '#fff' };

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
                  {[text.firstName, text.lastName].map((label) => (
                    <div key={label}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input type="text" style={inputStyle} />
                    </div>
                  ))}
                </div>
                {[{ label: 'Email', type: 'email' }, { label: text.phone, type: 'tel' }].map((field) => (
                  <div key={field.label}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input type={field.type} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.service}</label>
                  <select style={inputStyle}>
                    <option>{text.selectService}</option>
                    {text.services.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.message}</label>
                  <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <button style={{ width: '100%', background: '#1a2e44', color: '#fff', padding: 14, borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => alert(text.successMsg)}>
                  {text.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
// Last updated 2 May 2026 — fixed legal links from '#' to actual paths
export function Footer() {
  const { lang } = useLang();
  const settings = usePlatformSettings();

  const t = {
    el: {
      desc: 'Επαγγελματική, εξατομικευμένη φυσιοθεραπεία στην άνεση του σπιτιού σας.',
      menu: 'Μενού',
      legal: 'Νομικά',
      contact: 'Επικοινωνία',
      links: [
        ['/how-it-works', 'Πώς Λειτουργεί'],
        ['/services', 'Υπηρεσίες'],
        ['/therapists', 'Θεραπευτές'],
        ['/blog', 'Blog'],
        ['/contact', 'Επικοινωνία'],
      ],
      legalLinks: [
        ['/privacy', 'Πολιτική Απορρήτου'],
        ['/terms', 'Όροι Χρήσης'],
        ['/cookies', 'Πολιτική Cookies'],
        ['/become-therapist', 'Γίνε Θεραπευτής'],
      ],
      privLinks: [
        ['/privacy', 'Απόρρητο'],
        ['/terms', 'Όροι'],
        ['/cookies', 'Cookies'],
      ],
    },
    en: {
      desc: 'Professional, personalized physiotherapy in the comfort of your home.',
      menu: 'Menu',
      legal: 'Legal',
      contact: 'Contact',
      links: [
        ['/how-it-works', 'How It Works'],
        ['/services', 'Services'],
        ['/therapists', 'Therapists'],
        ['/blog', 'Blog'],
        ['/contact', 'Contact'],
      ],
      legalLinks: [
        ['/privacy', 'Privacy Policy'],
        ['/terms', 'Terms of Use'],
        ['/cookies', 'Cookie Policy'],
        ['/become-therapist', 'Become a Therapist'],
      ],
      privLinks: [
        ['/privacy', 'Privacy'],
        ['/terms', 'Terms'],
        ['/cookies', 'Cookies'],
      ],
    },
  };
  const text = t[lang];

  return (
    <>
      <style>{`
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
        .footer-bottom { display: flex; align-items: center; justify-content: space-between; }
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .footer-grid { grid-template-columns: 1fr; gap: 32px; } .footer-bottom { flex-direction: column; gap: 16px; text-align: center; } }
      `}</style>
      <footer style={{ background: '#0f1d2c', color: 'rgba(255,255,255,0.7)', padding: '60px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="footer-grid">

            {/* Brand */}
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
                {settings.platform_name}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{text.desc}</p>
            </div>

            {/* Menu */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{text.menu}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {text.links.map(([href, label]) => (
                  <li key={href}>
                    <a href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{text.legal}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {text.legalLinks.map(([href, label]) => (
                  <li key={label}>
                    <a href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{text.contact}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                  <Mail size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <a href={`mailto:${settings.email}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', wordBreak: 'break-all' }}>{settings.email}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                  <Phone size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <a href={`tel:${settings.phone}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{settings.phone}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                  <MapPin size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{settings.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
            <div className="footer-bottom">
              <span style={{ fontSize: 13 }}>
                © {new Date().getFullYear()} {settings.platform_name}. {lang === 'el' ? 'Με επιφύλαξη παντός δικαιώματος.' : 'All rights reserved.'}
              </span>
              <div style={{ display: 'flex', gap: 24 }}>
                {text.privLinks.map(([href, label]) => (
                  <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}