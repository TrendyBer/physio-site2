// src/app/api/stripe/activate-plan/route.js
// ═══════════════════════════════════════════════════════════════════
// «Πληρωμή & ενεργοποίηση» πακέτου που περιμένει πληρωμή.
//
// Ο θεραπευτής διαλέγει πακέτο στην εγγραφή. Πληρώνει ΜΟΝΟ αφού
// εγκριθεί το προφίλ του — δεν πληρώνει για πλατφόρμα που δεν μπορεί
// ακόμα να χρησιμοποιήσει, και δεν χρειάζεται επιστροφή αν απορριφθεί.
//
// Το ποσό είναι αυτό που «πάγωσε» η activate_subscription (τιμή μετά
// την προσφορά) — ποτέ κάτι που στέλνει ο browser.
//
// ΑΥΤΟΜΑΤΗ ΑΝΑΝΕΩΣΗ: η πληρωμή στήνει ΣΥΝΔΡΟΜΗ Stripe. Η κάρτα χρεώνεται
// κάθε μήνα μέχρι ο θεραπευτής να επιλέξει το δωρεάν πακέτο. Οι μηνιαίες
// χρεώσεις, οι αποτυχίες και η λήξη ενημερώνουν τη βάση μέσω webhook.
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import {
  adminDb, getStripeMode, stripeFor, getUserFromRequest, createCheckout,
} from '@/lib/stripeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const db = adminDb();

  const user = await getUserFromRequest(req, db);
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body = {};
  try { body = await req.json(); } catch (_) {}
  const lang = body?.lang === 'en' ? 'en' : 'el';

  const { data: prof } = await db
    .from('therapist_profiles')
    .select('id, is_approved')
    .eq('id', user.id)
    .single();
  if (!prof) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!prof.is_approved) return NextResponse.json({ error: 'not_approved' }, { status: 409 });

  const { data: sub } = await db
    .from('therapist_subscriptions')
    .select('id, status, effective_price, price_locked, promo_ends_at, plan_snapshot')
    .eq('therapist_id', user.id)
    .eq('status', 'pending_payment')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return NextResponse.json({ error: 'nothing_to_pay' }, { status: 409 });

  const mode = await getStripeMode(db);
  const amount = Number(sub.effective_price || 0);
  const listAmount = Number(sub.price_locked || 0);

  // Stripe off ή δωρεάν πακέτο: ενεργοποίηση χωρίς πληρωμή, όπως πριν.
  // (Πακέτο με τιμή που μηδενίζεται προσωρινά από προσφορά ΠΕΡΝΑ από
  // το Stripe, ώστε να αποθηκευτεί η κάρτα για τους επόμενους μήνες.)
  if (mode === 'off' || listAmount <= 0) {
    const { error } = await db.rpc('activate_paid_subscription', {
      p_subscription_id: sub.id,
      p_payment_intent: null,
    });
    if (error) {
      console.error('[activate-plan] free', error.message);
      return NextResponse.json({ error: 'generic' }, { status: 500 });
    }
    return NextResponse.json({ activated: true });
  }

  const planName = sub.plan_snapshot?.name_el || 'Theralivo';

  try {
    const stripe = stripeFor(mode);
    const url = await createCheckout({
      stripe, db, mode, user, lang,
      kind: 'plan_activation',
      amount,
      subscriptionId: sub.id,
      recurring: { listAmount, discount: promoDiscount(sub, amount, listAmount) },
      productName: lang === 'en'
        ? `Theralivo — ${sub.plan_snapshot?.name_en || planName} (monthly)`
        : `Theralivo — Πακέτο «${planName}» (μηνιαία συνδρομή)`,
      description: lang === 'en'
        ? 'Your profile becomes visible to patients right after payment.'
        : 'Το προφίλ σου εμφανίζεται στους ασθενείς αμέσως μετά την πληρωμή.',
      statementSuffix: 'PLAN',
    });
    return NextResponse.json({ url, amount });
  } catch (err) {
    console.error('[activate-plan] checkout', err?.message);
    const code = err?.message === 'stripe_key_mismatch' ? 'payments_unavailable' : 'generic';
    return NextResponse.json({ error: code }, { status: 500 });
  }
}

// Προσφορά → έκπτωση στις πρώτες μηνιαίες χρεώσεις του Stripe.
// Οι μήνες βγαίνουν από το promo_ends_at που «πάγωσε» η βάση.
function promoDiscount(sub, amount, listAmount) {
  const off = Math.round((listAmount - amount) * 100) / 100;
  if (!(off > 0)) return null;
  if (!sub.promo_ends_at) return { amountOff: off, months: null };
  const ms = new Date(sub.promo_ends_at).getTime() - Date.now();
  const months = Math.max(1, Math.round(ms / (30.44 * 86400000)));
  return { amountOff: off, months };
}
