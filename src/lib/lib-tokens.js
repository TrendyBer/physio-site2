/**
 * DESIGN TOKENS
 *
 * ΓΙΑΤΙ ΥΠΑΡΧΕΙ ΑΥΤΟ ΤΟ ΑΡΧΕΙΟ:
 * Τα χρώματα ήταν γραμμένα κατευθείαν μέσα σε κάθε component — #1a2e44 εδώ,
 * #2a6fdb εκεί, δεκάδες pastel αποχρώσεις παντού. Αν αλλάξει το brand, θα
 * χρειαζόταν να ξαναγραφτεί κάθε αρχείο.
 *
 * Τα ονόματα είναι ΟΥΔΕΤΕΡΑ επίτηδες: brand, surface, accent — όχι
 * physioBlue, physioGreen. Αν αλλάξει λογότυπο ή όνομα, αλλάζουν μόνο
 * οι τιμές εδώ.
 *
 * Χρήση:
 *   import { C, R, S, T, card, btn, badge } from '@/lib/tokens';
 *   <div style={card()}>...</div>
 *   <button style={btn('primary')}>Αποθήκευση</button>
 */

// ─── ΧΡΩΜΑΤΑ ─────────────────────────────────────────────────────────────
export const C = {
  // Ταυτότητα
  brand:        '#1a2e44',  // σκούρο navy — CTA, headings, navigation
  brandSoft:    '#2a4a6b',  // hover του brand
  accent:       '#2a6fdb',  // links, ενεργά στοιχεία
  accentSoft:   '#eaf2fc',  // very light blue — secondary surfaces
  accentBorder: '#c8dff9',

  // Επιφάνειες
  page:      '#f8fafb',  // ήρεμο background σελίδας
  surface:   '#ffffff',  // λευκές cards
  surfaceAlt:'#f8fafc',  // ελαφρώς τονισμένη ζώνη μέσα σε card
  border:    '#e5eaf0',  // πολύ ελαφρύ grey-blue
  borderSoft:'#f1f5f9',  // διαχωριστικά μέσα σε card

  // Κείμενο
  text:      '#0f172a',
  textBody:  '#334155',
  textMuted: '#64748b',  // secondary text
  textFaint: '#94a3b8',  // helper text, disabled

  // ΚΑΤΑΣΤΑΣΕΙΣ — μόνο όπου έχουν λειτουργικό νόημα
  successBg: '#f0fdf4', successBorder: '#bbf7d0', success: '#15803d',
  warnBg:    '#fffbeb', warnBorder:    '#fde68a', warn:    '#b45309',
  dangerBg:  '#fef2f2', dangerBorder:  '#fecaca', danger:  '#be123c',
  infoBg:    '#eff6ff', infoBorder:    '#bfdbfe', info:    '#1d4ed8',
};

// ─── RADIUS ──────────────────────────────────────────────────────────────
// Ένα σύστημα, όχι διαφορετικό radius σε κάθε component.
export const R = {
  card:   16,
  modal:  20,
  input:  10,
  button: 12,
  pill:   999,
  small:  8,
};

// ─── SPACING ─────────────────────────────────────────────────────────────
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────
// Serif ΜΟΝΟ σε μεγάλα, ανθρώπινα headings. Ποτέ σε tables, tabs ή labels.
export const F = {
  sans:  "'DM Sans', -apple-system, system-ui, sans-serif",
  serif: "'DM Serif Display', Georgia, serif",
};

export const T = {
  pageTitle:    { fontFamily: F.serif, fontSize: 'clamp(26px, 3.2vw, 34px)', fontWeight: 400, color: C.text,      lineHeight: 1.2 },
  sectionTitle: { fontFamily: F.sans,  fontSize: 21,  fontWeight: 600, color: C.text,      lineHeight: 1.3 },
  cardTitle:    { fontFamily: F.sans,  fontSize: 17,  fontWeight: 600, color: C.text,      lineHeight: 1.35 },
  body:         { fontFamily: F.sans,  fontSize: 15,  fontWeight: 400, color: C.textBody,  lineHeight: 1.65 },
  secondary:    { fontFamily: F.sans,  fontSize: 13.5,fontWeight: 400, color: C.textMuted, lineHeight: 1.6 },
  label:        { fontFamily: F.sans,  fontSize: 12.5,fontWeight: 500, color: C.textMuted, lineHeight: 1.4 },
  eyebrow:      { fontFamily: F.sans,  fontSize: 11,  fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '.07em' },
};

export const MAX_WIDTH = 1160;

// ─── ΒΟΗΘΗΤΙΚΑ ───────────────────────────────────────────────────────────

// Λευκή card με ελαφρύ border. Η προεπιλογή για σχεδόν τα πάντα.
export function card(extra = {}) {
  return {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: R.card,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    padding: S.xl,
    boxSizing: 'border-box',
    ...extra,
  };
}

// ΤΡΙΑ button styles, όχι δέκα.
// Το πράσινο ΔΕΝ είναι primary CTA — σημαίνει success/completed/available.
export function btn(variant = 'primary', extra = {}) {
  const base = {
    fontFamily: F.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: R.button,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    whiteSpace: 'nowrap',
    transition: 'all .15s',
    boxSizing: 'border-box',
  };
  const styles = {
    primary:     { background: C.brand,   color: '#fff',     border: `1px solid ${C.brand}` },
    secondary:   { background: C.surface, color: C.brand,    border: `1.5px solid ${C.brand}` },
    quiet:       { background: C.surface, color: C.textMuted,border: `1px solid ${C.border}` },
    destructive: { background: C.surface, color: C.danger,   border: `1.5px solid ${C.dangerBorder}` },
    disabled:    { background: C.borderSoft, color: C.textFaint, border: `1px solid ${C.border}`, cursor: 'not-allowed' },
  };
  return { ...base, ...(styles[variant] || styles.primary), ...extra };
}

// Ενιαία status badges: ίδιο ύψος, typography και padding παντού.
const BADGE = {
  confirmed: { bg: C.infoBg,    fg: C.info,    br: C.infoBorder },
  active:    { bg: C.infoBg,    fg: C.info,    br: C.infoBorder },
  completed: { bg: C.successBg, fg: C.success, br: C.successBorder },
  verified:  { bg: C.successBg, fg: C.success, br: C.successBorder },
  available: { bg: C.successBg, fg: C.success, br: C.successBorder },
  pending:   { bg: C.warnBg,    fg: C.warn,    br: C.warnBorder },
  attention: { bg: C.warnBg,    fg: C.warn,    br: C.warnBorder },
  cancelled: { bg: C.dangerBg,  fg: C.danger,  br: C.dangerBorder },
  neutral:   { bg: C.surfaceAlt,fg: C.textMuted,br: C.border },
};

export function badge(tone = 'neutral', extra = {}) {
  const t = BADGE[tone] || BADGE.neutral;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 22,
    padding: '0 10px',
    borderRadius: R.pill,
    fontFamily: F.sans,
    fontSize: 11.5,
    fontWeight: 600,
    background: t.bg,
    color: t.fg,
    border: `1px solid ${t.br}`,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...extra,
  };
}

// Inputs: σταθερό ύψος, ορατό focus.
export function input(extra = {}) {
  return {
    width: '100%',
    height: 48,
    padding: '0 14px',
    border: `1.5px solid ${C.border}`,
    borderRadius: R.input,
    fontSize: 15,
    fontFamily: F.sans,
    color: C.text,
    background: C.surface,
    outline: 'none',
    boxSizing: 'border-box',
    ...extra,
  };
}

// Ένα εικονίδιο, ένα stroke width, παντού.
export const ICON = { size: 16, strokeWidth: 2 };