export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Check if cancelled column exists
    let hasCancelled = false;
    try {
      const info = await env.DB.prepare("PRAGMA table_info(attendees)").all();
      hasCancelled = info.results.some((r) => r.name === 'cancelled');
    } catch {}

    const cancelledFilter = hasCancelled ? ' WHERE cancelled = 0' : '';
    const cancelledAnd = hasCancelled ? ' AND cancelled = 0' : '';

    const total = await env.DB.prepare(`SELECT COUNT(*) as count FROM attendees${cancelledFilter}`).first();
    const checkedIn = await env.DB.prepare(`SELECT COUNT(*) as count FROM attendees WHERE checked_in = 1${cancelledAnd}`).first();
    const giverArmy = await env.DB.prepare(`SELECT COUNT(*) as count FROM attendees WHERE giver_army = 1${cancelledAnd}`).first();
    let cancelled = { count: 0 };
    if (hasCancelled) {
      cancelled = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees WHERE cancelled = 1').first();
    }

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
