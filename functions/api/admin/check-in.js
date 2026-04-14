// Admin: check an attendee in by ticket id OR by id.
// Also supports a "search" mode to find attendees quickly from the volunteer UI.
// POST /api/admin/check-in     body: { ticketId } or { id }  → toggle to checked-in
// GET  /api/admin/check-in?q=  → quick search by name/email (for manual one-tap flow)

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q || q.length < 2) return json({ results: [] });
  const pat = `%${q}%`;
  const res = await context.env.DB.prepare(
    `SELECT id, ticket_id, first_name, last_name, email, is_giver_army, giver_army_tenure,
            is_waitlist, checked_in, checked_in_at
     FROM attendees
     WHERE cancelled = 0
       AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
     ORDER BY is_waitlist ASC, last_name ASC
     LIMIT 20`
  ).bind(pat, pat, pat).all();
  return json({ results: res.results || [] });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try { body = await request.json(); } catch { return json({ status: 'invalid' }, 400); }

  let row;
  if (body.id) {
    row = await env.DB.prepare(
      `SELECT id, ticket_id, first_name, last_name, email, is_waitlist, cancelled, checked_in, checked_in_at
       FROM attendees WHERE id = ?`
    ).bind(parseInt(body.id, 10)).first();
  } else if (body.ticketId) {
    row = await env.DB.prepare(
      `SELECT id, ticket_id, first_name, last_name, email, is_waitlist, cancelled, checked_in, checked_in_at
       FROM attendees WHERE ticket_id = ?`
    ).bind(body.ticketId).first();
  } else {
    return json({ status: 'invalid' }, 400);
  }

  if (!row) return json({ status: 'not_found' }, 404);
  if (row.cancelled) return json({ status: 'cancelled', attendee: row }, 400);
  if (row.is_waitlist) return json({ status: 'waitlist', attendee: row }, 400);

  if (row.checked_in) {
    return json({
      status: 'already_checked_in',
      attendee: { first_name: row.first_name, last_name: row.last_name, email: row.email, checked_in_at: row.checked_in_at },
    });
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE attendees SET checked_in = 1, checked_in_at = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(now, row.id).run();

  return json({
    status: 'checked_in',
    attendee: { first_name: row.first_name, last_name: row.last_name, email: row.email, checked_in_at: now },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
