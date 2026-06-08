-- Migration: upgrade pre-v2 databases to the current schema.
-- Safe to run multiple times.

-- Add any missing columns to attendees
ALTER TABLE attendees ADD COLUMN is_giver_army      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendees ADD COLUMN media_consent      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendees ADD COLUMN is_waitlist        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendees ADD COLUMN waitlist_timestamp TEXT;
ALTER TABLE attendees ADD COLUMN cancelled          INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendees ADD COLUMN cancelled_at       TEXT;
ALTER TABLE attendees ADD COLUMN updated_at         TEXT;
UPDATE attendees SET updated_at = datetime('now') WHERE updated_at IS NULL;

-- Backfill is_giver_army from the older giver_army column, if it exists
UPDATE attendees SET is_giver_army = giver_army WHERE is_giver_army = 0;

ALTER TABLE registrations ADD COLUMN edit_token  TEXT;
ALTER TABLE registrations ADD COLUMN is_waitlist INTEGER NOT NULL DEFAULT 0;

-- Backfill edit tokens for any row missing one
UPDATE registrations
  SET edit_token = lower(hex(randomblob(16)))
  WHERE edit_token IS NULL OR edit_token = '';
