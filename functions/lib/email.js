export async function sendConfirmationEmail({ attendee, baseUrl, apiKey, fromAddress, db }) {
  const ticketDisplayId = attendee.ticket_id.substring(0, 8).toUpperCase();
  const qrUrl = `${baseUrl}/api/ticket/${attendee.ticket_id}/qr`;
  const ticketUrl = `${baseUrl}/ticket/${attendee.ticket_id}`;

  const fromMatch = fromAddress.match(/^(.+?)\s*<(.+?)>$/);
  const senderName = fromMatch ? fromMatch[1].trim() : 'GiveSendGo Gala';
  const senderEmail = fromMatch ? fromMatch[2].trim() : fromAddress;

  // Fetch event settings from DB
  let event = {
    name: 'GiveSendGo Gala', year: '2026',
    event_date: 'Saturday, June 6, 2026',
    event_time: '6:00 PM - 11:00 PM',
    location: 'The Grand Ballroom',
    address: 'Nashville, TN',
    dress_code: 'Black Tie Optional',
    description: 'Join us for an evening of celebration and generosity.',
    calendar_start: '20260606T180000',
    calendar_end: '20260606T230000',
  };

  if (db) {
    try {
      const settings = await db.prepare('SELECT * FROM event_settings WHERE id = 1').first();
      if (settings) event = { ...event, ...settings };
    } catch {}
  }

  const calParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.name} ${event.year}`,
    dates: `${event.calendar_start}/${event.calendar_end}`,
    location: `${event.location}, ${event.address}`,
    details: event.description || '',
  });
  const googleCalUrl = `https://calendar.google.com/calendar/render?${calParams}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <tr><td style="background-color:#085078;padding:40px 32px;text-align:center;">
          <p style="color:#85D8CE;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Your Ticket</p>
          <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0;">${event.name}</h1>
          <p style="color:#85D8CE;font-size:18px;margin:8px 0 0;font-weight:600;">${event.year}</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="color:#374151;font-size:16px;margin:0 0 24px;line-height:1.6;">
            Hi ${attendee.first_name},<br><br>
            You're all set! Here's your ticket for the ${event.name} ${event.year}.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                <strong style="color:#374151;">Date:</strong> ${event.event_date}
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                <strong style="color:#374151;">Time:</strong> ${event.event_time}
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                <strong style="color:#374151;">Location:</strong> ${event.location}, ${event.address}
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;">
                <strong style="color:#374151;">Dress Code:</strong> ${event.dress_code}
              </p>
            </td></tr>
          </table>

          <div style="text-align:center;margin-bottom:24px;">
            <img src="${qrUrl}" alt="QR Code" width="180" height="180" style="display:block;margin:0 auto 12px;border-radius:8px;" />
            <p style="color:#9ca3af;font-size:12px;font-family:monospace;margin:0;">
              Ticket #${ticketDisplayId}
            </p>
          </div>

          <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 24px;">
            Present this QR code at the entrance for check-in.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:12px;">
              <a href="${ticketUrl}" style="display:inline-block;background-color:#085078;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                View Your Ticket
              </a>
            </td></tr>
            <tr><td align="center">
              <a href="${googleCalUrl}" style="display:inline-block;color:#085078;text-decoration:none;font-size:13px;font-weight:500;">
                Add to Google Calendar &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            &copy; ${event.year} GiveSendGo. All rights reserved.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: attendee.email, name: `${attendee.first_name} ${attendee.last_name}` }],
      subject: `Your ${event.name} ${event.year} Ticket - #${ticketDisplayId}`,
      htmlContent: html,
    }),
  });

  return response.ok;
}

export async function sendBulkEmail({ attendees, subject, message, apiKey, fromAddress, db }) {
  const fromMatch = fromAddress.match(/^(.+?)\s*<(.+?)>$/);
  const senderName = fromMatch ? fromMatch[1].trim() : 'GiveSendGo Gala';
  const senderEmail = fromMatch ? fromMatch[2].trim() : fromAddress;

  let event = { name: 'GiveSendGo Gala', year: '2026' };
  if (db) {
    try {
      const settings = await db.prepare('SELECT name, year FROM event_settings WHERE id = 1').first();
      if (settings) event = { ...event, ...settings };
    } catch {}
  }

  // Format message as HTML (preserve line breaks)
  const safeMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background-color:#085078;padding:32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">${event.name}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">${safeMessage}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Brevo supports BCC via messageVersions or batching. We'll send individually to keep it simple.
  let sent = 0;
  let failed = 0;

  for (const attendee of attendees) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: attendee.email, name: `${attendee.first_name} ${attendee.last_name}` }],
          subject,
          htmlContent: html,
        }),
      });
      if (res.ok) sent++; else failed++;
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}
