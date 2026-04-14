// Admin: CSV export with the same filters as /api/admin/attendees.
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
    else if (cancelled === 'all') { /* no filter */ }
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
      SELECT ticket_id, first_name, last_name, email, phone,
             is_giver_army, giver_army_tenure, media_consent,
             is_waitlist, waitlist_timestamp,
             checked_in, checked_in_at,
             cancelled, cancelled_at,
             created_at, registration_group_id
      FROM attendees
      ${wheres.length ? 'WHERE ' + wheres.join(' AND ') : ''}
      ORDER BY created_at DESC`;

    const result = await env.DB.prepare(sql).bind(...binds).all();
    const headers = [
      'Ticket ID', 'First Name', 'Last Name', 'Email', 'Phone',
      'Giver Army', 'Giver Army Tenure', 'Media Consent',
      'Waitlist', 'Waitlist At',
      'Checked In', 'Checked In At',
      'Cancelled', 'Cancelled At',
      'Registered At', 'Group ID',
    ];
    const rows = (result.results || []).map((r) => [
      r.ticket_id, esc(r.first_name), esc(r.last_name), r.email, esc(r.phone || ''),
      r.is_giver_army ? 'Yes' : 'No',
      r.giver_army_tenure || '',
      r.media_consent ? 'Yes' : 'No',
      r.is_waitlist ? 'Yes' : 'No',
      r.waitlist_timestamp || '',
      r.checked_in ? 'Yes' : 'No',
      r.checked_in_at || '',
      r.cancelled ? 'Yes' : 'No',
      r.cancelled_at || '',
      r.created_at,
      r.registration_group_id,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="gala-attendees-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('export error', err);
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function esc(v) {
  if (v == null) return '';
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
