// Admin: update, cancel, or move-from-waitlist a single attendee.
// PATCH /api/admin/attendee/:id  body: { action: 'update'|'cancel'|'move_to_confirmed', ...fields }

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const id = parseInt(params.id, 10);
  if (!id) return json({ error: 'Invalid id' }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const row = await env.DB.prepare(
    `SELECT id, ticket_id, registration_group_id, is_waitlist, cancelled FROM attendees WHERE id = ?`
  ).bind(id).first();
  if (!row) return json({ error: 'Attendee not found' }, 404);

  const action = body.action || 'update';

  if (action === 'cancel') {
    await env.DB.prepare(
      `UPDATE attendees SET cancelled=1, cancelled_at=datetime('now'), updated_at=datetime('now') WHERE id=?`
    ).bind(id).run();
    return json({ ok: true });
  }

  if (action === 'move_to_confirmed') {
    await env.DB.prepare(
      `UPDATE attendees SET is_waitlist=0, waitlist_timestamp=NULL, updated_at=datetime('now') WHERE id=?`
    ).bind(id).run();
    // If the whole group was on waitlist, confirm the group
    await env.DB.prepare(
      `UPDATE registrations SET is_waitlist = 0 WHERE group_id = ?`
    ).bind(row.registration_group_id).run();
    return json({ ok: true });
  }

  if (action === 'update') {
    const fields = [];
    const binds = [];
    const mapping = {
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email ? body.email.trim().toLowerCase() : undefined,
      phone: body.phone,
      is_giver_army: body.isGiverArmy == null ? undefined : (body.isGiverArmy ? 1 : 0),
      giver_army_tenure: body.giverArmyTenure,
      media_consent: body.mediaConsent == null ? undefined : (body.mediaConsent ? 1 : 0),
    };
    for (const [col, val] of Object.entries(mapping)) {
      if (val !== undefined) { fields.push(`${col}=?`); binds.push(val); }
    }
    if (!fields.length) return json({ ok: true });
    fields.push(`updated_at=datetime('now')`);
    binds.push(id);
    await env.DB.prepare(`UPDATE attendees SET ${fields.join(', ')} WHERE id=?`).bind(...binds).run();
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
