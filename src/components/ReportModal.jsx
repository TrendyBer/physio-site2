'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { C, R as RAD, btn } from '@/lib/tokens';
import { X, AlertTriangle, UserX, Check, ShieldAlert } from 'lucide-react';

/**
 * Δήλωση no-show και αναφορά προβλήματος.
 *
 * ΕΝΑ component για ΔΥΟ πίνακες. Ο ασθενής και ο θεραπευτής βλέπουν
 * σχεδόν το ίδιο· η μόνη διαφορά είναι ποιον αφορά η δήλωση. Δύο
 * ξεχωριστά components θα απέκλιναν στην πρώτη αλλαγή κειμένου.
 *
 * mode:
 *   'noshow' — ο άλλος δεν εμφανίστηκε
 *   'issue'  — κάτι άλλο πήγε στραβά
 */

const CATEGORIES = {
  el: [
    { id: 'late',          label: 'Μεγάλη καθυστέρηση' },
    { id: 'behaviour',     label: 'Συμπεριφορά' },
    { id: 'quality',       label: 'Ποιότητα συνεδρίας' },
    { id: 'payment',       label: 'Πρόβλημα πληρωμής' },
    { id: 'wrong_address', label: 'Λάθος διεύθυνση' },
    { id: 'safety',        label: 'Θέμα ασφάλειας' },
    { id: 'other',         label: 'Άλλο' },
  ],
  en: [
    { id: 'late',          label: 'Significant delay' },
    { id: 'behaviour',     label: 'Behaviour' },
    { id: 'quality',       label: 'Session quality' },
    { id: 'payment',       label: 'Payment issue' },
    { id: 'wrong_address', label: 'Wrong address' },
    { id: 'safety',        label: 'Safety concern' },
    { id: 'other',         label: 'Other' },
  ],
};

const TX = {
  el: {
    noshowTitle: 'Δεν εμφανίστηκε',
    noshowDesc: (who) => `Δηλώνετε ότι ο/η ${who} δεν εμφανίστηκε στο ραντεβού.`,
    noshowWarn: 'Θα ειδοποιηθεί και μπορεί να διαφωνήσει εντός 48 ωρών. Δηλώστε το μόνο αν όντως δεν ήρθε.',
    noshowNote: 'Τι έγινε; (προαιρετικό)',
    noshowBtn: 'Δήλωση no-show',

    issueTitle: 'Αναφορά προβλήματος',
    issueDesc: 'Πείτε μας τι πήγε στραβά. Η ομάδα μας θα το εξετάσει.',
    issueCat: 'Τι αφορά;',
    issueDetail: 'Περιγραφή',
    issuePh: 'Περιγράψτε με λίγα λόγια τι συνέβη...',
    issueBtn: 'Αποστολή αναφοράς',
    safetyWarn: 'Αν υπάρχει άμεσος κίνδυνος, καλέστε το 100 ή το 166. Η αναφορά δεν αντικαθιστά επείγουσα βοήθεια.',

    cancel: 'Άκυρο',
    sending: 'Αποστολή...',
    required: 'Συμπληρώστε την περιγραφή.',
    done: 'Καταγράφηκε',
  },
  en: {
    noshowTitle: 'Did not show up',
    noshowDesc: (who) => `You are reporting that ${who} did not show up.`,
    noshowWarn: 'They will be notified and can dispute within 48 hours. Only report this if they truly did not come.',
    noshowNote: 'What happened? (optional)',
    noshowBtn: 'Report no-show',

    issueTitle: 'Report a problem',
    issueDesc: 'Tell us what went wrong. Our team will look into it.',
    issueCat: 'What is it about?',
    issueDetail: 'Description',
    issuePh: 'Briefly describe what happened...',
    issueBtn: 'Send report',
    safetyWarn: 'If there is immediate danger, call 100 or 166. A report is not a substitute for emergency help.',

    cancel: 'Cancel',
    sending: 'Sending...',
    required: 'Please fill in the description.',
    done: 'Recorded',
  },
};

export default function ReportModal({ mode = 'issue', booking, otherName, lang = 'el', onClose, onDone }) {
  const tx = TX[lang] || TX.el;
  const cats = CATEGORIES[lang] || CATEGORIES.el;

  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(null);

  async function submit() {
    setError('');

    if (mode === 'issue') {
      if (!category) { setError(tx.issueCat); return; }
      if (!text.trim()) { setError(tx.required); return; }
    }

    setBusy(true);
    const { data, error: err } = mode === 'noshow'
      ? await supabase.rpc('report_no_show', { p_booking_id: booking.id, p_note: text.trim() || null })
      : await supabase.rpc('report_issue', {
          p_booking_id: booking.id,
          p_category: category,
          p_description: text.trim(),
        });
    setBusy(false);

    if (err) { setError(err.message); return; }
    if (!data?.ok) { setError(data?.error || 'Κάτι πήγε στραβά.'); return; }

    setOk(data.message || tx.done);
    if (onDone) onDone(data);
  }

  const isNoShow = mode === 'noshow';
  const showSafety = category === 'safety';

  const input = {
    width: '100%', padding: '11px 13px', border: `1.5px solid ${C.border}`,
    borderRadius: RAD.input, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    color: C.text, boxSizing: 'border-box', resize: 'vertical',
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
    >
      <div style={{ background: C.surface, borderRadius: RAD.modal, width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', padding: 26 }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: RAD.input, background: isNoShow ? C.warnBg : C.infoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isNoShow
              ? <UserX size={19} color={C.warn} strokeWidth={2.1} />
              : <AlertTriangle size={19} color={C.info} strokeWidth={2.1} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
              {isNoShow ? tx.noshowTitle : tx.issueTitle}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.55 }}>
              {isNoShow ? tx.noshowDesc(otherName || '—') : tx.issueDesc}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textFaint, padding: 2, lineHeight: 0 }}>
            <X size={19} />
          </button>
        </div>

        {ok ? (
          <>
            <div style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: RAD.input, padding: '14px 16px', fontSize: 13.5, color: C.success, lineHeight: 1.6, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <Check size={16} strokeWidth={2.6} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{ok}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={onClose} style={btn('primary', { padding: '10px 22px', fontSize: 13.5 })}>OK</button>
            </div>
          </>
        ) : (
          <>
            {/* Η προειδοποίηση ΠΡΙΝ τη δήλωση, όχι μετά.
                Ένα no-show δίνει strike και τρία strikes παγώνουν
                λογαριασμό — δεν είναι κάτι που πατάς στα γρήγορα. */}
            {isNoShow && (
              <div style={{ background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: RAD.input, padding: '11px 14px', marginBottom: 16, fontSize: 12.5, color: C.warn, lineHeight: 1.6 }}>
                {tx.noshowWarn}
              </div>
            )}

            {!isNoShow && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 7 }}>
                  {tx.issueCat}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {cats.map((c) => {
                    const on = category === c.id;
                    return (
                      <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                        style={{
                          padding: '7px 13px', borderRadius: RAD.pill, fontSize: 12.5, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          border: `1.5px solid ${on ? C.accent : C.border}`,
                          background: on ? C.accentSoft : C.surface,
                          color: on ? C.accent : C.textMuted,
                        }}>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showSafety && (
              <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: RAD.input, padding: '11px 14px', marginBottom: 16, fontSize: 12.5, color: C.danger, lineHeight: 1.6, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <ShieldAlert size={15} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{tx.safetyWarn}</span>
              </div>
            )}

            <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 7 }}>
              {isNoShow ? tx.noshowNote : tx.issueDetail}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={isNoShow ? '' : tx.issuePh}
              style={input}
            />

            {error && (
              <div style={{ marginTop: 12, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: RAD.small, padding: '10px 13px', fontSize: 13, color: C.danger }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={onClose} style={btn('quiet', { padding: '10px 20px', fontSize: 13.5 })}>
                {tx.cancel}
              </button>
              <button onClick={submit} disabled={busy}
                style={btn(isNoShow ? 'destructive' : 'primary', { padding: '10px 22px', fontSize: 13.5 })}>
                {busy ? tx.sending : (isNoShow ? tx.noshowBtn : tx.issueBtn)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}