// src/app/api/stripe/plan-cancel/route.js
// ═══════════════════════════════════════════════════════════════════
// Διακοπή / συνέχιση της αυτόματης μηνιαίας χρέωσης.
//
//   action: 'schedule' → ο θεραπευτής διάλεξε το δωρεάν πακέτο. Η χρέωση
//                        σταματά, μένει στο πακέτο του μέχρι το τέλος του
//                        μήνα που έχει πληρώσει και μετά περνά στο Basic
//                        (το κάνει το webhook customer.subscription.deleted).
//   action: 'undo'     → άλλαξε γνώμη πριν λήξει ο μήνας: η συνδρομή συνεχίζει.
//
// Ποιος είναι και ποια συνδρομή είναι δική του το αποφασίζει ο server.
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { adminDb, getStripeMode, stripeFor, getUserFromRequest } from '@/lib/stripeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const db = adminDb();
  const user = await getUserFromRequest(req, db);
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body = {};
  try { body = await req.json(); } catch (_) {}
  const action = body?.action === 'undo' ? 'undo' : 'schedule';

  const { data: sub } = await db
    .from('therapist_subscriptions')
    .select('id, stripe_subscription_id, current_period_end, status')
    .eq('therapist_id', user.id)
    .in('status', ['trialing', 'active', 'past_due'])
    .not('stripe_subscription_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return NextResponse.json({ error: 'no_recurring_plan' }, { status: 409 });

  try {
    const stripe = stripeFor(await getStripeMode(db));
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: action === 'schedule',
    });
  } catch (err) {
    console.error('[plan-cancel]', err?.message);
    return NextResponse.json({ error: 'generic' }, { status: 500 });
  }

  await db.from('therapist_subscriptions')
    .update({ cancel_at_period_end: action === 'schedule', updated_at: new Date().toISOString() })
    .eq('id', sub.id);

  return NextResponse.json({ ok: true, action, period_end: sub.current_period_end });
}
