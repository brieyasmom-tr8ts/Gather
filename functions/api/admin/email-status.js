// Admin: health check for email delivery.
// Verifies the Brevo key works, the sender is verified, and shows recent
// signup-confirmation results so problems are visible instead of silent.
import { ensureEmailTables } from '../../lib/scheduled.js';

const DEFAULT_FROM = 'Celebrate Gala 2026 <gala@giverarmy.com>';

export async function onRequestGet({ env }) {
  const fromRaw = env.EMAIL_FROM || DEFAULT_FROM;
  const fromEmail = (fromRaw.match(/<(.+?)>/)?.[1] || fromRaw).trim().toLowerCase();

  const status = {
    apiKeyConfigured: !!env.BREVO_API_KEY,
    apiKeyValid: null,
    account: null,
    from: fromRaw,
    fromUsingDefault: !env.EMAIL_FROM,
    senderVerified: null,
    baseUrl: env.BASE_URL || null,
    error: null,
    recent: [],
    last24h: { sent: 0, failed: 0, skipped: 0 },
  };

  if (env.BREVO_API_KEY) {
    try {
      const acc = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': env.BREVO_API_KEY, accept: 'application/json' },
      });
      status.apiKeyValid = acc.ok;
      if (acc.ok) {
        const a = await acc.json();
        const plan = (a.plan || []).find((p) => p.type !== 'sms') || a.plan?.[0];
        status.account = { email: a.email, company: a.companyName, plan: plan?.type, credits: plan?.credits };
      } else {
        status.error = `Brevo rejected the API key (HTTP ${acc.status})`;
      }

      if (acc.ok) {
        const s = await fetch('https://api.brevo.com/v3/senders', {
          headers: { 'api-key': env.BREVO_API_KEY, accept: 'application/json' },
        });
        if (s.ok) {
          const { senders = [] } = await s.json();
          const match = senders.find((x) => (x.email || '').toLowerCase() === fromEmail);
          const domain = fromEmail.split('@')[1];
          const domainMatch = senders.find((x) => (x.email || '').toLowerCase().endsWith('@' + domain) && x.active);
          status.senderVerified = match ? !!match.active : (domainMatch ? true : false);
        }
      }
    } catch (e) {
      status.error = `Could not reach Brevo: ${e.message}`;
    }
  }

  try {
    await ensureEmailTables(env.DB);
    const recent = await env.DB.prepare(
      `SELECT email, kind, status, error, created_at FROM email_log ORDER BY id DESC LIMIT 15`
    ).all();
    status.recent = recent.results || [];
    const counts = await env.DB.prepare(
      `SELECT status, COUNT(*) AS n FROM email_log WHERE created_at >= datetime('now', '-1 day') GROUP BY status`
    ).all();
    for (const r of counts.results || []) status.last24h[r.status] = r.n;
  } catch (e) {
    console.error('email-status log read failed', e);
  }

  return new Response(JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } });
}
