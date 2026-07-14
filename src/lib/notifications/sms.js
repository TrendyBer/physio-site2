// src/lib/notifications/sms.js
// ─────────────────────────────────────────────────────────────
// Αφηρημένος SMS adapter.
// Αλλάζεις πάροχο με ΜΙΑ μεταβλητή περιβάλλοντος: SMS_PROVIDER
// Υποστηρίζονται: 'routee' | 'yuboto' | 'twilio' | 'none'
// Αν SMS_PROVIDER=none (ή δεν οριστεί), τα SMS απενεργοποιούνται
// αθόρυβα — το email συνεχίζει κανονικά.
// ─────────────────────────────────────────────────────────────

const PROVIDER = (process.env.SMS_PROVIDER || 'none').toLowerCase();
const SENDER = process.env.SMS_SENDER || 'PhysioHome';

/**
 * Μετατροπή ελληνικού κινητού σε E.164.
 * Δέχεται: 6912345678 · 06912345678 · 0030691... · +30691... · με κενά/παύλες
 * Επιστρέφει: +306912345678  ή  null αν δεν είναι έγκυρο.
 */
export function normalizePhone(raw) {
  if (!raw) return null;

  let s = String(raw).replace(/[\s\-().]/g, '');

  if (s.startsWith('+')) {
    s = '+' + s.slice(1).replace(/\D/g, '');
  } else {
    s = s.replace(/\D/g, '');
  }

  if (!s) return null;

  // 00 30 ... → +30 ...
  if (s.startsWith('0030')) s = '+' + s.slice(2);
  // +30...
  else if (s.startsWith('+')) { /* ήδη διεθνές */ }
  // 30 69... (10+2 ψηφία)
  else if (s.startsWith('30') && s.length === 12) s = '+' + s;
  // 069... → 69...
  else if (s.startsWith('0')) s = '+30' + s.slice(1);
  // 69... (10 ψηφία)
  else if (s.length === 10) s = '+30' + s;
  else return null;

  // Έλεγχος: ελληνικό κινητό = +30 6xxxxxxxxx
  if (/^\+30\d{10}$/.test(s)) {
    if (!/^\+306/.test(s)) return null; // σταθερό — δεν δέχεται SMS
    return s;
  }

  // Άλλη χώρα — δέχομαι ό,τι μοιάζει με E.164
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;

  return null;
}

/**
 * Αποστολή SMS.
 * @returns {Promise<{ok: boolean, provider: string, providerId?: string, error?: string, skipped?: boolean}>}
 */
export async function sendSms({ to, text }) {
  const phone = normalizePhone(to);

  if (PROVIDER === 'none') {
    return { ok: false, provider: 'none', skipped: true, error: 'SMS απενεργοποιημένα (SMS_PROVIDER=none)' };
  }
  if (!phone) {
    return { ok: false, provider: PROVIDER, error: `Μη έγκυρο κινητό: ${to || '(κενό)'}` };
  }
  if (!text || !text.trim()) {
    return { ok: false, provider: PROVIDER, error: 'Κενό κείμενο SMS' };
  }

  try {
    switch (PROVIDER) {
      case 'routee': return await sendRoutee(phone, text);
      case 'yuboto': return await sendYuboto(phone, text);
      case 'twilio': return await sendTwilio(phone, text);
      default:
        return { ok: false, provider: PROVIDER, error: `Άγνωστος πάροχος SMS: ${PROVIDER}` };
    }
  } catch (err) {
    return { ok: false, provider: PROVIDER, error: err?.message || String(err) };
  }
}

// ─────────────────────────────────────────────────────────────
// ROUTEE  (AMD Telecom)
// ENV: ROUTEE_APP_ID, ROUTEE_APP_SECRET
// ─────────────────────────────────────────────────────────────
let _routeeToken = null;
let _routeeExpiry = 0;

async function routeeToken() {
  if (_routeeToken && Date.now() < _routeeExpiry - 60_000) return _routeeToken;

  const id = process.env.ROUTEE_APP_ID;
  const secret = process.env.ROUTEE_APP_SECRET;
  if (!id || !secret) throw new Error('Λείπουν ROUTEE_APP_ID / ROUTEE_APP_SECRET');

  const basic = Buffer.from(`${id}:${secret}`).toString('base64');

  const res = await fetch('https://auth.routee.net/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Routee auth απέτυχε (${res.status}): ${JSON.stringify(data)}`);
  }

  _routeeToken = data.access_token;
  _routeeExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return _routeeToken;
}

async function sendRoutee(to, text) {
  const token = await routeeToken();

  const res = await fetch('https://connect.routee.net/sms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: text, to, from: SENDER }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, provider: 'routee', error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
  }
  return { ok: true, provider: 'routee', providerId: data.trackingId || data.messageId || null };
}

// ─────────────────────────────────────────────────────────────
// YUBOTO  (Omni API)
// ENV: YUBOTO_API_KEY
// ─────────────────────────────────────────────────────────────
async function sendYuboto(to, text) {
  const key = process.env.YUBOTO_API_KEY;
  if (!key) throw new Error('Λείπει YUBOTO_API_KEY');

  const basic = Buffer.from(`${key}:`).toString('base64');

  const res = await fetch('https://services.yuboto.com/omni/v1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phonenumbers: [to.replace('+', '')],
      channel: 'sms',
      sms: { sender: SENDER, text, typesms: 'sms', longsms: true, validity: 240 },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ErrorCode) {
    return { ok: false, provider: 'yuboto', error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
  }
  return { ok: true, provider: 'yuboto', providerId: data?.Message?.[0]?.id || null };
}

// ─────────────────────────────────────────────────────────────
// TWILIO
// ENV: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
// ─────────────────────────────────────────────────────────────
async function sendTwilio(to, text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM || SENDER;
  if (!sid || !token) throw new Error('Λείπουν TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN');

  const basic = Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: text }).toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, provider: 'twilio', error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
  }
  return { ok: true, provider: 'twilio', providerId: data.sid || null };
}

export const smsEnabled = PROVIDER !== 'none';
export const smsProvider = PROVIDER;