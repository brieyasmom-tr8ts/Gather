// Admin: update one email template or render a preview.
// GET  /api/admin/template/:slug            → load raw template
// POST /api/admin/template/:slug            → body: { subject, body }
// POST /api/admin/template/:slug?preview=1  → render HTML preview
// POST /api/admin/template/:slug?test=1     → body: { toEmail } send to that address

import { loadTemplate, renderEmail, buildTemplateVars, sendEmail } from '../../../lib/email.js';
import { buildPublicEvent } from '../../../lib/event.js';

export async function onRequestGet(context) {
  const tmpl = await loadTemplate(context.env.DB, context.params.slug);
  if (!tmpl) return json({ error: 'Template not found' }, 404);
  return json({ template: tmpl });
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const url = new URL(request.url);

  const tmpl = await loadTemplate(env.DB, params.slug);
  if (!tmpl) return json({ error: 'Template not found' }, 404);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  // Preview — accept draft subject/body without saving
  if (url.searchParams.get('preview') === '1') {
    const draft = {
      ...tmpl,
      subject: body.subject ?? tmpl.subject,
      body: body.body ?? tmpl.body,
    };
    const event = await buildPublicEvent(env.DB);
    const vars = buildTemplateVars({
      attendee: { first_name: 'Alex', last_name: 'Example', email: 'alex@example.com', ticket_id: '00000000-0000-0000-0000-000000000000' },
      event,
      baseUrl: env.BASE_URL || `https://${request.headers.get('host')}`,
      editToken: 'preview-token',
    });
    const rendered = renderEmail(draft, vars, event);
    return json({ subject: rendered.subject, html: rendered.html });
  }

  // Send test
  if (url.searchParams.get('test') === '1') {
    const toEmail = (body.toEmail || '').trim();
    if (!toEmail) return json({ error: 'toEmail required' }, 400);
    const event = await buildPublicEvent(env.DB);
    const vars = buildTemplateVars({
      attendee: { first_name: 'Test', last_name: 'User', email: toEmail, ticket_id: '00000000-0000-0000-0000-000000000000' },
      event,
      baseUrl: env.BASE_URL || `https://${request.headers.get('host')}`,
      editToken: 'test-token',
    });
    const draft = {
      ...tmpl,
      subject: body.subject ?? tmpl.subject,
      body: body.body ?? tmpl.body,
    };
    const rendered = renderEmail(draft, vars, event);
    const result = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
    });
    return json(result, result.ok ? 200 : 500);
  }

  // Save
  const subject = (body.subject || '').toString();
  const tmplBody = (body.body || '').toString();
  if (!subject.trim() || !tmplBody.trim()) {
    return json({ error: 'Subject and body are required' }, 400);
  }
  await env.DB.prepare(
    `UPDATE email_templates SET subject=?, body=?, updated_at=datetime('now') WHERE slug=?`
  ).bind(subject, tmplBody, params.slug).run();
  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
