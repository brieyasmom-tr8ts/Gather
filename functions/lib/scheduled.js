// Scheduled email sends + email delivery log.
// Tables are created lazily so no manual migration is needed in production.

import { loadTemplate, buildTemplateVars, renderEmail, sendEmail } from './email.js';
import { buildPublicEvent } from './event.js';

// How many emails one invocation sends. Keeps each request well under the
// Workers subrequest limit; the cron caller loops until nothing is left.
export const BATCH_SIZE = 40;

export const AUDIENCES = {
  all:            'is_waitlist = 0',
  waitlist:       'is_waitlist = 1',
  giver_army:     'is_waitlist = 0 AND is_giver_army = 1',
  non_giver_army: 'is_waitlist = 0 AND is_giver_army = 0',
  checked_in:     'is_waitlist = 0 AND checked_in = 1',
  not_checked_in: 'is_waitlist = 0 AND checked_in = 0',
};

export async function ensureEmailTables(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS scheduled_emails (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT NOT NULL,
      audience      TEXT NOT NULL DEFAULT 'all',
      send_at       TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      sent_count    INTEGER NOT NULL DEFAULT 0,
      failed_count  INTEGER NOT NULL DEFAULT 0,
      last_error    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      started_at    TEXT,
      completed_at  TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS scheduled_email_recipients (
      scheduled_id  INTEGER NOT NULL,
      attendee_id   INTEGER NOT NULL,
      status        TEXT NOT NULL DEFAULT 'queued',
      error         TEXT,
      sent_at       TEXT,
      PRIMARY KEY (scheduled_id, attendee_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS email_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      attendee_id  INTEGER,
      email        TEXT,
      kind         TEXT NOT NULL,
      status       TEXT NOT NULL,
      error        TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
  ]);
}

/** Record the outcome of a single transactional email (e.g. signup confirmation). */
export async function logEmail(db, { attendeeId, email, kind, status, error }) {
  try {
    await ensureEmailTables(db);
    await db.prepare(
      'INSERT INTO email_log (attendee_id, email, kind, status, error) VALUES (?, ?, ?, ?, ?)'
    ).bind(attendeeId ?? null, email ?? null, kind, status, error ? String(error).slice(0, 500) : null).run();
  } catch (e) {
    console.error('email_log insert failed', e);
  }
}

/**
 * Process due scheduled emails. Sends at most BATCH_SIZE emails per call.
 * Safe to call repeatedly / concurrently: recipients are claimed one at a time.
 * Returns { processed, remaining } where remaining = queued emails still to send.
 */
export async function processScheduledEmails(env, baseUrl) {
  const db = env.DB;
  await ensureEmailTables(db);
  const nowIso = new Date().toISOString();

  // 1. Start any due jobs: snapshot the recipient list.
  const due = await db.prepare(
    `SELECT id, audience FROM scheduled_emails WHERE status = 'pending' AND send_at <= ?`
  ).bind(nowIso).all();
  for (const job of due.results || []) {
    const claimed = await db.prepare(
      `UPDATE scheduled_emails SET status = 'sending', started_at = ? WHERE id = ? AND status = 'pending'`
    ).bind(nowIso, job.id).run();
    if (!claimed.meta?.changes) continue;
    const where = AUDIENCES[job.audience] || AUDIENCES.all;
    await db.prepare(
      `INSERT OR IGNORE INTO scheduled_email_recipients (scheduled_id, attendee_id)
       SELECT ?, id FROM attendees WHERE cancelled = 0 AND ${where}`
    ).bind(job.id).run();
  }

  // 2. Send a batch of queued recipients across active jobs.
  const queued = await db.prepare(
    `SELECT r.scheduled_id, r.attendee_id, s.slug,
            a.ticket_id, a.first_name, a.last_name, a.email, a.cancelled,
            g.edit_token
     FROM scheduled_email_recipients r
     JOIN scheduled_emails s ON s.id = r.scheduled_id
     JOIN attendees a ON a.id = r.attendee_id
     LEFT JOIN registrations g ON g.group_id = a.registration_group_id
     WHERE r.status = 'queued' AND s.status = 'sending'
     ORDER BY r.scheduled_id, r.attendee_id
     LIMIT ?`
  ).bind(BATCH_SIZE).all();

  const rows = queued.results || [];
  let processed = 0;
  if (rows.length) {
    const event = await buildPublicEvent(db);
    const templates = new Map();
    for (const row of rows) {
      // Claim this recipient so a concurrent run can't double-send.
      const claim = await db.prepare(
        `UPDATE scheduled_email_recipients SET status = 'sending', sent_at = ?
         WHERE scheduled_id = ? AND attendee_id = ? AND status = 'queued'`
      ).bind(new Date().toISOString(), row.scheduled_id, row.attendee_id).run();
      if (!claim.meta?.changes) continue;

      let result;
      if (row.cancelled) {
        result = { ok: false, skipped: true, error: 'Registration cancelled' };
      } else {
        if (!templates.has(row.slug)) templates.set(row.slug, await loadTemplate(db, row.slug));
        const tmpl = templates.get(row.slug);
        if (!tmpl) {
          result = { ok: false, error: `Template "${row.slug}" not found` };
        } else {
          const vars = buildTemplateVars({ attendee: row, event, baseUrl, editToken: row.edit_token });
          const rendered = renderEmail(tmpl, vars, event);
          try {
            result = await sendEmail({
              apiKey: env.BREVO_API_KEY,
              from: env.EMAIL_FROM,
              to: row.email,
              subject: rendered.subject,
              html: rendered.html,
            });
          } catch (e) {
            result = { ok: false, error: e.message || 'Send failed' };
          }
        }
      }

      const status = result.ok ? 'sent' : result.skipped ? 'skipped' : 'failed';
      await db.prepare(
        `UPDATE scheduled_email_recipients SET status = ?, error = ?, sent_at = ?
         WHERE scheduled_id = ? AND attendee_id = ?`
      ).bind(status, result.ok ? null : String(result.error || '').slice(0, 500),
             new Date().toISOString(), row.scheduled_id, row.attendee_id).run();
      if (!result.ok && !result.skipped) {
        await db.prepare('UPDATE scheduled_emails SET last_error = ? WHERE id = ?')
          .bind(String(result.error || '').slice(0, 500), row.scheduled_id).run();
      }
      processed++;
    }
  }

  // 3. A recipient stuck in 'sending' for 10+ minutes means an invocation died
  //    mid-send. Mark it failed rather than risk sending a duplicate.
  const staleCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await db.prepare(
    `UPDATE scheduled_email_recipients SET status = 'failed', error = 'Interrupted while sending'
     WHERE status = 'sending' AND sent_at < ?`
  ).bind(staleCutoff).run();

  // 4. Refresh counts and finish jobs that have nothing left.
  const active = await db.prepare(`SELECT id FROM scheduled_emails WHERE status = 'sending'`).all();
  for (const job of active.results || []) {
    const c = await db.prepare(
      `SELECT
         SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
         SUM(CASE WHEN status IN ('queued','sending') THEN 1 ELSE 0 END) AS pending
       FROM scheduled_email_recipients WHERE scheduled_id = ?`
    ).bind(job.id).first();
    const sent = c?.sent || 0, failed = c?.failed || 0, pending = c?.pending || 0;
    if (pending === 0) {
      await db.prepare(
        `UPDATE scheduled_emails SET status = ?, sent_count = ?, failed_count = ?, completed_at = ? WHERE id = ?`
      ).bind(sent === 0 && failed > 0 ? 'failed' : 'sent', sent, failed, new Date().toISOString(), job.id).run();
    } else {
      await db.prepare('UPDATE scheduled_emails SET sent_count = ?, failed_count = ? WHERE id = ?')
        .bind(sent, failed, job.id).run();
    }
  }

  const rem = await db.prepare(
    `SELECT COUNT(*) AS n FROM scheduled_email_recipients r
     JOIN scheduled_emails s ON s.id = r.scheduled_id
     WHERE r.status = 'queued' AND s.status = 'sending'`
  ).first();
  return { processed, remaining: rem?.n || 0 };
}
