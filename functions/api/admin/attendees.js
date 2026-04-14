export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim();

  try {
    let result;

    if (search) {
      const pattern = `%${search}%`;
      result = await env.DB.prepare(
        `SELECT id, ticket_id, first_name, last_name, email, giver_army, giver_army_tenure, checked_in, checked_in_at, created_at
         FROM attendees
         WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
         ORDER BY created_at DESC`
      ).bind(pattern, pattern, pattern).all();
    } else {
      result = await env.DB.prepare(
        `SELECT id, ticket_id, first_name, last_name, email, giver_army, giver_army_tenure, checked_in, checked_in_at, created_at
         FROM attendees ORDER BY created_at DESC`
      ).all();
    }

    return new Response(JSON.stringify({ attendees: result.results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Attendees error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load attendees' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
