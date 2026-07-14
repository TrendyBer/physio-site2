// src/app/api/notifications/request/route.js
// ═══════════════════════════════════════════════════════════════════
// Καλείται από Supabase Database Webhook σε INSERT/UPDATE
// του πίνακα session_requests.
//
// Ροή:
//   Νέο αίτημα → webhook → εδώ → Email + SMS → notified_at = now()
//                                              ↑ ΤΟΤΕ ξεκινά το SLA
//
// Ασφάλεια: header  x-webhook-secret  πρέπει να ταιριάζει με
//           το NOTIFY_WEBHOOK_SECRET.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendSms } from '@/lib/notifications/sms';
import {
  therapistNewRequest,
  adminNewRequest,
  patientRequestSent,
} from '@/lib/notifications/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.NOTIFY_WEBHOOK_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Γράφει μία γραμμή στο notification_log ───────────────────
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
  if (error) console.error('[notify] αποτυχία log:', error.message);
}

// ── Έχει ήδη σταλεί αυτό το template για αυτό το αίτημα; ─────
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

// ── Email χρήστη από το auth (δεν το διπλοαποθηκεύουμε) ──────
async function authUser(db, userId) {
  if (!userId) return null;
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return {
    email: data.user.email || null,
    phone: data.user.phone || null,
    name: data.user.user_metadata?.name || null,
  };
}

export async function POST(req) {
  // 1. Ασφάλεια
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
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Άκυρο JSON' }, { status: 400 });
  }

  const { type, record, old_record: oldRecord } = payload || {};
  if (!record?.id) {
    return Response.json({ ok: true, skipped: 'χωρίς record' });
  }

  const db = admin();
  const done = [];

  // 2. SLA ώρες (από platform_settings)
  const { data: setting } = await db
    .from('platform_settings')
    .select('value')
    .eq('key', 'sla_hours')
    .maybeSingle();
  const slaHours = parseInt(setting?.value, 10) || 4;

  // 3. Τι πρέπει να σταλεί;
  const isNew = type === 'INSERT';
  const therapistChanged =
    type === 'UPDATE' && oldRecord?.therapist_id !== record.therapist_id;

  const notifyTherapist =
    Boolean(record.therapist_id) &&
    !record.notified_at &&                 // δεν έχει σταλεί ήδη → σπάει το loop
    record.status === 'pending' &&
    (isNew || therapistChanged);

  if (!isNew && !therapistChanged && !notifyTherapist) {
    return Response.json({ ok: true, skipped: 'καμία ενέργεια' });
  }

  // ═════════════════════════════════════════════════════════
  // A. ΘΕΡΑΠΕΥΤΗΣ — αυτό ξεκινά το ρολόι
  // ═════════════════════════════════════════════════════════
  if (notifyTherapist) {
    const { data: t } = await db
      .from('therapist_profiles')
      .select('id, name, phone')
      .eq('id', record.therapist_id)
      .maybeSingle();

    const tAuth = await authUser(db, record.therapist_id);
    const tEmail = tAuth?.email || null;
    const tPhone = t?.phone || tAuth?.phone || null;

    const slaDueAt = new Date(Date.now() + slaHours * 3600_000).toISOString();
    const msg = therapistNewRequest({
      therapistName: t?.name,
      request: record,
      slaDueAt,
      slaHours,
    });

    let anySent = false;

    if (tEmail) {
      const r = await sendEmail({ to: tEmail, subject: msg.subject, html: msg.html });
      await log(db, {
        request_id: record.id, role: 'therapist', recipient_id: record.therapist_id,
        channel: 'email', template: 'therapist_new_request', to: tEmail, result: r,
      });
      anySent = anySent || r.ok;
      done.push({ ch: 'email', to: 'therapist', ok: r.ok, err: r.error });
    } else {
      done.push({ ch: 'email', to: 'therapist', ok: false, err: 'χωρίς email' });
    }

    if (tPhone) {
      const r = await sendSms({ to: tPhone, text: msg.sms });
      if (!r.skipped) {
        await log(db, {
          request_id: record.id, role: 'therapist', recipient_id: record.therapist_id,
          channel: 'sms', template: 'therapist_new_request', to: tPhone, result: r,
        });
      }
      anySent = anySent || r.ok;
      done.push({ ch: 'sms', to: 'therapist', ok: r.ok, err: r.error });
    } else {
      done.push({ ch: 'sms', to: 'therapist', ok: false, err: 'χωρίς τηλέφωνο' });
    }

    // ⏱ ΤΟ ΡΟΛΟΪ ΞΕΚΙΝΑ ΤΩΡΑ — μόνο αν όντως έφυγε ειδοποίηση.
    // Ο trigger sr_sla_touch υπολογίζει το sla_due_at μόνος του.
    if (anySent) {
      const { error } = await db
        .from('session_requests')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', record.id);
      if (error) console.error('[notify] αποτυχία notified_at:', error.message);
    } else {
      // Καμία ειδοποίηση δεν έφυγε → σημαία για τον admin.
      // Το SLA ΔΕΝ τρέχει: άδικο να τιμωρηθεί κάποιος που δεν ειδοποιήθηκε.
      await db
        .from('session_requests')
        .update({ needs_support: true })
        .eq('id', record.id);
    }
  }

  // ═════════════════════════════════════════════════════════
  // B. ΑΣΘΕΝΗΣ — επιβεβαίωση παραλαβής
  // ═════════════════════════════════════════════════════════
  if (isNew && !(await alreadySent(db, record.id, 'patient_request_sent'))) {
    let pName = record.contact_name || null;
    let pEmail = record.contact_email || null;
    let pPhone = record.contact_phone || null;

    if (record.patient_id) {
      const { data: p } = await db
        .from('patient_profiles')
        .select('name, phone')
        .eq('id', record.patient_id)
        .maybeSingle();
      const pAuth = await authUser(db, record.patient_id);

      pName = pName || p?.name || pAuth?.name;
      pEmail = pEmail || pAuth?.email;
      pPhone = pPhone || p?.phone;
    }

    let tName = null;
    if (record.therapist_id) {
      const { data: t } = await db
        .from('therapist_profiles')
        .select('name')
        .eq('id', record.therapist_id)
        .maybeSingle();
      tName = t?.name || null;
    }

    const msg = patientRequestSent({
      patientName: pName, request: record, therapistName: tName, slaHours,
    });

    if (pEmail) {
      const r = await sendEmail({ to: pEmail, subject: msg.subject, html: msg.html });
      await log(db, {
        request_id: record.id, role: 'patient', recipient_id: record.patient_id,
        channel: 'email', template: 'patient_request_sent', to: pEmail, result: r,
      });
      done.push({ ch: 'email', to: 'patient', ok: r.ok, err: r.error });
    }

    if (pPhone) {
      const r = await sendSms({ to: pPhone, text: msg.sms });
      if (!r.skipped) {
        await log(db, {
          request_id: record.id, role: 'patient', recipient_id: record.patient_id,
          channel: 'sms', template: 'patient_request_sent', to: pPhone, result: r,
        });
      }
      done.push({ ch: 'sms', to: 'patient', ok: r.ok, err: r.error });
    }
  }

  // ═════════════════════════════════════════════════════════
  // C. ADMIN — πάντα ενημερώνεται για νέο αίτημα
  // ═════════════════════════════════════════════════════════
  if (isNew && ADMIN_EMAIL && !(await alreadySent(db, record.id, 'admin_new_request'))) {
    let tName = null;
    if (record.therapist_id) {
      const { data: t } = await db
        .from('therapist_profiles')
        .select('name')
        .eq('id', record.therapist_id)
        .maybeSingle();
      tName = t?.name || null;
    }

    const msg = adminNewRequest({ request: record, therapistName: tName });
    const r = await sendEmail({ to: ADMIN_EMAIL, subject: msg.subject, html: msg.html });
    await log(db, {
      request_id: record.id, role: 'admin',
      channel: 'email', template: 'admin_new_request', to: ADMIN_EMAIL, result: r,
    });
    done.push({ ch: 'email', to: 'admin', ok: r.ok, err: r.error });
  }

  return Response.json({ ok: true, request_id: record.id, sent: done });
}

// Βοήθημα ελέγχου: GET /api/notifications/request
export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/notifications/request',
    config: {
      supabase_url: Boolean(SUPABASE_URL),
      service_role_key: Boolean(SERVICE_KEY),
      webhook_secret: Boolean(WEBHOOK_SECRET),
      resend_api_key: Boolean(process.env.RESEND_API_KEY),
      resend_from: process.env.RESEND_FROM || '(default onboarding@resend.dev)',
      sms_provider: process.env.SMS_PROVIDER || 'none',
      admin_email: Boolean(ADMIN_EMAIL),
    },
  });
}