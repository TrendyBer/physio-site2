// src/lib/stripeServer.js
// ═══════════════════════════════════════════════════════════════════
// ΜΟΝΟ ΓΙΑ ΤΟΝ SERVER. Δεν εισάγεται ποτέ σε component του browser:
// περιέχει το μυστικό κλειδί του Stripe και το service role της βάσης.
//
// Ο διακόπτης (platform_settings.stripe_mode):
//   off  → καμία πληρωμή, όλα όπως πριν
//   test → κλειδί sk_test_ / rk_test_, ψεύτικες κάρτες
//   live → κλειδί sk_live_ / rk_live_, πραγματικά χρήματα
// Αν ο διακόπτης και το κλειδί δεν ταιριάζουν, ΣΤΑΜΑΤΑΜΕ. Καλύτερα
// μια καθαρή αποτυχία παρά δοκιμαστική χρέωση σε πραγματικό θεραπευτή
// ή πραγματική χρέωση σε δοκιμή.
// ═══════════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://theralivo.com';

export function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function getStripeMode(db) {
  const { data, error } = await db.rpc('stripe_mode');
  if (error) { console.error('[stripe_mode]', error.message); return 'off'; }
  return data === 'test' || data === 'live' ? data : 'off';
}

export function stripeFor(mode) {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const isTest = key.startsWith('sk_test_') || key.startsWith('rk_test_');
  const isLive = key.startsWith('sk_live_') || key.startsWith('rk_live_');
  if (mode === 'test' && !isTest) throw new Error('stripe_key_mismatch');
  if (mode === 'live' && !isLive) throw new Error('stripe_key_mismatch');
  return new Stripe(key);
}

// Ο χρήστης από το token του browser — ποτέ από κάτι που στέλνει ο ίδιος.
export async function getUserFromRequest(req, db) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Ένας πελάτης Stripe ανά θεραπευτή (ξεχωριστός για test/live).
// Εκεί ζουν οι αποθηκευμένες κάρτες του.
async function ensureCustomer(stripe, db, mode, therapistId, email) {
  const col = mode === 'live' ? 'stripe_customer_id' : 'stripe_test_customer_id';
  const { data: prof } = await db
    .from('therapist_profiles')
    .select(`id, name, ${col}`)
    .eq('id', therapistId)
    .single();

  if (prof?.[col]) return prof[col];

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: prof?.name || undefined,
    metadata: { therapist_id: therapistId },
    preferred_locales: ['el'],
  });
  await db.from('therapist_profiles').update({ [col]: customer.id }).eq('id', therapistId);
  return customer.id;
}

// Δημιουργεί (ή ξαναδίνει) σελίδα πληρωμής.
// Αν υπάρχει ήδη ανοιχτή πληρωμή για το ίδιο πράγμα, επιστρέφεται αυτή —
// δύο κλικ στο «Αποδοχή» δεν πρέπει ποτέ να σημαίνουν δύο χρεώσεις.
export async function createCheckout({
  stripe, db, mode, user, kind, amount,
  requestId = null, subscriptionId = null,
  productName, description, statementSuffix, lang = 'el',
}) {
  const reuse = db
    .from('stripe_checkouts')
    .select('id, stripe_session_id')
    .eq('therapist_id', user.id)
    .eq('kind', kind)
    .eq('mode', mode)
    .eq('status', 'open')
    .gte('created_at', new Date(Date.now() - 25 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1);
  const { data: existing } = requestId
    ? await reuse.eq('request_id', requestId)
    : await reuse.eq('subscription_id', subscriptionId);

  if (existing?.[0]?.stripe_session_id) {
    try {
      const s = await stripe.checkout.sessions.retrieve(existing[0].stripe_session_id);
      if (s.status === 'open' && s.url) return s.url;
    } catch (_) { /* έληξε ή δεν βρέθηκε — φτιάχνουμε νέα */ }
  }

  const customerId = await ensureCustomer(stripe, db, mode, user.id, user.email);

  const { data: row, error: insErr } = await db
    .from('stripe_checkouts')
    .insert({
      therapist_id: user.id,
      kind,
      request_id: requestId,
      subscription_id: subscriptionId,
      amount,
      mode,
    })
    .select('id')
    .single();
  if (insErr) throw new Error('checkout_record_failed: ' + insErr.message);

  const back = `${SITE}/dashboard/therapist`;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    locale: lang === 'en' ? 'en' : 'el',
    client_reference_id: row.id,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(amount) * 100),
        product_data: { name: productName, description: description || undefined },
      },
    }],
    // Το τσεκάρισμα «Αποθήκευση κάρτας για επόμενη φορά»
    saved_payment_method_options: { payment_method_save: 'enabled' },
    payment_intent_data: {
      description: productName,
      statement_descriptor_suffix: statementSuffix,
      metadata: { checkout_id: row.id, kind },
    },
    metadata: { checkout_id: row.id, kind },
    // Το ελάχιστο που επιτρέπει το Stripe είναι 30 λεπτά
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${back}?payment=success&kind=${kind}`,
    cancel_url: `${back}?payment=cancel&kind=${kind}`,
  });

  await db
    .from('stripe_checkouts')
    .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
    .eq('id', row.id);

  return session.url;
}

// Μηνύματα της βάσης → σύντομοι κωδικοί για τον browser
export function mapDbError(message = '') {
  const m = String(message);
  if (m.includes('προθεσμία') || m.includes('expired')) return 'expired';
  if (m.includes('ώρα του ραντεβού')) return 'too_late';
  if (m.includes('request_not_pending')) return 'not_pending';
  if (m.includes('not_your_request') || m.includes('not_authorised')) return 'forbidden';
  return 'generic';
}
