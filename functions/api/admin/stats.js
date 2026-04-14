// Admin overview: live counts + analytics series.
import { buildPublicEvent } from '../../lib/event.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const event = await buildPublicEvent(env.DB);

    const [groupsRow, checkedInRow, giverArmyRow, cancelledRow] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS n FROM registrations WHERE is_waitlist = 0').first(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM attendees WHERE cancelled = 0 AND is_waitlist = 0 AND checked_in = 1').first(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM attendees WHERE cancelled = 0 AND is_waitlist = 0 AND is_giver_army = 1').first(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM attendees WHERE cancelled = 1').first(),
    ]);

    const perDay = await env.DB.prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS n
       FROM attendees
       WHERE cancelled = 0 AND is_waitlist = 0
         AND created_at >= datetime('now','-30 days')
       GROUP BY day ORDER BY day`
    ).all();

    const tenureBreakdown = await env.DB.prepare(
      `SELECT COALESCE(giver_army_tenure,'') AS tenure, COUNT(*) AS n
       FROM attendees WHERE cancelled=0 AND is_waitlist=0 AND is_giver_army=1
       GROUP BY tenure`
    ).all();

    return json({
      capacity: event.max_capacity,
      registered: event.registered,
      remaining: event.max_capacity > 0 ? Math.max(0, event.max_capacity - event.registered) : null,
      waitlist: event.waitlist_count,
      groups: groupsRow?.n || 0,
      checkedIn: checkedInRow?.n || 0,
      giverArmy: giverArmyRow?.n || 0,
      nonGiverArmy: Math.max(0, event.registered - (giverArmyRow?.n || 0)),
      cancelled: cancelledRow?.n || 0,
      perDay: perDay.results || [],
      tenureBreakdown: tenureBreakdown.results || [],
      isFull: event.is_full,
    });
  } catch (err) {
    console.error('stats error', err);
    return json({ error: 'Failed to load stats' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
