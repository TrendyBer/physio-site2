'use client';
// src/components/InfoPage.jsx
// Απλή, λιτή σελίδα κειμένου (Σχετικά, Επαλήθευση κ.λπ.) με το ίδιο ύφος
// με το υπόλοιπο site. Παίρνει το περιεχόμενο σε δύο γλώσσες και δείχνει
// αυτή που έχει επιλέξει ο επισκέπτης.
//
// content = { el: {...}, en: {...} } με:
//   eyebrow, title, lead,
//   sections: [{ h, p?: [..], list?: [..], note? }],
//   cta?: { title, desc, href, label }
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLang } from '@/context/LanguageContext';
import { C, R } from '@/lib/tokens';

export default function InfoPage({ content }) {
  const { lang } = useLang();
  const c = content[lang] || content.el;

  return (
    <>
      <Navbar />
      <main style={{ background: C.page }}>
        <section style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '64px 24px 48px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {c.eyebrow && (
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                {c.eyebrow}
              </div>
            )}
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: C.brand, lineHeight: 1.15, marginBottom: 16 }}>{c.title}</h1>
            {c.lead && <p style={{ fontSize: 17, color: C.textMuted, lineHeight: 1.65 }}>{c.lead}</p>}
          </div>
        </section>

        <section style={{ padding: '48px 24px 64px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {c.sections.map((s, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: R.card, padding: '24px 26px' }}>
                <h2 style={{ fontSize: 19, color: C.brand, marginBottom: 10 }}>{s.h}</h2>
                {(s.p || []).map((t, j) => (
                  <p key={j} style={{ fontSize: 15, color: C.textBody, lineHeight: 1.7, marginBottom: 8 }}>{t}</p>
                ))}
                {s.list && (
                  <ul style={{ paddingLeft: 20, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {s.list.map((t, j) => (
                      <li key={j} style={{ fontSize: 15, color: C.textBody, lineHeight: 1.65 }}>{t}</li>
                    ))}
                  </ul>
                )}
                {s.note && (
                  <p style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.borderSoft}` }}>{s.note}</p>
                )}
                {s.link && (
                  <Link href={s.link.href} style={{ display: 'inline-block', marginTop: 10, fontSize: 14, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>
                    {s.link.label} →
                  </Link>
                )}
              </div>
            ))}

            {c.cta && (
              <div style={{ background: C.brand, borderRadius: R.card, padding: '28px 26px', color: '#fff', marginTop: 8 }}>
                <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>{c.cta.title}</div>
                <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.75)', marginBottom: 16, lineHeight: 1.6 }}>{c.cta.desc}</div>
                <Link href={c.cta.href} style={{ display: 'inline-block', background: '#fff', color: C.brand, padding: '12px 24px', borderRadius: R.button, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                  {c.cta.label}
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
