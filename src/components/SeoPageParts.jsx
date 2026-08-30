'use client';
import { MapPin, ShieldCheck, Clock, ArrowRight, ChevronRight, Star } from 'lucide-react';

/**
 * Κοινά κομμάτια για τις SEO σελίδες (παθήσεις & περιοχές).
 *
 * ΓΙΑΤΙ ΞΕΧΩΡΙΣΤΟ ΑΡΧΕΙΟ:
 * Οι δύο σελίδες μοιράζονται breadcrumbs, therapist cards, FAQ και CTA.
 * Δύο αντίγραφα θα απέκλιναν στην πρώτη διόρθωση — το πάθαμε ήδη με το
 * Footer και τη φόρμα επικοινωνίας.
 */

export const S = {
  navy: '#1a2e44', accent: '#2a6fdb', soft: '#eaf2fc', off: '#faf9f6',
  muted: '#6b7a8d', faint: '#94a3b8', border: '#e5eaf0', line: '#f1f5f9',
  green: '#15803d', greenBg: '#f0fdf4', greenBr: '#bbf7d0',
};
export const SERIF = "'DM Serif Display', Georgia, serif";

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="breadcrumb" style={{ marginBottom: 22 }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((it, i) => (
          <li key={it.href || it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={13} color={S.faint} />}
            {it.href ? (
              <a href={it.href} style={{ fontSize: 13, color: S.muted, textDecoration: 'none' }}>{it.label}</a>
            ) : (
              <span style={{ fontSize: 13, color: S.faint }}>{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function TherapistCard({ t }) {
  const areas = Array.isArray(t.service_areas) ? t.service_areas : [];
  return (
    <a href={`/therapists/${t.id}`}
      style={{ display: 'block', background: '#fff', border: `1px solid ${S.border}`, borderRadius: 16, padding: 20, textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
        {t.photo_url ? (
          <img src={t.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: S.soft, color: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {(t.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.navy }}>{t.name}</div>
          {t.specialty && <div style={{ fontSize: 13, color: S.muted, marginTop: 2 }}>{t.specialty}</div>}
        </div>
      </div>

      {t.verified && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: S.greenBg, color: S.green, border: `1px solid ${S.greenBr}`, borderRadius: 30, padding: '4px 10px', fontSize: 11.5, fontWeight: 600, marginBottom: 12 }}>
          <ShieldCheck size={12} strokeWidth={2.3} />
          Επαληθευμένη άδεια
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: S.muted }}>
        {t.years_experience > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} color={S.faint} />{t.years_experience} χρόνια εμπειρίας
          </span>
        )}
        {(t.area || areas.length > 0) && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={S.faint} />
            {[t.area, ...areas].filter(Boolean).slice(0, 2).join(', ')}
          </span>
        )}
        {t.price > 0 && (
          <span style={{ fontWeight: 700, color: S.navy, fontSize: 15, marginTop: 4 }}>
            {Math.round(Number(t.price))}€ / συνεδρία
          </span>
        )}
      </div>
    </a>
  );
}

export function ChipLinks({ items, base, icon: Icon }) {
  if (!items?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
      {items.map(it => (
        <a key={it.slug} href={`${base}/${it.slug}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${S.border}`, borderRadius: 30, padding: '9px 17px', fontSize: 14, color: S.navy, textDecoration: 'none', fontWeight: 500 }}>
          {Icon && <Icon size={14} color={S.faint} strokeWidth={2} />}
          {it.name}
        </a>
      ))}
    </div>
  );
}

export function Faq({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((f, i) => (
        <details key={i} style={{ background: '#fff', border: `1px solid ${S.border}`, borderRadius: 14, padding: '16px 20px' }}>
          <summary style={{ fontSize: 15.5, fontWeight: 600, color: S.navy, cursor: 'pointer', listStyle: 'none' }}>
            {f.q}
          </summary>
          <p style={{ fontSize: 14.5, color: S.muted, lineHeight: 1.7, margin: '12px 0 0' }}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBox({ title, desc, href, label }) {
  return (
    <div style={{ background: S.navy, borderRadius: 18, padding: '32px 28px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 2.4vw, 27px)', color: '#fff', margin: '0 0 12px', fontWeight: 400, lineHeight: 1.35 }}>
        {title}
      </h2>
      <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: '0 auto 24px', maxWidth: 520 }}>
        {desc}
      </p>
      <a href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: S.navy, padding: '13px 30px', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
        {label}
        <ArrowRight size={17} />
      </a>
    </div>
  );
}

export function Section({ children, bg, style }) {
  return (
    <section style={{ padding: '56px 24px', background: bg || '#fff', ...style }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

export function H2({ children }) {
  return (
    <h2 className="seo-h2" style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 2.8vw, 32px)', color: S.navy, lineHeight: 1.28, margin: '0 0 18px', fontWeight: 400 }}>
      {children}
    </h2>
  );
}