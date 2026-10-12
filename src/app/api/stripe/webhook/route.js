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
//
// ΣΥΝΔΡΟΜΕΣ (αυτόματη μηνιαία ανανέωση πακέτου):
//   invoice.paid (κύκλος)        → παράταση κατά έναν μήνα + τιμολόγιο
//   invoice.payment_failed       → «ληξιπρόθεσμη» (το Stripe ξαναδοκιμάζει)
//   customer.subscription.updated→ συγχρονισμός «λήγει στο τέλος του μήνα»
//   customer.subscription.deleted→ τέλος συνδρομής → αυτόματα Basic
// Τα αντικείμενα ξαναδιαβάζονται από το Stripe, ώστε ο κώδικας να μην
// εξαρτάται από την έκδοση API του webhook.
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/stripeServer';
import { downgradeToBasic } from '@/lib/subscriptions';

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
      // no_payment_required: συνδρομή που ξεκινά με 100% προσφορά — η κάρτα
      // αποθηκεύτηκε, η πρώτη χρέωση θα γίνει όταν λήξει η προσφορά.
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        await applyPaidSession(stripe, db, session);
      }
    } else if (event.type === 'invoice.paid') {
      await onInvoicePaid(stripe, db, event.data.object);
    } else if (event.type === 'invoice.payment_failed') {
      await onInvoiceFailed(stripe, db, event.data.object);
    } else if (event.type === 'customer.subscription.updated') {
      await onSubscriptionUpdated(stripe, db, event.data.object);
    } else if (event.type === 'customer.subscription.deleted') {
      await onSubscriptionDeleted(stripe, db, event.data.object);
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
    if (session.mode === 'subscription') {
      await applySubscriptionActivation(stripe, db, row, session);
    } else {
      await applyPlanActivation(stripe, db, row, paymentIntent);
    }
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

// ═══════════════════════════════════════════════════════════════════
// ΣΥΝΔΡΟΜΕΣ
// ═══════════════════════════════════════════════════════════════════

const sid = (x) => (typeof x === 'string' ? x : x?.id || null);

// Η περίοδος της συνδρομής: στις νέες εκδόσεις API ζει στο item.
function periodOf(sub) {
  const item = sub?.items?.data?.[0];
  const start = item?.current_period_start ?? sub?.current_period_start;
  const end = item?.current_period_end ?? sub?.current_period_end;
  return {
    start: start ? new Date(start * 1000).toISOString() : null,
    end: end ? new Date(end * 1000).toISOString() : null,
  };
}

// Η πρώτη πληρωμή του πακέτου (Checkout σε mode 'subscription')
async function applySubscriptionActivation(stripe, db, row, session) {
  const stripeSubId = sid(session.subscription);
  const invoiceId = sid(session.invoice);

  // Παλιές συνδρομές Stripe του ίδιου θεραπευτή (π.χ. αλλαγή Plus → Pro):
  // διαβάζονται ΠΡΙΝ την ενεργοποίηση, που τις σημειώνει ως ακυρωμένες.
  const { data: oldRows } = await db
    .from('therapist_subscriptions')
    .select('id, stripe_subscription_id')
    .eq('therapist_id', row.therapist_id)
    .neq('id', row.subscription_id)
    .not('stripe_subscription_id', 'is', null)
    .in('status', ['trialing', 'active', 'past_due']);

  // Χρέωση 0€ (δοκιμαστική περίοδος μέχρι να λήξει προσφορά, ή κουπόνι 100%):
  // ενεργοποίηση ΧΩΡΙΣ καταγραφή πληρωμένου τιμολογίου. Η πρώτη πραγματική
  // χρέωση θα καταγραφεί από το invoice.paid.
  const charged = Number(session.amount_total || 0) > 0;
  const { error } = await db.rpc('activate_paid_subscription', {
    p_subscription_id: row.subscription_id,
    p_payment_intent: charged ? (invoiceId || stripeSubId || session.id) : null,
  });

  if (error) {
    // Δεν μπορεί να ενεργοποιηθεί: σταματά η συνδρομή και επιστρέφονται τα χρήματα.
    console.error('[webhook] subscription activation failed', error.message);
    try { if (stripeSubId) await stripe.subscriptions.cancel(stripeSubId); } catch (e) { console.error('[webhook] cancel after fail', e?.message); }
    const pi = await paymentIntentOfInvoice(stripe, invoiceId);
    if (pi) {
      await refund(stripe, db, row, pi, 'activate_failed: ' + error.message);
    } else {
      await db.from('stripe_checkouts')
        .update({ status: 'failed', error: 'activate_failed (χωρίς χρέωση ή χρειάζεται χειροκίνητη επιστροφή): ' + error.message, updated_at: now() })
        .eq('id', row.id);
    }
    return;
  }

  // Σύνδεση της γραμμής μας με τη συνδρομή του Stripe + πραγματική περίοδος
  let patch = {
    stripe_subscription_id: stripeSubId,
    stripe_customer_id: sid(session.customer),
    cancel_at_period_end: false,
    updated_at: now(),
  };
  try {
    if (stripeSubId) {
      const sub = await stripe.subscriptions.retrieve(stripeSubId);
      const per = periodOf(sub);
      if (per.start) patch.current_period_start = per.start;
      if (per.end) patch.current_period_end = per.end;
    }
  } catch (e) { console.error('[webhook] retrieve sub', e?.message); }
  await db.from('therapist_subscriptions').update(patch).eq('id', row.subscription_id);

  // Τέλος στις παλιές χρεώσεις — ποτέ δύο συνδρομές μαζί.
  for (const o of oldRows || []) {
    if (o.stripe_subscription_id && o.stripe_subscription_id !== stripeSubId) {
      try { await stripe.subscriptions.cancel(o.stripe_subscription_id); }
      catch (e) { console.error('[webhook] cancel old sub', e?.message); }
    }
  }

  await db.from('stripe_checkouts')
    .update({ status: 'applied', updated_at: now() })
    .eq('id', row.id);
}

async function paymentIntentOfInvoice(stripe, invoiceId) {
  if (!invoiceId) return null;
  try {
    const inv = await stripe.invoices.retrieve(invoiceId, { expand: ['payments'] });
    const p = inv?.payments?.data?.find(x => x?.payment?.payment_intent)?.payment?.payment_intent;
    return sid(p) || sid(inv?.payment_intent) || null;
  } catch (e) {
    console.error('[webhook] invoice payments', e?.message);
    return null;
  }
}

function subscriptionIdOfInvoice(inv) {
  return sid(inv?.parent?.subscription_details?.subscription) || sid(inv?.subscription) || null;
}

async function rowByStripeSub(db, stripeSubId) {
  if (!stripeSubId) return null;
  const { data } = await db
    .from('therapist_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

// Μηνιαία χρέωση πέτυχε → παράταση + τιμολόγιο
async function onInvoicePaid(stripe, db, evInvoice) {
  const inv = await stripe.invoices.retrieve(evInvoice.id);
  // Η πρώτη χρέωση καταγράφεται ήδη από το checkout.session.completed
  if (inv.billing_reason === 'subscription_create') return;

  const stripeSubId = subscriptionIdOfInvoice(inv);
  const row = await rowByStripeSub(db, stripeSubId);
  if (!row || row.status === 'canceled') return;

  // Επανάληψη μηνύματος: το ίδιο τιμολόγιο δεν γράφεται δύο φορές
  const { data: dup } = await db.from('subscription_invoices')
    .select('id').eq('stripe_invoice_id', inv.id).limit(1);
  if (dup?.length) return;

  let per = { start: null, end: null };
  try { per = periodOf(await stripe.subscriptions.retrieve(stripeSubId)); } catch (_) {}
  const line = inv.lines?.data?.[0]?.period;
  const start = per.start || (line?.start ? new Date(line.start * 1000).toISOString() : now());
  const end = per.end || (line?.end ? new Date(line.end * 1000).toISOString() : null);

  await db.from('therapist_subscriptions').update({
    status: 'active',
    current_period_start: start,
    ...(end ? { current_period_end: end } : {}),
    updated_at: now(),
  }).eq('id', row.id);

  const { error } = await db.from('subscription_invoices').insert({
    subscription_id: row.id,
    therapist_id: row.therapist_id,
    plan_id: row.plan_id,
    period_start: start.slice(0, 10),
    period_end: end ? end.slice(0, 10) : null,
    amount: Number(inv.amount_paid || 0) / 100,
    status: 'paid',
    paid_at: now(),
    payment_method: 'stripe',
    stripe_invoice_id: inv.id,
    admin_note: 'Μηνιαία ανανέωση — αυτόματη χρέωση κάρτας (Stripe)',
  });
  if (error) console.error('[webhook] renewal invoice', error.message);
}

// Μηνιαία χρέωση απέτυχε → «ληξιπρόθεσμη». Το Stripe ξαναδοκιμάζει·
// αν αποτύχουν όλες οι προσπάθειες, ακυρώνει τη συνδρομή (→ Basic).
async function onInvoiceFailed(stripe, db, evInvoice) {
  const inv = await stripe.invoices.retrieve(evInvoice.id);
  if (inv.billing_reason === 'subscription_create') return;
  const row = await rowByStripeSub(db, subscriptionIdOfInvoice(inv));
  if (!row || !['active', 'past_due', 'trialing'].includes(row.status)) return;
  await db.from('therapist_subscriptions')
    .update({ status: 'past_due', updated_at: now() })
    .eq('id', row.id);
}

// Συγχρονισμός «λήγει στο τέλος του μήνα» και περιόδου
async function onSubscriptionUpdated(stripe, db, evSub) {
  const row = await rowByStripeSub(db, evSub.id);
  if (!row || row.status === 'canceled') return;
  let sub = evSub;
  try { sub = await stripe.subscriptions.retrieve(evSub.id); } catch (_) {}
  const per = periodOf(sub);
  const patch = { cancel_at_period_end: !!sub.cancel_at_period_end, updated_at: now() };
  if (per.end) patch.current_period_end = per.end;
  if (sub.status === 'active' && row.status === 'past_due') patch.status = 'active';
  await db.from('therapist_subscriptions').update(patch).eq('id', row.id);
}

// Η συνδρομή τελείωσε (διακοπή από τον θεραπευτή ή αποτυχία πληρωμής)
// → η γραμμή κλείνει και ο θεραπευτής περνά αυτόματα στο Basic.
// Αν τελείωσε επειδή άλλαξε σε άλλο πληρωμένο πακέτο, η γραμμή είναι
// ήδη «ακυρωμένη» και δεν γίνεται τίποτα.
async function onSubscriptionDeleted(stripe, db, evSub) {
  const row = await rowByStripeSub(db, evSub.id);
  if (!row || !['active', 'past_due', 'trialing'].includes(row.status)) return;
  await downgradeToBasic(db, row, row.status === 'past_due' ? 'payment_failed' : 'canceled_by_therapist');
}
