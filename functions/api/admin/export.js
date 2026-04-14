export async function onRequestGet(context) {
  const { env } = context;

  try {
    const result = await env.DB.prepare(
      `SELECT a.ticket_id, a.first_name, a.last_name, a.email, a.phone, a.giver_army, a.giver_army_tenure,
              a.photo_consent, a.is_waitlist, a.checked_in, a.checked_in_at, a.cancelled, a.cancelled_at,
              a.created_at, a.registration_group_id
       FROM attendees a ORDER BY a.created_at DESC`
    ).all();

    const headers = [
      'Ticket ID', 'First Name', 'Last Name', 'Email', 'Phone',
      'Giver Army', 'Giver Army Tenure',
      'Photo Consent', 'Waitlist',
      'Checked In', 'Checked In At',
      'Cancelled', 'Cancelled At',
      'Registered At', 'Group ID',
    ];

    const rows = result.results.map((r) => [
      r.ticket_id,
      escapeCsv(r.first_name),
      escapeCsv(r.last_name),
      r.email,
      escapeCsv(r.phone || ''),
      r.giver_army ? 'Yes' : 'No',
      r.giver_army_tenure || '',
      r.photo_consent ? 'Yes' : 'No',
      r.is_waitlist ? 'Yes' : 'No',
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
        'Content-Disposition': `attachment; filename="gala-attendees-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function escapeCsv(value) {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
