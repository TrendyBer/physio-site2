// src/app/api/notifications/scheduled/route.js
// ═══════════════════════════════════════════════════════════════════
// Χρονοπρογραμματισμένες ειδοποιήσεις.
//
//   reminder_24h  — υπενθύμιση ραντεβού, μία μέρα πριν
//   review_request — αίτημα αξιολόγησης, μετά την ολοκλήρωση
//
// ΓΙΑΤΙ ΕΝΑ ROUTE ΓΙΑ ΤΑ ΔΥΟ:
// Και τα δύο ξεκινούν από cron, όχι από ενέργεια χρήστη, και δουλεύουν
// πάνω σε session_bookings. Ξεχωριστά routes θα σήμαιναν διπλό κώδικα
// για την ίδια δουλειά.
//
// ΓΙΑΤΙ ΤΟ ΡΟΛΟΪ ΤΗΣ ΑΞΙΟΛΟΓΗΣΗΣ ΞΕΚΙΝΑ 3 ΩΡΕΣ ΜΕΤΑ:
// Αν το email φτάσει τη στιγμή που ο θεραπευτής πατάει «ολοκληρώθηκε»,
// ο ασθενής μπορεί να τον έχει ακόμα στο σπίτι. Άβολο και για τους δύο.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendSms } from '@/lib/notifications/sms';
import { appointmentReminder, patientReviewRequest } from '@/lib/notifications/templates';

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
  if (error) console.error('[scheduled] log failed:', error.message);
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

  const event = payload?.event;
  const ids = Array.isArray(payload?.booking_ids) ? payload.booking_ids : [];
  if (!['reminder_24h', 'review_request'].includes(event) || ids.length === 0) {
    return Response.json({ ok: true, skipped: 'χωρίς δεδομένα' });
  }

  const db = admin();
  const done = [];

  const { data: bookings } = await db
    .from('session_bookings')
    .select('id, request_id, patient_id, therapist_id, session_date, session_time, status')
    .in('id', ids);

  for (const b of bookings || []) {
    const [{ data: p }, { data: t }, { data: r }] = await Promise.all([
      db.from('patient_profiles').select('name, phone').eq('id', b.patient_id).maybeSingle(),
      db.from('therapist_profiles').select('name, phone').eq('id', b.therapist_id).maybeSingle(),
      b.request_id
        ? db.from('session_requests').select('address, area').eq('id', b.request_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // ═══ ΥΠΕΝΘΥΜΙΣΗ 24 ΩΡΩΝ — και στους δύο ═══
    if (event === 'reminder_24h') {
      // Ο ασθενής βλέπει το όνομα του θεραπευτή, ο θεραπευτής τη
      // διεύθυνση — τηλέφωνα δεν ανταλλάσσονται ποτέ.
      const targets = [
        {
          role: 'patient',
          id: b.patient_id,
          name: p?.name,
          other: t?.name,
          phone: p?.phone,
          address: null,
        },
        {
          role: 'therapist',
          id: b.therapist_id,
          name: t?.name,
          other: p?.name,
          phone: t?.phone,
          address: r?.address || r?.area || null,
        },
      ];

      for (const tg of targets) {
        const template = `reminder_24h_${tg.role}`;
        const msg = appointmentReminder({
          toRole: tg.role,
          recipientName: tg.name,
          otherName: tg.other,
          booking: b,
          address: tg.address,
        });

        const email = await authEmail(db, tg.id);
        if (email) {
          const res = await sendEmail({ to: email, subject: msg.subject, html: msg.html });
          await log(db, {
            request_id: b.request_id, role: tg.role, recipient_id: tg.id,
            channel: 'email', template, to: email, result: res,
          });
          done.push({ booking: b.id, to: tg.role, ok: res.ok, err: res.error });
        }

        if (tg.phone) {
          const res = await sendSms({ to: tg.phone, text: msg.sms });
          if (!res.skipped) {
            await log(db, {
              request_id: b.request_id, role: tg.role, recipient_id: tg.id,
              channel: 'sms', template, to: tg.phone, result: res,
            });
          }
        }
      }
    }

    // ═══ ΑΙΤΗΜΑ ΑΞΙΟΛΟΓΗΣΗΣ — μόνο στον ασθενή ═══
    if (event === 'review_request') {
      const msg = patientReviewRequest({
        patientName: p?.name,
        therapistName: t?.name,
        booking: b,
      });

      const email = await authEmail(db, b.patient_id);
      if (email) {
        const res = await sendEmail({ to: email, subject: msg.subject, html: msg.html });
        await log(db, {
          request_id: b.request_id, role: 'patient', recipient_id: b.patient_id,
          channel: 'email', template: 'review_request', to: email, result: res,
        });
        done.push({ booking: b.id, to: 'patient', ok: res.ok, err: res.error });
      }
    }
  }

  return Response.json({ ok: true, event, processed: done.length, sent: done });
}

export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/notifications/scheduled',
    events: ['reminder_24h', 'review_request'],
    config: {
      supabase_url: Boolean(SUPABASE_URL),
      service_role_key: Boolean(SERVICE_KEY),
      webhook_secret: Boolean(WEBHOOK_SECRET),
      resend_api_key: Boolean(process.env.RESEND_API_KEY),
    },
  });
}