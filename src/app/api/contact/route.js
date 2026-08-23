import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/*
  POST /api/contact
  ─────────────────
  Δέχεται τη φόρμα επικοινωνίας και στέλνει email στη διεύθυνση που
  ορίζει ο admin στο platform_settings.contact_email.

  ΚΡΙΣΙΜΟ: το email παραλήπτη διαβάζεται από τη ΒΑΣΗ σε κάθε αίτημα.
  Αλλάζεις το πεδίο στο admin panel -> αλλάζει ο παραλήπτης αμέσως,
  χωρίς deploy και χωρίς αλλαγή κώδικα.

  Δεν απαιτεί login.

  ── ENV VARS ────────────────────────────────────────────────────────
  RESEND_API_KEY            (υποχρεωτικό — υπάρχει ήδη για τα notifications)
  RESEND_FROM               (προαιρετικό — το ίδιο που χρησιμοποιεί ήδη
                            το /api/notifications/request)
  CONTACT_FROM_EMAIL        (προαιρετικό — υπερισχύει του RESEND_FROM
                            μόνο για τη φόρμα επικοινωνίας)

                            Σειρά προτεραιότητας:
                            CONTACT_FROM_EMAIL -> RESEND_FROM -> onboarding@resend.dev

                            ΠΡΟΣΟΧΗ: όσο δεν έχεις verified domain στο
                            Resend, το onboarding@resend.dev μπορεί να
                            στείλει ΜΟΝΟ στο email με το οποίο έκανες
                            εγγραφή στο Resend. Βάλε αυτό ακριβώς το
                            email στο admin -> Ρυθμίσεις -> Email
                            παραλήπτη φόρμας και θα δουλέψει.
*/

const FROM =
  process.env.CONTACT_FROM_EMAIL ||
  process.env.RESEND_FROM ||
  'PhysioHome <onboarding@resend.dev>';
const FALLBACK_TO = 'info@physiohome.gr';

// Απλό in-memory rate limit ανά IP. Χάνεται σε cold start — αρκεί για
// να μπλοκάρει bots χωρίς εξωτερική υποδομή.
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) return true;
  arr.push(now);
  hits.set(ip, arr);

  // Καθαρισμός παλιών εγγραφών ώστε να μη φουσκώνει η μνήμη
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

export async function POST(req) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY missing');
      return NextResponse.json({ error: 'server_not_configured' }, { status: 500 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const body = await req.json();
    const {
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      service = '',
      message = '',
      website = '', // honeypot — αόρατο πεδίο, μόνο bots το γεμίζουν
      lang = 'el',
    } = body || {};

    // Bot: απαντάμε 200 ώστε να μην καταλάβει ότι μπλοκαρίστηκε
    if (website) {
      return NextResponse.json({ ok: true });
    }

    const name = `${firstName} ${lastName}`.trim();
    if (!name || !isEmail(email) || !String(message).trim()) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    if (String(message).length > 5000) {
      return NextResponse.json({ error: 'message_too_long' }, { status: 400 });
    }

    // ── Παραλήπτης από τη βάση ─────────────────────────────────────
    let to = FALLBACK_TO;
    let platformName = 'PhysioHome';

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['contact_email', 'email', 'platform_name']);

      const map = {};
      (data || []).forEach((r) => { map[r.key] = r.value; });

      // Προτεραιότητα: contact_email (ειδικό πεδίο) -> email (δημόσιο) -> fallback
      if (isEmail(map.contact_email)) to = map.contact_email.trim();
      else if (isEmail(map.email)) to = map.email.trim();

      if (map.platform_name) platformName = map.platform_name;
    } catch (e) {
      console.error('[contact] settings lookup failed, using fallback:', e);
    }

    // ── Σύνθεση email ──────────────────────────────────────────────
    const rows = [
      ['Όνομα', name],
      ['Email', email],
      ['Τηλέφωνο', phone || '—'],
      ['Υπηρεσία', service || '—'],
      ['Γλώσσα', lang === 'en' ? 'English' : 'Ελληνικά'],
    ];

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a2e44">
  <div style="background:#1a2e44;padding:22px 26px;border-radius:12px 12px 0 0">
    <div style="color:#fff;font-size:18px;font-weight:700">${esc(platformName)}</div>
    <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:3px">Νέο μήνυμα από τη φόρμα επικοινωνίας</div>
  </div>
  <div style="border:1px solid #dce6f0;border-top:none;border-radius:0 0 12px 12px;padding:26px">
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:22px">
      ${rows.map(([k, v]) => `
        <tr>
          <td style="padding:7px 0;color:#6b7a8d;width:120px;vertical-align:top">${esc(k)}</td>
          <td style="padding:7px 0;color:#1a2e44;font-weight:600">${esc(v)}</td>
        </tr>`).join('')}
    </table>
    <div style="font-size:12px;font-weight:600;color:#6b7a8d;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Μήνυμα</div>
    <div style="background:#f8fafb;border-left:3px solid #2a6fdb;border-radius:6px;padding:16px 18px;font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(message)}</div>
    <div style="margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8">
      Απάντησε απευθείας σε αυτό το email για να επικοινωνήσεις με τον αποστολέα.
    </div>
  </div>
</div>`.trim();

    const text = [
      ...rows.map(([k, v]) => `${k}: ${v}`),
      '',
      'Μήνυμα:',
      message,
    ].join('\n');

    // ── Αποστολή ───────────────────────────────────────────────────
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: email,
        subject: `Νέο μήνυμα από ${name}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('[contact] Resend error:', res.status, detail);

      // 403 = προσπάθεια αποστολής σε άλλον παραλήπτη χωρίς verified domain
      if (res.status === 403) {
        return NextResponse.json({ error: 'sender_not_verified' }, { status: 502 });
      }
      return NextResponse.json({ error: 'send_failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] unexpected error:', err);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}