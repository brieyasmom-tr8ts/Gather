export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { attendeeId, cancel } = await request.json();

    if (!attendeeId) {
      return jsonResponse({ error: 'Attendee ID required' }, 400);
    }

    const shouldCancel = cancel !== false; // default true

    const result = await env.DB.prepare(
      'UPDATE attendees SET cancelled = ?, cancelled_at = ? WHERE id = ?'
    ).bind(
      shouldCancel ? 1 : 0,
      shouldCancel ? new Date().toISOString() : null,
      attendeeId
    ).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: 'Attendee not found' }, 404);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    return jsonResponse({ error: 'Failed to update attendee' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
