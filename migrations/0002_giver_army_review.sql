-- Add review_requested column for Giver Army membership disputes
ALTER TABLE attendees ADD COLUMN giver_army_review_requested INTEGER NOT NULL DEFAULT 0;
