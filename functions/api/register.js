import { sendConfirmationEmail } from '../lib/email.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { attendees } = await request.json();

    // Validate input
    if (!Array.isArray(attendees) || attendees.length === 0 || attendees.length > 10) {
      return jsonResponse({ error: 'Please provide between 1 and 10 attendees.' }, 400);
    }

    const validTenures = ['new', '1year', '2-3years', '4-5years', '5plus'];
    const emails = new Set();

    for (const a of attendees) {
      if (!a.firstName?.trim() || !a.lastName?.trim()) {
        return jsonResponse({ error: 'First and last name are required for all attendees.' }, 400);
      }
      if (!a.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) {
        return jsonResponse({ error: `Invalid email: ${a.email}` }, 400);
      }
      if (emails.has(a.email.toLowerCase())) {
        return jsonResponse({ error: `Duplicate email in request: ${a.email}` }, 400);
      }
      if (a.giverArmyTenure && !validTenures.includes(a.giverArmyTenure)) {
        return jsonResponse({ error: 'Invalid Giver Army tenure value.' }, 400);
      }
      emails.add(a.email.toLowerCase());
    }

    // Check capacity
    if (env.MAX_ATTENDEES && parseInt(env.MAX_ATTENDEES) > 0) {
      const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM attendees').first();
      if (count + attendees.length > parseInt(env.MAX_ATTENDEES)) {
        return jsonResponse({ error: 'Sorry, the event has reached capacity.' }, 400);
      }
    }

    // Check for duplicate emails in database
    const emailList = attendees.map((a) => a.email.toLowerCase());
    const placeholders = emailList.map(() => '?').join(',');
    const existing = await env.DB.prepare(
      `SELECT email FROM attendees WHERE email IN (${placeholders})`
    ).bind(...emailList).all();

    if (existing.results.length > 0) {
      const duplicateEmails = existing.results.map((r) => r.email);
      return jsonResponse({
        error: 'One or more email addresses are already registered.',
        duplicateEmails,
      }, 409);
    }

    // Create registration group
    const groupId = crypto.randomUUID();

    await env.DB.prepare(
      'INSERT INTO registrations (group_id, total_attendees) VALUES (?, ?)'
    ).bind(groupId, attendees.length).run();

    // Create attendees
    const createdAttendees = [];

    for (const a of attendees) {
      const ticketId = crypto.randomUUID();

      await env.DB.prepare(
        `INSERT INTO attendees (ticket_id, first_name, last_name, email, phone, registration_group_id, giver_army, giver_army_tenure)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        ticketId,
        a.firstName.trim(),
        a.lastName.trim(),
        a.email.trim().toLowerCase(),
        a.phone?.trim() || null,
        groupId,
        a.giverArmy ? 1 : 0,
        a.giverArmyTenure || null
      ).run();

      createdAttendees.push({
        ticket_id: ticketId,
        first_name: a.firstName.trim(),
        last_name: a.lastName.trim(),
        email: a.email.trim().toLowerCase(),
      });
    }

    // Send confirmation emails (non-blocking)
    if (env.BREVO_API_KEY) {
      const baseUrl = env.BASE_URL || `https://${request.headers.get('host')}`;
      const emailPromises = createdAttendees.map((attendee) =>
        sendConfirmationEmail({
          attendee,
          baseUrl,
          apiKey: env.BREVO_API_KEY,
          fromAddress: env.EMAIL_FROM || 'GiveSendGo Gala <gala@giverarmy.com>',
        }).catch(() => {})
      );
      context.waitUntil(Promise.all(emailPromises));
    }

    return jsonResponse({ groupId, attendees: createdAttendees }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    return jsonResponse({ error: 'Registration failed. Please try again.' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
