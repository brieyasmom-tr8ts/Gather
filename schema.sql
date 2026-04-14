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
