// Admin: list / create / cancel scheduled email sends.
import { ensureEmailTables, AUDIENCES } from '../../lib/scheduled.js';
import { loadTemplate } from '../../lib/email.js';

export async function onRequestGet({ env }) {
  await ensureEmailTables(env.DB);
  const { results } = await env.DB.prepare(
    `SELECT s.*, t.name AS template_name, t.subject AS template_subject,
            (SELECT COUNT(*) FROM scheduled_email_recipients r WHERE r.scheduled_id = s.id) AS recipient_count
     FROM scheduled_emails s
     LEFT JOIN email_templates t ON t.slug = s.slug
     ORDER BY s.send_at DESC
     LIMIT 50`
  ).all();
  return json({ scheduled: results || [] });
}

export async function onRequestPost({ env, request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  const slug = (body.slug || '').trim();
  const audience = body.audience || 'all';
  const sendAt = new Date(body.sendAt);

  if (!slug) return json({ error: 'Pick a template' }, 400);
  if (!AUDIENCES[audience]) return json({ error: 'Unknown audience' }, 400);
  if (Number.isNaN(sendAt.getTime())) return json({ error: 'Pick a valid date and time' }, 400);
  if (sendAt.getTime() < Date.now() - 5 * 60 * 1000) {
    return json({ error: 'That time is in the past' }, 400);
  }
  if (!(await loadTemplate(env.DB, slug))) return json({ error: 'Template not found' }, 404);

  await ensureEmailTables(env.DB);
  const res = await env.DB.prepare(
    'INSERT INTO scheduled_emails (slug, audience, send_at) VALUES (?, ?, ?)'
  ).bind(slug, audience, sendAt.toISOString()).run();
  return json({ ok: true, id: res.meta?.last_row_id }, 201);
}

export async function onRequestDelete({ env, request }) {
  const id = parseInt(new URL(request.url).searchParams.get('id'), 10);
  if (!id) return json({ error: 'id required' }, 400);
  await ensureEmailTables(env.DB);
  const res = await env.DB.prepare(
    `UPDATE scheduled_emails SET status = 'cancelled' WHERE id = ? AND status = 'pending'`
  ).bind(id).run();
  if (!res.meta?.changes) return json({ error: 'Only emails that have not started sending can be cancelled' }, 409);
  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
