// src/app/api/stripe/webhook/route.js
// ═══════════════════════════════════════════════════════════════════
// Εδώ το Stripe ειδοποιεί ότι μια πληρωμή ΟΛΟΚΛΗΡΩΘΗΚΕ.
//
// ΓΙΑΤΙ ΕΔΩ ΚΑΙ ΟΧΙ ΣΤΟΝ BROWSER:
// Αν ο θεραπευτής πληρώσει και κλείσει αμέσως το παράθυρο, ο browser
// δεν επιστρέφει ποτέ. Το Stripe όμως ειδοποιεί πάντα τον server.
// Άρα η αποδοχή γίνεται πάντα — ή, αν δεν είναι πια δυνατή, γίνεται
// ΑΥΤΟΜΑΤΗ ΕΠΙΣΤΡΟΦΗ των χρημάτων. Ποτέ χρέωση χωρίς αντάλλαγμα.
//
// ΑΣΦΑΛΕΙΑ: κάθε μήνυμα ελέγχεται με την υπογραφή του Stripe
// (STRIPE_WEBHOOK_SECRET). Ψεύτικο «πληρώθηκε» απορρίπτεται.
//
// ΕΠΑΝΑΛΗΨΕΙΣ: το Stripe μπορεί να στείλει το ίδιο μήνυμα δύο φορές.
// Η μετάβαση open → processing γίνεται ατομικά στη βάση· μόνο ένα
// μήνυμα «κερδίζει», το δεύτερο αγνοείται.
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/stripeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function now() { return new Date().toISOString(); }

export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  const raw = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('[webhook] bad signature', err?.message);
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 });
  }

  const db = adminDb();

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        await applyPaidSession(stripe, db, session);
      }
    } else if (event.type === 'checkout.session.expired') {
      const id = event.data.object?.metadata?.checkout_id;
      if (id) {
        await db.from('stripe_checkouts')
          .update({ status: 'expired', updated_at: now() })
          .eq('id', id).eq('status', 'open');
      }
    }
  } catch (err) {
    // Απρόβλεπτο σφάλμα (π.χ. η βάση δεν απαντά): 500 ώστε το Stripe
    // να ξαναστείλει αργότερα. Η ατομική μετάβαση αποτρέπει διπλή εκτέλεση.
    console.error('[webhook] unexpected', err?.message);
    return NextResponse.json({ error: 'retry' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function applyPaidSession(stripe, db, session) {
  const checkoutId = session.metadata?.checkout_id;
  if (!checkoutId) return;

  const paymentIntent = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null;

  // ── Ατομική «κράτηση»: μόνο ΕΝΑ μήνυμα προχωρά ──
  const { data: claimed, error: claimErr } = await db
    .from('stripe_checkouts')
    .update({ status: 'processing', stripe_payment_intent: paymentIntent, updated_at: now() })
    .eq('id', checkoutId)
    .eq('status', 'open')
    .select('*');

  if (claimErr) throw new Error('claim_failed: ' + claimErr.message);
  const row = claimed?.[0];
  if (!row) return; // ήδη επεξεργάστηκε ή δεν υπάρχει

  if (row.kind === 'new_patient_fee') {
    await applyNewPatientFee(stripe, db, row, paymentIntent);
  } else if (row.kind === 'plan_activation') {
    await applyPlanActivation(stripe, db, row, paymentIntent);
  }
}

async function applyNewPatientFee(stripe, db, row, paymentIntent) {
  const { error: accErr } = await db.rpc('accept_request_server', {
    p_request_id: row.request_id,
    p_therapist_id: row.therapist_id,
  });

  if (accErr) {
    // Η αποδοχή δεν είναι πια δυνατή (έληξε η προθεσμία, ακυρώθηκε
    // στο μεταξύ...). Ο θεραπευτής ΔΕΝ κρατά χρέωση για ασθενή που
    // δεν πήρε: επιστροφή ολόκληρου του ποσού.
    await refund(stripe, db, row, paymentIntent, 'accept_failed: ' + accErr.message);
    return;
  }

  // Καταγραφή του τέλους ως εξοφλημένου + σχέση ασθενή–θεραπευτή
  const { data: reqRow } = await db
    .from('session_requests')
    .select('patient_id')
    .eq('id', row.request_id)
    .single();

  let recorded = false;
  if (reqRow?.patient_id) {
    const { error: recErr } = await db.rpc('record_new_patient_fee', {
      p_therapist_id: row.therapist_id,
      p_patient_id: reqRow.patient_id,
      p_amount: Number(row.amount),
      p_stripe_payment_id: paymentIntent,
      p_request_id: row.request_id,
    });
    if (recErr) console.error('[webhook] record fee', recErr.message);
    else recorded = true;
  }

  // Αν δεν υπάρχει λογαριασμός ασθενή (ή απέτυχε η παραπάνω),
  // κρατάμε τουλάχιστον την εγγραφή της πληρωμής.
  if (!recorded) {
    const { error: payErr } = await db.from('payments').insert({
      therapist_id: row.therapist_id,
      request_id: row.request_id,
      amount: Number(row.amount),
      paid: true,
      paid_at: now(),
      status: 'paid',
      payment_method: 'card',
      stripe_payment_id: paymentIntent,
      fee_type: 'first_session',
      is_first_session: true,
    });
    if (payErr) console.error('[webhook] payments fallback', payErr.message);
  }

  await db.from('stripe_checkouts')
    .update({ status: 'applied', updated_at: now() })
    .eq('id', row.id);
}

async function applyPlanActivation(stripe, db, row, paymentIntent) {
  const { error } = await db.rpc('activate_paid_subscription', {
    p_subscription_id: row.subscription_id,
    p_payment_intent: paymentIntent,
  });

  if (error) {
    await refund(stripe, db, row, paymentIntent, 'activate_failed: ' + error.message);
    return;
  }

  await db.from('stripe_checkouts')
    .update({ status: 'applied', updated_at: now() })
    .eq('id', row.id);
}

async function refund(stripe, db, row, paymentIntent, reason) {
  console.error('[webhook] refunding', row.id, reason);
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntent,
      reason: 'requested_by_customer',
      metadata: { checkout_id: row.id, why: reason.slice(0, 450) },
    });
    await db.from('stripe_checkouts')
      .update({ status: 'refunded', error: reason, updated_at: now() })
      .eq('id', row.id);
  } catch (err) {
    // Η επιστροφή απέτυχε: σημειώνεται για χειροκίνητο έλεγχο από admin
    await db.from('stripe_checkouts')
      .update({ status: 'failed', error: reason + ' | refund_failed: ' + (err?.message || ''), updated_at: now() })
      .eq('id', row.id);
  }
}
