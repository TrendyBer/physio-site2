'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, X, Clock, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

const NAVY = '#1a2e44';
const ACCENT = '#2a6fdb';
const SOFT = '#eaf2fc';
const OFFWHITE = '#faf9f6';

/**
 * CancelBookingModal
 *
 * Ένα component για ΟΛΟΥΣ (ασθενή, θεραπευτή, admin).
 * Η βάση αποφασίζει τι θα γίνει — το UI απλά το δείχνει.
 *
 * Ροή:
 *   1. Ανοίγει  → καλεί preview_cancellation()  → δείχνει τι θα γίνει
 *   2. Ο χρήστης γράφει λόγο (υποχρεωτικός αν είναι late/strike)
 *   3. Επιβεβαιώνει → καλεί cancel_booking()    → δείχνει αποτέλεσμα
 *
 * Props:
 *   bookingId  — το id του session_booking
 *   onClose()  — κλείσιμο χωρίς αλλαγή
 *   onDone()   — η ακύρωση ολοκληρώθηκε (refresh τη λίστα)
 */

// Οπτική ταυτότητα ανά σοβαρότητα
const TIERS = {
  free:      { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', Icon: CheckCircle2 },
  late:      { bg: '#fffbeb', border: '#fde68a', color: '#b45309', Icon: AlertTriangle },
  very_late: { bg: '#fff1f2', border: '#fecdd3', color: '#be123c', Icon: AlertTriangle },
  admin:     { bg: SOFT,      border: '#c8dff9', color: ACCENT,   Icon: CheckCircle2 },
};

function fmtHours(h) {
  if (h === null || h === undefined) return '—';
  if (h < 0) return 'Η ώρα έχει περάσει';
  if (h < 1) return `${Math.round(h * 60)} λεπτά`;
  if (h < 48) return `${Math.round(h)} ${Math.round(h) === 1 ? 'ώρα' : 'ώρες'}`;
  return `${Math.round(h / 24)} ημέρες`;
}

function fmtSession(date, time) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.toLocaleDateString('el-GR', { weekday: 'long', day: '2-digit', month: 'long' });
  return time ? `${day}, ${String(time).slice(0, 5)}` : day;
}

export default function CancelBookingModal({ bookingId, onClose, onDone }) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('preview_cancellation', {
        p_booking_id: bookingId,
      });
      if (error) {
        setError('Δεν ήταν δυνατός ο έλεγχος της ακύρωσης. Δοκιμάστε ξανά.');
      } else if (!data?.ok) {
        setError(data?.message || 'Η ακύρωση δεν είναι δυνατή.');
      } else {
        setPreview(data);
      }
      setLoading(false);
    })();
  }, [bookingId]);

  // Ο λόγος είναι υποχρεωτικός όταν η ακύρωση επηρεάζει τον άλλον
  const reasonRequired = preview && preview.tier !== 'free' && preview.tier !== 'admin';
  const canSubmit = preview && (!reasonRequired || reason.trim().length >= 5);

  async function confirm() {
    setSubmitting(true);
    setError('');
    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_reason: reason.trim() || null,
    });
    if (error) {
      setError('Η ακύρωση απέτυχε. Δοκιμάστε ξανά ή επικοινωνήστε μαζί μας.');
      setSubmitting(false);
      return;
    }
    if (!data?.ok) {
      setError(data?.message || 'Η ακύρωση δεν ήταν δυνατή.');
      setSubmitting(false);
      return;
    }
    setResult(data);
    setSubmitting(false);
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(26,46,68,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1200, padding: 20,
  };

  const box = {
    background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500,
    boxShadow: '0 20px 60px rgba(26,46,68,0.25)',
    fontFamily: "'DM Sans', sans-serif",
    maxHeight: '90vh', overflowY: 'auto',
  };

  // ── ΑΠΟΤΕΛΕΣΜΑ ──
  if (result) {
    const paused = result.account_paused;
    const struck = result.strike_issued;
    const tone = paused
      ? { bg: '#fff1f2', border: '#fecdd3', color: '#be123c' }
      : struck
        ? { bg: '#fffbeb', border: '#fde68a', color: '#b45309' }
        : { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' };

    return (
      <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) { onDone?.(); } }}>
        <div style={box}>
          <div style={{ padding: '32px 30px', textAlign: 'center' }}>
            <div style={{
              width: 58, height: 58, borderRadius: '50%',
              background: tone.bg, border: `1px solid ${tone.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              {paused || struck
                ? <ShieldAlert size={26} color={tone.color} strokeWidth={2.2} />
                : <CheckCircle2 size={26} color={tone.color} strokeWidth={2.2} />}
            </div>

            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 21, color: NAVY, marginBottom: 10,
            }}>
              Το ραντεβού ακυρώθηκε
            </h2>

            <p style={{ fontSize: 14, color: '#5a6b7d', lineHeight: 1.6, marginBottom: struck ? 20 : 26 }}>
              {result.message}
            </p>

            {struck && (
              <div style={{
                background: tone.bg, border: `1px solid ${tone.border}`,
                borderRadius: 12, padding: '14px 18px', marginBottom: 24,
                textAlign: 'left',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: tone.color, marginBottom: 4 }}>
                  Ενεργά strikes: {result.active_strikes} από 3
                </div>
                <div style={{ fontSize: 12.5, color: tone.color, opacity: 0.9, lineHeight: 1.5 }}>
                  {paused
                    ? 'Ο λογαριασμός σας πάγωσε. Δεν θα λαμβάνετε νέα αιτήματα μέχρι να επικοινωνήσετε μαζί μας.'
                    : 'Το strike λήγει αυτόματα σε 6 μήνες. Με 3 ενεργά strikes ο λογαριασμός παγώνει.'}
                </div>
              </div>
            )}

            <button
              onClick={() => onDone?.()}
              style={{
                width: '100%', padding: '13px', borderRadius: 30, border: 'none',
                background: NAVY, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ΦΟΡΤΩΣΗ ──
  if (loading) {
    return (
      <div style={overlay}>
        <div style={{ ...box, padding: '50px 30px', textAlign: 'center' }}>
          <Loader2 size={26} color={ACCENT} style={{ margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontSize: 14, color: '#5a6b7d' }}>Έλεγχος ακύρωσης...</div>
        </div>
      </div>
    );
  }

  // ── ΣΦΑΛΜΑ / ΜΗ ΕΠΙΤΡΕΠΤΗ ──
  if (error && !preview) {
    return (
      <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
        <div style={box}>
          <div style={{ padding: '32px 30px', textAlign: 'center' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%', background: '#fff1f2',
              border: '1px solid #fecdd3', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <AlertTriangle size={24} color="#be123c" strokeWidth={2.2} />
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 19, color: NAVY, marginBottom: 8 }}>
              Δεν είναι δυνατή η ακύρωση
            </h2>
            <p style={{ fontSize: 14, color: '#5a6b7d', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '13px', borderRadius: 30,
                border: '1px solid #e2e8f0', background: 'transparent',
                color: '#5a6b7d', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tier = TIERS[preview.tier] || TIERS.late;
  const TierIcon = tier.Icon;

  // ── ΕΠΙΒΕΒΑΙΩΣΗ ──
  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose?.(); }}>
      <div style={box}>

        {/* Header */}
        <div style={{ padding: '24px 30px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 21, color: NAVY, marginBottom: 4,
            }}>
              Ακύρωση ραντεβού
            </h2>
            <div style={{ fontSize: 13.5, color: '#5a6b7d', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} />
              {fmtSession(preview.session_date, preview.session_time)}
              <span style={{ color: '#c8d3de' }}>·</span>
              σε {fmtHours(preview.hours_before)}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ background: 'transparent', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', color: '#8a9aab', padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Τι θα γίνει */}
        <div style={{ padding: '20px 30px 0' }}>
          <div style={{
            background: tier.bg,
            border: `1px solid ${tier.border}`,
            borderRadius: 14,
            padding: '16px 18px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <TierIcon size={19} color={tier.color} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tier.color, marginBottom: 4 }}>
                {preview.title}
              </div>
              <div style={{ fontSize: 13, color: tier.color, opacity: 0.92, lineHeight: 1.6 }}>
                {preview.message}
              </div>
            </div>
          </div>

          {/* Strikes counter — μόνο για θεραπευτή που θα φάει strike */}
          {preview.will_strike && (
            <div style={{
              marginTop: 10,
              padding: '12px 16px',
              background: OFFWHITE,
              border: '1px solid #e8e4dc',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <ShieldAlert size={16} color="#8a9aab" strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#5a6b7d', lineHeight: 1.5 }}>
                Έχετε <strong style={{ color: NAVY }}>{preview.active_strikes}</strong> ενεργά strikes.
                Μετά από αυτή την ακύρωση θα έχετε <strong style={{ color: preview.active_strikes + 1 >= 3 ? '#be123c' : NAVY }}>
                  {preview.active_strikes + 1}
                </strong>.
              </span>
            </div>
          )}
        </div>

        {/* Λόγος */}
        <div style={{ padding: '20px 30px 0' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: 'block', marginBottom: 7 }}>
            Λόγος ακύρωσης
            {reasonRequired
              ? <span style={{ color: '#be123c' }}> *</span>
              : <span style={{ color: '#8a9aab', fontWeight: 400 }}> (προαιρετικό)</span>}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            disabled={submitting}
            placeholder={
              preview.role === 'therapist'
                ? 'π.χ. Έκτακτο περιστατικό υγείας, δεν μπορώ να παραστώ.'
                : 'π.χ. Προέκυψε κάτι επείγον και δεν θα είμαι σπίτι.'
            }
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #e2e8f0', borderRadius: 12,
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
              color: NAVY, resize: 'vertical', boxSizing: 'border-box',
              background: submitting ? '#f8fafb' : '#fff',
            }}
          />
          {reasonRequired && reason.trim().length > 0 && reason.trim().length < 5 && (
            <div style={{ fontSize: 12, color: '#be123c', marginTop: 5 }}>
              Γράψτε λίγο περισσότερο — βοηθά τον άλλον να καταλάβει.
            </div>
          )}
        </div>

        {error && (
          <div style={{
            margin: '16px 30px 0', padding: '12px 16px',
            background: '#fff1f2', border: '1px solid #fecdd3',
            borderRadius: 10, fontSize: 13, color: '#be123c',
          }}>
            {error}
          </div>
        )}

        {/* Κουμπιά */}
        <div style={{ padding: '22px 30px 28px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1, padding: '13px', borderRadius: 30,
              border: '1px solid #e2e8f0', background: 'transparent',
              color: '#5a6b7d', fontSize: 14, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Πίσω
          </button>
          <button
            onClick={confirm}
            disabled={submitting || !canSubmit}
            style={{
              flex: 2, padding: '13px', borderRadius: 30, border: 'none',
              background: submitting || !canSubmit
                ? '#c8d3de'
                : (preview.tier === 'free' || preview.tier === 'admin' ? NAVY : '#be123c'),
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Ακύρωση...' : 'Επιβεβαίωση ακύρωσης'}
          </button>
        </div>
      </div>
    </div>
  );
}