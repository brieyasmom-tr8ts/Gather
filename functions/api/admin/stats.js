export async function onRequestGet(context) {
  const { env } = context;

  try {
    const total = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees').first();
    const checkedIn = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees WHERE checked_in = 1').first();

    return new Response(JSON.stringify({
      total: total.count,
      checkedIn: checkedIn.count,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stats error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
