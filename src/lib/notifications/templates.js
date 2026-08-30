// src/lib/notifications/templates.js
// ─────────────────────────────────────────────────────────────
// Όλα τα κείμενα ειδοποιήσεων σε ένα σημείο.
// Χρώματα: Navy #1a2e44 · Accent #2a6fdb · Soft #eaf2fc · Off-white #faf9f6
// ─────────────────────────────────────────────────────────────

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://physio-site2.vercel.app';
const ADMIN_SITE = process.env.ADMIN_SITE_URL || 'https://physio-admin-orcin.vercel.app';

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('el-GR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Athens',
  });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('el-GR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Athens',
  });
}


// Ώρα προθεσμίας σε ανθρώπινη μορφή: «σήμερα στις 16:30» / «αύριο στις 09:00»
function fmtDeadline(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const tz = { timeZone: 'Europe/Athens' };
  const day = d.toLocaleDateString('el-GR', tz);
  const today = now.toLocaleDateString('el-GR', tz);
  const tomorrow = new Date(now.getTime() + 86400000).toLocaleDateString('el-GR', tz);
  const time = d.toLocaleTimeString('el-GR', { ...tz, hour: '2-digit', minute: '2-digit' });
  if (day === today) return `σήμερα στις ${time}`;
  if (day === tomorrow) return `αύριο στις ${time}`;
  return `${day} στις ${time}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('el-GR', {
    weekday: 'long', day: '2-digit', month: 'long',
    timeZone: 'Europe/Athens',
  });
}

// ── Κέλυφος email ────────────────────────────────────────────
function shell({ title, intro, rows = [], ctaLabel, ctaUrl, footNote, accent = '#2a6fdb' }) {
  const rowsHtml = rows
    .filter(r => r && r.value)
    .map(r => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #eef2f7;color:#64748b;font-size:13px;width:150px;vertical-align:top;">${r.label}</td>
        <td style="padding:9px 0;border-bottom:1px solid #eef2f7;color:#1a2e44;font-size:14px;font-weight:600;">${r.value}</td>
      </tr>`)
    .join('');

  return `<!doctype html>
<html lang="el"><body style="margin:0;padding:0;background:#faf9f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;font-family:'DM Sans',Helvetica,Arial,sans-serif;">

        <tr><td style="background:#1a2e44;padding:20px 28px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${accent};margin-right:8px;"></span>
          <span style="color:#ffffff;font-family:Georgia,serif;font-size:18px;font-weight:700;">PhysioHome</span>
        </td></tr>

        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:22px;line-height:1.3;color:#1a2e44;font-weight:700;">${title}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">${intro}</p>

          ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">${rowsHtml}</table>` : ''}

          ${ctaUrl ? `
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:30px;background:${accent};">
              <a href="${ctaUrl}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:30px;">${ctaLabel}</a>
            </td>
          </tr></table>` : ''}

          ${footNote ? `<p style="margin:22px 0 0;padding:13px 16px;background:#eaf2fc;border-radius:10px;font-size:13px;line-height:1.6;color:#1a2e44;">${footNote}</p>` : ''}
        </td></tr>

        <tr><td style="padding:16px 28px;background:#faf9f6;border-top:1px solid #eef2f7;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">PhysioHome — Φυσιοθεραπεία κατ' οίκον</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ═════════════════════════════════════════════════════════════
// 1. ΝΕΟ ΑΙΤΗΜΑ → ΘΕΡΑΠΕΥΤΗΣ  (το SLA τρέχει)
// ═════════════════════════════════════════════════════════════
export function therapistNewRequest({ therapistName, request, slaDueAt, slaHours }) {
  const url = `${SITE}/dashboard/therapist`;
  const first = (therapistName || '').split(' ')[0] || 'συνάδελφε';

  // Η προθεσμία έρχεται από το expires_at, που για αυθημερόν ραντεβού
  // είναι ΠΟΛΥ νωρίτερα από 24 ώρες. Το μήνυμα προσαρμόζεται ανάλογα:
  // «απαντήστε έως τις 16:30» έχει άλλο βάρος από «εντός 24 ωρών».
  const deadline = request.expires_at || slaDueAt;
  const sameDay = !!request.is_same_day;
  const apptTime = request.appointment_starts_at
    ? new Date(request.appointment_starts_at).toLocaleTimeString('el-GR', { timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit' })
    : null;

  const subject = sameDay
    ? `ΣΗΜΕΡΑ${apptTime ? ` στις ${apptTime}` : ''} — απαντήστε έως ${fmtTime(deadline)}`
    : `Νέο αίτημα — απάντηση έως ${fmtTime(deadline)}`;

  const html = shell({
    accent: sameDay ? '#B45309' : '#2a6fdb',
    title: sameDay
      ? `Αίτημα για ΣΗΜΕΡΑ στην περιοχή ${request.area || '—'}`
      : `Νέο αίτημα στην περιοχή ${request.area || '—'}`,
    intro: sameDay
      ? `${first}, ένας ασθενής σας ζητάει <strong>σήμερα${apptTime ? ` στις ${apptTime}` : ''}</strong>. Απαντήστε <strong>έως ${fmtDeadline(deadline)}</strong> — μετά το αίτημα θα προωθηθεί σε άλλον.`
      : `${first}, ένας ασθενής σας επέλεξε. Απαντήστε <strong>έως ${fmtDeadline(deadline)}</strong>.`,
    rows: [
      { label: 'Πρόβλημα', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Ώρα ραντεβού', value: request.appointment_starts_at ? fmtDateTime(request.appointment_starts_at) : null },
      { label: 'Αμοιβή', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: sameDay ? 'Απαντήστε τώρα' : 'Δείτε το αίτημα',
    ctaUrl: url,
    footNote: `Αν δεν απαντήσετε μέχρι τις ${fmtTime(deadline)}, το αίτημα λήγει και ο ασθενής προωθείται σε άλλον θεραπευτή. Η ακριβής διεύθυνση εμφανίζεται μόλις αποδεχτείτε.`,
  });

  // Χωρίς τόνους: ελληνικά με τόνους χωρανε 70 χαρακτηρες αντι για 160
  // και χρεωνονται διπλα.
  const sms = sameDay
    ? `PhysioHome: ΣΗΜΕΡΑ${apptTime ? ` ${apptTime}` : ''} στην ${request.area || '-'}. Απαντηστε εως ${fmtTime(deadline)} αλλιως χανεται. ${url}`
    : `PhysioHome: Νεο αιτημα ${request.area || '-'} (${request.problem_type || 'Φυσιοθεραπεια'}). Απαντηστε εως ${fmtTime(deadline)}. ${url}`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 2. ΝΕΟ ΑΙΤΗΜΑ → ADMIN
// ═════════════════════════════════════════════════════════════
export function adminNewRequest({ request, therapistName }) {
  const isFree = request.type === 'free_assessment';
  const contact = [request.contact_name, request.contact_phone, request.contact_email]
    .filter(Boolean).join(' · ');

  const subject = isFree
    ? `Νέα δωρεάν αξιολόγηση — ${request.area || '—'}`
    : `Νέο αίτημα — ${request.area || '—'}`;

  const html = shell({
    accent: isFree ? '#F59E0B' : '#2a6fdb',
    title: subject,
    intro: isFree
      ? 'Αίτημα δωρεάν αξιολόγησης. <strong>Δεν έχει ανατεθεί θεραπευτής</strong> — χρειάζεται χειροκίνητη ανάθεση.'
      : 'Νέο αίτημα καταχωρήθηκε στην πλατφόρμα.',
    rows: [
      { label: 'Πρόβλημα', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Διεύθυνση', value: request.address },
      { label: 'Θεραπευτής', value: therapistName || '⚠️ Καμία ανάθεση' },
      { label: 'Επικοινωνία', value: contact || null },
      { label: 'Αξία', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: 'Άνοιγμα στο admin',
    ctaUrl: `${ADMIN_SITE}/requests`,
  });

  return { subject, html, sms: null };
}

// ═════════════════════════════════════════════════════════════
// 3. ΕΠΙΒΕΒΑΙΩΣΗ → ΑΣΘΕΝΗΣ
// ═════════════════════════════════════════════════════════════
export function patientRequestSent({ patientName, request, therapistName, slaHours }) {
  const first = (patientName || '').split(' ')[0] || '';

  // ΔΕΝ λέμε σκέτο «στάλθηκε». Ο ασθενής πρέπει να ξέρει ΜΕΧΡΙ ΠΟΤΕ
  // περιμένει και τι γίνεται αν δεν απαντήσει κανείς. Αλλιώς μένει στο
  // κενό, υποθέτει ότι κάτι δεν πάει καλά, και φεύγει.
  const deadline = request.expires_at || null;
  const deadlineText = deadline ? fmtDeadline(deadline) : null;

  const subject = deadlineText
    ? `Το αίτημά σας εστάλη — απάντηση έως ${fmtTime(deadline)}`
    : 'Το αίτημά σας εστάλη';

  const html = shell({
    title: 'Λάβαμε το αίτημά σας',
    intro: therapistName
      ? `${first ? first + ', τ' : 'Τ'}ο αίτημά σας στάλθηκε στον/στην <strong>${therapistName}</strong>.` +
        (deadlineText
          ? ` Πρέπει να απαντήσει <strong>έως ${deadlineText}</strong>. Αν δεν απαντήσει, θα σας προτείνουμε αμέσως άλλους διαθέσιμους θεραπευτές.`
          : ` Θα απαντήσει εντός ${slaHours} ωρών.`)
      : `${first ? first + ', λ' : 'Λ'}άβαμε το αίτημά σας. Η ομάδα μας θα σας βρει τον κατάλληλο θεραπευτή και θα επικοινωνήσουμε μαζί σας.`,
    rows: [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Ραντεβού', value: request.appointment_starts_at ? fmtDateTime(request.appointment_starts_at) : null },
      { label: 'Θεραπευτής', value: therapistName || 'Θα οριστεί από την ομάδα μας' },
      { label: 'Απάντηση έως', value: deadline ? fmtDateTime(deadline) : null },
    ],
    ctaLabel: 'Δείτε το αίτημά σας',
    ctaUrl: `${SITE}/dashboard/patient`,
    footNote: 'Δεν χρεώνεστε τίποτα μέχρι να επιβεβαιωθεί το ραντεβού. Η πληρωμή γίνεται σε μετρητά στον θεραπευτή, μετά τη συνεδρία.',
  });

  const sms = therapistName
    ? (deadline
        ? `PhysioHome: Το αιτημα σας σταλθηκε στον/στην ${therapistName}. Απαντηση εως ${fmtTime(deadline)}.`
        : `PhysioHome: Το αιτημα σας σταλθηκε στον/στην ${therapistName}.`)
    : `PhysioHome: Λαβαμε το αιτημα σας. Θα επικοινωνησουμε συντομα.`;

  return { subject, html, sms };
}


// ═════════════════════════════════════════════════════════════
// 4. ΑΠΟΔΟΧΗ → ΑΣΘΕΝΗΣ
// Το πιο σημαντικό email της πλατφόρμας: επιβεβαιώνει ότι κάποιος
// έρχεται στο σπίτι του. Πρέπει να έχει ΟΛΑ όσα χρειάζεται.
// ═════════════════════════════════════════════════════════════
export function patientRequestAccepted({ patientName, therapistName, request, booking }) {
  const first = (patientName || '').split(' ')[0] || '';
  const when = booking?.session_date
    ? `${fmtDate(booking.session_date)}${booking.session_time ? `, ${String(booking.session_time).slice(0, 5)}` : ''}`
    : null;

  const subject = 'Το ραντεβού σας επιβεβαιώθηκε';

  const html = shell({
    accent: '#15803D',
    title: 'Το ραντεβού σας επιβεβαιώθηκε',
    intro: `${first ? first + ', ο' : 'Ο'}/η <strong>${therapistName || 'θεραπευτής'}</strong> αποδέχτηκε το αίτημά σας.`,
    rows: [
      { label: 'Ημερομηνία', value: when },
      { label: 'Θεραπευτής', value: therapistName },
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Διεύθυνση', value: request.address },
      { label: 'Κόστος', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: 'Δείτε το ραντεβού σας',
    ctaUrl: `${SITE}/dashboard/patient`,
    footNote: 'Η πληρωμή γίνεται σε μετρητά, απευθείας στον θεραπευτή, μετά τη συνεδρία. Αν χρειαστεί να ακυρώσετε, ενημερώστε μας εγκαίρως από τον πίνακά σας.',
  });

  const sms = `PhysioHome: Το ραντεβου σας επιβεβαιωθηκε${when ? ` για ${when}` : ''} με τον/την ${therapistName || '-'}. ${SITE}/dashboard/patient`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 5. ΑΠΟΡΡΙΨΗ → ΑΣΘΕΝΗΣ
// ΔΕΝ αφήνουμε τον ασθενή σε αδιέξοδο. Το κουμπί οδηγεί πίσω στον
// οδηγό με τα στοιχεία του ήδη συμπληρωμένα.
// ═════════════════════════════════════════════════════════════
export function patientRequestRejected({ patientName, therapistName, request }) {
  const first = (patientName || '').split(' ')[0] || '';
  const subject = 'Ο θεραπευτής δεν είναι διαθέσιμος';

  const html = shell({
    accent: '#B45309',
    title: 'Ο θεραπευτής δεν είναι διαθέσιμος',
    intro: `${first ? first + ', δ' : 'Δ'}υστυχώς ο/η <strong>${therapistName || 'θεραπευτής'}</strong> δεν μπορεί να αναλάβει αυτό το ραντεβού. Υπάρχουν όμως κι άλλοι διαθέσιμοι θεραπευτές στην περιοχή σας.`,
    rows: [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
    ],
    ctaLabel: 'Δες άλλους θεραπευτές',
    ctaUrl: `${SITE}/dashboard/patient/new-request?retry=${request.id}`,
    footNote: 'Τα στοιχεία σας είναι ήδη συμπληρωμένα — χρειάζεται μόνο να διαλέξετε θεραπευτή και ώρα.',
  });

  const sms = `PhysioHome: Ο θεραπευτης δεν ειναι διαθεσιμος. Δειτε αλλους: ${SITE}/dashboard/patient/new-request?retry=${request.id}`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 6. ΛΗΞΗ → ΑΣΘΕΝΗΣ
// ═════════════════════════════════════════════════════════════
export function patientRequestExpired({ patientName, therapistName, request, hours, matches }) {
  const first = (patientName || '').split(' ')[0] || '';
  const list = Array.isArray(matches) ? matches : [];
  const sameDay = !!request.is_same_day;

  const subject = list.length > 0
    ? `Βρήκαμε ${list.length} ${list.length === 1 ? 'διαθέσιμο θεραπευτή' : 'διαθέσιμους θεραπευτές'}`
    : 'Το αίτημά σας έληξε — δείτε άλλους θεραπευτές';

  // Συγκεκριμένες προτάσεις, όχι «ξαναψάξε». Ο ασθενής μόλις περίμενε
  // άδικα· το τελευταίο που θέλει είναι να ξαναρχίσει από την αρχή.
  const matchRows = list.map((m) => {
    const when = m.next_slot_date
      ? `${m.same_day ? 'σήμερα' : fmtDate(m.next_slot_date)}${m.next_slot_time ? ` στις ${String(m.next_slot_time).slice(0, 5)}` : ''}`
      : null;
    return {
      label: m.name,
      value: [when, m.price ? `${Math.round(Number(m.price))}€` : null].filter(Boolean).join(' · '),
    };
  });

  const html = shell({
    accent: '#B45309',
    title: 'Ο θεραπευτής δεν απάντησε εγκαίρως',
    intro: list.length > 0
      ? `${first ? first + ', ο' : 'Ο'}/η <strong>${therapistName || 'θεραπευτής'}</strong> δεν απάντησε στην ώρα του. ` +
        `Βρήκαμε <strong>${list.length}</strong> ${list.length === 1 ? 'θεραπευτή που μπορεί' : 'θεραπευτές που μπορούν'} να σας εξυπηρετήσουν` +
        `${sameDay ? ' <strong>σήμερα</strong>' : ''}.`
      : `${first ? first + ', τ' : 'Τ'}ο αίτημά σας προς τον/την <strong>${therapistName || 'θεραπευτή'}</strong> έμεινε αναπάντητο, οπότε το κλείσαμε. Λυπούμαστε για την αναμονή.`,
    rows: matchRows.length > 0 ? matchRows : [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
    ],
    ctaLabel: list.length > 0 ? 'Δες τους διαθέσιμους' : 'Δες άλλους θεραπευτές',
    ctaUrl: `${SITE}/dashboard/patient/new-request?retry=${request.id}`,
    footNote: 'Τα στοιχεία σας είναι ήδη συμπληρωμένα — χρειάζεται μόνο να διαλέξετε.',
  });

  const sms = list.length > 0
    ? `PhysioHome: Ο θεραπευτης δεν απαντησε. Βρηκαμε ${list.length} διαθεσιμους${sameDay ? ' για σημερα' : ''}: ${SITE}/dashboard/patient/new-request?retry=${request.id}`
    : `PhysioHome: Το αιτημα σας εληξε. Δειτε αλλους: ${SITE}/dashboard/patient/new-request?retry=${request.id}`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 7. ΥΠΕΝΘΥΜΙΣΗ → ΘΕΡΑΠΕΥΤΗΣ
// Στέλνεται ΜΙΑ φορά. Λέει πόσος χρόνος απομένει, όχι πόσος πέρασε —
// το δεύτερο ακούγεται σαν κατηγορία.
// ═════════════════════════════════════════════════════════════
export function therapistPendingReminder({ therapistName, request, hoursLeft }) {
  const first = (therapistName || '').split(' ')[0] || 'συνάδελφε';
  const subject = `Εκκρεμεί αίτημα — απομένουν ${hoursLeft} ώρες`;

  const html = shell({
    accent: '#B45309',
    title: 'Ένα αίτημα περιμένει απάντηση',
    intro: `${first}, ένας ασθενής στην περιοχή <strong>${request.area || '—'}</strong> περιμένει την απάντησή σας. Απομένουν <strong>${hoursLeft} ώρες</strong>.`,
    rows: [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Αμοιβή', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: 'Απάντησε τώρα',
    ctaUrl: `${SITE}/dashboard/therapist`,
    footNote: 'Αν δεν σας βολεύει, μια γρήγορη απόρριψη βοηθάει τον ασθενή να βρει άλλον θεραπευτή νωρίτερα.',
  });

  const sms = `PhysioHome: Εκκρεμει αιτημα στην περιοχη ${request.area || '-'}. Απομενουν ${hoursLeft} ωρες. ${SITE}/dashboard/therapist`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 8. ΑΚΥΡΩΣΗ
// Ο παραλήπτης αλλάζει ανάλογα με το ποιος ακύρωσε.
// ═════════════════════════════════════════════════════════════
export function cancellationNotice({ toRole, recipientName, otherName, booking, reason }) {
  const first = (recipientName || '').split(' ')[0] || '';
  const when = booking?.session_date
    ? `${fmtDate(booking.session_date)}${booking.session_time ? `, ${String(booking.session_time).slice(0, 5)}` : ''}`
    : null;

  const byPatient = toRole === 'therapist';
  const subject = 'Ακύρωση ραντεβού';

  const html = shell({
    accent: '#BE123C',
    title: 'Το ραντεβού ακυρώθηκε',
    intro: byPatient
      ? `${first ? first + ', τ' : 'Τ'}ο ραντεβού με <strong>${otherName || 'τον ασθενή'}</strong> ακυρώθηκε από τον ασθενή.`
      : `${first ? first + ', τ' : 'Τ'}ο ραντεβού σας με <strong>${otherName || 'τον θεραπευτή'}</strong> ακυρώθηκε.`,
    rows: [
      { label: 'Ημερομηνία', value: when },
      { label: byPatient ? 'Ασθενής' : 'Θεραπευτής', value: otherName },
      { label: 'Αιτιολογία', value: reason },
    ],
    ctaLabel: byPatient ? 'Δες τα ραντεβού σου' : 'Βρες άλλον θεραπευτή',
    ctaUrl: byPatient ? `${SITE}/dashboard/therapist` : `${SITE}/dashboard/patient/new-request`,
    footNote: byPatient
      ? 'Η ώρα ελευθερώθηκε αυτόματα στο πρόγραμμά σας.'
      : 'Μπορείτε να κλείσετε νέο ραντεβού με άλλον θεραπευτή οποτεδήποτε.',
  });

  const sms = byPatient
    ? `PhysioHome: Ακυρωθηκε ραντεβου${when ? ` (${when})` : ''} απο τον ασθενη.`
    : `PhysioHome: Το ραντεβου σας${when ? ` (${when})` : ''} ακυρωθηκε. Βρειτε αλλον θεραπευτη: ${SITE}`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 9. ΑΙΤΗΜΑ ΑΞΙΟΛΟΓΗΣΗΣ → ΑΣΘΕΝΗΣ
// ═════════════════════════════════════════════════════════════
export function patientReviewRequest({ patientName, therapistName, booking }) {
  const first = (patientName || '').split(' ')[0] || '';
  const subject = 'Πώς ήταν η συνεδρία σας;';

  const html = shell({
    title: 'Πώς ήταν η συνεδρία σας;',
    intro: `${first ? first + ', η' : 'Η'} γνώμη σας για τον/την <strong>${therapistName || 'θεραπευτή'}</strong> βοηθάει τους επόμενους ασθενείς να διαλέξουν σωστά. Χρειάζεται λιγότερο από ένα λεπτό.`,
    rows: [
      { label: 'Θεραπευτής', value: therapistName },
      { label: 'Ημερομηνία', value: booking?.session_date ? fmtDate(booking.session_date) : null },
    ],
    ctaLabel: 'Άφησε αξιολόγηση',
    ctaUrl: `${SITE}/dashboard/patient`,
    footNote: 'Η αξιολόγησή σας θα φέρει την ένδειξη «Από επαληθευμένη συνεδρία».',
  });

  const sms = `PhysioHome: Πως ηταν η συνεδρια με τον/την ${therapistName || '-'}; Αφηστε αξιολογηση: ${SITE}/dashboard/patient`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 10. ΥΠΕΝΘΥΜΙΣΗ ΡΑΝΤΕΒΟΥ — και στους δύο
// ═════════════════════════════════════════════════════════════
export function appointmentReminder({ toRole, recipientName, otherName, booking, address }) {
  const first = (recipientName || '').split(' ')[0] || '';
  const time = booking?.session_time ? String(booking.session_time).slice(0, 5) : '';
  const toTherapist = toRole === 'therapist';

  const subject = 'Υπενθύμιση: ραντεβού αύριο';

  const html = shell({
    title: 'Το ραντεβού σας είναι αύριο',
    intro: `${first ? first + ', υ' : 'Υ'}πενθύμιση για το ραντεβού${time ? ` στις <strong>${time}</strong>` : ''}${otherName ? ` με <strong>${otherName}</strong>` : ''}.`,
    rows: [
      { label: 'Ημερομηνία', value: booking?.session_date ? fmtDate(booking.session_date) : null },
      { label: 'Ώρα', value: time || null },
      { label: toTherapist ? 'Ασθενής' : 'Θεραπευτής', value: otherName },
      { label: 'Διεύθυνση', value: address },
    ],
    ctaLabel: toTherapist ? 'Δες το πρόγραμμά σου' : 'Δες το ραντεβού σου',
    ctaUrl: toTherapist ? `${SITE}/dashboard/therapist` : `${SITE}/dashboard/patient`,
    footNote: 'Αν κάτι άλλαξε, ενημερώστε μας το συντομότερο ώστε να προλάβει να προσαρμοστεί ο άλλος.',
  });

  const sms = `PhysioHome: Υπενθυμιση ραντεβου αυριο${time ? ` στις ${time}` : ''}${otherName ? ` με ${otherName}` : ''}.`;

  return { subject, html, sms };
}

export { fmtDateTime, fmtTime, fmtDate, SITE, ADMIN_SITE };