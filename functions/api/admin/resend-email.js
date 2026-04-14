import { sendConfirmationEmail } from '../../lib/email.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { attendeeId } = await request.json();

    if (!attendeeId) {
      return jsonResponse({ error: 'Attendee ID required' }, 400);
    }

    const attendee = await env.DB.prepare(
      'SELECT ticket_id, first_name, last_name, email FROM attendees WHERE id = ?'
    ).bind(attendeeId).first();

    if (!attendee) {
      return jsonResponse({ error: 'Attendee not found' }, 404);
    }

    if (!env.BREVO_API_KEY) {
      return jsonResponse({ error: 'Email service not configured' }, 500);
    }

    const baseUrl = env.BASE_URL || `https://${request.headers.get('host')}`;
    const sent = await sendConfirmationEmail({
      attendee,
      baseUrl,
      apiKey: env.BREVO_API_KEY,
      fromAddress: env.EMAIL_FROM || 'GiveSendGo Gala <gala@giverarmy.com>',
    });

    if (sent) {
      return jsonResponse({ success: true });
    } else {
      return jsonResponse({ error: 'Email delivery failed' }, 500);
    }
  } catch (err) {
    console.error('Resend email error:', err);
    return jsonResponse({ error: 'Failed to resend email' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
