// Public event endpoint — everything the front-end needs to render.
import { buildPublicEvent } from '../lib/event.js';

export async function onRequestGet(context) {
  try {
    const payload = await buildPublicEvent(context.env.DB);
    return json(payload, 200, { 'Cache-Control': 'public, max-age=15' });
  } catch (err) {
    console.error('event endpoint error', err);
    return json({ error: 'Failed to load event' }, 500);
  }
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}
