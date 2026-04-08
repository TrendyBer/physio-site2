'use client';
import { useLang } from '@/context/LanguageContext';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const { lang, toggleLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  const t = {
    el: {
      howItWorks: 'Πώς Λειτουργεί', services: 'Υπηρεσίες',
      therapists: 'Θεραπευτές', blog: 'Blog', contact: 'Επικοινωνία',
      cta: 'Κλείστε Ραντεβού',
    },
    en: {
      howItWorks: 'How it Works', services: 'Services',
      therapists: 'For Therapists', blog: 'Blog', contact: 'Contacts',
      cta: 'Request a Session',
    },
  };
  const text = t[lang];
  const links = [
    { label: text.howItWorks, href: '/how-it-works' },
    { label: text.services, href: '/services' },
    { label: text.blog, href: '/blog' },
    { label: text.therapists, href: '/therapists' },
    { label: text.contact, href: '/contact' },
  ];

  return (
    <>
      <style>{`
        .nav-links-desktop { display: flex; }
        .nav-cta-desktop { display: flex; }
        .hamburger { display: none !important; }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-cta-desktop { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #dce6f0', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a2e44', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
            PhysioHome
          </Link>

          <ul className="nav-links-desktop" style={{ alignItems: 'center', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
            {links.map((item) => (
              <li key={item.href}>
                <a href={item.href} style={{ fontSize: 14, fontWeight: 500, color: '#6b7a8d', textDecoration: 'none' }}>{item.label}</a>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={toggleLang} style={{ border: '1px solid #dce6f0', background: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, color: '#6b7a8d', cursor: 'pointer' }}>
              {lang === 'el' ? 'EN' : 'ΕΛ'}
            </button>
            <a href="/request" className="nav-cta-desktop" style={{ background: '#1a2e44', color: '#fff', padding: '10px 22px', borderRadius: 30, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              {text.cta}
            </a>
            <button className="hamburger" onClick={() => setMenuOpen(true)} style={{ flexDirection: 'column', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
              <span style={{ width: 24, height: 2, background: '#1a2e44', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 24, height: 2, background: '#1a2e44', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 24, height: 2, background: '#1a2e44', borderRadius: 2, display: 'block' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff', display: 'flex', flexDirection: 'column', padding: '20px 24px', overflowY: 'auto' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#1a2e44' }}>PhysioHome</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a href="/request" onClick={() => setMenuOpen(false)} style={{ background: '#1a2e44', color: '#fff', padding: '8px 18px', borderRadius: 30, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                {text.cta}
              </a>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1a2e44', padding: 4 }}>✕</button>
            </div>
          </div>

          {/* Language toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            <button onClick={() => { if (lang !== 'en') toggleLang(); }} style={{ padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: lang === 'en' ? '#1a2e44' : '#dce6f0', background: lang === 'en' ? '#1a2e44' : '#fff', color: lang === 'en' ? '#fff' : '#6b7a8d' }}>EN</button>
            <button onClick={() => { if (lang !== 'el') toggleLang(); }} style={{ padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: lang === 'el' ? '#1a2e44' : '#dce6f0', background: lang === 'el' ? '#1a2e44' : '#fff', color: lang === 'el' ? '#fff' : '#6b7a8d' }}>EL</button>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {links.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ fontSize: 18, fontWeight: 600, color: '#1a2e44', textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                {item.label}
              </a>
            ))}
          </nav>

          {/* Contact info at bottom */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a href="mailto:email@example.com" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#6b7a8d', textDecoration: 'none' }}>
              <span>✉</span> email@example.com
            </a>
            <a href="tel:+15550000000" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#6b7a8d', textDecoration: 'none' }}>
              <span>📞</span> +1 (555) 000-0000
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#6b7a8d' }}>
              <span>📍</span> 123 Sample St, Sydney NSW 2000 AU
            </div>
          </div>
        </div>
      )}
    </>
  );
}