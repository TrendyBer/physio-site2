'use client';

/**
 * Reusable component για εμφάνιση βαθμολογίας θεραπευτή.
 *
 * Variants:
 *   - "compact"  : ⭐ 4.8 (12)              [για cards]
 *   - "stars"    : ★★★★★ 4.8 (12 reviews)  [για modal header]
 *   - "stars-only": ★★★★★                  [μόνο τα αστέρια]
 *
 * Props:
 *   - rating: number (0-5)
 *   - count:  number (πόσα reviews)
 *   - lang:   'el' | 'en'
 *   - variant: 'compact' | 'stars' | 'stars-only'
 *   - size: number (font size για τα stars)
 */
export default function RatingDisplay({ rating = 0, count = 0, lang = 'el', variant = 'compact', size = 14 }) {
  const newLabel  = lang === 'el' ? 'Νέος θεραπευτής' : 'New therapist';
  const reviewsLabel = lang === 'el'
    ? (count === 1 ? 'αξιολόγηση' : 'αξιολογήσεις')
    : (count === 1 ? 'review' : 'reviews');

  // Αν δεν υπάρχουν reviews
  if (count === 0) {
    return (
      <span style={{ fontSize: size, color: '#94a3b8', fontWeight: 500 }}>
        ✨ {newLabel}
      </span>
    );
  }

  const filledStars = Math.round(rating);

  if (variant === 'stars-only') {
    return (
      <span style={{ display: 'inline-flex', gap: 2, fontSize: size }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{ color: i <= filledStars ? '#F59E0B' : '#E2E8F0' }}>★</span>
        ))}
      </span>
    );
  }

  if (variant === 'stars') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-flex', gap: 2, fontSize: size }}>
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= filledStars ? '#F59E0B' : '#E2E8F0' }}>★</span>
          ))}
        </span>
        <span style={{ fontSize: size, color: '#1a2e44', fontWeight: 700 }}>
          {rating.toFixed(1)}
        </span>
        <span style={{ fontSize: size - 2, color: '#6b7a8d' }}>
          ({count} {reviewsLabel})
        </span>
      </div>
    );
  }

  // compact (default)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: size, fontWeight: 600 }}>
      <span style={{ color: '#F59E0B' }}>★</span>
      <span style={{ color: '#1a2e44' }}>{rating.toFixed(1)}</span>
      <span style={{ color: '#6b7a8d', fontWeight: 500 }}>({count})</span>
    </span>
  );
}