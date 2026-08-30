// src/app/api/notifications/ga/route.js
// ═══════════════════════════════════════════════════════════════════
// Server-side conversions προς GA4 (Measurement Protocol).
//
// ΓΙΑΤΙ SERVER-SIDE:
// Το booking_confirmed συμβαίνει στον browser του ΘΕΡΑΠΕΥΤΗ. Ένα
// client-side event θα αποδιδόταν στη συνεδρία του — και η διαφήμιση
// που έφερε τον ασθενή δεν θα έπαιρνε ποτέ credit.
//
// Εδώ στέλνουμε με το client_id που αποθήκευσε ο ΑΣΘΕΝΗΣ όταν υπέβαλε
// το αίτημα, οπότε το conversion αποδίδεται στη σωστή διαφήμιση.
//
// ENV: GA_MEASUREMENT_ID, GA_API_SECRET
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.NOTIFY_WEBHOOK_SECRET;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GA_SECRET = process.env.GA_API_SECRET;

export async function POST(req) {
  if (!WEBHOOK_SECRET) {
    return Response.json({ error: 'NOTIFY_WEBHOOK_SECRET δεν έχει οριστεί' }, { status: 500 });
  }
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Μη εξουσιοδοτημένο' }, { status: 401 });
  }
  if (!GA_ID || !GA_SECRET) {
    // Δεν είναι σφάλμα: αν δεν έχει στηθεί GA, απλά δεν στέλνουμε.
    return Response.json({ ok: true, skipped: 'GA δεν έχει ρυθμιστεί' });
  }

  let payload;
  try { payload = await req.json(); }
  catch { return Response.json({ error: 'Άκυρο JSON' }, { status: 400 }); }

  const event = payload?.event;
  const ids = Array.isArray(payload?.request_ids) ? payload.request_ids : [];
  if (!['booking_confirmed', 'booking_completed'].includes(event) || ids.length === 0) {
    return Response.json({ ok: true, skipped: 'χωρίς δεδομένα' });
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requests } = await db
    .from('session_requests')
    .select('id, ga_client_id, total_cost, utm_source, utm_medium, utm_campaign, therapist_id, area, problem_type')
    .in('id', ids);

  const sent = [];

  for (const r of requests || []) {
    if (!r.ga_client_id) { sent.push({ id: r.id, ok: false, err: 'χωρίς client_id' }); continue; }

    const body = {
      client_id: r.ga_client_id,
      // non_personalized_ads: σεβασμός στη συγκατάθεση. Αν ο χρήστης
      // αρνήθηκε ad_storage, το conversion μετράει ως conversion αλλά
      // δεν τροφοδοτεί εξατομικευμένη στόχευση.
      events: [{
        name: event,
        params: {
          value: Number(r.total_cost) || 0,
          currency: 'EUR',
          request_id: r.id,
          therapist_id: r.therapist_id,
          area: r.area || undefined,
          problem_type: r.problem_type || undefined,
          source: r.utm_source || undefined,
          medium: r.utm_medium || undefined,
          campaign: r.utm_campaign || undefined,
          // Απαραίτητο ώστε το GA4 να μη θεωρήσει τη συνεδρία «direct»
          session_id: String(Date.now()),
          engagement_time_msec: 1,
        },
      }],
    };

    try {
      const res = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${GA_ID}&api_secret=${GA_SECRET}`,
        { method: 'POST', body: JSON.stringify(body) }
      );
      // Το Measurement Protocol επιστρέφει 204 χωρίς σώμα.
      // Δεν λέει αν το event ήταν έγκυρο — γι' αυτό υπάρχει το
      // /debug/mp/collect κατά τη ρύθμιση.
      sent.push({ id: r.id, ok: res.status === 204 || res.ok, status: res.status });
    } catch (err) {
      sent.push({ id: r.id, ok: false, err: err.message });
    }
  }

  return Response.json({ ok: true, event, processed: sent.length, sent });
}

export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/notifications/ga',
    events: ['booking_confirmed', 'booking_completed'],
    config: {
      ga_measurement_id: Boolean(GA_ID),
      ga_api_secret: Boolean(GA_SECRET),
      webhook_secret: Boolean(WEBHOOK_SECRET),
      service_role_key: Boolean(SERVICE_KEY),
    },
  });
}