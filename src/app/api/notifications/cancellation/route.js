// src/app/api/notifications/cancellation/route.js
// ═══════════════════════════════════════════════════════════════════
// Ακύρωση ραντεβού — ειδοποιείται ο ΑΛΛΟΣ.
//
// ΤΟ ΚΕΝΟ ΠΟΥ ΚΛΕΙΝΕΙ:
// Η cancel_booking έκανε τα πάντα σωστά — status, slot, strike,
// ιστορικό — και δεν ειδοποιούσε κανέναν. Ο άλλος μάθαινε μόνο αν
// άνοιγε τον πίνακά του. Στην πράξη: ο θεραπευτής πήγαινε στο σπίτι,
// ή ο ασθενής περίμενε κάποιον που δεν θα ερχόταν.
//
// ΑΣΥΜΜΕΤΡΙΑ ΠΟΥ ΘΕΛΕΙ ΠΡΟΣΟΧΗ:
// Όταν ακυρώνει ο ΘΕΡΑΠΕΥΤΗΣ, ο ασθενής μένει χωρίς φροντίδα — και
// συχνά είχε ήδη κανονίσει τη μέρα του. Παίρνει διέξοδο: κουμπί που
// τον γυρίζει στον οδηγό με τα στοιχεία του συμπληρωμένα.
// Όταν ακυρώνει ο ΑΣΘΕΝΗΣ, ο θεραπευτής χάνει μια ώρα — ενοχλητικό
// αλλά όχι αδιέξοδο. Παίρνει απλή ενημέρωση.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendSms } from '@/lib/notifications/sms';
import { cancellationNotice } from '@/lib/notifications/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.NOTIFY_WEBHOOK_SECRET;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function log(db, entry) {
  const { error } = await db.from('notification_log').insert([{
    request_id: entry.request_id || null,
    recipient_role: entry.role,
    recipient_id: entry.recipient_id || null,
    channel: entry.channel,
    template: entry.template,
    to_address: entry.to || '(κενό)',
    status: entry.result?.ok ? 'sent' : 'failed',
    provider: entry.result?.provider || null,
    provider_id: entry.result?.providerId || null,
    error: entry.result?.ok ? null : (entry.result?.error || 'άγνωστο σφάλμα'),
    sent_at: entry.result?.ok ? new Date().toISOString() : null,
  }]);
  if (error) console.error('[cancellation] log failed:', error.message);
}

async function authEmail(db, userId) {
  if (!userId) return null;
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user.email || null;
}

export async function POST(req) {
  if (!WEBHOOK_SECRET) {
    return Response.json({ error: 'NOTIFY_WEBHOOK_SECRET δεν έχει οριστεί' }, { status: 500 });
  }
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Μη εξουσιοδοτημένο' }, { status: 401 });
  }

  let payload;
  try { payload = await req.json(); }
  catch { return Response.json({ error: 'Άκυρο JSON' }, { status: 400 }); }

  const ids = Array.isArray(payload?.booking_ids) ? payload.booking_ids : [];
  if (ids.length === 0) {
    return Response.json({ ok: true, skipped: 'χωρίς δεδομένα' });
  }

  const db = admin();
  const done = [];

  const { data: bookings } = await db
    .from('session_bookings')
    .select('id, request_id, patient_id, therapist_id, session_date, session_time, status, cancelled_reason, cancelled_by_role')
    .in('id', ids);

  for (const b of bookings || []) {
    // Ποιος ακύρωσε καθορίζει ποιος ειδοποιείται.
    const byPatient = b.cancelled_by_role === 'patient';
    const toRole = byPatient ? 'therapist' : 'patient';
    const template = `cancellation_to_${toRole}`;

    // Μία ειδοποίηση ανά κράτηση
    const { data: prior } = await db
      .from('notification_log')
      .select('id')
      .eq('request_id', b.request_id)
      .eq('template', template)
      .eq('status', 'sent')
      .limit(1);
    if (prior && prior.length) continue;

    const [{ data: p }, { data: t }, { data: reqRow }] = await Promise.all([
      db.from('patient_profiles').select('name, phone').eq('id', b.patient_id).maybeSingle(),
      db.from('therapist_profiles').select('name, phone').eq('id', b.therapist_id).maybeSingle(),
      b.request_id
        ? db.from('session_requests').select('id').eq('id', b.request_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const recipientId = toRole === 'therapist' ? b.therapist_id : b.patient_id;
    const recipientName = toRole === 'therapist' ? t?.name : p?.name;
    const otherName = toRole === 'therapist' ? p?.name : t?.name;
    const recipientPhone = toRole === 'therapist' ? t?.phone : p?.phone;

    const msg = cancellationNotice({
      toRole,
      recipientName,
      otherName,
      booking: b,
      reason: b.cancelled_reason,
    });

    // Ο ασθενής παίρνει διέξοδο, όχι σκέτη ενημέρωση.
    // Μια ακύρωση από τον θεραπευτή είναι το ίδιο αδιέξοδο με απόρριψη,
    // απλά συμβαίνει αργότερα και πονάει περισσότερο.
    let html = msg.html;
    if (toRole === 'patient' && reqRow?.id) {
      html = html.replace(
        '/dashboard/patient/new-request',
        `/dashboard/patient/new-request?retry=${reqRow.id}`
      );
    }

    const email = await authEmail(db, recipientId);
    if (email) {
      const res = await sendEmail({ to: email, subject: msg.subject, html });
      await log(db, {
        request_id: b.request_id, role: toRole, recipient_id: recipientId,
        channel: 'email', template, to: email, result: res,
      });
      done.push({ booking: b.id, to: toRole, ok: res.ok, err: res.error });
    } else {
      done.push({ booking: b.id, to: toRole, ok: false, err: 'χωρίς email' });
    }

    // SMS στον ίδιο τον παραλήπτη — το δικό του τηλέφωνο.
    if (recipientPhone) {
      const res = await sendSms({ to: recipientPhone, text: msg.sms });
      if (!res.skipped) {
        await log(db, {
          request_id: b.request_id, role: toRole, recipient_id: recipientId,
          channel: 'sms', template, to: recipientPhone, result: res,
        });
      }
    }
  }

  return Response.json({ ok: true, event: 'cancelled', processed: done.length, sent: done });
}

export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/notifications/cancellation',
    events: ['cancelled'],
    config: {
      supabase_url: Boolean(SUPABASE_URL),
      service_role_key: Boolean(SERVICE_KEY),
      webhook_secret: Boolean(WEBHOOK_SECRET),
      resend_api_key: Boolean(process.env.RESEND_API_KEY),
    },
  });
}