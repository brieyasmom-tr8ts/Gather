// Admin: list all email templates.
export async function onRequestGet(context) {
  try {
    const res = await context.env.DB.prepare(
      'SELECT slug, name, subject, body, updated_at FROM email_templates ORDER BY name'
    ).all();
    return json({ templates: res.results || [] });
  } catch (err) {
    console.error('templates list error', err);
    return json({ error: 'Failed to load templates' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
