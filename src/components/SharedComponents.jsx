'use client';
import { useLang } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BookingButton from './BookingButton';

const BLOG_SLUGS = {
  el: [
    { slug: 'how-home-physiotherapy-can-help-with-back-and-neck-pain', cat: 'Συμβουλές Ανάρρωσης', time: '5 λεπτά ανάγνωση', title: 'Πώς να υποστηρίξετε την ανάρρωση από τραυματισμό στο σπίτι', desc: 'Απλές συνήθειες και πρακτικά βήματα που μπορούν να κάνουν τη διαδικασία ανάρρωσής σας πιο ομαλή.' },
    { slug: 'simple-ways-to-improve-mobility-and-balance-at-home', cat: 'Γιατί να μας επιλέξετε', time: '4 λεπτά ανάγνωση', title: 'Γιατί η φυσιοθεραπεία στο σπίτι είναι πιο αποτελεσματική', desc: 'Μάθετε γιατί η αποκατάσταση στο οικείο σας περιβάλλον δίνει καλύτερα αποτελέσματα.' },
  ],
  en: [
    { slug: 'how-home-physiotherapy-can-help-with-back-and-neck-pain', cat: 'Recovery Tips', time: '5 min read', title: 'How to support recovery after an injury at home', desc: 'Simple habits and practical steps that can help make your recovery process safer, smoother, and more effective.' },
    { slug: 'simple-ways-to-improve-mobility-and-balance-at-home', cat: 'Why Choose Us', time: '4 min read', title: 'Why home physiotherapy is more effective than clinic visits', desc: 'Learn why recovering in your familiar environment with a dedicated physiotherapist gives better results.' },
  ],
};

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
export function Partners() {
  const { lang } = useLang();
  return (
    <div style={{ background: '#f8fafb', padding: '36px 24px', borderTop: '1px solid #dce6f0', borderBottom: '1px solid #dce6f0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6b7a8d', marginBottom: 20, fontWeight: 500 }}>
          {lang === 'el' ? 'Οι Συνεργάτες μας' : 'Our Partners'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (<div key={i} style={{ width: 90, height: 32, borderRadius: 6, background: '#dce6f0', opacity: 0.6 }} />))}
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

// ─── Blog ─────────────────────────────────────────────────────────────────────
export function Blog() {
  const { lang } = useLang();
  const posts = BLOG_SLUGS[lang];
  const t = {
    el: { title: 'Συμβουλές &', titleEm: 'Πόροι Φυσιοθεραπείας', desc: 'Εξερευνήστε εξειδικευμένες συμβουλές και πρακτική καθοδήγηση για να υποστηρίξετε την ανάρρωσή σας στο σπίτι.', viewAll: 'Όλα τα Άρθρα', readMore: 'Διαβάστε περισσότερα →' },
    en: { title: 'Physiotherapy', titleEm: 'Tips & Resources', desc: 'Explore expert advice, recovery tips, and practical guidance to support your recovery at home.', viewAll: 'View All Articles', readMore: 'Read More →' },
  };
  const text = t[lang];
  return (
    <>
      <style>{`.blog-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; } @media (max-width: 640px) { .blog-grid { grid-template-columns: 1fr; } } .blog-card-home { background: #fff; border-radius: 16px; border: 1px solid #dce6f0; overflow: hidden; transition: all .3s; text-decoration: none; color: inherit; display: block; } .blog-card-home:hover { box-shadow: 0 4px 24px rgba(26,46,68,0.08); transform: translateY(-4px); }`}</style>
      <section id="blog" style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3vw, 40px)', color: '#1a2e44', lineHeight: 1.2, marginBottom: 12 }}>
                {text.title} <em style={{ fontStyle: 'italic', color: '#2a6fdb' }}>{text.titleEm}</em>
              </h2>
              <p style={{ fontSize: 16, color: '#6b7a8d', maxWidth: 560 }}>{text.desc}</p>
            </div>
            <a href="/blog" style={{ background: 'transparent', color: '#1a2e44', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1.5px solid #1a2e44' }}>{text.viewAll}</a>
          </div>
          <div className="blog-grid">
            {posts.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`} className="blog-card-home">
                <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #d4e8ff, #b8d4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a6fdb', fontSize: 13 }}>📷</div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2a6fdb', marginBottom: 8 }}>{post.cat} · {post.time}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e44', marginBottom: 8, lineHeight: 1.4 }}>{post.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 16 }}>{post.desc}</p>
                  <span style={{ fontSize: 13, color: '#2a6fdb', fontWeight: 500 }}>{text.readMore}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
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
      <style>{`.faq-item { border: 1px solid #dce6f0; border-radius: 12px; overflow: hidden; margin-bottom: 12px; cursor: pointer; }`}</style>
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
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

  return (
    <>
      <style>{`.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; } .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; gap: 32px; } .form-row { grid-template-columns: 1fr; } }`}</style>
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
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✉</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>Email</div>
                    <a href={`mailto:${settings.email}`} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{settings.email}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📞</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 2 }}>{text.phone}</div>
                    <a href={`tel:${settings.phone}`} style={{ fontWeight: 500, color: '#1a2e44', textDecoration: 'none' }}>{settings.phone}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📍</div>
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
                      <input type="text" style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                {[{ label: 'Email', type: 'email' }, { label: text.phone, type: 'tel' }].map((field) => (
                  <div key={field.label}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input type={field.type} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.service}</label>
                  <select style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                    <option>{text.selectService}</option>
                    {text.services.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e44', display: 'block', marginBottom: 6 }}>{text.message}</label>
                  <textarea rows={4} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dce6f0', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: '#1a2e44', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
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
export function Footer() {
  const { lang } = useLang();
  const settings = usePlatformSettings();

  const t = {
    el: { desc: 'Επαγγελματική, εξατομικευμένη φυσιοθεραπεία στην άνεση του σπιτιού σας.', menu: 'Μενού', legal: 'Νομικά', contact: 'Επικοινωνία', links: [['/how-it-works', 'Πώς Λειτουργεί'], ['/services', 'Υπηρεσίες'], ['/therapists', 'Θεραπευτές'], ['/blog', 'Blog'], ['/contact', 'Επικοινωνία']], legalLinks: [['#', 'Πολιτική Απορρήτου'], ['#', 'Όροι Χρήσης'], ['#', 'Πολιτική Cookies']], privLinks: [['#', 'Απόρρητο'], ['#', 'Όροι'], ['#', 'Cookies']] },
    en: { desc: 'Professional, personalized physiotherapy in the comfort of your home.', menu: 'Menu', legal: 'Legal', contact: 'Contact', links: [['/how-it-works', 'How It Works'], ['/services', 'Services'], ['/therapists', 'Therapists'], ['/blog', 'Blog'], ['/contact', 'Contact']], legalLinks: [['#', 'Privacy Policy'], ['#', 'Terms of Use'], ['#', 'Cookie Policy']], privLinks: [['#', 'Privacy'], ['#', 'Terms'], ['#', 'Cookies']] },
  };
  const text = t[lang];

  return (
    <>
      <style>{`.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; } .footer-bottom { display: flex; align-items: center; justify-content: space-between; } @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr; } } @media (max-width: 640px) { .footer-grid { grid-template-columns: 1fr; gap: 32px; } .footer-bottom { flex-direction: column; gap: 16px; text-align: center; } }`}</style>
      <footer style={{ background: '#0f1d2c', color: 'rgba(255,255,255,0.7)', padding: '60px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="footer-grid">
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
                {settings.platform_name}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{text.desc}</p>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{text.menu}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {text.links.map(([href, label]) => (<li key={href}><a href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a></li>))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{text.legal}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {text.legalLinks.map(([href, label]) => (<li key={label}><a href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a></li>))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{text.contact}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                  <span>✉</span>
                  <a href={`mailto:${settings.email}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{settings.email}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                  <span>📞</span>
                  <a href={`tel:${settings.phone}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{settings.phone}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                  <span>📍</span>
                  <span>{settings.address}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
            <div className="footer-bottom">
              <span style={{ fontSize: 13 }}>© {new Date().getFullYear()} {settings.platform_name}. {lang === 'el' ? 'Με επιφύλαξη παντός δικαιώματος.' : 'All rights reserved.'}</span>
              <div style={{ display: 'flex', gap: 24 }}>
                {text.privLinks.map(([href, label]) => (<a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{label}</a>))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}