'use client';
// ΚΑΝΟΝΙΚΟ Footer — η ΜΟΝΗ υλοποίηση στο project.
// Το SharedComponents.jsx κάνει re-export αυτό το αρχείο· δεν έχει δικό του.
// Αν χρειαστεί αλλαγή σε link, γίνεται ΕΔΩ και μόνο εδώ.
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const CACHE_KEY = 'cms_platform_settings';
const CONDITIONS_CACHE_KEY = 'cms_popular_conditions';
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULTS = {
  platform_name: 'PhysioHome',
  email: 'info@physiohome.gr',
  phone: '+30 210 123 4567',
  address: 'Αθήνα & Αττική, Ελλάδα',
};

const TX = {
  el: {
    desc: 'Επαγγελματική, εξατομικευμένη φυσιοθεραπεία στην άνεση του σπιτιού σας.',
    findHelp: 'Βρες τη βοήθειά σου',
    menu: 'Μενού',
    conditions: 'Δημοφιλείς Παθήσεις',
    legal: 'Νομικά',
    contact: 'Επικοινωνία',
    rights: 'Με επιφύλαξη παντός δικαιώματος.',
    menuLinks: [
      ['/', 'Αρχική'],
      ['/how-it-works', 'Πώς Λειτουργεί'],
      ['/therapists', 'Θεραπευτές'],
      ['/find-help', 'Παθήσεις'],
      ['/blog', 'Blog'],
      ['/contact', 'Επικοινωνία'],
    ],
    legalLinks: [
      ['/privacy', 'Πολιτική Απορρήτου'],
      ['/terms', 'Όροι Χρήσης'],
      ['/cookies', 'Πολιτική Cookies'],
      ['/become-therapist', 'Γίνε Θεραπευτής'],
    ],
    bottomLinks: [
      ['/privacy', 'Απόρρητο'],
      ['/terms', 'Όροι'],
      ['/cookies', 'Cookies'],
    ],
    fallbackConditions: [
      ['/find-help/low_back_pain', 'Οσφυαλγία'],
      ['/find-help/neck_pain', 'Αυχενικό σύνδρομο'],
      ['/find-help/knee_pain', 'Πόνος γόνατου'],
      ['/find-help/sciatica', 'Ισχιαλγία'],
      ['/find-help/sports_injury', 'Αθλητικός τραυματισμός'],
    ],
  },
  en: {
    desc: 'Professional, personalized physiotherapy in the comfort of your home.',
    findHelp: 'Find your help',
    menu: 'Menu',
    conditions: 'Popular Conditions',
    legal: 'Legal',
    contact: 'Contact',
    rights: 'All rights reserved.',
    menuLinks: [
      ['/', 'Home'],
      ['/how-it-works', 'How It Works'],
      ['/therapists', 'Therapists'],
      ['/find-help', 'Conditions'],
      ['/blog', 'Blog'],
      ['/contact', 'Contact'],
    ],
    legalLinks: [
      ['/privacy', 'Privacy Policy'],
      ['/terms', 'Terms of Use'],
      ['/cookies', 'Cookie Policy'],
      ['/become-therapist', 'Become a Therapist'],
    ],
    bottomLinks: [
      ['/privacy', 'Privacy'],
      ['/terms', 'Terms'],
      ['/cookies', 'Cookies'],
    ],
    fallbackConditions: [
      ['/find-help/low_back_pain', 'Low back pain'],
      ['/find-help/neck_pain', 'Neck pain'],
      ['/find-help/knee_pain', 'Knee pain'],
      ['/find-help/sciatica', 'Sciatica'],
      ['/find-help/sports_injury', 'Sports injury'],
    ],
  },
};

export default function Footer() {
  const { lang } = useLang();
  const tx = TX[lang] || TX.el;

  const [settings, setSettings] = useState(DEFAULTS);
  const [popularConditions, setPopularConditions] = useState([]);

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

    async function fetchConditions() {
      try {
        const cached = sessionStorage.getItem(CONDITIONS_CACHE_KEY);
        if (cached) {
          const { value, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setPopularConditions(value);
            return;
          }
        }
      } catch (_) {}

      const { data } = await supabase
        .from('conditions')
        .select('slug, name_el, name_en')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('display_order', { ascending: true })
        .limit(9);

      if (data) {
        setPopularConditions(data);
        try {
          sessionStorage.setItem(CONDITIONS_CACHE_KEY, JSON.stringify({ value: data, timestamp: Date.now() }));
        } catch (_) {}
      }
    }

    fetchSettings();
    fetchConditions();
  }, []);

  return (
    <>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr;
          gap: 32px;
          margin-bottom: 40px;
        }
        .footer-bottom { display: flex; align-items: center; justify-content: space-between; }
        .footer-legal-bottom { display: flex; gap: 24px; }
        .footer-link { font-size: 14px; color: rgba(255,255,255,0.7); text-decoration: none; transition: color .15s; }
        .footer-link:hover { color: #fff; }
        .footer-link-small { font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none; transition: color .15s; }
        .footer-link-small:hover { color: #fff; }
        .footer-cta-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #2a6fdb; color: #fff; padding: 8px 16px;
          border-radius: 20px; font-size: 12px; font-weight: 600; text-decoration: none;
        }
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr; gap: 28px; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }
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
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{tx.desc}</p>
              <a href="/find-help" className="footer-cta-btn">
                {tx.findHelp}
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Menu */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{tx.menu}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tx.menuLinks.map(([href, label]) => (
                  <li key={href}><a href={href} className="footer-link">{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Popular Conditions */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>
                {tx.conditions}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {popularConditions.length > 0
                  ? popularConditions.map(c => (
                    <li key={c.slug}>
                      <a href={`/find-help/${c.slug}`} className="footer-link-small">
                        {lang === 'el' ? c.name_el : (c.name_en || c.name_el)}
                      </a>
                    </li>
                  ))
                  : tx.fallbackConditions.map(([href, label]) => (
                    <li key={href}><a href={href} className="footer-link-small">{label}</a></li>
                  ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{tx.legal}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tx.legalLinks.map(([href, label]) => (
                  <li key={href}><a href={href} className="footer-link">{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff', marginBottom: 16, fontWeight: 600 }}>{tx.contact}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                  <Mail size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <a href={`mailto:${settings.email}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', wordBreak: 'break-all' }}>
                    {settings.email}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                  <Phone size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <a href={`tel:${settings.phone}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                    {settings.phone}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
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
                © {new Date().getFullYear()} {settings.platform_name}. {tx.rights}
              </span>
              <div className="footer-legal-bottom">
                {tx.bottomLinks.map(([href, label]) => (
                  <a key={label} href={href} className="footer-link-small">{label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}