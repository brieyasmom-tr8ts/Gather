export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { attendeeId } = await request.json();

    if (!attendeeId) {
      return jsonResponse({ error: 'Attendee ID required' }, 400);
    }

    const result = await env.DB.prepare(
      'DELETE FROM attendees WHERE id = ?'
    ).bind(attendeeId).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: 'Attendee not found' }, 404);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return jsonResponse({ error: 'Failed to delete attendee' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
