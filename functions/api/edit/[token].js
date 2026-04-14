// Public, token-based edit flow.
// GET  → load current registration by edit token.
// POST → update attendees (names/emails) and add/remove one guest before cutoff.
import { buildPublicEvent } from '../../lib/event.js';

const VALID_TENURES = ['new', '1year', '2-3years', '4-5years', '5plus'];

export async function onRequestGet(context) {
  const { env, params } = context;
  const reg = await loadByToken(env.DB, params.token);
  if (!reg) return json({ error: 'Invalid edit link' }, 404);

  const attendees = await env.DB.prepare(
    `SELECT ticket_id, first_name, last_name, email, phone,
            is_giver_army, giver_army_tenure, media_consent
     FROM attendees WHERE registration_group_id = ? AND cancelled = 0 ORDER BY id ASC`
  ).bind(reg.group_id).all();

  const event = await buildPublicEvent(env.DB);
  const cutoff = computeCutoff(event);
  const canEdit = Date.now() < cutoff;

  return json({
    groupId: reg.group_id,
    isWaitlist: !!reg.is_waitlist,
    attendees: attendees.results,
    event,
    canEdit,
    cutoffIso: new Date(cutoff).toISOString(),
  });
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const reg = await loadByToken(env.DB, params.token);
  if (!reg) return json({ error: 'Invalid edit link' }, 404);

  const event = await buildPublicEvent(env.DB);
  const cutoff = computeCutoff(event);
  if (Date.now() >= cutoff) {
    return json({ error: 'Registration edits have closed for this event.' }, 400);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  const attendees = Array.isArray(body.attendees) ? body.attendees : [];
  if (attendees.length < 1 || attendees.length > 2) {
    return json({ error: 'Registrations must have 1 or 2 attendees.' }, 400);
  }

  // Validation
  const seenEmails = new Set();
  for (const a of attendees) {
    if (!a.firstName?.trim() || !a.lastName?.trim()) return json({ error: 'Name required.' }, 400);
    const em = (a.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return json({ error: `Invalid email: ${a.email}` }, 400);
    if (seenEmails.has(em)) return json({ error: `Duplicate email: ${em}` }, 400);
    seenEmails.add(em);
    if (a.giverArmyTenure && !VALID_TENURES.includes(a.giverArmyTenure)) {
      return json({ error: 'Invalid Giver Army tenure' }, 400);
    }
  }

  // Fetch existing attendees
  const existing = await env.DB.prepare(
    `SELECT ticket_id, email FROM attendees WHERE registration_group_id = ? AND cancelled = 0 ORDER BY id ASC`
  ).bind(reg.group_id).all();
  const existingMap = new Map(existing.results.map((r) => [r.ticket_id, r.email]));

  // Emails that would be new on this group
  const newEmails = attendees.filter((a) => !a.ticketId).map((a) => a.email.trim().toLowerCase());
  if (newEmails.length > 0) {
    const placeholders = newEmails.map(() => '?').join(',');
    const conflicts = await env.DB.prepare(
      `SELECT email FROM attendees WHERE cancelled = 0 AND email IN (${placeholders})`
    ).bind(...newEmails).all();
    if (conflicts.results?.length) {
      return json({ error: 'Email already registered: ' + conflicts.results.map((r) => r.email).join(', ') }, 409);
    }
  }

  // Apply changes
  const keepTickets = new Set();
  for (const a of attendees) {
    if (a.ticketId && existingMap.has(a.ticketId)) {
      keepTickets.add(a.ticketId);
      await env.DB.prepare(
        `UPDATE attendees SET first_name=?, last_name=?, email=?, phone=?,
           is_giver_army=?, giver_army_tenure=?, updated_at=datetime('now')
         WHERE ticket_id=?`
      ).bind(
        a.firstName.trim(), a.lastName.trim(), a.email.trim().toLowerCase(),
        (a.phone || '').trim() || null,
        a.giverArmy ? 1 : 0,
        a.giverArmy && a.giverArmyTenure ? a.giverArmyTenure : null,
        a.ticketId
      ).run();
    } else {
      const ticketId = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO attendees (
           ticket_id, registration_group_id,
           first_name, last_name, email, phone,
           is_giver_army, giver_army_tenure, media_consent,
           is_waitlist
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        ticketId, reg.group_id,
        a.firstName.trim(), a.lastName.trim(), a.email.trim().toLowerCase(),
        (a.phone || '').trim() || null,
        a.giverArmy ? 1 : 0,
        a.giverArmy && a.giverArmyTenure ? a.giverArmyTenure : null,
        a.mediaConsent ? 1 : 0,
        reg.is_waitlist ? 1 : 0
      ).run();
      keepTickets.add(ticketId);
    }
  }

  // Cancel any attendees the user removed
  for (const ticketId of existingMap.keys()) {
    if (!keepTickets.has(ticketId)) {
      await env.DB.prepare(
        `UPDATE attendees SET cancelled=1, cancelled_at=datetime('now'), updated_at=datetime('now')
         WHERE ticket_id=?`
      ).bind(ticketId).run();
    }
  }

  // Sync group total
  const { n } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM attendees WHERE registration_group_id = ? AND cancelled = 0`
  ).bind(reg.group_id).first();
  await env.DB.prepare(
    `UPDATE registrations SET total_attendees = ? WHERE group_id = ?`
  ).bind(n, reg.group_id).run();

  return json({ success: true });
}

async function loadByToken(db, token) {
  if (!token) return null;
  return await db.prepare('SELECT group_id, edit_token, is_waitlist FROM registrations WHERE edit_token = ?')
    .bind(token).first();
}

function computeCutoff(event) {
  const hours = event.edit_cutoff_hours || 24;
  const start = new Date(event.iso_start + 'Z').getTime(); // interpret as UTC for simple math
  return start - hours * 3600 * 1000;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
