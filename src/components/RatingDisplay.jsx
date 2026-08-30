'use client';
import { Star, Sparkles } from 'lucide-react';
import { C } from '@/lib/tokens';

/**
 * Εμφάνιση βαθμολογίας θεραπευτή.
 *
 * Variants:
 *   compact     — ★ 4.8 (12)             [cards]
 *   stars       — ★★★★★ 4.8 (12 αξιολογήσεις)
 *   stars-only  — ★★★★★
 *
 * Τα αστέρια ήταν χαρακτήρες κειμένου (★) και emoji (✨). Άλλαζαν σχήμα
 * ανά λειτουργικό σύστημα και δεν ταίριαζαν με τα υπόλοιπα εικονίδια.
 */
export default function RatingDisplay({ rating = 0, count = 0, lang = 'el', variant = 'compact', size = 14 }) {
  const newLabel = lang === 'el' ? 'Νέος θεραπευτής' : 'New therapist';
  const reviewsLabel = lang === 'el'
    ? (count === 1 ? 'αξιολόγηση' : 'αξιολογήσεις')
    : (count === 1 ? 'review' : 'reviews');

  if (count === 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: size, color: C.textFaint, fontWeight: 500 }}>
        <Sparkles size={size} strokeWidth={2} />
        {newLabel}
      </span>
    );
  }

  const filled = Math.round(rating);
  const Stars = ({ px }) => (
    <span style={{ display: 'inline-flex', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={px}
          strokeWidth={2}
          fill={i <= filled ? C.warn : 'none'}
          color={i <= filled ? C.warn : C.border}
        />
      ))}
    </span>
  );

  if (variant === 'stars-only') return <Stars px={size} />;

  if (variant === 'stars') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Stars px={size} />
        <span style={{ fontSize: size, color: C.text, fontWeight: 700 }}>{rating.toFixed(1)}</span>
        <span style={{ fontSize: size - 2, color: C.textMuted }}>({count} {reviewsLabel})</span>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: size, fontWeight: 600 }}>
      <Star size={size} strokeWidth={2} fill={C.warn} color={C.warn} />
      <span style={{ color: C.text }}>{rating.toFixed(1)}</span>
      <span style={{ color: C.textMuted, fontWeight: 500 }}>({count})</span>
    </span>
  );
}