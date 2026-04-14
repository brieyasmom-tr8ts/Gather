// Admin attendee list with search + filters.
// Query params:
//   search           substring match on name/email
//   checked_in       yes|no
//   giver_army       yes|no
//   tenure           tenure key
//   waitlist         yes|no
//   cancelled        yes|no (default: exclude cancelled)
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const q = (v) => url.searchParams.get(v);
  const search = (q('search') || '').trim();
  const checkedIn = q('checked_in');
  const giverArmy = q('giver_army');
  const tenure = q('tenure');
  const waitlist = q('waitlist');
  const cancelled = q('cancelled');

  try {
    const wheres = [];
    const binds = [];

    if (cancelled === 'yes') wheres.push('cancelled = 1');
    else wheres.push('cancelled = 0');

    if (waitlist === 'yes') wheres.push('is_waitlist = 1');
    else if (waitlist === 'no') wheres.push('is_waitlist = 0');

    if (checkedIn === 'yes') wheres.push('checked_in = 1');
    else if (checkedIn === 'no') wheres.push('checked_in = 0');

    if (giverArmy === 'yes') wheres.push('is_giver_army = 1');
    else if (giverArmy === 'no') wheres.push('is_giver_army = 0');

    if (tenure) { wheres.push('giver_army_tenure = ?'); binds.push(tenure); }

    if (search) {
      wheres.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
      const pat = `%${search}%`;
      binds.push(pat, pat, pat);
    }

    const sql = `
      SELECT id, ticket_id, registration_group_id,
             first_name, last_name, email, phone,
             is_giver_army, giver_army_tenure, media_consent,
             is_waitlist, waitlist_timestamp,
             checked_in, checked_in_at,
             cancelled, cancelled_at,
             created_at
      FROM attendees
      ${wheres.length ? 'WHERE ' + wheres.join(' AND ') : ''}
      ORDER BY created_at DESC`;

    const result = await env.DB.prepare(sql).bind(...binds).all();
    return json({ attendees: result.results || [] });
  } catch (err) {
    console.error('attendees list error', err);
    return json({ error: 'Failed to load attendees', attendees: [] }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
