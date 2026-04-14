export async function onRequestGet(context) {
  const { env, params } = context;
  const { ticketId } = params;

  try {
    const attendee = await env.DB.prepare(
      'SELECT ticket_id, first_name, last_name, email, giver_army, giver_army_tenure, checked_in, checked_in_at FROM attendees WHERE ticket_id = ?'
    ).bind(ticketId).first();

    if (!attendee) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(attendee), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Ticket lookup error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load ticket' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
