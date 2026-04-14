// Admin: send a template email to a targeted audience.
// Body: { slug, audience, overrideSubject, overrideBody }
// Audience:
//   'all'              all confirmed (non-waitlist, non-cancelled)
//   'waitlist'         waitlist only
//   'giver_army'       giver army, confirmed
//   'non_giver_army'   non giver army, confirmed
//   'checked_in'       checked in
//   'not_checked_in'   not checked in, confirmed
//   'ids'              specific attendee ids (body.ids = [1, 2, ...])

import { loadTemplate, buildTemplateVars, renderEmail, sendEmail } from '../../lib/email.js';
import { buildPublicEvent } from '../../lib/event.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const slug = body.slug;
  const audience = body.audience || 'all';
  if (!slug) return json({ error: 'Missing slug' }, 400);

  const tmpl = await loadTemplate(env.DB, slug);
  if (!tmpl) return json({ error: 'Template not found' }, 404);
  if (body.overrideSubject) tmpl.subject = body.overrideSubject;
  if (body.overrideBody) tmpl.body = body.overrideBody;

  let where = 'cancelled = 0';
  let binds = [];
  switch (audience) {
    case 'all':            where += ' AND is_waitlist = 0'; break;
    case 'waitlist':       where += ' AND is_waitlist = 1'; break;
    case 'giver_army':     where += ' AND is_waitlist = 0 AND is_giver_army = 1'; break;
    case 'non_giver_army': where += ' AND is_waitlist = 0 AND is_giver_army = 0'; break;
    case 'checked_in':     where += ' AND is_waitlist = 0 AND checked_in = 1'; break;
    case 'not_checked_in': where += ' AND is_waitlist = 0 AND checked_in = 0'; break;
    case 'ids':
      if (!Array.isArray(body.ids) || !body.ids.length) return json({ error: 'ids required' }, 400);
      where += ` AND id IN (${body.ids.map(() => '?').join(',')})`;
      binds = body.ids.map((id) => parseInt(id, 10));
      break;
    default: return json({ error: 'Unknown audience' }, 400);
  }

  const { results } = await env.DB.prepare(
    `SELECT id, ticket_id, first_name, last_name, email, registration_group_id
     FROM attendees WHERE ${where}`
  ).bind(...binds).all();

  if (!results?.length) return json({ ok: true, sent: 0, failed: 0 });

  // Map edit tokens by group
  const groupIds = [...new Set(results.map((r) => r.registration_group_id))];
  const placeholders = groupIds.map(() => '?').join(',');
  const groupRes = await env.DB.prepare(
    `SELECT group_id, edit_token FROM registrations WHERE group_id IN (${placeholders})`
  ).bind(...groupIds).all();
  const tokenByGroup = new Map((groupRes.results || []).map((g) => [g.group_id, g.edit_token]));

  const event = await buildPublicEvent(env.DB);
  const baseUrl = env.BASE_URL || `https://${request.headers.get('host')}`;

  let sent = 0, failed = 0;
  const errors = [];

  // Sequential to respect Resend rate limits
  for (const a of results) {
    const editToken = tokenByGroup.get(a.registration_group_id);
    const vars = buildTemplateVars({ attendee: a, event, baseUrl, editToken });
    const rendered = renderEmail(tmpl, vars, event);
    const result = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: a.email,
      subject: rendered.subject,
      html: rendered.html,
    });
    if (result.ok) sent++;
    else { failed++; errors.push({ email: a.email, error: result.error }); }
  }

  return json({ ok: failed === 0, sent, failed, errors: errors.slice(0, 10) });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
