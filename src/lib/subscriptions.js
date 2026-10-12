// src/lib/subscriptions.js
// ─────────────────────────────────────────────────────────────
// Κοινές ενέργειες συνδρομών, ΜΟΝΟ για τον server (service role).
// Χρησιμοποιούνται από το webhook του Stripe και από το καθημερινό cron.
// ─────────────────────────────────────────────────────────────

// Κλείνει μια συνδρομή και βάζει τον θεραπευτή στο δωρεάν πακέτο (Basic).
// Δεν κάνει τίποτα αν ο θεραπευτής έχει ήδη άλλο ενεργό πακέτο.
// Επιστρέφει true αν έγινε η μετάβαση.
export async function downgradeToBasic(db, row, reason) {
  const nowIso = new Date().toISOString();

  await db.from('therapist_subscriptions')
    .update({ status: 'canceled', canceled_at: nowIso, updated_at: nowIso })
    .eq('id', row.id);

  const { data: other } = await db.from('therapist_subscriptions')
    .select('id')
    .eq('therapist_id', row.therapist_id)
    .in('status', ['trialing', 'active', 'past_due', 'exempt'])
    .limit(1);
  if (other?.length) return false;

  const { data: basic } = await db.from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_archived', false)
    .eq('price_monthly', 0)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!basic) { console.error('[subscriptions] no free plan for downgrade'); return false; }

  const start = new Date();
  const end = new Date(start); end.setMonth(end.getMonth() + 1);
  const { error } = await db.from('therapist_subscriptions').insert({
    therapist_id: row.therapist_id,
    plan_id: basic.id,
    status: 'active',
    billing_interval: 'monthly',
    price_locked: 0,
    first_session_fee_locked: Number(basic.first_session_fee || 0),
    effective_price: 0,
    effective_first_session_fee: Number(basic.first_session_fee || 0),
    plan_snapshot: basic,
    plan_version: basic.version ?? null,
    agreement_version: row.agreement_version,
    agreement_accepted_at: row.agreement_accepted_at,
    agreement_snapshot: {
      auto_downgrade: true,
      from_plan: row.plan_snapshot?.name_el || null,
      reason,
      at: start.toISOString(),
    },
    started_at: start.toISOString(),
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString(),
  });
  if (error) { console.error('[subscriptions] downgrade insert', error.message); return false; }
  return true;
}

// Συνδρομή που είναι δωρεάν ΜΟΝΟ λόγω προσφοράς (κανονική τιμή > 0)
// και χωρίς κάρτα στο Stripe.
export function isFreeByPromo(sub) {
  return !!sub
    && Number(sub.effective_price || 0) <= 0
    && Number(sub.price_locked || 0) > 0
    && !!sub.promo_ends_at
    && !sub.stripe_subscription_id;
}
