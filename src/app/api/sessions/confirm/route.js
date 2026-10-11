// src/app/api/sessions/confirm/route.js
// ═══════════════════════════════════════════════════════════════════
// Η απάντηση του ασθενή στο «Έγινε η συνεδρία;»
//
//   Ναι  → η συνεδρία κλείνει (payment_status = released)
//   Όχι  → σημειώνεται ως αμφισβητούμενη και ειδοποιείται η ομάδα
//          με email, για να το εξετάσει. Δεν κλείνει αυτόματα.
//
// Ο browser στέλνει μόνο το id του ραντεβού και την απάντηση. Ποιος
// είναι και αν το ραντεβού είναι δικό του το αποφασίζει ο server.
// Αν ο ασθενής δεν απαντήσει σε 7 ημέρες, η συνεδρία κλείνει αυτόματα
// από τη βάση (auto_confirm_sessions, μέσω cron).
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { adminDb, getUserFromRequest } from '@/lib/stripeServer';
import { sendEmail } from '@/lib/notifications/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@theralivo.com';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function POST(req) {
  const db = adminDb();

  const user = await getUserFromRequest(req, db);
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body = {};
  try { body = await req.json(); } catch (_) {}
  const bookingId = body?.bookingId;
  const happened = body?.happened;
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  if (!bookingId || typeof happened !== 'boolean') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const { data: booking } = await db
    .from('session_bookings')
    .select('id, request_id, status, payment_status, patient_confirmation, session_date, session_time')
    .eq('id', bookingId)
    .single();
  if (!booking) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: request } = await db
    .from('session_requests')
    .select('id, patient_id, therapist_id, patient_name')
    .eq('id', booking.request_id)
    .single();
  if (!request || request.patient_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Ερωτάται μόνο όταν ο θεραπευτής έχει δηλώσει ότι έγινε,
  // και μόνο μία φορά.
  if (booking.status !== 'completed' || booking.payment_status !== 'held' || booking.patient_confirmation) {
    return NextResponse.json({ error: 'already_answered' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const update = happened
    ? { payment_status: 'released', patient_released_at: now, patient_confirmation: 'confirmed', patient_confirmed_at: now }
    : { patient_confirmation: 'disputed', patient_confirmed_at: now, patient_dispute_note: note || null };

  const { error } = await db
    .from('session_bookings')
    .update(update)
    .eq('id', bookingId)
    .eq('payment_status', 'held')
    .is('patient_confirmation', null);
  if (error) {
    console.error('[sessions/confirm]', error.message);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  if (!happened) {
    // Η ειδοποίηση δεν πρέπει να χαλάσει την απάντηση του ασθενή.
    try {
      const { data: th } = await db
        .from('therapist_profiles')
        .select('name, phone')
        .eq('id', request.therapist_id)
        .single();
      const when = `${booking.session_date || ''} ${booking.session_time ? String(booking.session_time).slice(0, 5) : ''}`.trim();
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Ασθενής δηλώνει ότι η συνεδρία ΔΕΝ έγινε — ${when}`,
        html: `
          <p>Ένας ασθενής δήλωσε ότι η συνεδρία <strong>δεν έγινε</strong>, ενώ ο θεραπευτής την είχε σημειώσει ως ολοκληρωμένη.</p>
          <ul>
            <li><strong>Ασθενής:</strong> ${esc(request.patient_name || '-')} (${esc(user.email || '-')})</li>
            <li><strong>Θεραπευτής:</strong> ${esc(th?.name || '-')} ${th?.phone ? `(${esc(th.phone)})` : ''}</li>
            <li><strong>Ραντεβού:</strong> ${esc(when || '-')}</li>
            <li><strong>Booking id:</strong> ${esc(bookingId)}</li>
          </ul>
          <p><strong>Σχόλιο ασθενή:</strong><br>${note ? esc(note).replace(/\n/g, '<br>') : '<em>(κανένα)</em>'}</p>
        `,
        replyTo: user.email || undefined,
      });
    } catch (e) {
      console.error('[sessions/confirm] email failed:', e?.message);
    }
  }

  return NextResponse.json({ ok: true });
}
