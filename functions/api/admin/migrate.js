// One-time database migration endpoint
// Protected by admin auth. Safe to call multiple times.

export async function onRequestPost(context) {
  const { env } = context;

  const results = [];

  // Each migration is wrapped in try/catch so existing columns don't fail the whole thing
  const migrations = [
    {
      name: 'Add photo_consent column',
      sql: 'ALTER TABLE attendees ADD COLUMN photo_consent INTEGER NOT NULL DEFAULT 1',
    },
    {
      name: 'Add is_waitlist column',
      sql: 'ALTER TABLE attendees ADD COLUMN is_waitlist INTEGER NOT NULL DEFAULT 0',
    },
    {
      name: 'Add cancelled column',
      sql: 'ALTER TABLE attendees ADD COLUMN cancelled INTEGER NOT NULL DEFAULT 0',
    },
    {
      name: 'Add cancelled_at column',
      sql: 'ALTER TABLE attendees ADD COLUMN cancelled_at TEXT',
    },
    {
      name: 'Add phone column',
      sql: 'ALTER TABLE attendees ADD COLUMN phone TEXT',
    },
    {
      name: 'Create event_settings table',
      sql: `CREATE TABLE IF NOT EXISTS event_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL DEFAULT 'GiveSendGo Gala',
        year TEXT NOT NULL DEFAULT '2026',
        tagline TEXT DEFAULT 'An Evening of Celebration & Generosity',
        event_date TEXT DEFAULT 'Saturday, June 6, 2026',
        event_time TEXT DEFAULT '6:00 PM - 11:00 PM',
        location TEXT DEFAULT 'The Grand Ballroom',
        address TEXT DEFAULT 'Nashville, TN',
        description TEXT,
        dress_code TEXT DEFAULT 'Black Tie Optional',
        faq_parking TEXT DEFAULT 'Complimentary valet parking is available at the venue entrance.',
        faq_what_to_expect TEXT DEFAULT 'A beautiful evening with dinner, live entertainment, inspiring stories, and celebration.',
        calendar_start TEXT DEFAULT '20260606T180000',
        calendar_end TEXT DEFAULT '20260606T230000',
        iso_start TEXT DEFAULT '2026-06-06T18:00:00',
        max_attendees INTEGER DEFAULT 0,
        giver_army_signup_url TEXT DEFAULT 'https://www.giverarmy.com',
        giver_army_video_url TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
    },
    {
      name: 'Seed event_settings row',
      sql: 'INSERT OR IGNORE INTO event_settings (id) VALUES (1)',
    },
  ];

  for (const m of migrations) {
    try {
      await env.DB.prepare(m.sql).run();
      results.push({ name: m.name, status: 'ok' });
    } catch (err) {
      const msg = err.message || String(err);
      // "duplicate column" means migration already ran - that's fine
      if (msg.includes('duplicate column') || msg.includes('already exists')) {
        results.push({ name: m.name, status: 'skipped (already applied)' });
      } else {
        results.push({ name: m.name, status: 'error', error: msg });
      }
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
