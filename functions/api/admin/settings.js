// Admin: read and update event_settings.
// GET  → returns all settings as flat object
// POST → accepts a JSON object and upserts each key/value pair.

import { loadEventSettings, setSetting } from '../../lib/event.js';

const ALLOWED_KEYS = new Set([
  'event_name', 'event_year', 'event_tagline', 'event_description',
  'gala_date', 'start_time', 'end_time', 'time_zone',
  'venue_name', 'venue_address', 'venue_city', 'venue_state',
  'dress_code', 'parking_info', 'arrival_info',
  'max_capacity', 'edit_cutoff_hours',
  'giver_army_video_url', 'giver_army_signup_url',
  'photos_url', 'next_event_url',
  'hero_image_url', 'turnstile_site_key',
  'faq_json',
]);

export async function onRequestGet(context) {
  try {
    const settings = await loadEventSettings(context.env.DB);
    return json({ settings });
  } catch (err) {
    console.error('settings get error', err);
    return json({ error: 'Failed to load settings' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const patch = body && typeof body === 'object' ? body : {};

    // Basic validation on date / time formats
    if (patch.gala_date && !/^\d{4}-\d{2}-\d{2}$/.test(patch.gala_date)) {
      return json({ error: 'gala_date must be YYYY-MM-DD' }, 400);
    }
    if (patch.start_time && !/^\d{2}:\d{2}$/.test(patch.start_time)) {
      return json({ error: 'start_time must be HH:MM' }, 400);
    }
    if (patch.end_time && !/^\d{2}:\d{2}$/.test(patch.end_time)) {
      return json({ error: 'end_time must be HH:MM' }, 400);
    }
    if (patch.max_capacity != null && String(patch.max_capacity).match(/\D/)) {
      return json({ error: 'max_capacity must be a number' }, 400);
    }
    if (patch.faq_json) {
      try { JSON.parse(patch.faq_json); } catch { return json({ error: 'faq_json must be valid JSON' }, 400); }
    }

    for (const [key, value] of Object.entries(patch)) {
      if (!ALLOWED_KEYS.has(key)) continue;
      await setSetting(context.env.DB, key, value);
    }

    const settings = await loadEventSettings(context.env.DB);
    return json({ ok: true, settings });
  } catch (err) {
    console.error('settings save error', err);
    return json({ error: 'Failed to save settings' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
