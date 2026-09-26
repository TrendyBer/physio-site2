// src/app/api/stripe/accept-request/route.js
// ═══════════════════════════════════════════════════════════════════
// Το κουμπί «Αποδοχή» του θεραπευτή.
//
//   Stripe off, ή δεν χρειάζεται τέλος  → η αποδοχή γίνεται ΕΔΩ
//   Χρειάζεται τέλος                     → επιστρέφεται σελίδα πληρωμής·
//                                          η αποδοχή γίνεται στο webhook,
//                                          ΑΦΟΥ πληρωθεί
//
// Ο browser στέλνει μόνο το id του αιτήματος. Ποιος είναι, αν το αίτημα
// είναι δικό του και πόσο πληρώνει τα αποφασίζει ο server.
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import {
  adminDb, getStripeMode, stripeFor, getUserFromRequest, createCheckout, mapDbError,
} from '@/lib/stripeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const db = adminDb();

  const user = await getUserFromRequest(req, db);
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body = {};
  try { body = await req.json(); } catch (_) {}
  const requestId = body?.requestId;
  const lang = body?.lang === 'en' ? 'en' : 'el';
  if (!requestId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { data: request } = await db
    .from('session_requests')
    .select('id, therapist_id, status')
    .eq('id', requestId)
    .single();

  if (!request || request.therapist_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'not_pending' }, { status: 409 });
  }

  const mode = await getStripeMode(db);

  let fee = 0;
  if (mode !== 'off') {
    const { data, error } = await db.rpc('new_patient_fee_for_request', { p_request_id: requestId });
    if (error) {
      console.error('[accept-request] fee', error.message);
      return NextResponse.json({ error: 'generic' }, { status: 500 });
    }
    fee = Number(data || 0);
  }

  // ── Χωρίς τέλος: αποδοχή τώρα ──
  if (fee <= 0) {
    const { error } = await db.rpc('accept_request_server', {
      p_request_id: requestId,
      p_therapist_id: user.id,
    });
    if (error) {
      return NextResponse.json({ error: mapDbError(error.message) }, { status: 409 });
    }
    return NextResponse.json({ accepted: true });
  }

  // ── Με τέλος: σελίδα πληρωμής ──
  try {
    const stripe = stripeFor(mode);
    const url = await createCheckout({
      stripe, db, mode, user, lang,
      kind: 'new_patient_fee',
      amount: fee,
      requestId,
      productName: lang === 'en' ? 'Theralivo — New patient fee' : 'Theralivo — Τέλος νέου ασθενή',
      description: lang === 'en'
        ? 'One-off fee for the first session with a new patient. Your acceptance is confirmed right after payment.'
        : 'Εφάπαξ τέλος για την πρώτη συνεδρία με νέο ασθενή. Η αποδοχή σου επιβεβαιώνεται αμέσως μετά την πληρωμή.',
      statementSuffix: 'NEW PATIENT',
    });
    return NextResponse.json({ url, amount: fee });
  } catch (err) {
    console.error('[accept-request] checkout', err?.message);
    const code = err?.message === 'stripe_key_mismatch' ? 'payments_unavailable' : 'generic';
    return NextResponse.json({ error: code }, { status: 500 });
  }
}
