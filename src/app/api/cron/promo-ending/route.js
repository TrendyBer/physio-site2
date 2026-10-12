// src/app/api/cron/promo-ending/route.js
// ═══════════════════════════════════════════════════════════════════
// Καθημερινό cron (Vercel Cron, βλ. vercel.json) για πακέτα που είναι
// δωρεάν ΜΟΝΟ λόγω προσφοράς (π.χ. FOUNDERS100) και χωρίς κάρτα:
//
//   · 7 ημέρες πριν λήξει η προσφορά → email υπενθύμισης
//     («πρόσθεσε κάρτα για να συνεχίσεις — η πρώτη χρέωση στη λήξη»)
//   · Έληξε και δεν πρόσθεσε κάρτα → αυτόματα Basic + email
//
// Αν ο θεραπευτής πρόσθεσε κάρτα, η γραμμή έχει πια συνδρομή Stripe και
// δεν αγγίζεται εδώ (τη συνέχεια την κάνει το Stripe).
//
// ΑΣΦΑΛΕΙΑ: το Vercel στέλνει «Authorization: Bearer <CRON_SECRET>».
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/stripeServer';
import { downgradeToBasic, isFreeByPromo } from '@/lib/subscriptions';
import { sendEmail } from '@/lib/notifications/email';
import { therapistPromoEnding, therapistMovedToBasic } from '@/lib/notifications/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86400000;

function fmt(iso) {
  return new Date(iso).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Athens' });
}

async function therapistContact(db, id) {
  const [{ data: prof }, { data: au }] = await Promise.all([
    db.from('therapist_profiles').select('name').eq('id', id).maybeSingle(),
    db.auth.admin.getUserById(id),
  ]);
  return { name: prof?.name || '', email: au?.user?.email || null };
}

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const db = adminDb();
  const now = Date.now();

  const { data: rows, error } = await db
    .from('therapist_subscriptions')
    .select('*')
    .eq('status', 'active')
    .not('promo_ends_at', 'is', null)
    .is('stripe_subscription_id', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let reminded = 0;
  let downgraded = 0;

  for (const row of (rows || []).filter(isFreeByPromo)) {
    const ends = new Date(row.promo_ends_at).getTime();
    const planName = row.plan_snapshot?.name_el || 'πακέτο';
    const price = Number(row.price_locked || 0).toFixed(2).replace('.', ',');

    // Υπενθύμιση: μία φορά, την ημέρα που απομένουν 6–7 ημέρες
    // (το cron τρέχει μία φορά τη μέρα, άρα το παράθυρο πιάνεται μία φορά).
    if (ends - now > 6 * DAY && ends - now <= 7 * DAY) {
      const c = await therapistContact(db, row.therapist_id);
      if (c.email) {
        const t = therapistPromoEnding({ therapistName: c.name, planName, endDate: fmt(row.promo_ends_at), price });
        const r = await sendEmail({ to: c.email, subject: t.subject, html: t.html });
        if (r.ok) reminded += 1;
      }
      continue;
    }

    // Έληξε χωρίς κάρτα → Basic
    if (ends <= now) {
      const ok = await downgradeToBasic(db, row, 'promo_ended_without_card');
      if (ok) {
        downgraded += 1;
        const c = await therapistContact(db, row.therapist_id);
        if (c.email) {
          const t = therapistMovedToBasic({ therapistName: c.name, planName });
          await sendEmail({ to: c.email, subject: t.subject, html: t.html });
        }
      }
    }
  }

  return NextResponse.json({ ok: true, reminded, downgraded });
}
