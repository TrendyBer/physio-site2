// src/lib/emailVerify.js
// ═══════════════════════════════════════════════════════════════════
// ΜΟΝΟ ΓΙΑ ΤΟΝ SERVER.
//
// Το link «Επιβεβαίωση email» περιέχει το id του χρήστη και μια υπογραφή
// (HMAC) πάνω στο id + email. Κανείς δεν μπορεί να φτιάξει έγκυρο link
// χωρίς το μυστικό κλειδί του server. Αν ο χρήστης αλλάξει email, τα
// παλιά links παύουν να ισχύουν αυτόματα.
//
// Κλειδί: EMAIL_VERIFY_SECRET αν υπάρχει, αλλιώς παράγεται από το
// SUPABASE_SERVICE_ROLE_KEY (δεν χρειάζεται νέα ρύθμιση στο Vercel).
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';

function secret() {
  const own = process.env.EMAIL_VERIFY_SECRET;
  if (own) return own;
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!base) throw new Error('missing_secret');
  return crypto.createHash('sha256').update('theralivo-email-verify:' + base).digest('hex');
}

export function verifyToken(userId, email) {
  return crypto
    .createHmac('sha256', secret())
    .update(`${userId}.${String(email || '').trim().toLowerCase()}`)
    .digest('base64url')
    .slice(0, 32);
}

export function checkToken(userId, email, token) {
  if (!userId || !email || typeof token !== 'string') return false;
  const expected = Buffer.from(verifyToken(userId, email));
  const got = Buffer.from(token);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

export function verifyUrl(site, userId, email) {
  return `${site}/api/auth/verify-email?u=${encodeURIComponent(userId)}&t=${verifyToken(userId, email)}`;
}

export const PROFILE_TABLE = { therapist: 'therapist_profiles', patient: 'patient_profiles' };
