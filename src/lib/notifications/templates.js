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

  const subject = `Νέο αίτημα — απάντηση εντός ${slaHours} ωρών`;

  const html = shell({
    title: `Νέο αίτημα στην περιοχή ${request.area || '—'}`,
    intro: `${first}, ένας ασθενής σας επέλεξε. Έχετε <strong>${slaHours} ώρες</strong> να απαντήσετε — έως τις <strong>${fmtDateTime(slaDueAt)}</strong>.`,
    rows: [
      { label: 'Πρόβλημα', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Τύπος', value: request.session_type === 'package' ? `Πακέτο ${request.package_size} συνεδριών` : 'Μεμονωμένη συνεδρία' },
      { label: 'Αμοιβή', value: request.total_cost ? `${request.total_cost}€` : null },
    ],
    ctaLabel: 'Δείτε το αίτημα',
    ctaUrl: url,
    footNote: `Αν δεν απαντήσετε μέχρι τις ${fmtTime(slaDueAt)}, το αίτημα θα ανατεθεί σε άλλον θεραπευτή. Η ακριβής διεύθυνση εμφανίζεται μόλις αποδεχτείτε.`,
  });

  const sms =
    `PhysioHome: Νεο αιτημα στην περιοχη ${request.area || '-'} (${request.problem_type || 'Φυσιοθεραπεια'}). ` +
    `Απαντηστε εως ${fmtTime(slaDueAt)} (${slaHours}h). ${url}`;

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

  const subject = 'Το αίτημά σας εστάλη';

  const html = shell({
    title: 'Λάβαμε το αίτημά σας',
    intro: therapistName
      ? `${first ? first + ', η' : 'Η'} αίτησή σας στάλθηκε στον/στην <strong>${therapistName}</strong>. Θα απαντήσει εντός ${slaHours} ωρών.`
      : `${first ? first + ', λ' : 'Λ'}άβαμε το αίτημά σας. Η ομάδα μας θα σας βρει τον κατάλληλο θεραπευτή και θα επικοινωνήσουμε μαζί σας.`,
    rows: [
      { label: 'Πρόβλημα', value: request.problem_type },
      { label: 'Περιοχή', value: request.area },
      { label: 'Θεραπευτής', value: therapistName || 'Θα οριστεί από την ομάδα μας' },
    ],
    ctaLabel: 'Δείτε το αίτημά σας',
    ctaUrl: `${SITE}/dashboard/patient`,
    footNote: 'Δεν χρεώνεστε τίποτα μέχρι να επιβεβαιωθεί το ραντεβού.',
  });

  const sms = therapistName
    ? `PhysioHome: Το αιτημα σας σταλθηκε στον/στην ${therapistName}. Θα απαντησει εντος ${slaHours}h.`
    : `PhysioHome: Λαβαμε το αιτημα σας. Θα επικοινωνησουμε συντομα.`;

  return { subject, html, sms };
}

export { fmtDateTime, fmtTime, SITE, ADMIN_SITE };