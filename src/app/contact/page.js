'use client';
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLang } from '@/context/LanguageContext';

const t = {
  el: {
    title: 'Επικοινωνήστε',
    titleEm: 'μαζί μας',
    desc: 'Έχετε ερωτήσεις για τις υπηρεσίες μας; Είμαστε εδώ να βοηθήσουμε. Επικοινωνήστε μαζί μας και η ομάδα μας θα σας απαντήσει το συντομότερο δυνατό.',
    contacts: [
      { icon: '✉', label: 'Email', value: 'info@physiohome.gr', href: 'mailto:info@physiohome.gr' },
      { icon: '📞', label: 'Τηλέφωνο', value: '+30 210 123 4567', href: 'tel:+302101234567' },
      { icon: '📍', label: 'Περιοχή', value: 'Αθήνα & Αττική, Ελλάδα' },
    ],
    name: 'Όνομα',
    namePh: 'π.χ. Γιώργος',
    email: 'Email',
    emailPh: 'emailexample@gmail.com',
    message: 'Μήνυμα',
    messagePh: 'Γράψτε το μήνυμά σας εδώ...',
    terms: 'Αποδέχομαι τους ',
    termsLink: 'Όρους & Πολιτική Απορρήτου',
    submit: 'Αποστολή',
    required: 'Παρακαλώ συμπληρώστε όλα τα πεδία και αποδεχτείτε τους όρους.',
    successTitle: 'Ευχαριστούμε που επικοινωνήσατε!',
    successDesc: 'Λάβαμε το αίτημά σας και θα το εξετάσουμε σύντομα. Θα επικοινωνήσουμε μαζί σας στο',
    successEnd: 'εντός 24 ωρών.',
    successBtn: 'Εντάξει',
  },
  en: {
    title: 'Contact',
    titleEm: 'Us',
    desc: 'Have questions about our services? We\'re here to help. Reach out and our team will respond as soon as possible.',
    contacts: [
      { icon: '✉', label: 'Email', value: 'email@example.com', href: 'mailto:email@example.com' },
      { icon: '📞', label: 'Phone', value: '+1 (555) 000-0000', href: 'tel:+15550000000' },
      { icon: '📍', label: 'Location', value: '123 Sample St, Sydney NSW 2000 AU' },
    ],
    name: 'Name',
    namePh: 'e.g. John',
    email: 'Email',
    emailPh: 'emailexample@gmail.com',
    message: 'Message',
    messagePh: 'Type your message here...',
    terms: 'I accept the ',
    termsLink: 'Terms and Privacy Policy',
    submit: 'Submit',
    required: 'Please fill in all fields and accept the terms.',
    successTitle: 'Thank you for reaching out!',
    successDesc: 'We\'ve received your request and will review it shortly. We\'ll get back to you at',
    successEnd: 'within 24 hours.',
    successBtn: 'Got it',
  },
};

export default function ContactPage() {
  const { lang } = useLang();
  const tx = t[lang];

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message || !accepted) {
      setError(true);
      return;
    }
    setError(false);
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 800);
  };

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
        .contact-icon { width: 44px; height: 44px; border-radius: 10px; background: #e8f1fd; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
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
                {tx.contacts.map((item) => (
                  <div key={item.label} className="contact-info-item">
                    <div className="contact-icon">{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.label}</div>
                      {item.href
                        ? <a href={item.href} style={{ fontWeight: 600, color: '#1a2e44', textDecoration: 'none', fontSize: 15 }}>{item.value}</a>
                        : <span style={{ fontWeight: 600, color: '#1a2e44', fontSize: 15 }}>{item.value}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Form ── */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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

                {/* Terms */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="terms" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2a6fdb' }} />
                  <label htmlFor="terms" style={{ fontSize: 14, color: '#1a2e44', cursor: 'pointer' }}>
                    {tx.terms}<a href="#" style={{ color: '#2a6fdb', fontWeight: 600 }}>{tx.termsLink}</a>
                  </label>
                </div>

                {error && (
                  <div style={{ background: '#FFE4E6', color: '#9F1239', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
                    {tx.required}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%', background: '#1a2e44', color: '#fff', padding: '14px', borderRadius: 30, fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
                >
                  {loading ? '...' : tx.submit}
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
            <button onClick={() => setSubmitted(false)} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: '#065F46' }}>✓</div>
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