'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, MapPin, Check, X, AlertCircle, ArrowRight } from 'lucide-react';

const CACHE_KEY = 'cms_platform_settings';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULTS = {
  email: 'info@physiohome.gr',
  phone: '+30 210 123 4567',
  address: 'Αθήνα & Αττική, Ελλάδα',
};

const TX = {
  el: {
    title: 'Επικοινωνήστε',
    titleEm: 'μαζί μας',
    desc: 'Έχετε ερωτήσεις για τις υπηρεσίες μας; Είμαστε εδώ να βοηθήσουμε. Επικοινωνήστε μαζί μας και η ομάδα μας θα σας απαντήσει το συντομότερο δυνατό.',
    labelEmail: 'Email',
    labelPhone: 'Τηλέφωνο',
    labelArea: 'Περιοχή Εξυπηρέτησης',
    firstName: 'Όνομα',
    lastName: 'Επώνυμο',
    phone: 'Τηλέφωνο',
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
    title: 'Contact',
    titleEm: 'Us',
    desc: "Have questions about our services? We're here to help. Reach out and our team will respond as soon as possible.",
    labelEmail: 'Email',
    labelPhone: 'Phone',
    labelArea: 'Service Area',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone',
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

export default function ContactPage() {
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
      console.error('[contact] submit failed:', err);
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 70px; align-items: start; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-input {
          width: 100%; padding: 13px 15px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-family: inherit; color: #1a2e44; outline: none;
          transition: border-color .2s; background: #fff; box-sizing: border-box;
        }
        .form-input:focus { border-color: #2a6fdb; }
        .form-label { font-size: 13px; font-weight: 600; color: #1a2e44; margin-bottom: 6px; display: block; }
        .form-optional { font-weight: 400; color: #94a3b8; font-size: 12px; }
        .contact-info-item { display: flex; align-items: center; gap: 14px; }
        .contact-icon { width: 44px; height: 44px; border-radius: 10px; background: #e8f1fd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .hp-field { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr; gap: 44px; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <Navbar />

      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #f8fafb 100%)', minHeight: 'calc(100vh - 68px)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="contact-grid">

            {/* ── LEFT: Info ── */}
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 20 }}>
                {tx.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.titleEm}</em>
              </h1>
              <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 40 }}>{tx.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {infoItems.map((item) => {
                  const ItemIcon = item.Icon;
                  return (
                    <div key={item.label} className="contact-info-item">
                      <div className="contact-icon">
                        <ItemIcon size={20} color="#2a6fdb" strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.label}</div>
                        {item.href
                          ? <a href={item.href} style={{ fontWeight: 600, color: '#1a2e44', textDecoration: 'none', fontSize: 15 }}>{item.value}</a>
                          : <span style={{ fontWeight: 600, color: '#1a2e44', fontSize: 15 }}>{item.value}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: Form ── */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
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
                    <label className="form-label">{tx.firstName}</label>
                    <input type="text" value={form.firstName} onChange={(e) => upd('firstName', e.target.value)} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">{tx.lastName}</label>
                    <input type="text" value={form.lastName} onChange={(e) => upd('lastName', e.target.value)} className="form-input" />
                  </div>
                </div>

                <div>
                  <label className="form-label">{tx.labelEmail}</label>
                  <input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} className="form-input" />
                </div>

                <div>
                  <label className="form-label">
                    {tx.phone} <span className="form-optional">{tx.optional}</span>
                  </label>
                  <input type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} className="form-input" />
                </div>

                <div>
                  <label className="form-label">{tx.service}</label>
                  <select
                    value={form.service}
                    onChange={(e) => upd('service', e.target.value)}
                    className="form-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">{tx.selectService}</option>
                    {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">{tx.message}</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => upd('message', e.target.value)}
                    maxLength={1000}
                    className="form-input"
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>
                    {form.message.length}/1000
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2a6fdb', flexShrink: 0 }}
                  />
                  <label htmlFor="terms" style={{ fontSize: 13.5, color: '#1a2e44', cursor: 'pointer', lineHeight: 1.5 }}>
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

      {/* ── SUCCESS MODAL ── */}
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
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#1a2e44', marginBottom: 12 }}>{tx.okTitle}</h3>
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

      <Footer />
    </>
  );
}