'use client';
import { ShieldCheck } from 'lucide-react';
import { C, R } from '@/lib/tokens';

/**
 * ΕΝΑ badge επαλήθευσης, ένα κείμενο, παντού.
 *
 * Έλεγε σκέτο «Επαληθευμένος», που δεν λέει ΤΙ επαληθεύτηκε. Ο ασθενής
 * δεν ξέρει αν ελέγχθηκε η ταυτότητα, το email ή η άδεια. Τώρα λέει
 * ακριβώς τι εγγυάται η πλατφόρμα.
 *
 * Το tooltip εξηγεί ποιος έκανε τον έλεγχο.
 *
 * Props:
 *   size    — 'sm' για cards, 'md' για προφίλ
 *   compact — μόνο «Επαληθευμένη άδεια», για στενά σημεία
 */
const TX = {
  el: {
    full: 'Επαληθευμένη επαγγελματική άδεια',
    short: 'Επαληθευμένη άδεια',
    tooltip: 'Η επαγγελματική άδεια του θεραπευτή έχει ελεγχθεί από την ομάδα της πλατφόρμας.',
  },
  en: {
    full: 'Verified professional licence',
    short: 'Verified licence',
    tooltip: "The therapist's professional licence has been checked by the platform team.",
  },
};

export default function VerifiedBadge({ lang = 'el', size = 'sm', compact = false, style }) {
  const tx = TX[lang] || TX.el;
  const md = size === 'md';

  return (
    <span
      title={tx.tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: md ? 7 : 5,
        padding: md ? '6px 13px' : '4px 10px',
        borderRadius: R.pill,
        fontSize: md ? 13 : 11.5,
        fontWeight: 600,
        background: C.successBg,
        color: C.success,
        border: `1px solid ${C.successBorder}`,
        whiteSpace: 'nowrap',
        cursor: 'help',
        ...style,
      }}
    >
      <ShieldCheck size={md ? 15 : 12} strokeWidth={2.2} />
      {compact ? tx.short : tx.full}
    </span>
  );
}