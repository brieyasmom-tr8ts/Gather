export async function onRequestGet(context) {
  const { env, params } = context;
  const { groupId } = params;

  try {
    const registration = await env.DB.prepare(
      'SELECT * FROM registrations WHERE group_id = ?'
    ).bind(groupId).first();

    if (!registration) {
      return jsonResponse({ error: 'Registration not found' }, 404);
    }

    const attendees = await env.DB.prepare(
      'SELECT ticket_id, first_name, last_name, email, giver_army, giver_army_tenure, checked_in FROM attendees WHERE registration_group_id = ?'
    ).bind(groupId).all();

    return jsonResponse({
      groupId: registration.group_id,
      createdAt: registration.created_at,
      attendees: attendees.results,
    });
  } catch (err) {
    console.error('Fetch registration error:', err);
    return jsonResponse({ error: 'Failed to load registration' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
