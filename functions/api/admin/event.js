export async function onRequestGet(context) {
  const { env } = context;
  try {
    const settings = await env.DB.prepare('SELECT * FROM event_settings WHERE id = 1').first();
    return json(settings || {});
  } catch (err) {
    console.error('Admin event GET error:', err);
    return json({ error: 'Failed to load' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();

    const allowed = [
      'name', 'year', 'tagline', 'event_date', 'event_time',
      'location', 'address', 'description', 'dress_code',
      'faq_parking', 'faq_what_to_expect',
      'calendar_start', 'calendar_end', 'iso_start',
      'max_attendees', 'giver_army_signup_url', 'giver_army_video_url',
    ];

    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (fields.length === 0) {
      return json({ error: 'No fields to update' }, 400);
    }

    fields.push("updated_at = datetime('now')");

    await env.DB.prepare(`UPDATE event_settings SET ${fields.join(', ')} WHERE id = 1`)
      .bind(...values)
      .run();

    const updated = await env.DB.prepare('SELECT * FROM event_settings WHERE id = 1').first();
    return json(updated);
  } catch (err) {
    console.error('Admin event POST error:', err);
    return json({ error: 'Failed to save' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
