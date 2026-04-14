export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim();

  // Detect which columns exist so we can handle pre-migration databases
  let cols = new Set();
  try {
    const info = await env.DB.prepare("PRAGMA table_info(attendees)").all();
    cols = new Set(info.results.map((r) => r.name));
  } catch {}

  const extra = [];
  if (cols.has('phone')) extra.push('phone'); else extra.push("NULL as phone");
  if (cols.has('photo_consent')) extra.push('photo_consent'); else extra.push("1 as photo_consent");
  if (cols.has('is_waitlist')) extra.push('is_waitlist'); else extra.push("0 as is_waitlist");
  if (cols.has('cancelled')) extra.push('cancelled'); else extra.push("0 as cancelled");
  if (cols.has('cancelled_at')) extra.push('cancelled_at'); else extra.push("NULL as cancelled_at");

  const selectCols = `id, ticket_id, first_name, last_name, email, giver_army, giver_army_tenure, checked_in, checked_in_at, created_at, ${extra.join(', ')}`;

  try {
    let result;

    if (search) {
      const pattern = `%${search}%`;
      result = await env.DB.prepare(
        `SELECT ${selectCols} FROM attendees
         WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
         ORDER BY created_at DESC`
      ).bind(pattern, pattern, pattern).all();
    } else {
      result = await env.DB.prepare(
        `SELECT ${selectCols} FROM attendees ORDER BY created_at DESC`
      ).all();
    }

    return new Response(JSON.stringify({ attendees: result.results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Attendees error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load attendees', attendees: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
