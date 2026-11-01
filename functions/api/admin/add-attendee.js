// Admin: manually add an attendee (bypasses CAPTCHA and, by default, capacity).
// Creates a new registration group with a single attendee.
import { sendTemplateToAttendee } from '../../lib/email.js';

const VALID_TENURES = ['new', '1year', '2-3years', '4-5years', '5plus'];

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim() || null;
  const isGiverArmy = !!body.isGiverArmy;
  const tenure = isGiverArmy && body.giverArmyTenure ? body.giverArmyTenure : null;
  const vipCocktail = isGiverArmy && !!body.vipCocktail;
  const mediaConsent = !!body.mediaConsent;
  const addToWaitlist = !!body.addToWaitlist;
  const sendConfirmation = body.sendEmail !== false;

  if (!firstName || !lastName) return json({ error: 'First and last name are required.' }, 400);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please enter a valid email.' }, 400);
  }
  if (tenure && !VALID_TENURES.includes(tenure)) return json({ error: 'Invalid Giver Army tenure.' }, 400);

  try {
    const existing = await env.DB.prepare(
      'SELECT id FROM attendees WHERE cancelled = 0 AND email = ?'
    ).bind(email).first();
    if (existing) return json({ error: `${email} is already registered.` }, 409);

    const groupId = crypto.randomUUID();
    const editToken = crypto.randomUUID().replace(/-/g, '');
    const ticketId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO registrations (group_id, edit_token, total_attendees, is_waitlist) VALUES (?, ?, 1, ?)'
    ).bind(groupId, editToken, addToWaitlist ? 1 : 0).run();

    await env.DB.prepare(
      `INSERT INTO attendees (
         ticket_id, registration_group_id,
         first_name, last_name, email, phone,
         is_giver_army, giver_army_tenure, vip_cocktail, media_consent,
         is_waitlist, waitlist_timestamp
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      ticketId, groupId,
      firstName, lastName, email, phone,
      isGiverArmy ? 1 : 0, tenure, vipCocktail ? 1 : 0, mediaConsent ? 1 : 0,
      addToWaitlist ? 1 : 0, addToWaitlist ? nowIso : null
    ).run();

    const attendee = { ticket_id: ticketId, first_name: firstName, last_name: lastName, email };

    let emailSent = false;
    let emailError = null;
    if (sendConfirmation && !addToWaitlist) {
      const baseUrl = env.BASE_URL || `https://${request.headers.get('host')}`;
      try {
        const result = await sendTemplateToAttendee({
          db: env.DB, env, attendee, slug: 'confirmation', baseUrl, editToken,
        });
        emailSent = !!result?.ok;
        if (!emailSent) emailError = result?.error || 'Email failed to send';
      } catch (e) {
        emailError = e.message || 'Email failed to send';
      }
    }

    return json({ ok: true, attendee, emailSent, emailError }, 201);
  } catch (err) {
    console.error('add-attendee error', err);
    if (err.message?.includes('UNIQUE')) return json({ error: `${email} is already registered.` }, 409);
    return json({ error: 'Failed to add attendee.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
