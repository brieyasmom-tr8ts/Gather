import { sendBulkEmail } from '../../lib/email.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { subject, message, audience } = await request.json();

    if (!subject?.trim() || !message?.trim()) {
      return json({ error: 'Subject and message are required' }, 400);
    }

    if (!env.BREVO_API_KEY) {
      return json({ error: 'Email service not configured' }, 500);
    }

    // Build query based on audience
    let sql = 'SELECT first_name, last_name, email FROM attendees WHERE cancelled = 0';
    if (audience === 'active') {
      sql += ' AND is_waitlist = 0';
    } else if (audience === 'waitlist') {
      sql += ' AND is_waitlist = 1';
    } else if (audience === 'checked_in') {
      sql += ' AND checked_in = 1';
    } else if (audience === 'pending') {
      sql += ' AND checked_in = 0 AND is_waitlist = 0';
    }
    // 'all' includes everyone not cancelled

    const result = await env.DB.prepare(sql).all();
    const attendees = result.results;

    if (attendees.length === 0) {
      return json({ error: 'No recipients match' }, 400);
    }

    const { sent, failed } = await sendBulkEmail({
      attendees,
      subject: subject.trim(),
      message: message.trim(),
      apiKey: env.BREVO_API_KEY,
      fromAddress: env.EMAIL_FROM || 'GiveSendGo Gala <gala@giverarmy.com>',
      db: env.DB,
    });

    return json({ success: true, sent, failed, total: attendees.length });
  } catch (err) {
    console.error('Bulk email error:', err);
    return json({ error: 'Failed to send bulk email' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
