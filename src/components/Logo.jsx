'use client';
import Image from 'next/image';

/**
 * ΤΟ ΣΗΜΑ ΤΟΥ THERALIVO
 *
 * ΓΙΑΤΙ ΧΩΡΙΣΤΟ ΣΗΜΑ ΑΠΟ ΤΟ ΟΝΟΜΑ:
 * Στο πρωτότυπο λογότυπο το «Theralivo» είναι navy — αόρατο πάνω στο
 * σκούρο navbar. Αν βάζαμε ολόκληρη την εικόνα, θα χρειαζόμασταν δύο
 * εκδόσεις και θα ξεχνούσαμε να ενημερώσουμε τη μία.
 *
 * Εδώ η εικόνα είναι ΜΟΝΟ η φιγούρα — που έχει γαλάζιο και λειτουργεί
 * σε κάθε φόντο — και το όνομα γράφεται ως κείμενο, οπότε αλλάζει χρώμα
 * ελεύθερα.
 *
 * ΠΑΡΑΛΛΑΓΕΣ
 *   variant="full"    σήμα + όνομα + υπότιτλος   (αρχική, footer)
 *   variant="compact" σήμα + όνομα               (navbar, admin)
 *   variant="mark"    μόνο η φιγούρα             (avatar, μικρά σημεία)
 *   variant="image"   ολόκληρο το λογότυπο       (μόνο σε ανοιχτό φόντο)
 *
 *   tone="dark"  για ανοιχτό φόντο  (προεπιλογή)
 *   tone="light" για σκούρο φόντο
 */

export const BRAND = 'Theralivo';
export const TAGLINE = 'Your path to better life.';
export const TAGLINE_EL = 'Ο δρόμος σου προς μια καλύτερη ζωή.';

const MARK = '/brand/logo-mark.png';
const FULL = '/brand/logo-full.png';

export function LogoMark({ size = 32, style }) {
  return (
    <span style={{ display: 'inline-flex', flexShrink: 0, ...style }}>
      <Image
        src={MARK}
        alt=""
        width={size}
        height={size}
        // Η φιγούρα είναι ψηλότερη από φαρδιά· το contain κρατάει τις
        // αναλογίες χωρίς να την παραμορφώνει σε τετράγωνο πλαίσιο.
        style={{ width: 'auto', height: size, objectFit: 'contain' }}
        priority
      />
    </span>
  );
}

export default function Logo({
  variant = 'compact',
  tone = 'dark',
  size,
  href = '/',
  asLink = true,
  lang = 'el',
  showTagline,
  style,
}) {
  const light = tone === 'light';
  const wordColor    = light ? '#ffffff' : '#0f2a52';
  const taglineColor = light ? 'rgba(255,255,255,0.62)' : '#5b7699';

  const markSize = size || (variant === 'full' ? 48 : variant === 'mark' ? 32 : 34);
  const wordSize = variant === 'full' ? 27 : 21;

  // Ο υπότιτλος μόνο στην πλήρη μορφή: στο navbar θα ήταν δυσανάγνωστος
  // και θα έκλεβε ύψος από τη γραμμή.
  const withTagline = showTagline ?? (variant === 'full');
  const tagline = lang === 'el' ? TAGLINE_EL : TAGLINE;

  const wrap = (inner) => asLink
    ? <a href={href} aria-label={BRAND} style={{ display: 'inline-flex', textDecoration: 'none', ...style }}>{inner}</a>
    : <span style={{ display: 'inline-flex', ...style }}>{inner}</span>;

  if (variant === 'mark') {
    return wrap(<LogoMark size={markSize} />);
  }

  // Ολόκληρη η εικόνα. Χρησιμοποιείται μόνο όπου το φόντο είναι σίγουρα
  // ανοιχτό — π.χ. σε email ή σε έντυπο.
  if (variant === 'image') {
    const h = size || 56;
    return wrap(
      <Image src={FULL} alt={BRAND} width={h * 3} height={h}
        style={{ width: 'auto', height: h, objectFit: 'contain' }} priority />
    );
  }

  return wrap(
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: variant === 'full' ? 13 : 10 }}>
      <LogoMark size={markSize} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontSize: wordSize, fontWeight: 800, color: wordColor,
          letterSpacing: '-0.025em', whiteSpace: 'nowrap',
        }}>
          {BRAND}
        </span>
        {withTagline && (
          <span style={{
            fontSize: variant === 'full' ? 11 : 9.5,
            fontWeight: 500, color: taglineColor,
            letterSpacing: '.05em', marginTop: 5, whiteSpace: 'nowrap',
          }}>
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}