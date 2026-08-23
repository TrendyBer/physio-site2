'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, MapPin, Check, X, AlertCircle } from 'lucide-react';

const CACHE_KEY = 'cms_platform_settings';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULTS = {
  email: 'info@physiohome.gr',
  phone: '+30 210 123 4567',
  address: 'Αθήνα & Αττική, Ελλάδα',
};

const t = {
  el: {
    title: 'Επικοινωνήστε',
    titleEm: 'μαζί μας',
    desc: 'Έχετε ερωτήσεις για τις υπηρεσίες μας; Είμαστε εδώ να βοηθήσουμε. Επικοινωνήστε μαζί μας και η ομάδα μας θα σας απαντήσει το συντομότερο δυνατό.',
    labels: { email: 'Email', phone: 'Τηλέφωνο', area: 'Περιοχή' },
    name: 'Όνομα',
    namePh: 'π.χ. Γιώργος',
    email: 'Email',
    emailPh: 'emailexample@gmail.com',
    message: 'Μήνυμα',
    messagePh: 'Γράψτε το μήνυμά σας εδώ...',
    terms: 'Αποδέχομαι τους ',
    termsLink: 'Όρους & Πολιτική Απορρήτου',
    submit: 'Αποστολή',
    sending: 'Αποστολή...',
    required: 'Παρακαλώ συμπληρώστε όλα τα πεδία και αποδεχτείτε τους όρους.',
    invalidEmail: 'Το email δεν φαίνεται σωστό. Ελέγξτε το και δοκιμάστε ξανά.',
    sendFailed: 'Δεν ήταν δυνατή η αποστολή. Δοκιμάστε ξανά σε λίγο ή στείλτε μας email απευθείας.',
    rateLimited: 'Στείλατε ήδη αρκετά μηνύματα. Δοκιμάστε ξανά σε λίγη ώρα.',
    successTitle: 'Ευχαριστούμε που επικοινωνήσατε!',
    successDesc: 'Λάβαμε το μήνυμά σας και θα το εξετάσουμε σύντομα. Θα επικοινωνήσουμε μαζί σας στο',
    successEnd: 'εντός 24 ωρών.',
    successBtn: 'Εντάξει',
    close: 'Κλείσιμο',
  },
  en: {
    title: 'Contact',
    titleEm: 'Us',
    desc: "Have questions about our services? We're here to help. Reach out and our team will respond as soon as possible.",
    labels: { email: 'Email', phone: 'Phone', area: 'Location' },
    name: 'Name',
    namePh: 'e.g. John',
    email: 'Email',
    emailPh: 'emailexample@gmail.com',
    message: 'Message',
    messagePh: 'Type your message here...',
    terms: 'I accept the ',
    termsLink: 'Terms and Privacy Policy',
    submit: 'Submit',
    sending: 'Sending...',
    required: 'Please fill in all fields and accept the terms.',
    invalidEmail: "That email doesn't look right. Please check it and try again.",
    sendFailed: 'We could not send your message. Please try again shortly, or email us directly.',
    rateLimited: "You've sent several messages already. Please try again later.",
    successTitle: 'Thank you for reaching out!',
    successDesc: "We've received your message and will review it shortly. We'll get back to you at",
    successEnd: 'within 24 hours.',
    successBtn: 'Got it',
    close: 'Close',
  },
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

export default function ContactPage() {
  const { lang } = useLang();
  const tx = t[lang];

  const [settings, setSettings] = useState(DEFAULTS);
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Στοιχεία επικοινωνίας από τη βάση — αλλάζουν από το admin panel
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
    fetchSettings();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || !accepted) {
      setError(tx.required);
      return;
    }
    if (!isEmail(form.email)) {
      setError(tx.invalidEmail);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.name.trim(),
          lastName: '',
          email: form.email.trim(),
          phone: '',
          service: '',
          message: form.message.trim(),
          website: form.website, // honeypot
          lang,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error === 'rate_limited' ? tx.rateLimited : tx.sendFailed);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setForm({ name: '', email: form.email, message: '', website: '' });
      setAccepted(false);
    } catch (err) {
      console.error('[contact] submit failed:', err);
      setError(tx.sendFailed);
    }

    setLoading(false);
  }

  const contactItems = [
    { Icon: Mail, label: tx.labels.email, value: settings.email, href: `mailto:${settings.email}` },
    { Icon: Phone, label: tx.labels.phone, value: settings.phone, href: `tel:${String(settings.phone).replace(/\s/g, '')}` },
    { Icon: MapPin, label: tx.labels.area, value: settings.address },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 80px; align-items: start; }
        @media (max-width: 900px) { .contact-grid { grid-template-columns: 1fr; gap: 48px; } }
        .form-input { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; color: #1a2e44; outline: none; transition: border-color .2s; background: #fff; }
        .form-input:focus { border-color: #2a6fdb; }
        .form-label { font-size: 13px; font-weight: 600; color: #1a2e44; margin-bottom: 6px; display: block; }
        .contact-info-item { display: flex; align-items: center; gap: 14px; }
        .contact-icon { width: 44px; height: 44px; border-radius: 10px; background: #e8f1fd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .hp-field { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
      `}</style>

      <Navbar />

      <section style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #f8fafb 100%)', minHeight: 'calc(100vh - 68px)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="contact-grid">

            {/* ── LEFT: Info ── */}
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 20 }}>
                {tx.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{tx.titleEm}</em>
              </h1>
              <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 40 }}>{tx.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {contactItems.map((item) => {
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
                          : <span style={{ fontWeight: 600, color: '#1a2e44', fontSize: 15 }}>{item.value}</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: Form ── */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>

                {/* Honeypot — αόρατο σε ανθρώπους, μόνο bots το γεμίζουν */}
                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">{tx.name}</label>
                  <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder={tx.namePh} />
                </div>

                <div>
                  <label className="form-label">{tx.email}</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="form-input" placeholder={tx.emailPh} />
                </div>

                <div>
                  <label className="form-label">{tx.message}</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={tx.messagePh}
                    rows={6}
                    style={{ resize: 'vertical' }}
                    maxLength={300}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{form.message.length}/300</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="terms" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2a6fdb' }} />
                  <label htmlFor="terms" style={{ fontSize: 14, color: '#1a2e44', cursor: 'pointer' }}>
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
                  <div style={{ background: '#FFE4E6', color: '#9F1239', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.5 }}>
                    <AlertCircle size={15} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%', background: '#1a2e44', color: '#fff', padding: '14px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
                >
                  {loading ? tx.sending : tx.submit}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUCCESS MODAL ── */}
      {submitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setSubmitted(false)} aria-label={tx.close} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 4, lineHeight: 0 }}>
              <X size={20} />
            </button>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={28} color="#065F46" strokeWidth={3} />
            </div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#1a2e44', marginBottom: 12 }}>{tx.successTitle}</h3>
            <p style={{ fontSize: 15, color: '#6b7a8d', lineHeight: 1.6, marginBottom: 28 }}>
              {tx.successDesc} <strong>{form.email}</strong> {tx.successEnd}
            </p>
            <button onClick={() => setSubmitted(false)} style={{ background: '#1a2e44', color: '#fff', padding: '12px 40px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {tx.successBtn}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}