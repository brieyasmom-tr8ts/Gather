// Public registration endpoint — creates a group + attendees, with waitlist fallback.
import { buildPublicEvent, countConfirmedAttendees } from '../lib/event.js';
import { sendTemplateToAttendee } from '../lib/email.js';

const VALID_TENURES = ['new', '1year', '2-3years', '4-5years', '5plus'];

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const attendees = Array.isArray(body.attendees) ? body.attendees : [];
    const honeypot = body.website;

    if (honeypot) return json({ error: 'Invalid request' }, 400);
    if (attendees.length === 0 || attendees.length > 2) {
      return json({ error: 'Please provide 1 or 2 attendees.' }, 400);
    }

    // Per-attendee validation
    const seen = new Set();
    for (const a of attendees) {
      if (!a.firstName?.trim() || !a.lastName?.trim()) {
        return json({ error: 'First and last name are required for each attendee.' }, 400);
      }
      const email = (a.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: `Please enter a valid email for ${a.firstName || 'attendee'}.` }, 400);
      }
      if (seen.has(email)) return json({ error: `Duplicate email in this request: ${email}` }, 400);
      seen.add(email);
      if (a.giverArmy && a.giverArmyTenure && !VALID_TENURES.includes(a.giverArmyTenure)) {
        return json({ error: 'Invalid Giver Army tenure.' }, 400);
      }
      if (a.mediaConsent !== true) {
        return json({ error: `${a.firstName || 'Attendee'} must acknowledge the photo/video consent.` }, 400);
      }
    }

    // Duplicate-email protection (against active rows)
    const emailList = attendees.map((a) => a.email.trim().toLowerCase());
    const placeholders = emailList.map(() => '?').join(',');
    const existing = await env.DB.prepare(
      `SELECT email FROM attendees WHERE cancelled = 0 AND email IN (${placeholders})`
    ).bind(...emailList).all();
    if (existing.results?.length) {
      return json({
        error: 'One or more emails are already registered.',
        duplicateEmails: existing.results.map((r) => r.email),
      }, 409);
    }

    // Capacity check → decide confirmed vs waitlist
    const evt = await buildPublicEvent(env.DB);
    const confirmedCount = evt.registered;
    const capacity = evt.max_capacity;
    const remaining = capacity > 0 ? Math.max(0, capacity - confirmedCount) : Infinity;

    let isWaitlist = false;
    if (capacity > 0 && attendees.length > remaining) {
      // If not all attendees fit, the whole group goes on the waitlist
      // (simple + fair; avoids splitting groups).
      isWaitlist = true;
    }

    // Create group + edit token
    const groupId = crypto.randomUUID();
    const editToken = crypto.randomUUID().replace(/-/g, '');
    const nowIso = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO registrations (group_id, edit_token, total_attendees, is_waitlist) VALUES (?, ?, ?, ?)'
    ).bind(groupId, editToken, attendees.length, isWaitlist ? 1 : 0).run();

    const created = [];
    for (const a of attendees) {
      const ticketId = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO attendees (
           ticket_id, registration_group_id,
           first_name, last_name, email, phone,
           is_giver_army, giver_army_tenure, media_consent,
           is_waitlist, waitlist_timestamp
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        ticketId, groupId,
        a.firstName.trim(), a.lastName.trim(), a.email.trim().toLowerCase(), (a.phone || '').trim() || null,
        a.giverArmy ? 1 : 0,
        (a.giverArmy && a.giverArmyTenure) ? a.giverArmyTenure : null,
        1,
        isWaitlist ? 1 : 0,
        isWaitlist ? nowIso : null
      ).run();

      created.push({
        ticket_id: ticketId,
        first_name: a.firstName.trim(),
        last_name: a.lastName.trim(),
        email: a.email.trim().toLowerCase(),
      });
    }

    // Send confirmation emails — non-blocking
    if (env.RESEND_API_KEY && !isWaitlist) {
      const baseUrl = env.BASE_URL || `https://${request.headers.get('host')}`;
      context.waitUntil(Promise.all(created.map((a) =>
        sendTemplateToAttendee({
          db: env.DB, env, attendee: a, slug: 'confirmation', baseUrl, editToken,
        }).catch(() => {})
      )));
    }

    return json({
      groupId,
      editToken,
      isWaitlist,
      attendees: created,
    }, 201);
  } catch (err) {
    console.error('register error', err);
    return json({ error: 'Registration failed. Please try again.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
