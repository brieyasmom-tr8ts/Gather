// Admin: resend the confirmation email to one attendee.
import { sendTemplateToAttendee } from '../../lib/email.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const attendeeId = parseInt(body.attendeeId, 10);
  if (!attendeeId) return json({ error: 'attendeeId required' }, 400);

  const attendee = await env.DB.prepare(
    `SELECT a.id, a.ticket_id, a.first_name, a.last_name, a.email, a.registration_group_id,
            r.edit_token
     FROM attendees a
     JOIN registrations r ON r.group_id = a.registration_group_id
     WHERE a.id = ?`
  ).bind(attendeeId).first();
  if (!attendee) return json({ error: 'Attendee not found' }, 404);

  const baseUrl = env.BASE_URL || `https://${request.headers.get('host')}`;
  const result = await sendTemplateToAttendee({
    db: env.DB, env, attendee,
    slug: 'confirmation',
    baseUrl,
    editToken: attendee.edit_token,
  });
  return json(result, result.ok ? 200 : 500);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
