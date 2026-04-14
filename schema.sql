-- GiveSendGo Gala — Production Schema
-- Run via: npm run db:init (local) or npm run db:init:remote

-- =========================================================================
-- event_settings — single-row key/value table driving the public site
-- =========================================================================
CREATE TABLE IF NOT EXISTS event_settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Seed sensible defaults if empty
INSERT OR IGNORE INTO event_settings (key, value) VALUES
  ('event_name',          'GiveSendGo Gala'),
  ('event_year',          '2026'),
  ('event_tagline',       'An Evening of Celebration & Generosity'),
  ('event_description',   'Join us for an unforgettable evening celebrating the power of generosity. Dinner, live entertainment, inspiring stories, and community.'),
  ('gala_date',           '2026-10-18'),
  ('start_time',          '18:00'),
  ('end_time',            '21:30'),
  ('time_zone',           'America/Chicago'),
  ('venue_name',          'The Grand Ballroom'),
  ('venue_address',       '123 Main Street'),
  ('venue_city',          'Nashville'),
  ('venue_state',         'TN'),
  ('dress_code',          'Black Tie Optional'),
  ('parking_info',        'Complimentary valet parking is available at the venue entrance. Additional self-parking is available in the adjacent garage.'),
  ('arrival_info',        'Doors open 30 minutes before start. Please arrive early for check-in at the main lobby.'),
  ('max_capacity',        '300'),
  ('edit_cutoff_hours',   '24'),
  ('giver_army_video_url','https://www.youtube.com/embed/dQw4w9WgXcQ'),
  ('giver_army_signup_url','https://www.giverarmy.com'),
  ('hero_image_url',      ''),
  ('photos_url',          ''),
  ('next_event_url',      ''),
  ('turnstile_site_key',  ''),
  ('faq_json',            '[{"q":"What is the dress code?","a":"Black Tie Optional. Dress to celebrate."},{"q":"Is parking available?","a":"Yes — complimentary valet at the front entrance."},{"q":"What time should I arrive?","a":"Doors open 30 minutes before start time. Please arrive early for check-in."},{"q":"Can I bring a guest?","a":"Yes — you can register yourself plus one guest."},{"q":"What should I expect?","a":"A beautiful evening with dinner, live entertainment, inspiring stories, and celebration."}]');

-- =========================================================================
-- registrations — one row per group (1-2 attendees)
-- =========================================================================
CREATE TABLE IF NOT EXISTS registrations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id         TEXT UNIQUE NOT NULL,
  edit_token       TEXT UNIQUE NOT NULL,
  total_attendees  INTEGER NOT NULL DEFAULT 1,
  is_waitlist      INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- attendees — one row per person
-- =========================================================================
CREATE TABLE IF NOT EXISTS attendees (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id               TEXT UNIQUE NOT NULL,
  registration_group_id   TEXT NOT NULL,

  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT,

  is_giver_army           INTEGER NOT NULL DEFAULT 0,
  giver_army_tenure       TEXT,
  media_consent           INTEGER NOT NULL DEFAULT 0,

  is_waitlist             INTEGER NOT NULL DEFAULT 0,
  waitlist_timestamp      TEXT,
  cancelled               INTEGER NOT NULL DEFAULT 0,
  cancelled_at            TEXT,

  checked_in              INTEGER NOT NULL DEFAULT 0,
  checked_in_at           TEXT,

  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (registration_group_id) REFERENCES registrations(group_id)
);

-- One email per event (enforced across non-cancelled rows via unique index below)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendees_email_active
  ON attendees(email) WHERE cancelled = 0;

CREATE INDEX IF NOT EXISTS idx_attendees_ticket_id    ON attendees(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attendees_group_id     ON attendees(registration_group_id);
CREATE INDEX IF NOT EXISTS idx_attendees_checked_in   ON attendees(checked_in);
CREATE INDEX IF NOT EXISTS idx_attendees_is_waitlist  ON attendees(is_waitlist);
CREATE INDEX IF NOT EXISTS idx_attendees_giver_army   ON attendees(is_giver_army);
CREATE INDEX IF NOT EXISTS idx_attendees_created      ON attendees(created_at);

-- =========================================================================
-- email_templates — editable templates keyed by slug
-- =========================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  slug       TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO email_templates (slug, name, subject, body) VALUES
  ('confirmation',
   'Confirmation Email',
   'You''re in for {{event_name}} — {{event_date}}',
   'Hi {{first_name}},

You''re all set for {{event_name}}!

When: {{event_date}} at {{event_time}}
Where: {{location}}
Dress code: {{dress_code}}

Your ticket QR code is attached below — please present it at the door.

{{qr_code}}

Need to update your registration? {{edit_link}}

We can''t wait to celebrate with you.

— The GiveSendGo Team'),

  ('reminder_1week',
   'One Week Reminder',
   '{{event_name}} is one week away',
   'Hi {{first_name}},

Just a friendly reminder — {{event_name}} is just one week away.

When: {{event_date}} at {{event_time}}
Where: {{location}}
Dress code: {{dress_code}}

Plan your arrival: doors open 30 minutes before start. Complimentary valet is available at the entrance.

{{qr_code}}

See you soon.

— The GiveSendGo Team'),

  ('reminder_24hr',
   '24 Hour Reminder',
   'Tomorrow: {{event_name}}',
   'Hi {{first_name}},

Tomorrow is the big night!

When: {{event_date}} at {{event_time}}
Where: {{location}}
Dress code: {{dress_code}}

Present this QR code at the check-in table:

{{qr_code}}

Parking: valet at the entrance.
Arrival: please arrive 15–30 minutes before start.

— The GiveSendGo Team'),

  ('post_event',
   'Post-Event Thank You',
   'Thank you for joining us at {{event_name}}',
   'Hi {{first_name}},

Thank you for making {{event_name}} unforgettable.

We''ll be sharing photos and highlights soon. In the meantime, keep the generosity going — there are thousands of campaigns on GiveSendGo ready for your encouragement.

With gratitude,
— The GiveSendGo Team'),

  ('bulk_update',
   'Bulk Update / Announcement',
   'Update about {{event_name}}',
   'Hi {{first_name}},

[Write your announcement here.]

— The GiveSendGo Team');

