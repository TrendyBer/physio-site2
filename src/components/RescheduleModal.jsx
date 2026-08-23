'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarClock, ChevronLeft, ChevronRight, Check, X, AlertCircle, Clock } from 'lucide-react';

/*
  RescheduleModal
  ───────────────
  Δουλεύει ΚΑΙ για τους δύο ρόλους, σε δύο λειτουργίες:

    mode="propose"  — επιλογή νέας ώρας από το ημερολόγιο του θεραπευτή
    mode="respond"  — έγκριση ή απόρριψη πρότασης που ήρθε

  Όσο εκκρεμεί η απάντηση, το νέο slot είναι ήδη δεσμευμένο από τη βάση.
  Αν απορριφθεί, ελευθερώνεται αυτόματα.

  Props:
    booking     — { id, therapist_id, session_date, session_time }
    reschedule  — το εκκρεμές αίτημα (μόνο σε mode="respond")
    mode        — 'propose' | 'respond'
    lang        — 'el' | 'en'
    onClose
    onDone      — καλείται μετά από επιτυχία
*/

const DAYS_SHORT = {
  el: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const MONTHS = {
  el: ['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου','Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};
const LOCALE = { el: 'el-GR', en: 'en-US' };

const TX = {
  el: {
    proposeTitle: 'Αλλαγή ημέρας και ώρας',
    proposeDesc: 'Επιλέξτε νέα ώρα. Η αλλαγή ισχύει μόνο αφού την εγκρίνει ο άλλος.',
    currentSlot: 'Τρέχον ραντεβού',
    newSlot: 'Νέα ώρα',
    reason: 'Αιτιολογία (προαιρετικό)',
    reasonPh: 'π.χ. προέκυψε κάτι επείγον',
    prev: 'Πριν',
    next: 'Μετά',
    noSlots: 'Δεν υπάρχουν διαθέσιμες ώρες αυτή την εβδομάδα.',
    loading: 'Φόρτωση...',
    sendProposal: 'Αποστολή πρότασης',
    sending: 'Αποστολή...',
    cancel: 'Άκυρο',
    pickFirst: 'Επιλέξτε νέα ώρα για να συνεχίσετε.',

    respondTitle: 'Πρόταση αλλαγής ραντεβού',
    respondFrom: (who) => `${who} προτείνει νέα ώρα`,
    whoTherapist: 'Ο θεραπευτής',
    whoPatient: 'Ο ασθενής',
    whoAdmin: 'Η πλατφόρμα',
    from: 'Από',
    to: 'Σε',
    theirReason: 'Αιτιολογία:',
    noteLabel: 'Σημείωση (προαιρετικό)',
    notePh: 'π.χ. με βολεύει καλύτερα',
    accept: 'Αποδοχή',
    decline: 'Απόρριψη',
    responding: 'Καταχώρηση...',

    errSlotTaken: 'Η ώρα μόλις κλείστηκε. Επιλέξτε άλλη.',
    errPending: 'Υπάρχει ήδη εκκρεμής πρόταση για αυτό το ραντεβού.',
    errPast: 'Δεν μπορείτε να επιλέξετε ώρα που έχει περάσει.',
    errOwn: 'Δεν μπορείτε να απαντήσετε στη δική σας πρόταση.',
    errAnswered: 'Η πρόταση έχει ήδη απαντηθεί.',
    errGeneric: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
  },
  en: {
    proposeTitle: 'Change date and time',
    proposeDesc: 'Pick a new time. The change applies only once the other side approves.',
    currentSlot: 'Current appointment',
    newSlot: 'New time',
    reason: 'Reason (optional)',
    reasonPh: 'e.g. something urgent came up',
    prev: 'Prev',
    next: 'Next',
    noSlots: 'No available times this week.',
    loading: 'Loading...',
    sendProposal: 'Send proposal',
    sending: 'Sending...',
    cancel: 'Cancel',
    pickFirst: 'Pick a new time to continue.',

    respondTitle: 'Reschedule proposal',
    respondFrom: (who) => `${who} proposes a new time`,
    whoTherapist: 'The therapist',
    whoPatient: 'The patient',
    whoAdmin: 'The platform',
    from: 'From',
    to: 'To',
    theirReason: 'Reason:',
    noteLabel: 'Note (optional)',
    notePh: 'e.g. this works better for me',
    accept: 'Accept',
    decline: 'Decline',
    responding: 'Saving...',

    errSlotTaken: 'That time was just taken. Please pick another.',
    errPending: 'There is already a pending proposal for this appointment.',
    errPast: 'You cannot pick a time in the past.',
    errOwn: 'You cannot respond to your own proposal.',
    errAnswered: 'This proposal has already been answered.',
    errGeneric: 'Something went wrong. Please try again.',
  },
};

function fmtFull(dateStr, timeStr, lang) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS_SHORT[lang][d.getDay()]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]}, ${String(timeStr).slice(0, 5)}`;
}

export default function RescheduleModal({
  booking,
  reschedule = null,
  mode = 'propose',
  lang = 'el',
  onClose,
  onDone,
}) {
  const tx = TX[lang] || TX.el;
  const loc = LOCALE[lang] || LOCALE.el;

  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [week, setWeek] = useState(0);
  const [loading, setLoading] = useState(mode === 'propose');
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'propose') return;
    fetchSlots();
  }, [week, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSlots() {
    setLoading(true);
    const start = new Date();
    start.setDate(start.getDate() + week * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('therapist_id', booking.therapist_id)
      .eq('is_blocked', false)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date').order('start_time');

    setSlots(data || []);
    setLoading(false);
  }

  function mapError(code) {
    switch (code) {
      case 'slot_taken':       return tx.errSlotTaken;
      case 'already_pending':  return tx.errPending;
      case 'slot_in_past':     return tx.errPast;
      case 'cannot_answer_own':return tx.errOwn;
      case 'already_answered': return tx.errAnswered;
      default:                 return tx.errGeneric;
    }
  }

  async function submitProposal() {
    if (!selected) { setError(tx.pickFirst); return; }
    setBusy(true); setError('');

    const { data, error: err } = await supabase.rpc('request_reschedule', {
      p_booking_id: booking.id,
      p_new_slot_id: selected.id,
      p_reason: reason.trim() || null,
    });

    setBusy(false);

    if (err) { setError(tx.errGeneric); return; }
    if (!data?.ok) {
      setError(mapError(data?.error));
      if (data?.error === 'slot_taken') { setSelected(null); fetchSlots(); }
      return;
    }

    onDone?.(data);
    onClose?.();
  }

  async function respond(accept) {
    setBusy(true); setError('');

    const { data, error: err } = await supabase.rpc('respond_to_reschedule', {
      p_reschedule_id: reschedule.id,
      p_accept: accept,
      p_note: note.trim() || null,
    });

    setBusy(false);

    if (err) { setError(tx.errGeneric); return; }
    if (!data?.ok) { setError(mapError(data?.error)); return; }

    onDone?.(data);
    onClose?.();
  }

  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + week * 7 + i);
    return d.toISOString().split('T')[0];
  });

  const whoLabel =
    reschedule?.requested_by_role === 'therapist' ? tx.whoTherapist
    : reschedule?.requested_by_role === 'patient' ? tx.whoPatient
    : tx.whoAdmin;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget && !busy) onClose?.(); }}>

      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: mode === 'propose' ? 620 : 480, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarClock size={20} color="#2a6fdb" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>
              {mode === 'propose' ? tx.proposeTitle : tx.respondTitle}
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              {mode === 'propose' ? tx.proposeDesc : tx.respondFrom(whoLabel)}
            </p>
          </div>
          <button onClick={() => !busy && onClose?.()} style={{ background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', color: '#94a3b8', padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 28px' }}>

          {/* ── ΠΡΟΤΑΣΗ ── */}
          {mode === 'propose' && (
            <>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '13px 16px', marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                  {tx.currentSlot}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
                  {fmtFull(booking.session_date, booking.session_time, lang)}
                </div>
              </div>

              {selected && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '13px 16px', marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                    {tx.newSlot}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#15803D' }}>
                    {fmtFull(selected.date, selected.start_time, lang)}
                  </div>
                </div>
              )}

              {/* Πλοήγηση εβδομάδας */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <button onClick={() => setWeek(w => Math.max(0, w - 1))} disabled={week === 0}
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: week === 0 ? '#f8fafc' : '#fff', color: week === 0 ? '#94a3b8' : '#1a2e44', fontSize: 12.5, fontWeight: 600, cursor: week === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ChevronLeft size={14} />
                  {tx.prev}
                </button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                  {weekDates[0] && `${new Date(weekDates[0] + 'T12:00:00').toLocaleDateString(loc, { day: '2-digit', month: '2-digit' })} – ${new Date(weekDates[6] + 'T12:00:00').toLocaleDateString(loc, { day: '2-digit', month: '2-digit' })}`}
                </div>
                <button onClick={() => setWeek(w => w + 1)}
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1a2e44', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {tx.next}
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Slots */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 28, color: '#64748B', fontSize: 13 }}>{tx.loading}</div>
              ) : slots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 28, color: '#94A3B8', fontSize: 13, background: '#f8fafc', borderRadius: 10 }}>
                  {tx.noSlots}
                </div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
                  {weekDates.map(date => {
                    const daySlots = slots.filter(s => s.date === date);
                    if (daySlots.length === 0) return null;
                    const d = new Date(date + 'T12:00:00');
                    return (
                      <div key={date} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 7 }}>
                          {DAYS_SHORT[lang][d.getDay()]} {d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {daySlots.map(s => {
                            const isSel = selected?.id === s.id;
                            return (
                              <button key={s.id} onClick={() => { setSelected(s); setError(''); }}
                                style={{ padding: '7px 15px', borderRadius: 8, border: `1.5px solid ${isSel ? '#2a6fdb' : '#e2e8f0'}`, background: isSel ? '#2a6fdb' : '#fff', color: isSel ? '#fff' : '#0F172A', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {s.start_time?.slice(0, 5)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  {tx.reason}
                </label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} maxLength={300}
                  placeholder={tx.reasonPh}
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: '#0F172A', boxSizing: 'border-box' }} />
              </div>
            </>
          )}

          {/* ── ΑΠΑΝΤΗΣΗ ── */}
          {mode === 'respond' && reschedule && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '13px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                    {tx.from}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: '#64748B', textDecoration: 'line-through' }}>
                    {fmtFull(reschedule.old_date, reschedule.old_time, lang)}
                  </div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '13px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                    {tx.to}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#15803D' }}>
                    {fmtFull(reschedule.new_date, reschedule.new_time, lang)}
                  </div>
                </div>
              </div>

              {reschedule.reason && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 15px', marginBottom: 16, fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
                  <strong>{tx.theirReason}</strong>{' '}
                  <span style={{ fontStyle: 'italic' }}>{reschedule.reason}</span>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  {tx.noteLabel}
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={300}
                  placeholder={tx.notePh}
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: '#0F172A', boxSizing: 'border-box' }} />
              </div>
            </>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, padding: '11px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5 }}>
              <AlertCircle size={15} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {mode === 'propose' ? (
            <>
              <button onClick={onClose} disabled={busy}
                style={{ padding: '11px 22px', borderRadius: 30, border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {tx.cancel}
              </button>
              <button onClick={submitProposal} disabled={busy || !selected}
                style={{ padding: '11px 26px', borderRadius: 30, border: 'none', background: selected && !busy ? '#1a2e44' : '#cbd5e1', color: '#fff', fontSize: 14, fontWeight: 600, cursor: selected && !busy ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <CalendarClock size={15} />
                {busy ? tx.sending : tx.sendProposal}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => respond(false)} disabled={busy}
                style={{ padding: '11px 22px', borderRadius: 30, border: '1.5px solid #FECDD3', background: '#fff', color: '#BE123C', fontSize: 14, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <X size={15} />
                {tx.decline}
              </button>
              <button onClick={() => respond(true)} disabled={busy}
                style={{ padding: '11px 26px', borderRadius: 30, border: 'none', background: busy ? '#94a3b8' : '#15803D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Check size={15} strokeWidth={3} />
                {busy ? tx.responding : tx.accept}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}