// Shared helpers for event settings — single source of truth.
// All derived datetime values are computed from gala_date + start_time + end_time + time_zone.

const DEFAULT_TZ = 'America/Chicago';

/**
 * Load all event settings from D1 as an object { key: value, ... }.
 */
export async function loadEventSettings(db) {
  try {
    const res = await db.prepare('SELECT key, value FROM event_settings').all();
    const obj = {};
    for (const row of res.results || []) obj[row.key] = row.value;
    return obj;
  } catch {
    return {};
  }
}

export async function getSetting(db, key, fallback = null) {
  try {
    const row = await db.prepare('SELECT value FROM event_settings WHERE key = ?').bind(key).first();
    return row ? row.value : fallback;
  } catch {
    return fallback;
  }
}

export async function setSetting(db, key, value) {
  await db.prepare(
    'INSERT INTO event_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).bind(key, value == null ? '' : String(value)).run();
}

/**
 * Count active (non-cancelled) confirmed attendees (not waitlist).
 */
export async function countConfirmedAttendees(db) {
  const row = await db.prepare(
    'SELECT COUNT(*) AS n FROM attendees WHERE cancelled = 0 AND is_waitlist = 0'
  ).first();
  return row ? row.n : 0;
}

export async function countWaitlistAttendees(db) {
  const row = await db.prepare(
    'SELECT COUNT(*) AS n FROM attendees WHERE cancelled = 0 AND is_waitlist = 1'
  ).first();
  return row ? row.n : 0;
}

export async function countCheckedIn(db) {
  const row = await db.prepare(
    'SELECT COUNT(*) AS n FROM attendees WHERE cancelled = 0 AND is_waitlist = 0 AND checked_in = 1'
  ).first();
  return row ? row.n : 0;
}

/**
 * Compute derived datetime values from the stored settings.
 * Input: { gala_date: "YYYY-MM-DD", start_time: "HH:MM", end_time: "HH:MM", time_zone }
 * Output: {
 *   isoStart, isoEnd,     // ISO string in event-local wall time (no TZ suffix — UTC stamp from naive date)
 *   calStart, calEnd,     // Calendar-format: YYYYMMDDTHHMMSS (floating local)
 *   countdownTarget,      // ISO string used by the client to count down
 *   longDate,             // "Saturday, October 18, 2026"
 *   shortDate,            // "Oct 18, 2026"
 *   timeRange             // "6:00 PM – 9:30 PM"
 * }
 */
export function deriveEventDates(settings) {
  const date = settings.gala_date || '2026-10-18';
  const start = (settings.start_time || '18:00').slice(0, 5);
  const end = (settings.end_time || '21:30').slice(0, 5);
  const tz = settings.time_zone || DEFAULT_TZ;

  const [y, m, d] = date.split('-').map(Number);
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const pad = (n) => String(n).padStart(2, '0');
  const calStart = `${y}${pad(m)}${pad(d)}T${pad(sh)}${pad(sm)}00`;
  const calEnd = `${y}${pad(m)}${pad(d)}T${pad(eh)}${pad(em)}00`;

  const isoStart = `${date}T${pad(sh)}:${pad(sm)}:00`;
  const isoEnd = `${date}T${pad(eh)}:${pad(em)}:00`;

  // Long human date — computed via Intl in the event's time zone.
  let longDate, shortDate, timeRange, weekday;
  try {
    const sample = new Date(`${isoStart}Z`);
    const longFmt = new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    });
    const shortFmt = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
    });
    longDate = longFmt.format(sample);
    shortDate = shortFmt.format(sample);
    weekday = longDate.split(',')[0];
  } catch {
    longDate = date;
    shortDate = date;
    weekday = '';
  }

  timeRange = `${formatTime(sh, sm)} – ${formatTime(eh, em)}`;

  return {
    date,
    time_zone: tz,
    isoStart,
    isoEnd,
    calStart,
    calEnd,
    countdownTarget: isoStart,
    longDate,
    shortDate,
    weekday,
    timeRange,
    startTimeHuman: formatTime(sh, sm),
    endTimeHuman: formatTime(eh, em),
  };
}

function formatTime(h, m) {
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return m === 0 ? `${hour12}:00 ${ampm}` : `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Format a flattened event object used by the public API / emails.
 */
export async function buildPublicEvent(db) {
  const settings = await loadEventSettings(db);
  const derived = deriveEventDates(settings);

  const capacity = parseInt(settings.max_capacity || '0', 10) || 0;
  const confirmed = await countConfirmedAttendees(db);
  const waitlist = await countWaitlistAttendees(db);
  const available = capacity > 0 ? Math.max(0, capacity - confirmed) : null;
  const isFull = capacity > 0 && confirmed >= capacity;

  let faq = [];
  try { faq = JSON.parse(settings.faq_json || '[]'); } catch { faq = []; }

  return {
    name: settings.event_name || 'GiveSendGo Gala',
    year: settings.event_year || '',
    tagline: settings.event_tagline || '',
    description: settings.event_description || '',

    // Single source of truth
    gala_date: derived.date,
    start_time: settings.start_time || '18:00',
    end_time: settings.end_time || '21:30',
    time_zone: derived.time_zone,

    // Human-readable display
    long_date: derived.longDate,
    short_date: derived.shortDate,
    weekday: derived.weekday,
    time_range: derived.timeRange,
    start_time_human: derived.startTimeHuman,
    end_time_human: derived.endTimeHuman,

    // Derived calendar / countdown
    iso_start: derived.isoStart,
    iso_end: derived.isoEnd,
    calendar_start: derived.calStart,
    calendar_end: derived.calEnd,
    countdown_target: derived.countdownTarget,

    // Venue
    venue_name: settings.venue_name || '',
    venue_address: settings.venue_address || '',
    venue_city: settings.venue_city || '',
    venue_state: settings.venue_state || '',

    // Other
    dress_code: settings.dress_code || '',
    parking_info: settings.parking_info || '',
    arrival_info: settings.arrival_info || '',
    giver_army_video_url: settings.giver_army_video_url || '',
    giver_army_signup_url: settings.giver_army_signup_url || '',
    photos_url: settings.photos_url || '',
    next_event_url: settings.next_event_url || '',
    hero_image_url: settings.hero_image_url || '',
    turnstile_site_key: settings.turnstile_site_key || '',
    faq,

    // Capacity
    max_capacity: capacity,
    registered: confirmed,
    waitlist_count: waitlist,
    available,
    is_full: isFull,

    // Edit cutoff hours (before event start)
    edit_cutoff_hours: parseInt(settings.edit_cutoff_hours || '24', 10),
  };
}
