// src/app/api/auth/verify-email/route.js
// ═══════════════════════════════════════════════════════════════════
// Το link «Επιβεβαίωση email» από το email καλωσορίσματος.
//
// Ελέγχει την υπογραφή, σημειώνει email_verified_at στο προφίλ και
// στέλνει τον χρήστη στη σελίδα /auth/email-verified με το αποτέλεσμα.
// Δεν χρειάζεται να είναι συνδεδεμένος — μπορεί να το ανοίξει από το
// κινητό ενώ γράφτηκε από τον υπολογιστή.
// ═══════════════════════════════════════════════════════════════════

import { adminDb } from '@/lib/stripeServer';
import { checkToken, PROFILE_TABLE } from '@/lib/emailVerify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Επιστροφή στο ίδιο domain από το οποίο ανοίχτηκε το link.
function goTo(origin) {
  return (status, role) => {
    const q = new URLSearchParams({ s: status });
    if (role) q.set('r', role);
    return Response.redirect(`${origin}/auth/email-verified?${q}`, 303);
  };
}

export async function GET(req) {
  const { searchParams, origin } = new URL(req.url);
  const go = goTo(origin);
  const userId = searchParams.get('u') || '';
  const token = searchParams.get('t') || '';
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !token) return go('invalid');

  const db = adminDb();
  const { data, error } = await db.auth.admin.getUserById(userId);
  const email = data?.user?.email;
  if (error || !email || !checkToken(userId, email, token)) return go('invalid');

  const { data: up } = await db.from('user_profiles').select('role').eq('id', userId).maybeSingle();
  const role = up?.role === 'therapist' ? 'therapist' : up?.role === 'patient' ? 'patient' : null;
  if (!role) return go('invalid');

  const table = PROFILE_TABLE[role];
  const { data: prof, error: pErr } = await db.from(table)
    .select('email_verified_at').eq('id', userId).maybeSingle();
  if (pErr || !prof) {
    console.error('[verify-email]', pErr?.message || 'no profile');
    return go('error', role);
  }
  if (prof.email_verified_at) return go('already', role);

  const { error: uErr } = await db.from(table)
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', userId)
    .is('email_verified_at', null);
  if (uErr) {
    console.error('[verify-email] update failed:', uErr.message);
    return go('error', role);
  }
  return go('ok', role);
}
