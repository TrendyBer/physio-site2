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

// ΤΟ ΟΝΟΜΑ ΣΕ ΕΝΑ ΣΗΜΕΙΟ.
// Ήταν γραμμένο δεκαέξι φορές μέσα στα templates. Μια αλλαγή
// σήμαινε δεκαέξι σημεία να θυμηθείς — και ένα να ξεχάσεις.
const BRAND = 'Theralivo';

// ── Κέλυφος email ────────────────────────────────────────────
function shell({ title, intro, rows = [], ctaLabel, ctaUrl, footNote, accent = '#2a6fdb', lang = 'el', footer }) {
  const rowsHtml = rows
    .filter(r => r && r.value)
    .map(r => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #eef2f7;color:#64748b;font-size:13px;width:150px;vertical-align:top;">${r.label}</td>
        <td style="padding:9px 0;border-bottom:1px solid #eef2f7;color:#1a2e44;font-size:14px;font-weight:600;">${r.value}</td>
      </tr>`)
    .join('');

  return `<!doctype html>
<html lang="${lang}"><body style="margin:0;padding:0;background:#faf9f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;font-family:'DM Sans',Helvetica,Arial,sans-serif;">

        <tr><td style="background:#1a2e44;padding:20px 28px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${accent};margin-right:8px;"></span>
          <span style="color:#ffffff;font-size:19px;font-weight:800;letter-spacing:-0.02em;">${BRAND}</span>
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
          <p style="margin:0;font-size:12px;color:#94a3b8;">${footer || `${BRAND} — Φυσικοθεραπεία κατ' οίκον`}</p>
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
    ? `ΣΗΜΕΡΑ${apptTime ? ` στις ${apptTime}` : ''} — απάντησε έως ${fmtTime(deadline)}`
    : `Νέο αίτημα — απάντηση έως ${fmtTime(deadline)}`;

  const html = shell({
    accent: sameDay ? '#B45309' : '#2a6fdb',
    title: sameDay
      ? `Αίτημα για ΣΗΜΕΡΑ στην περιοχή ${request.area || '—'}`
      : `Νέο αίτημα στην περιοχή ${request.area || '—'}`,
    intro: sameDay
      ? `${first}, ένας ασθενής σε ζητάει <strong>σήμερα${apptTime ? ` στις ${apptTime}` : ''}</strong>. Απάντησε <strong>έως ${fmtDeadline(deadline)}</strong> — μετά το αίτημα θα προωθηθεί σε άλλον.`
      : `${first}, ένας ασθενής σε επέλεξε. Απάντησε <strong>έως ${fmtDeadline(deadline)}</strong>.`,
    rows: [
      { label: 'Πρόβλημα', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Ώρα ραντεβού', value: request.appointment_starts_at ? fmtDateTime(request.appointment_starts_at) : null },
      { label: 'Αμοιβή', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: sameDay ? 'Απάντησε τώρα' : 'Δες το αίτημα',
    ctaUrl: url,
    footNote: `Αν δεν απαντήσεις μέχρι τις ${fmtTime(deadline)}, το αίτημα λήγει και ο ασθενής προωθείται σε άλλον φυσικοθεραπευτή. Η ακριβής διεύθυνση εμφανίζεται μόλις αποδεχτείς.`,
  });

  // Χωρίς τόνους: ελληνικά με τόνους χωρανε 70 χαρακτηρες αντι για 160
  // και χρεωνονται διπλα.
  const sms = sameDay
    ? `${BRAND}: ΣΗΜΕΡΑ${apptTime ? ` ${apptTime}` : ''} στην ${request.area || '-'}. Απαντησε εως ${fmtTime(deadline)} αλλιως χανεται. ${url}`
    : `${BRAND}: Νεο αιτημα ${request.area || '-'} (${request.problem_type || 'Φυσικοθεραπεια'}). Απαντησε εως ${fmtTime(deadline)}. ${url}`;

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
    ? `Το αίτημά σου στάλθηκε — απάντηση έως ${fmtTime(deadline)}`
    : 'Το αίτημά σου στάλθηκε';

  const html = shell({
    title: 'Λάβαμε το αίτημά σου',
    intro: therapistName
      ? `${first ? first + ', τ' : 'Τ'}ο αίτημά σου στάλθηκε στον/στην <strong>${therapistName}</strong>.` +
        (deadlineText
          ? ` Πρέπει να απαντήσει <strong>έως ${deadlineText}</strong>. Αν δεν απαντήσει, θα σου προτείνουμε αμέσως άλλους διαθέσιμους φυσικοθεραπευτές.`
          : ` Θα απαντήσει εντός ${slaHours} ωρών.`)
      : `${first ? first + ', λ' : 'Λ'}άβαμε το αίτημά σου. Η ομάδα μας θα σου βρει τον κατάλληλο φυσικοθεραπευτή και θα επικοινωνήσουμε μαζί σου.`,
    rows: [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Ραντεβού', value: request.appointment_starts_at ? fmtDateTime(request.appointment_starts_at) : null },
      { label: 'Φυσικοθεραπευτής', value: therapistName || 'Θα οριστεί από την ομάδα μας' },
      { label: 'Απάντηση έως', value: deadline ? fmtDateTime(deadline) : null },
    ],
    ctaLabel: 'Δες το αίτημά σου',
    ctaUrl: `${SITE}/dashboard/patient`,
    footNote: 'Δεν χρεώνεσαι τίποτα μέχρι να επιβεβαιωθεί το ραντεβού. Η πληρωμή γίνεται σε μετρητά στον φυσικοθεραπευτή, μετά τη συνεδρία.',
  });

  const sms = therapistName
    ? (deadline
        ? `${BRAND}: Το αιτημα σου σταλθηκε στον/στην ${therapistName}. Απαντηση εως ${fmtTime(deadline)}.`
        : `${BRAND}: Το αιτημα σου σταλθηκε στον/στην ${therapistName}.`)
    : `${BRAND}: Λαβαμε το αιτημα σου. Θα επικοινωνησουμε συντομα.`;

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

  const subject = 'Το ραντεβού σου επιβεβαιώθηκε';

  const html = shell({
    accent: '#15803D',
    title: 'Το ραντεβού σου επιβεβαιώθηκε',
    intro: `${first ? first + ', ο' : 'Ο'}/η <strong>${therapistName || 'φυσικοθεραπευτής'}</strong> αποδέχτηκε το αίτημά σου.`,
    rows: [
      { label: 'Ημερομηνία', value: when },
      { label: 'Φυσικοθεραπευτής', value: therapistName },
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Διεύθυνση', value: request.address },
      { label: 'Κόστος', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: 'Δες το ραντεβού σου',
    ctaUrl: `${SITE}/dashboard/patient`,
    footNote: 'Η πληρωμή γίνεται σε μετρητά, απευθείας στον φυσικοθεραπευτή, μετά τη συνεδρία. Αν χρειαστεί να ακυρώσεις, κάν\' το εγκαίρως από τον πίνακά σου.',
  });

  const sms = `${BRAND}: Το ραντεβου σου επιβεβαιωθηκε${when ? ` για ${when}` : ''} με τον/την ${therapistName || '-'}. ${SITE}/dashboard/patient`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 5. ΑΠΟΡΡΙΨΗ → ΑΣΘΕΝΗΣ
// ΔΕΝ αφήνουμε τον ασθενή σε αδιέξοδο. Το κουμπί οδηγεί πίσω στον
// οδηγό με τα στοιχεία του ήδη συμπληρωμένα.
// ═════════════════════════════════════════════════════════════
export function patientRequestRejected({ patientName, therapistName, request }) {
  const first = (patientName || '').split(' ')[0] || '';
  const subject = 'Ο φυσικοθεραπευτής δεν είναι διαθέσιμος';

  const html = shell({
    accent: '#B45309',
    title: 'Ο φυσικοθεραπευτής δεν είναι διαθέσιμος',
    intro: `${first ? first + ', δ' : 'Δ'}υστυχώς ο/η <strong>${therapistName || 'φυσικοθεραπευτής'}</strong> δεν μπορεί να αναλάβει αυτό το ραντεβού. Υπάρχουν όμως κι άλλοι διαθέσιμοι φυσικοθεραπευτές στην περιοχή σου.`,
    rows: [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
    ],
    ctaLabel: 'Δες άλλους φυσικοθεραπευτές',
    ctaUrl: `${SITE}/dashboard/patient/new-request?retry=${request.id}`,
    footNote: 'Τα στοιχεία σου είναι ήδη συμπληρωμένα — χρειάζεται μόνο να διαλέξεις φυσικοθεραπευτή και ώρα.',
  });

  const sms = `${BRAND}: Ο φυσικοθεραπευτης δεν ειναι διαθεσιμος. Δες αλλους: ${SITE}/dashboard/patient/new-request?retry=${request.id}`;

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
    ? `Βρήκαμε ${list.length} ${list.length === 1 ? 'διαθέσιμο φυσικοθεραπευτή' : 'διαθέσιμους φυσικοθεραπευτές'}`
    : 'Το αίτημά σου έληξε — δες άλλους φυσικοθεραπευτές';

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
    title: 'Ο φυσικοθεραπευτής δεν απάντησε εγκαίρως',
    intro: list.length > 0
      ? `${first ? first + ', ο' : 'Ο'}/η <strong>${therapistName || 'φυσικοθεραπευτής'}</strong> δεν απάντησε στην ώρα του. ` +
        `Βρήκαμε <strong>${list.length}</strong> ${list.length === 1 ? 'φυσικοθεραπευτή που μπορεί' : 'φυσικοθεραπευτές που μπορούν'} να σε εξυπηρετήσουν` +
        `${sameDay ? ' <strong>σήμερα</strong>' : ''}.`
      : `${first ? first + ', τ' : 'Τ'}ο αίτημά σου προς τον/την <strong>${therapistName || 'φυσικοθεραπευτή'}</strong> έμεινε αναπάντητο, οπότε το κλείσαμε. Λυπούμαστε για την αναμονή.`,
    rows: matchRows.length > 0 ? matchRows : [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
    ],
    ctaLabel: list.length > 0 ? 'Δες τους διαθέσιμους' : 'Δες άλλους φυσικοθεραπευτές',
    ctaUrl: `${SITE}/dashboard/patient/new-request?retry=${request.id}`,
    footNote: 'Τα στοιχεία σου είναι ήδη συμπληρωμένα — χρειάζεται μόνο να διαλέξεις.',
  });

  const sms = list.length > 0
    ? `${BRAND}: Ο φυσικοθεραπευτης δεν απαντησε. Βρηκαμε ${list.length} διαθεσιμους${sameDay ? ' για σημερα' : ''}: ${SITE}/dashboard/patient/new-request?retry=${request.id}`
    : `${BRAND}: Το αιτημα σου εληξε. Δες αλλους: ${SITE}/dashboard/patient/new-request?retry=${request.id}`;

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
    intro: `${first}, ένας ασθενής στην περιοχή <strong>${request.area || '—'}</strong> περιμένει την απάντησή σου. Απομένουν <strong>${hoursLeft} ώρες</strong>.`,
    rows: [
      { label: 'Περιστατικό', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Αμοιβή', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: 'Απάντησε τώρα',
    ctaUrl: `${SITE}/dashboard/therapist`,
    footNote: 'Αν δεν σε βολεύει, μια γρήγορη απόρριψη βοηθάει τον ασθενή να βρει άλλον φυσικοθεραπευτή νωρίτερα.',
  });

  const sms = `${BRAND}: Εκκρεμει αιτημα στην περιοχη ${request.area || '-'}. Απομενουν ${hoursLeft} ωρες. ${SITE}/dashboard/therapist`;

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
      : `${first ? first + ', τ' : 'Τ'}ο ραντεβού σου με <strong>${otherName || 'τον φυσικοθεραπευτή'}</strong> ακυρώθηκε.`,
    rows: [
      { label: 'Ημερομηνία', value: when },
      { label: byPatient ? 'Ασθενής' : 'Φυσικοθεραπευτής', value: otherName },
      { label: 'Αιτιολογία', value: reason },
    ],
    ctaLabel: byPatient ? 'Δες τα ραντεβού σου' : 'Βρες άλλον φυσικοθεραπευτή',
    ctaUrl: byPatient ? `${SITE}/dashboard/therapist` : `${SITE}/dashboard/patient/new-request`,
    footNote: byPatient
      ? 'Η ώρα ελευθερώθηκε αυτόματα στο πρόγραμμά σου.'
      : 'Μπορείς να κλείσεις νέο ραντεβού με άλλον φυσικοθεραπευτή οποτεδήποτε.',
  });

  const sms = byPatient
    ? `${BRAND}: Ακυρωθηκε ραντεβου${when ? ` (${when})` : ''} απο τον ασθενη.`
    : `${BRAND}: Το ραντεβου σου${when ? ` (${when})` : ''} ακυρωθηκε. Βρες αλλον φυσικοθεραπευτη: ${SITE}`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// 9. ΑΙΤΗΜΑ ΑΞΙΟΛΟΓΗΣΗΣ → ΑΣΘΕΝΗΣ
// ═════════════════════════════════════════════════════════════
export function patientReviewRequest({ patientName, therapistName, booking }) {
  const first = (patientName || '').split(' ')[0] || '';
  const subject = 'Πώς ήταν η συνεδρία σου;';

  const html = shell({
    title: 'Πώς ήταν η συνεδρία σου;',
    intro: `${first ? first + ', η' : 'Η'} γνώμη σου για τον/την <strong>${therapistName || 'φυσικοθεραπευτή'}</strong> βοηθάει τους επόμενους ασθενείς να διαλέξουν σωστά. Χρειάζεται λιγότερο από ένα λεπτό.`,
    rows: [
      { label: 'Φυσικοθεραπευτής', value: therapistName },
      { label: 'Ημερομηνία', value: booking?.session_date ? fmtDate(booking.session_date) : null },
    ],
    ctaLabel: 'Άφησε αξιολόγηση',
    ctaUrl: `${SITE}/dashboard/patient`,
    footNote: 'Η αξιολόγησή σου θα φέρει την ένδειξη «Από επαληθευμένη συνεδρία».',
  });

  const sms = `${BRAND}: Πως ηταν η συνεδρια με τον/την ${therapistName || '-'}; Αφησε αξιολογηση: ${SITE}/dashboard/patient`;

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
    title: 'Το ραντεβού σου είναι αύριο',
    intro: `${first ? first + ', υ' : 'Υ'}πενθύμιση για το ραντεβού${time ? ` στις <strong>${time}</strong>` : ''}${otherName ? ` με <strong>${otherName}</strong>` : ''}.`,
    rows: [
      { label: 'Ημερομηνία', value: booking?.session_date ? fmtDate(booking.session_date) : null },
      { label: 'Ώρα', value: time || null },
      { label: toTherapist ? 'Ασθενής' : 'Φυσικοθεραπευτής', value: otherName },
      { label: 'Διεύθυνση', value: address },
    ],
    ctaLabel: toTherapist ? 'Δες το πρόγραμμά σου' : 'Δες το ραντεβού σου',
    ctaUrl: toTherapist ? `${SITE}/dashboard/therapist` : `${SITE}/dashboard/patient`,
    footNote: 'Αν κάτι άλλαξε, ενημέρωσέ μας το συντομότερο ώστε να προλάβει να προσαρμοστεί και η άλλη πλευρά.',
  });

  const sms = `${BRAND}: Υπενθυμιση ραντεβου αυριο${time ? ` στις ${time}` : ''}${otherName ? ` με ${otherName}` : ''}.`;

  return { subject, html, sms };
}

// ═════════════════════════════════════════════════════════════
// ΠΡΟΣΦΟΡΑ ΠΟΥ ΛΗΓΕΙ (π.χ. FOUNDERS100) — ο θεραπευτής δεν έχει δώσει
// κάρτα. 7 μέρες πριν: υπενθύμιση. Στη λήξη, αν δεν συνέχισε: Basic.
// ═════════════════════════════════════════════════════════════
export function therapistPromoEnding({ therapistName, planName, endDate, price }) {
  const first = (therapistName || '').split(' ')[0] || 'συνάδελφε';
  const subject = `Η δωρεάν περίοδος του πακέτου ${planName} λήγει στις ${endDate}`;
  const html = shell({
    accent: '#B45309',
    title: 'Η δωρεάν περίοδός σου τελειώνει',
    intro: `${first}, η προσφορά σου στο πακέτο <strong>${planName}</strong> λήγει στις <strong>${endDate}</strong>. Για να συνεχίσεις στο ${planName}, πρόσθεσε κάρτα από τον πίνακά σου — η πρώτη χρέωση (${price}€/μήνα) θα γίνει την ημέρα που λήγει η προσφορά, όχι νωρίτερα.`,
    rows: [
      { label: 'Πακέτο', value: planName },
      { label: 'Λήξη προσφοράς', value: endDate },
      { label: 'Τιμή μετά', value: `${price}€ / μήνα` },
    ],
    ctaLabel: `Συνέχεια στο ${planName}`,
    ctaUrl: `${SITE}/dashboard/therapist`,
    footNote: 'Αν δεν κάνεις τίποτα, στη λήξη περνάς αυτόματα στο δωρεάν πακέτο Basic. Ο λογαριασμός και το προφίλ σου μένουν κανονικά.',
  });
  return { subject, html };
}

export function therapistMovedToBasic({ therapistName, planName }) {
  const first = (therapistName || '').split(' ')[0] || 'συνάδελφε';
  const subject = 'Πέρασες στο δωρεάν πακέτο Basic';
  const html = shell({
    title: 'Το πακέτο σου άλλαξε σε Basic',
    intro: `${first}, η δωρεάν περίοδος του πακέτου <strong>${planName}</strong> τελείωσε και πέρασες αυτόματα στο δωρεάν πακέτο <strong>Basic</strong>. Το προφίλ σου παραμένει ορατό στους ασθενείς.`,
    rows: [],
    ctaLabel: 'Δες τα πακέτα',
    ctaUrl: `${SITE}/dashboard/therapist`,
    footNote: 'Μπορείς να επιστρέψεις σε πληρωμένο πακέτο όποτε θέλεις από τον πίνακά σου.',
  });
  return { subject, html };
}

// ═════════════════════════════════════════════════════════════
// ΚΑΛΩΣΟΡΙΣΜΑ + ΕΠΙΒΕΒΑΙΩΣΗ EMAIL — στέλνεται αμέσως μετά την εγγραφή.
// Ο χρήστης μπαίνει κανονικά χωρίς να το πατήσει· ο φυσικοθεραπευτής
// όμως δεν εγκρίνεται αν δεν επιβεβαιώσει το email του.
// ═════════════════════════════════════════════════════════════
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function stepsHtml(steps) {
  return `<ol style="margin:14px 0 0;padding-left:20px;color:#475569;font-size:14.5px;line-height:1.7;">${
    steps.map(s => `<li style="margin:0 0 6px;">${s}</li>`).join('')
  }</ol>`;
}

const FOOTER_EN = `${BRAND} — Home physiotherapy`;

export function welcomeTherapist({ name, verifyUrl, lang = 'el' }) {
  const first = esc((name || '').trim().split(' ')[0]);
  if (lang === 'en') {
    const subject = `Welcome to ${BRAND} — please confirm your email`;
    const html = shell({
      lang, footer: FOOTER_EN,
      title: `Welcome${first ? `, ${first}` : ''}!`,
      intro: `Thank you for joining ${BRAND} as a physiotherapist. Please confirm that this email address is yours — we need it before your profile can be approved.` +
        stepsHtml([
          '<strong>Confirm your email</strong> using the button below.',
          'Complete your profile: photo, areas you cover, specialties and availability.',
          'Upload your licence to practise.',
          'Choose a plan (Basic is free).',
          'Our team reviews your profile and approves it — then patients can find you.',
        ]),
      ctaLabel: 'Confirm my email',
      ctaUrl: verifyUrl,
      footNote: `You can already sign in and complete your profile. Approval happens only after the email is confirmed. If you did not create this account, ignore this email.`,
    });
    return { subject, html };
  }
  const subject = `Καλώς ήρθες στο ${BRAND} — επιβεβαίωσε το email σου`;
  const html = shell({
    title: `Καλώς ήρθες${first ? `, ${first}` : ''}!`,
    intro: `Σε ευχαριστούμε που γράφτηκες στο ${BRAND} ως φυσικοθεραπευτής. Επιβεβαίωσε ότι αυτό το email είναι δικό σου — χωρίς αυτό δεν μπορεί να εγκριθεί το προφίλ σου.` +
      stepsHtml([
        '<strong>Επιβεβαίωσε το email σου</strong> με το κουμπί παρακάτω.',
        'Συμπλήρωσε το προφίλ σου: φωτογραφία, περιοχές, ειδικότητες και διαθεσιμότητα.',
        'Ανέβασε την άδεια άσκησης επαγγέλματος.',
        'Διάλεξε πακέτο (το Basic είναι δωρεάν).',
        'Η ομάδα μας ελέγχει το προφίλ σου και το εγκρίνει — τότε σε βρίσκουν οι ασθενείς.',
      ]),
    ctaLabel: 'Επιβεβαίωση email',
    ctaUrl: verifyUrl,
    footNote: 'Μπορείς ήδη να συνδεθείς και να συμπληρώσεις το προφίλ σου. Η έγκριση γίνεται μόνο αφού επιβεβαιωθεί το email. Αν δεν έκανες εσύ αυτή την εγγραφή, αγνόησε αυτό το μήνυμα.',
  });
  return { subject, html };
}

export function welcomePatient({ name, verifyUrl, lang = 'el' }) {
  const first = esc((name || '').trim().split(' ')[0]);
  if (lang === 'en') {
    const subject = `Welcome to ${BRAND} — please confirm your email`;
    const html = shell({
      lang, footer: FOOTER_EN,
      title: `Welcome${first ? `, ${first}` : ''}!`,
      intro: `Your ${BRAND} account is ready. Please confirm that this email address is yours, so we can safely send you updates about your appointments.` +
        stepsHtml([
          'Describe what you need and the area where you want the session.',
          'Choose a verified physiotherapist who covers your area.',
          'The physiotherapist comes to your home at the agreed time.',
        ]),
      ctaLabel: 'Confirm my email',
      ctaUrl: verifyUrl,
      footNote: 'Your account already works — you can book right away. If you did not create this account, ignore this email.',
    });
    return { subject, html };
  }
  const subject = `Καλώς ήρθες στο ${BRAND} — επιβεβαίωσε το email σου`;
  const html = shell({
    title: `Καλώς ήρθες${first ? `, ${first}` : ''}!`,
    intro: `Ο λογαριασμός σου στο ${BRAND} είναι έτοιμος. Επιβεβαίωσε ότι αυτό το email είναι δικό σου, ώστε να σου στέλνουμε με ασφάλεια ενημερώσεις για τα ραντεβού σου.` +
      stepsHtml([
        'Περιγράφεις τι χρειάζεσαι και την περιοχή όπου θέλεις τη συνεδρία.',
        'Διαλέγεις επαληθευμένο φυσικοθεραπευτή που καλύπτει την περιοχή σου.',
        'Ο φυσικοθεραπευτής έρχεται στον χώρο σου τη συμφωνημένη ώρα.',
      ]),
    ctaLabel: 'Επιβεβαίωση email',
    ctaUrl: verifyUrl,
    footNote: 'Ο λογαριασμός σου λειτουργεί ήδη — μπορείς να κλείσεις ραντεβού αμέσως. Αν δεν έκανες εσύ αυτή την εγγραφή, αγνόησε αυτό το μήνυμα.',
  });
  return { subject, html };
}

// Επαναποστολή από τον πίνακα («Δεν ήρθε το email;»)
export function verifyEmailAgain({ name, verifyUrl, role, lang = 'el' }) {
  const first = esc((name || '').trim().split(' ')[0]);
  if (lang === 'en') {
    return {
      subject: `Confirm your email — ${BRAND}`,
      html: shell({
        lang, footer: FOOTER_EN,
        title: 'Confirm your email',
        intro: `${first ? `${first}, p` : 'P'}ress the button below to confirm that this email address is yours.`,
        ctaLabel: 'Confirm my email',
        ctaUrl: verifyUrl,
        footNote: role === 'therapist' ? 'Your profile can be approved only after the email is confirmed.' : null,
      }),
    };
  }
  return {
    subject: `Επιβεβαίωση email — ${BRAND}`,
    html: shell({
      title: 'Επιβεβαίωση email',
      intro: `${first ? `${first}, π` : 'Π'}άτησε το κουμπί για να επιβεβαιώσεις ότι αυτό το email είναι δικό σου.`,
      ctaLabel: 'Επιβεβαίωση email',
      ctaUrl: verifyUrl,
      footNote: role === 'therapist' ? 'Το προφίλ σου μπορεί να εγκριθεί μόνο αφού επιβεβαιωθεί το email.' : null,
    }),
  };
}

export { fmtDateTime, fmtTime, fmtDate, SITE, ADMIN_SITE };