export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'gala_admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    },
  });
}
