// src/app/api/notifications/lifecycle/route.js
// ═══════════════════════════════════════════════════════════════════
// Ειδοποιήσεις κύκλου ζωής αιτήματος.
//
// Καλείται από pg_cron μέσω pg_net, με το ίδιο μυστικό που χρησιμοποιεί
// και το /api/notifications/request.
//
// ΓΙΑΤΙ ΞΕΧΩΡΙΣΤΟ ROUTE:
// Το /api/notifications/request πυροδοτείται από trigger σε INSERT ενός
// αιτήματος. Εδώ δεν υπάρχει «ένα» γεγονός — υπάρχουν παρτίδες γραμμών
// που άλλαξαν κατάσταση από το cron. Διαφορετική ροή, διαφορετικό route.
//
// events:
//   expired   — αιτήματα που έληξαν, ειδοποιείται ο ασθενής
//   reminder  — εκκρεμή στις 8 ώρες, ειδοποιείται ο θεραπευτής
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendSms } from '@/lib/notifications/sms';
import {
  patientRequestExpired,
  therapistPendingReminder,
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
  if (error) console.error('[lifecycle] log failed:', error.message);
}

// Το email δεν ζει στα προφίλ — ζει στο auth.users
async function authEmail(db, userId) {
  if (!userId) return null;
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user.email || null;
}

// Στέλνει μία φορά ανά αίτημα ανά template.
// Το cron τρέχει κάθε 15 λεπτά· χωρίς αυτόν τον έλεγχο, ένα ληγμένο
// αίτημα θα έστελνε email κάθε τέταρτο μέχρι να το δει κάποιος.
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
  if (!SERVICE_KEY) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY δεν έχει οριστεί' }, { status: 500 });
  }

  let payload;
  try { payload = await req.json(); }
  catch { return Response.json({ error: 'Άκυρο JSON' }, { status: 400 }); }

  const event = payload?.event;
  const ids = Array.isArray(payload?.request_ids) ? payload.request_ids : [];
  if (!event || ids.length === 0) {
    return Response.json({ ok: true, skipped: 'χωρίς δεδομένα' });
  }

  const db = admin();
  const done = [];

  const { data: cfg } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', ['request_expiry_hours', 'request_reminder_hours']);
  const settings = {};
  (cfg || []).forEach(r => { settings[r.key] = r.value; });
  const expiryHours = parseInt(settings.request_expiry_hours, 10) || 24;
  const reminderHours = parseInt(settings.request_reminder_hours, 10) || 8;

  const { data: requests } = await db
    .from('session_requests')
    .select('id, patient_id, therapist_id, problem_type, area, total_cost, status')
    .in('id', ids);

  for (const r of requests || []) {
    // ═══ ΛΗΞΗ → ΑΣΘΕΝΗΣ ═══
    if (event === 'expired') {
      if (await alreadySent(db, r.id, 'patient_request_expired')) continue;

      const [pEmail, { data: p }, { data: t }] = await Promise.all([
        authEmail(db, r.patient_id),
        db.from('patient_profiles').select('name').eq('id', r.patient_id).maybeSingle(),
        db.from('therapist_profiles').select('name').eq('id', r.therapist_id).maybeSingle(),
      ]);

      const msg = patientRequestExpired({
        patientName: p?.name,
        therapistName: t?.name,
        request: r,
        hours: expiryHours,
      });

      if (pEmail) {
        const res = await sendEmail({ to: pEmail, subject: msg.subject, html: msg.html });
        await log(db, {
          request_id: r.id, role: 'patient', recipient_id: r.patient_id,
          channel: 'email', template: 'patient_request_expired', to: pEmail, result: res,
        });
        done.push({ id: r.id, to: 'patient', ok: res.ok, err: res.error });
      } else {
        done.push({ id: r.id, to: 'patient', ok: false, err: 'χωρίς email' });
      }
    }

    // ═══ ΥΠΕΝΘΥΜΙΣΗ → ΘΕΡΑΠΕΥΤΗΣ ═══
    if (event === 'reminder') {
      if (await alreadySent(db, r.id, 'therapist_pending_reminder')) continue;

      const [tEmail, { data: t }] = await Promise.all([
        authEmail(db, r.therapist_id),
        db.from('therapist_profiles').select('name, phone').eq('id', r.therapist_id).maybeSingle(),
      ]);

      const msg = therapistPendingReminder({
        therapistName: t?.name,
        request: r,
        hoursLeft: Math.max(1, expiryHours - reminderHours),
      });

      if (tEmail) {
        const res = await sendEmail({ to: tEmail, subject: msg.subject, html: msg.html });
        await log(db, {
          request_id: r.id, role: 'therapist', recipient_id: r.therapist_id,
          channel: 'email', template: 'therapist_pending_reminder', to: tEmail, result: res,
        });
        done.push({ id: r.id, to: 'therapist', ok: res.ok, err: res.error });
      }

      if (t?.phone) {
        const res = await sendSms({ to: t.phone, text: msg.sms });
        if (!res.skipped) {
          await log(db, {
            request_id: r.id, role: 'therapist', recipient_id: r.therapist_id,
            channel: 'sms', template: 'therapist_pending_reminder', to: t.phone, result: res,
          });
        }
      }
    }
  }

  return Response.json({ ok: true, event, processed: done.length, sent: done });
}

export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/notifications/lifecycle',
    events: ['expired', 'reminder'],
    config: {
      supabase_url: Boolean(SUPABASE_URL),
      service_role_key: Boolean(SERVICE_KEY),
      webhook_secret: Boolean(WEBHOOK_SECRET),
      resend_api_key: Boolean(process.env.RESEND_API_KEY),
      resend_from: process.env.RESEND_FROM || '(default onboarding@resend.dev)',
    },
  });
}