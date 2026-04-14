import { buildPublicEvent } from '../../../lib/event.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    const row = await env.DB.prepare(
      `SELECT ticket_id, first_name, last_name, email, is_giver_army, giver_army_tenure,
              is_waitlist, checked_in, checked_in_at
       FROM attendees WHERE ticket_id = ? AND cancelled = 0`
    ).bind(params.ticketId).first();
    if (!row) return json({ error: 'Ticket not found' }, 404);

    const event = await buildPublicEvent(env.DB);
    return json({ ...row, event });
  } catch (err) {
    console.error('ticket lookup error', err);
    return json({ error: 'Failed to load ticket' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
