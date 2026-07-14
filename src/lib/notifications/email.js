// src/lib/notifications/email.js
// ─────────────────────────────────────────────────────────────
// Email μέσω Resend — σκέτο fetch, χωρίς npm dependency.
// ENV: RESEND_API_KEY, RESEND_FROM
// Χωρίς δικό σου domain, βάλε: RESEND_FROM=onboarding@resend.dev
// (δουλεύει ΜΟΝΟ προς το δικό σου email — αρκεί για δοκιμές)
// ─────────────────────────────────────────────────────────────

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || 'PhysioHome <onboarding@resend.dev>';

/**
 * @returns {Promise<{ok: boolean, provider: string, providerId?: string, error?: string, skipped?: boolean}>}
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  if (!API_KEY) {
    return { ok: false, provider: 'resend', skipped: true, error: 'Λείπει RESEND_API_KEY' };
  }
  if (!to) {
    return { ok: false, provider: 'resend', error: 'Κενός παραλήπτης' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        provider: 'resend',
        error: `HTTP ${res.status}: ${data?.message || JSON.stringify(data)}`,
      };
    }

    return { ok: true, provider: 'resend', providerId: data.id || null };
  } catch (err) {
    return { ok: false, provider: 'resend', error: err?.message || String(err) };
  }
}

export const emailEnabled = Boolean(API_KEY);