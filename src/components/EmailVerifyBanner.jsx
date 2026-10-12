'use client';
// src/components/EmailVerifyBanner.jsx
// ═══════════════════════════════════════════════════════════════════
// «Επιβεβαίωσε το email σου» — στον πίνακα ασθενή και φυσικοθεραπευτή,
// όσο το email δεν έχει επιβεβαιωθεί. Δεν μπλοκάρει τίποτα· για τον
// φυσικοθεραπευτή εξηγεί ότι η έγκριση περιμένει την επιβεβαίωση.
//
// Δεν εμφανίζεται αν η στήλη email_verified_at δεν υπάρχει ακόμα στη
// βάση (πριν τρέξει το SQL) — έτσι δεν ενοχλεί κανέναν πριν την ώρα του.
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { C, R } from '@/lib/tokens';

const TX = {
  el: {
    title: 'Επιβεβαίωσε το email σου',
    patient: (e) => <>Σου στείλαμε email στο <strong>{e}</strong> με κουμπί επιβεβαίωσης. Ο λογαριασμός σου λειτουργεί κανονικά.</>,
    therapist: (e) => <>Σου στείλαμε email στο <strong>{e}</strong> με κουμπί επιβεβαίωσης. Το προφίλ σου μπορεί να εγκριθεί μόνο αφού επιβεβαιωθεί το email.</>,
    resend: 'Επαναποστολή',
    sending: 'Αποστολή…',
    sent: 'Στάλθηκε! Έλεγξε και τον φάκελο ανεπιθύμητης αλληλογραφίας (spam).',
    tooSoon: (s) => `Περίμενε ${s} δευτερόλεπτα και δοκίμασε ξανά.`,
    failed: 'Η αποστολή απέτυχε. Δοκίμασε ξανά σε λίγο.',
    verified: 'Το email σου είναι ήδη επιβεβαιωμένο.',
  },
  en: {
    title: 'Please confirm your email',
    patient: (e) => <>We sent an email to <strong>{e}</strong> with a confirmation button. Your account works normally in the meantime.</>,
    therapist: (e) => <>We sent an email to <strong>{e}</strong> with a confirmation button. Your profile can be approved only after the email is confirmed.</>,
    resend: 'Resend',
    sending: 'Sending…',
    sent: 'Sent! Please also check your spam folder.',
    tooSoon: (s) => `Please wait ${s} seconds and try again.`,
    failed: 'Sending failed. Please try again shortly.',
    verified: 'Your email is already confirmed.',
  },
};

export default function EmailVerifyBanner({ profile, email, role, lang = 'el' }) {
  const tx = TX[lang] || TX.el;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(false);

  if (!profile || !('email_verified_at' in profile) || profile.email_verified_at || done) return null;

  async function resend() {
    setBusy(true); setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ resend: true, lang }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.already) { setMsg({ ok: true, text: tx.verified }); setTimeout(() => setDone(true), 2500); }
      else if (res.ok) setMsg({ ok: true, text: tx.sent });
      else if (j.error === 'too_soon') setMsg({ ok: false, text: tx.tooSoon(j.retryIn || 60) });
      else setMsg({ ok: false, text: tx.failed });
    } catch {
      setMsg({ ok: false, text: tx.failed });
    }
    setBusy(false);
  }

  return (
    <div style={{ background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: R.card, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <Mail size={22} color={C.info} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.info, marginBottom: 3 }}>{tx.title}</div>
        <div style={{ fontSize: 13.5, color: C.info, lineHeight: 1.55, wordBreak: 'break-word' }}>
          {(role === 'therapist' ? tx.therapist : tx.patient)(email)}
        </div>
        {msg && (
          <div style={{ fontSize: 13, marginTop: 6, fontWeight: 600, color: msg.ok ? C.success : C.danger, display: 'flex', alignItems: 'center', gap: 5 }}>
            {msg.ok && <CheckCircle2 size={14} />}{msg.text}
          </div>
        )}
      </div>
      <button onClick={resend} disabled={busy}
        style={{ padding: '10px 20px', borderRadius: R.button, border: `1.5px solid ${C.info}`, background: C.surface, color: C.info, fontSize: 14, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
        {busy ? tx.sending : tx.resend}
      </button>
    </div>
  );
}
