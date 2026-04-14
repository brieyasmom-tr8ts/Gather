import { verifyToken, getTokenFromCookie } from '../../lib/auth.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Skip auth check for login endpoint
  const url = new URL(request.url);
  if (url.pathname === '/api/admin/login') {
    return context.next();
  }

  const token = getTokenFromCookie(request);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const valid = await verifyToken(token, env.AUTH_SECRET);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return context.next();
}
