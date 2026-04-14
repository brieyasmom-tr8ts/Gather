export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { ticketId } = await request.json();

    if (!ticketId) {
      return jsonResponse({ status: 'invalid', error: 'No ticket ID provided' }, 400);
    }

    const attendee = await env.DB.prepare(
      'SELECT id, ticket_id, first_name, last_name, email, checked_in, checked_in_at FROM attendees WHERE ticket_id = ?'
    ).bind(ticketId).first();

    if (!attendee) {
      return jsonResponse({ status: 'not_found' }, 404);
    }

    if (attendee.checked_in) {
      return jsonResponse({
        status: 'already_checked_in',
        attendee: {
          first_name: attendee.first_name,
          last_name: attendee.last_name,
          email: attendee.email,
          checked_in_at: attendee.checked_in_at,
        },
      });
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE attendees SET checked_in = 1, checked_in_at = ? WHERE ticket_id = ?'
    ).bind(now, ticketId).run();

    return jsonResponse({
      status: 'checked_in',
      attendee: {
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        email: attendee.email,
        checked_in_at: now,
      },
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return jsonResponse({ status: 'error', error: 'Check-in failed' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
