'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';
import { Mail, Phone, MapPin, ArrowRight, Check, X, AlertCircle } from 'lucide-react';

const CACHE_KEY = 'cms_platform_settings';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULTS = {
  email: 'info@physiohome.gr',
  phone: '+30 210 123 4567',
  address: 'Αθήνα & Αττική',
};

const TX = {
  el: {
    title: 'Επικοινωνήστε',
    titleEm: 'μαζί μας',
    desc: 'Συμπληρώστε τη φόρμα και θα επικοινωνήσουμε μαζί σας εντός 24 ωρών για να κλείσουμε τη συνεδρία σας.',
    labelEmail: 'Email',
    labelPhone: 'Τηλέφωνο',
    labelArea: 'Περιοχή Εξυπηρέτησης',
    firstName: 'Όνομα',
    lastName: 'Επώνυμο',
    optional: '(προαιρετικό)',
    service: 'Υπηρεσία',
    selectService: 'Επιλέξτε Υπηρεσία',
    message: 'Μήνυμα',
    terms: 'Αποδέχομαι τους ',
    termsLink: 'Όρους & Πολιτική Απορρήτου',
    send: 'Αποστολή Αιτήματος',
    sending: 'Αποστολή...',
    fallbackServices: [
      'Μυοσκελετική Φυσιοθεραπεία',
      'Μετεγχειρητική Αποκατάσταση',
      'Αποκατάσταση Αθλητικών Τραυματισμών',
    ],
    errRequired: 'Συμπληρώστε όνομα, email και μήνυμα, και αποδεχτείτε τους όρους.',
    errEmail: 'Το email δεν φαίνεται σωστό. Ελέγξτε το και δοκιμάστε ξανά.',
    errRate: 'Στείλατε ήδη αρκετά μηνύματα. Δοκιμάστε ξανά σε λίγη ώρα.',
    errSend: 'Δεν ήταν δυνατή η αποστολή. Δοκιμάστε ξανά σε λίγο ή στείλτε μας email απευθείας.',
    okTitle: 'Ευχαριστούμε που επικοινωνήσατε!',
    okDesc: 'Λάβαμε το αίτημά σας. Θα επικοινωνήσουμε μαζί σας στο',
    okEnd: 'εντός 24 ωρών.',
    okBtn: 'Εντάξει',
    close: 'Κλείσιμο',
  },
  en: {
    title: 'Get in',
    titleEm: 'touch',
    desc: "Fill out the form and we'll get back to you within 24 hours to schedule your session.",
    labelEmail: 'Email',
    labelPhone: 'Phone',
    labelArea: 'Service Area',
    firstName: 'First Name',
    lastName: 'Last Name',
    optional: '(optional)',
    service: 'Service',
    selectService: 'Select Service',
    message: 'Message',
    terms: 'I accept the ',
    termsLink: 'Terms and Privacy Policy',
    send: 'Send Request',
    sending: 'Sending...',
    fallbackServices: [
      'Musculoskeletal Physiotherapy',
      'Post-Surgery Rehabilitation',
      'Sports Injury Recovery',
    ],
    errRequired: 'Please fill in name, email and message, and accept the terms.',
    errEmail: "That email doesn't look right. Please check it and try again.",
    errRate: "You've sent several messages already. Please try again later.",
    errSend: 'We could not send your message. Please try again shortly, or email us directly.',
    okTitle: 'Thank you for reaching out!',
    okDesc: "We've received your request. We'll get back to you at",
    okEnd: 'within 24 hours.',
    okBtn: 'Got it',
    close: 'Close',
  },
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #dce6f0',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: 14,
  color: '#1a2e44',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: '#1a2e44',
  display: 'block',
  marginBottom: 6,
};

export default function Contact() {
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;

  const [settings, setSettings] = useState(DEFAULTS);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', service: '', message: '', website: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setSettings((prev) => ({ ...prev, ...value }));
            return;
          }
        }
      } catch (_) {}

      const { data } = await supabase.from('platform_settings').select('key, value');
      if (data) {
        const s = {};
        data.forEach((row) => { s[row.key] = row.value; });
        setSettings((prev) => ({ ...prev, ...s }));
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: s, timestamp: Date.now() }));
        } catch (_) {}
      }
    }

    async function fetchServices() {
      const { data } = await supabase
        .from('services')
        .select('id, title_el, title_en')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data && data.length > 0) setServices(data);
    }

    fetchSettings();
    fetchServices();
  }, []);

  const upd = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const serviceOptions = services.length > 0
    ? services.map((s) => (lang === 'el' ? s.title_el : s.title_en) || s.title_el)
    : tx.fallbackServices;

  async function handleSubmit() {
    // Το τηλέφωνο ΔΕΝ είναι υποχρεωτικό
    if (!form.firstName.trim() || !form.email.trim() || !form.message.trim() || !accepted) {
      setError(tx.errRequired);
      return;
    }
    if (!isEmail(form.email)) {
      setError(tx.errEmail);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          service: form.service,
          message: form.message.trim(),
          website: form.website, // honeypot
          lang,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error === 'rate_limited' ? tx.errRate : tx.errSend);
        setLoading(false);
        return;
      }

      setSentTo(form.email.trim());
      setSent(true);
      setForm({ firstName: '', lastName: '', email: '', phone: '', service: '', message: '', website: '' });
      setAccepted(false);
    } catch (err) {
      console.error('[contact-section] submit failed:', err);
      setError(tx.errSend);
    }

    setLoading(false);
  }

  const infoItems = [
    { Icon: Mail, label: tx.labelEmail, value: settings.email, href: `mailto:${settings.email}` },
    { Icon: Phone, label: tx.labelPhone, value: settings.phone, href: `tel:${String(settings.phone).replace(/\s/g, '')}` },
    { Icon: MapPin, label: tx.labelArea, value: settings.address },
  ];

  return (
    <>
      <style>{`
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .contact-form { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; padding: 32px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .hp-field { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; gap: 32px; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <section id="contact" style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="contact-grid">

            {/* Left Info */}
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {tx.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', marginBottom: 32 }}>{tx.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {infoItems.map((item) => {
                  const ItemIcon = item.Icon;
                  return (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ItemIcon size={20} color="#2a6fdb" strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>{item.label}</div>
                        {item.href
                          ? <a href={item.href} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{item.value}</a>
                          : <span style={{ fontWeight: 500, color: '#1a2e44' }}>{item.value}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Form */}
            <div className="contact-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

                {/* Honeypot */}
                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="hp-website">Website</label>
                  <input
                    id="hp-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => upd('website', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div>
                    <label style={labelStyle}>{tx.firstName}</label>
                    <input type="text" value={form.firstName} onChange={(e) => upd('firstName', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{tx.lastName}</label>
                    <input type="text" value={form.lastName} onChange={(e) => upd('lastName', e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{tx.labelEmail}</label>
                  <input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>
                    {tx.labelPhone}{' '}
                    <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>{tx.optional}</span>
                  </label>
                  <input type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>{tx.service}</label>
                  <select
                    value={form.service}
                    onChange={(e) => upd('service', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">{tx.selectService}</option>
                    {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>{tx.message}</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => upd('message', e.target.value)}
                    maxLength={1000}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>
                    {form.message.length}/1000
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="home-terms"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2a6fdb', flexShrink: 0 }}
                  />
                  <label htmlFor="home-terms" style={{ fontSize: 13.5, color: '#1a2e44', cursor: 'pointer', lineHeight: 1.5 }}>
                    {tx.terms}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2a6fdb', fontWeight: 600, textDecoration: 'underline' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tx.termsLink}
                    </a>
                  </label>
                </div>

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '11px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.5 }}>
                    <AlertCircle size={15} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    width: '100%', background: '#1a2e44', color: '#fff', padding: 14, borderRadius: 30,
                    fontSize: 15, fontWeight: 600, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? tx.sending : tx.send}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success modal */}
      {sent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSent(false); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '44px 40px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setSent(false)} aria-label={tx.close}
              style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, lineHeight: 0 }}>
              <X size={20} />
            </button>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={28} color="#065F46" strokeWidth={3} />
            </div>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1a2e44', marginBottom: 12 }}>{tx.okTitle}</h3>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.6, marginBottom: 26 }}>
              {tx.okDesc} <strong>{sentTo}</strong> {tx.okEnd}
            </p>
            <button onClick={() => setSent(false)}
              style={{ background: '#1a2e44', color: '#fff', padding: '12px 40px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {tx.okBtn}
            </button>
          </div>
        </div>
      )}
    </>
  );
}