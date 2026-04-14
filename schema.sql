-- GiveSendGo Gala - Database Schema

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT UNIQUE NOT NULL,
  total_attendees INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  registration_group_id TEXT NOT NULL,
  giver_army INTEGER NOT NULL DEFAULT 0,
  giver_army_tenure TEXT,
  photo_consent INTEGER NOT NULL DEFAULT 1,
  is_waitlist INTEGER NOT NULL DEFAULT 0,
  checked_in INTEGER NOT NULL DEFAULT 0,
  checked_in_at TEXT,
  cancelled INTEGER NOT NULL DEFAULT 0,
  cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (registration_group_id) REFERENCES registrations(group_id)
);

CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
CREATE INDEX IF NOT EXISTS idx_attendees_ticket_id ON attendees(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attendees_group_id ON attendees(registration_group_id);
CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON attendees(checked_in);

-- Event settings (singleton row with id=1)
CREATE TABLE IF NOT EXISTS event_settings (
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
  faq_what_to_expect TEXT DEFAULT 'A beautiful evening with dinner, live entertainment, inspiring stories, and the chance to celebrate with fellow givers.',
  calendar_start TEXT DEFAULT '20260606T180000',
  calendar_end TEXT DEFAULT '20260606T230000',
  iso_start TEXT DEFAULT '2026-06-06T18:00:00',
  max_attendees INTEGER DEFAULT 0,
  giver_army_signup_url TEXT DEFAULT 'https://www.giverarmy.com',
  giver_army_video_url TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed default row
INSERT OR IGNORE INTO event_settings (id) VALUES (1);
