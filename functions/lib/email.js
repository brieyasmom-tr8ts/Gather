export async function sendConfirmationEmail({ attendee, baseUrl, apiKey, fromAddress }) {
  const ticketDisplayId = attendee.ticket_id.substring(0, 8).toUpperCase();
  const qrUrl = `${baseUrl}/api/ticket/${attendee.ticket_id}/qr`;
  const ticketUrl = `${baseUrl}/ticket/${attendee.ticket_id}`;

  // Google Calendar link
  const calParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'GiveSendGo Gala 2026',
    dates: '20260606T180000/20260606T230000',
    location: 'The Grand Ballroom, Nashville, TN',
    details: 'Join us for the GiveSendGo Gala 2026 - An evening of celebration and generosity.',
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

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1A1A2E 0%,#2D1B69 100%);padding:40px 32px;text-align:center;">
          <p style="color:#FCA5A5;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Your Ticket</p>
          <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0;">GiveSendGo Gala</h1>
          <p style="color:#D4AF37;font-size:18px;margin:8px 0 0;font-weight:300;">2026</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#374151;font-size:16px;margin:0 0 24px;line-height:1.6;">
            Hi ${attendee.first_name},<br><br>
            You're all set! Here's your ticket for the GiveSendGo Gala 2026.
          </p>

          <!-- Event Details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                <strong style="color:#374151;">Date:</strong> Saturday, June 6, 2026
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                <strong style="color:#374151;">Time:</strong> 6:00 PM - 11:00 PM
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;">
                <strong style="color:#374151;">Location:</strong> The Grand Ballroom, Nashville, TN
              </p>
            </td></tr>
          </table>

          <!-- QR Code -->
          <div style="text-align:center;margin-bottom:24px;">
            <img src="${qrUrl}" alt="QR Code" width="180" height="180" style="display:block;margin:0 auto 12px;border-radius:8px;" />
            <p style="color:#9ca3af;font-size:12px;font-family:monospace;margin:0;">
              Ticket #${ticketDisplayId}
            </p>
          </div>

          <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 24px;">
            Present this QR code at the entrance for check-in.
          </p>

          <!-- CTA Buttons -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-bottom:12px;">
                <a href="${ticketUrl}" style="display:inline-block;background-color:#E8553D;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                  View Your Ticket
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <a href="${googleCalUrl}" style="display:inline-block;color:#E8553D;text-decoration:none;font-size:13px;font-weight:500;">
                  Add to Google Calendar &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            &copy; 2026 GiveSendGo. All rights reserved.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [attendee.email],
      subject: `Your GiveSendGo Gala 2026 Ticket - #${ticketDisplayId}`,
      html,
    }),
  });

  return response.ok;
}
