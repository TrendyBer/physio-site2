// src/app/api/auth/welcome/route.js
// ═══════════════════════════════════════════════════════════════════
// Email καλωσορίσματος + επιβεβαίωσης.
//
// Καλείται:
//   • από τη σελίδα εγγραφής, αμέσως μετά τη δημιουργία λογαριασμού
//     → email καλωσορίσματος (διαφορετικό για φυσικοθεραπευτή / ασθενή)
//   • από το κουμπί «Επαναποστολή» στον πίνακα ({ resend: true })
//     → σύντομο email μόνο με το κουμπί επιβεβαίωσης
//
// Ο χρήστης βγαίνει από το token του browser — ποτέ από το body.
// Το email πηγαίνει ΜΟΝΟ στη διεύθυνση του λογαριασμού.
// Όριο: ένα email ανά 60 δευτερόλεπτα ανά χρήστη.
// ═══════════════════════════════════════════════════════════════════

import { adminDb, getUserFromRequest, SITE } from '@/lib/stripeServer';
import { sendEmail } from '@/lib/notifications/email';
import { welcomeTherapist, welcomePatient, verifyEmailAgain } from '@/lib/notifications/templates';
import { verifyUrl, PROFILE_TABLE } from '@/lib/emailVerify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 60 * 1000;

export async function POST(req) {
  const db = adminDb();
  const user = await getUserFromRequest(req, db);
  if (!user?.email) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lang = body?.lang === 'en' ? 'en' : 'el';
  const resend = Boolean(body?.resend);

  const { data: up } = await db.from('user_profiles').select('role').eq('id', user.id).maybeSingle();
  const role = up?.role === 'therapist' ? 'therapist' : up?.role === 'patient' ? 'patient' : null;
  if (!role) return Response.json({ error: 'no_role' }, { status: 400 });

  const table = PROFILE_TABLE[role];
  const { data: prof } = await db.from(table).select('*').eq('id', user.id).maybeSingle();
  const hasColumns = Boolean(prof && 'email_verified_at' in prof);

  if (prof?.email_verified_at) return Response.json({ ok: true, already: true });

  if (hasColumns && prof.email_verify_sent_at) {
    const since = Date.now() - new Date(prof.email_verify_sent_at).getTime();
    if (since < COOLDOWN_MS) {
      return Response.json({ error: 'too_soon', retryIn: Math.ceil((COOLDOWN_MS - since) / 1000) }, { status: 429 });
    }
  }

  const name = prof?.name || user.user_metadata?.name || '';
  const url = verifyUrl(SITE, user.id, user.email);

  // Πρώτη φορά → καλωσόρισμα. Μετά → μόνο υπενθύμιση επιβεβαίωσης.
  const firstTime = !resend && !(hasColumns && prof.email_verify_sent_at);
  const mail = firstTime
    ? (role === 'therapist' ? welcomeTherapist : welcomePatient)({ name, verifyUrl: url, lang })
    : verifyEmailAgain({ name, verifyUrl: url, role, lang });

  const result = await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
  if (!result.ok) {
    console.error('[welcome] email failed:', user.id, result.error);
    return Response.json({ error: 'send_failed' }, { status: 502 });
  }

  if (hasColumns) {
    const { error } = await db.from(table)
      .update({ email_verify_sent_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) console.error('[welcome] sent_at update failed:', error.message);
  }

  return Response.json({ ok: true, kind: firstTime ? 'welcome' : 'resend' });
}
