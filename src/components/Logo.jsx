'use client';
import Image from 'next/image';

/**
 * ΤΟ ΛΟΓΟΤΥΠΟ ΤΟΥ THERALIVO
 *
 * ΔΥΟ ΕΠΙΠΕΔΑ, ΟΧΙ ΕΝΑ:
 *
 *   primary  σύμβολο + Theralivo
 *            Το «κανονικό» λογότυπο. Navbar, favicon, κινητό, social,
 *            κάρτες, κάθε μικρή επιφάνεια.
 *
 *   lockup   σύμβολο + Theralivo + tagline
 *            Παρουσιάσεις, hero, footer, έντυπα. Όπου υπάρχει χώρος να
 *            διαβαστεί και λόγος να εξηγηθεί η μάρκα.
 *
 * Το tagline ΔΕΝ είναι μέρος του λογοτύπου. Είναι brand message που
 * μπορεί να ζήσει και μόνο του — κάτω από τον τίτλο του hero, σε ένα
 * About, σε splash screen.
 *
 * ΓΙΑΤΙ ΤΟ TAGLINE ΕΙΝΑΙ ΚΕΙΜΕΝΟ ΚΑΙ ΟΧΙ ΕΙΚΟΝΑ:
 * Στο αρχικό σχέδιο ήταν «ψημένο» μέσα στο PNG. Κάθε αλλαγή διατύπωσης
 * θα απαιτούσε νέο σχέδιο, και κάθε σκούρο φόντο δεύτερο αρχείο.
 * Τώρα αλλάζει με μία γραμμή και προσαρμόζει χρώμα μόνο του.
 *
 * ΔΥΟ ΕΚΔΟΣΕΙΣ ΕΙΚΟΝΑΣ:
 * Το «Theralivo» στο σχέδιο είναι navy — αόρατο σε σκούρο navbar. Η
 * λευκή έκδοση έχει το κείμενο αντιστραμμένο και τη φιγούρα ανέπαφη.
 */

export const BRAND = 'Theralivo';
export const TAGLINE = 'Better movement. Better life.';

const WORDMARK_DARK  = '/brand/logo-wordmark.png';
const WORDMARK_LIGHT = '/brand/logo-wordmark-light.png';
const MARK           = '/brand/logo-mark.png';

// Αναλογίες του πρωτότυπου — το πλάτος προκύπτει από το ύψος, ώστε να
// μη παραμορφώνεται σε κανένα μέγεθος.
const WORDMARK_RATIO = 587 / 180;
const MARK_RATIO     = 225 / 256;

// Το «T» ξεκινά στο 27% του πλάτους. Το tagline στοιχίζεται εκεί, κάτω
// από το όνομα — όχι κάτω από το σύμβολο.
const TEXT_OFFSET = 0.27;

export function LogoMark({ size = 32, style }) {
  return (
    <span style={{ display: 'inline-flex', flexShrink: 0, ...style }}>
      <Image
        src={MARK} alt=""
        width={Math.round(size * MARK_RATIO)} height={size}
        style={{ width: 'auto', height: size, objectFit: 'contain' }}
        priority
      />
    </span>
  );
}

/** Το brand message, αυτόνομα. Για hero, About, splash. */
export function Tagline({ tone = 'dark', size = 13, style }) {
  return (
    <span style={{
      fontSize: size,
      fontWeight: 500,
      letterSpacing: '.06em',
      color: tone === 'light' ? 'rgba(255,255,255,0.7)' : '#5b7699',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {TAGLINE}
    </span>
  );
}

export default function Logo({
  variant = 'primary',
  tone = 'dark',
  size,
  href = '/',
  asLink = true,
  style,
}) {
  const light = tone === 'light';
  const height = size || (variant === 'lockup' ? 44 : variant === 'mark' ? 32 : 36);
  const width = Math.round(height * WORDMARK_RATIO);

  if (variant === 'mark') {
    const m = <LogoMark size={height} />;
    return asLink
      ? <a href={href} aria-label={BRAND} style={{ display: 'inline-flex', ...style }}>{m}</a>
      : <span style={{ display: 'inline-flex', ...style }}>{m}</span>;
  }

  const wordmark = (
    <Image
      src={light ? WORDMARK_LIGHT : WORDMARK_DARK}
      alt={BRAND}
      width={width} height={height}
      style={{ width: 'auto', height, objectFit: 'contain', display: 'block' }}
      priority
    />
  );

  const inner = variant === 'lockup' ? (
    <span style={{ display: 'inline-flex', flexDirection: 'column' }}>
      {wordmark}
      <Tagline
        tone={tone}
        size={Math.max(10, Math.round(height * 0.23))}
        style={{ marginTop: Math.round(height * 0.14), marginLeft: Math.round(width * TEXT_OFFSET) }}
      />
    </span>
  ) : wordmark;

  return asLink
    ? <a href={href} aria-label={BRAND} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, ...style }}>{inner}</a>
    : <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, ...style }}>{inner}</span>;
}