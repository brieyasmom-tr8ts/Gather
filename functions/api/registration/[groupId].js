// Public endpoint to fetch a registration by group id — used on the confirmation page.
import { buildPublicEvent } from '../../lib/event.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const { groupId } = params;

  try {
    const reg = await env.DB.prepare(
      'SELECT group_id, edit_token, total_attendees, is_waitlist, created_at FROM registrations WHERE group_id = ?'
    ).bind(groupId).first();
    if (!reg) return json({ error: 'Registration not found' }, 404);

    const attendees = await env.DB.prepare(
      `SELECT ticket_id, first_name, last_name, email, phone,
              is_giver_army, giver_army_tenure, media_consent,
              is_waitlist, checked_in, checked_in_at
       FROM attendees WHERE registration_group_id = ? AND cancelled = 0
       ORDER BY id ASC`
    ).bind(groupId).all();

    const event = await buildPublicEvent(env.DB);
    return json({
      groupId: reg.group_id,
      editToken: reg.edit_token,
      isWaitlist: !!reg.is_waitlist,
      createdAt: reg.created_at,
      attendees: attendees.results,
      event,
    });
  } catch (err) {
    console.error('registration fetch error', err);
    return json({ error: 'Failed to load registration' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
