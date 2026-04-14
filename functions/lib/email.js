// Email sender (Resend) + template rendering with {{variables}}.
// Templates are stored in D1 (email_templates). The admin can edit them at any time.

import { buildPublicEvent } from './event.js';

const DEFAULT_FROM = 'GiveSendGo Gala <onboarding@resend.dev>';

export async function loadTemplate(db, slug) {
  return await db.prepare('SELECT slug, name, subject, body, updated_at FROM email_templates WHERE slug = ?')
    .bind(slug).first();
}

/**
 * Replace {{variables}} in a raw template string.
 */
export function renderTemplate(str, vars) {
  return String(str || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, name) => {
    const v = vars[name];
    if (v == null) return '';
    return String(v);
  });
}

/**
 * Turn a plain-text template body into HTML suitable for email.
 * Paragraphs on blank lines; {{qr_code}} becomes <img>; {{edit_link}} becomes styled button.
 */
export function bodyToHtml(body, vars) {
  const rendered = renderTemplate(body, {
    ...vars,
    qr_code: '__QR_CODE__',
    edit_link: '__EDIT_LINK__',
  });
  const escaped = rendered
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  let html = paragraphs;
  if (vars.qr_code_url) {
    const qrBlock = `
      <div style="text-align:center;margin:24px 0;">
        <img src="${vars.qr_code_url}" alt="Your ticket QR code" width="180" height="180" style="display:inline-block;border-radius:12px;border:1px solid #e5e7eb;padding:8px;background:#ffffff;" />
        <p style="color:#9ca3af;font-size:12px;font-family:monospace;margin:8px 0 0;">Ticket #${vars.ticket_display_id || ''}</p>
      </div>`;
    html = html.replace(/__QR_CODE__/g, qrBlock);
  } else {
    html = html.replace(/__QR_CODE__/g, '');
  }
  if (vars.edit_link_url) {
    const editBtn = `
      <div style="text-align:center;margin:16px 0;">
        <a href="${vars.edit_link_url}" style="display:inline-block;background:#085078;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px;">Edit my registration</a>
      </div>`;
    html = html.replace(/__EDIT_LINK__/g, editBtn);
  } else {
    html = html.replace(/__EDIT_LINK__/g, '');
  }
  return html;
}

/**
 * Wrap an HTML fragment in a branded email shell.
 */
export function wrapEmailHtml(innerHtml, evt, extras = {}) {
  const calendarParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${evt.name} ${evt.year || ''}`.trim(),
    dates: `${evt.calendar_start}/${evt.calendar_end}`,
    location: [evt.venue_name, `${evt.venue_city}, ${evt.venue_state}`].filter(Boolean).join(', '),
    details: evt.description || '',
  });
  const calendarUrl = `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(evt.name)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#042B3E 0%,#085078 100%);padding:32px 28px;text-align:center;">
            <p style="color:#85D8CE;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;font-weight:700;">${escapeHtml(evt.long_date || '')}</p>
            <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0;letter-spacing:-.5px;">${escapeHtml(evt.name)}${evt.year ? ` ${escapeHtml(evt.year)}` : ''}</h1>
            <p style="color:#B8EAE4;font-size:14px;margin:6px 0 0;">${escapeHtml(evt.time_range || '')}</p>
          </td>
        </tr>
        <tr><td style="padding:28px;">${innerHtml}</td></tr>
        <tr><td style="padding:0 28px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:13px;"><strong style="color:#374151;">When:</strong> ${escapeHtml(evt.long_date || '')} · ${escapeHtml(evt.time_range || '')}</p>
              <p style="margin:0 0 4px;color:#6b7280;font-size:13px;"><strong style="color:#374151;">Where:</strong> ${escapeHtml(evt.venue_name || '')}, ${escapeHtml(evt.venue_city || '')}${evt.venue_state ? ', ' + escapeHtml(evt.venue_state) : ''}</p>
              ${evt.dress_code ? `<p style="margin:0;color:#6b7280;font-size:13px;"><strong style="color:#374151;">Dress code:</strong> ${escapeHtml(evt.dress_code)}</p>` : ''}
            </td></tr>
          </table>
          <p style="text-align:center;margin:16px 0 0;">
            <a href="${calendarUrl}" style="color:#085078;font-size:13px;font-weight:600;text-decoration:none;">Add to Google Calendar &rarr;</a>
          </p>
        </td></tr>
        <tr>
          <td style="padding:20px 28px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} GiveSendGo. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/**
 * Build the standard template variables for an attendee + event.
 */
export function buildTemplateVars({ attendee, event, baseUrl, editToken }) {
  const ticketDisplayId = (attendee.ticket_id || '').substring(0, 8).toUpperCase();
  const qrCodeUrl = baseUrl ? `${baseUrl}/api/ticket/${attendee.ticket_id}/qr` : '';
  const editLinkUrl = baseUrl && editToken ? `${baseUrl}/edit/${editToken}` : '';
  const location = [event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
    .filter(Boolean).join(', ');

  return {
    first_name: attendee.first_name || '',
    last_name: attendee.last_name || '',
    full_name: [attendee.first_name, attendee.last_name].filter(Boolean).join(' '),
    email: attendee.email || '',
    event_name: event.name || '',
    event_year: event.year || '',
    event_date: event.long_date || '',
    event_time: event.time_range || '',
    location,
    dress_code: event.dress_code || '',
    parking_info: event.parking_info || '',
    arrival_info: event.arrival_info || '',
    venue_name: event.venue_name || '',
    ticket_id: attendee.ticket_id || '',
    ticket_display_id: ticketDisplayId,
    qr_code_url: qrCodeUrl,
    edit_link_url: editLinkUrl,
  };
}

/**
 * Render a template (subject+body) into fully-formed email content.
 */
export function renderEmail(template, vars, event) {
  const subject = renderTemplate(template.subject, vars);
  const innerHtml = bodyToHtml(template.body, vars);
  const html = wrapEmailHtml(innerHtml, event, vars);
  return { subject, html };
}

/**
 * Send one email through Resend.
 */
export async function sendEmail({ apiKey, from, to, subject, html }) {
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from || DEFAULT_FROM, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Resend error ${res.status}: ${text}` };
  }
  return { ok: true };
}

/**
 * Convenience: send a template-based email to a single attendee.
 */
export async function sendTemplateToAttendee({ db, env, attendee, slug, baseUrl, editToken, overrideBody }) {
  const template = await loadTemplate(db, slug);
  if (!template) return { ok: false, error: `Template "${slug}" not found` };
  const event = await buildPublicEvent(db);
  const vars = buildTemplateVars({ attendee, event, baseUrl, editToken });
  const rendered = renderEmail(
    overrideBody ? { ...template, body: overrideBody } : template,
    vars,
    event
  );
  return await sendEmail({
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM || DEFAULT_FROM,
    to: attendee.email,
    subject: rendered.subject,
    html: rendered.html,
  });
}
