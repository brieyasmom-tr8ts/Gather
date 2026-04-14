export async function onRequestGet(context) {
  const { env } = context;

  try {
    const settings = await env.DB.prepare('SELECT * FROM event_settings WHERE id = 1').first();
    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees WHERE cancelled = 0 AND is_waitlist = 0').first();

    const max = settings?.max_attendees || 0;
    const registered = count?.count || 0;
    const available = max > 0 ? Math.max(0, max - registered) : null;

    return new Response(JSON.stringify({
      ...settings,
      registered,
      available,
      is_full: max > 0 && registered >= max,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (err) {
    console.error('Event settings error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
