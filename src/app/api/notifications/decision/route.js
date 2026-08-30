// src/app/api/notifications/decision/route.js
// ═══════════════════════════════════════════════════════════════════
// Ο θεραπευτής απάντησε — ειδοποιείται ο ασθενής.
//
// ΤΟ ΚΕΝΟ ΠΟΥ ΚΛΕΙΝΕΙ:
// Ο υπάρχων trigger πυροδοτεί μόνο σε INSERT νέου αιτήματος. Όταν ο
// θεραπευτής πατούσε «Αποδοχή» ή «Απόρριψη», ο ασθενής δεν μάθαινε
// τίποτα — έπρεπε να ανοίξει τον πίνακα και να ελπίζει.
//
// Στην απόρριψη το email ΔΕΝ είναι αδιέξοδο: το κουμπί οδηγεί πίσω στον
// οδηγό με τα στοιχεία του ασθενή ήδη συμπληρωμένα.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendSms } from '@/lib/notifications/sms';
import {
  patientRequestAccepted,
  patientRequestRejected,
} from '@/lib/notifications/templates';

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
    request_id: entry.request_id,
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
  if (error) console.error('[decision] log failed:', error.message);
}

async function authEmail(db, userId) {
  if (!userId) return null;
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user.email || null;
}

async function alreadySent(db, requestId, template) {
  const { data } = await db
    .from('notification_log')
    .select('id')
    .eq('request_id', requestId)
    .eq('template', template)
    .eq('status', 'sent')
    .limit(1);
  return Boolean(data && data.length);
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

  const event = payload?.event;
  const ids = Array.isArray(payload?.request_ids) ? payload.request_ids : [];
  if (!['accepted', 'rejected'].includes(event) || ids.length === 0) {
    return Response.json({ ok: true, skipped: 'χωρίς δεδομένα' });
  }

  const db = admin();
  const done = [];
  const template = event === 'accepted' ? 'patient_request_accepted' : 'patient_request_rejected';

  const { data: requests } = await db
    .from('session_requests')
    .select('id, patient_id, therapist_id, problem_type, area, address, total_cost, status')
    .in('id', ids);

  for (const r of requests || []) {
    if (await alreadySent(db, r.id, template)) continue;

    const [pEmail, { data: p }, { data: t }, { data: bk }] = await Promise.all([
      authEmail(db, r.patient_id),
      db.from('patient_profiles').select('name, phone').eq('id', r.patient_id).maybeSingle(),
      db.from('therapist_profiles').select('name').eq('id', r.therapist_id).maybeSingle(),
      db.from('session_bookings')
        .select('session_date, session_time')
        .eq('request_id', r.id)
        .order('session_date', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const msg = event === 'accepted'
      ? patientRequestAccepted({ patientName: p?.name, therapistName: t?.name, request: r, booking: bk })
      : patientRequestRejected({ patientName: p?.name, therapistName: t?.name, request: r });

    if (pEmail) {
      const res = await sendEmail({ to: pEmail, subject: msg.subject, html: msg.html });
      await log(db, {
        request_id: r.id, role: 'patient', recipient_id: r.patient_id,
        channel: 'email', template, to: pEmail, result: res,
      });
      done.push({ id: r.id, ok: res.ok, err: res.error });
    } else {
      done.push({ id: r.id, ok: false, err: 'χωρίς email' });
    }

    // SMS προς τον ΙΔΙΟ τον ασθενή — το τηλέφωνό του, όχι κάποιου άλλου.
    if (p?.phone) {
      const res = await sendSms({ to: p.phone, text: msg.sms });
      if (!res.skipped) {
        await log(db, {
          request_id: r.id, role: 'patient', recipient_id: r.patient_id,
          channel: 'sms', template, to: p.phone, result: res,
        });
      }
    }
  }

  return Response.json({ ok: true, event, processed: done.length, sent: done });
}

export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/notifications/decision',
    events: ['accepted', 'rejected'],
    config: {
      supabase_url: Boolean(SUPABASE_URL),
      service_role_key: Boolean(SERVICE_KEY),
      webhook_secret: Boolean(WEBHOOK_SECRET),
      resend_api_key: Boolean(process.env.RESEND_API_KEY),
    },
  });
}