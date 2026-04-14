export async function onRequestGet(context) {
  const { env } = context;

  try {
    const total = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees WHERE cancelled = 0').first();
    const checkedIn = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees WHERE checked_in = 1 AND cancelled = 0').first();
    const giverArmy = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees WHERE giver_army = 1 AND cancelled = 0').first();
    const cancelled = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees WHERE cancelled = 1').first();

    return new Response(JSON.stringify({
      total: total.count,
      checkedIn: checkedIn.count,
      giverArmy: giverArmy.count,
      others: total.count - giverArmy.count,
      cancelled: cancelled.count,
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
