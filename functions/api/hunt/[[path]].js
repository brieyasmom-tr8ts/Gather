// Gala scavenger hunt API. Lives at /api/hunt/*.
// Teams need the shared HUNT_CODE (from the private team link). Judges use ADMIN_PASSWORD.
const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS hunt_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS hunt_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      media_key TEXT,
      media_type TEXT,
      answer TEXT,
      points INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (team_id, item_id))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS hunt_bonuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS hunt_settings (
      key TEXT PRIMARY KEY,
      value TEXT)`),
  ]);
  schemaReady = true;
}

function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function hasCode(request, env) {
  if (!env.HUNT_CODE) return false;
  return safeEqual(request.headers.get('x-hunt-code'), env.HUNT_CODE);
}

export async function onRequest({ request, env, params }) {
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const method = request.method;
  try {
    await ensureSchema(env);
    if (path.startsWith('admin/')) return admin(request, env, path.slice(6));
    if (path.startsWith('media/')) return media(request, env, path.slice(6));
    if (!hasCode(request, env)) return json({ error: 'This link is missing its access code. Use the team link you were given.' }, 403);
    if (path === 'join' && method === 'POST') return join(request, env);
    if (path === 'me' && method === 'GET') return me(request, env);
    if (path === 'submit' && method === 'POST') return submit(request, env);
    if (path === 'leaderboard' && method === 'GET') return json(await leaderboard(env));
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e.message || 'Server error' }, 500);
  }
}

async function teamFromToken(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return env.DB.prepare('SELECT id, name FROM hunt_teams WHERE token = ?').bind(token).first();
}

async function isLocked(env) {
  const row = await env.DB.prepare("SELECT value FROM hunt_settings WHERE key = 'locked'").first();
  return !!row && row.value === '1';
}

async function join(request, env) {
  const body = await request.json();
  const name = String(body.name || '').trim().slice(0, 40);
  const pin = String(body.pin || '').trim().slice(0, 12);
  if (!name || !pin) return json({ error: 'Team name and PIN are required.' }, 400);
  const key = name.toLowerCase();
  const existing = await env.DB.prepare('SELECT name, pin, token FROM hunt_teams WHERE name_key = ?').bind(key).first();
  if (existing) {
    if (existing.pin !== pin) return json({ error: 'That team name exists and the PIN does not match.' }, 403);
    return json({ token: existing.token, name: existing.name });
  }
  const token = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO hunt_teams (name, name_key, pin, token) VALUES (?, ?, ?, ?)')
    .bind(name, key, pin, token).run();
  return json({ token, name });
}

async function me(request, env) {
  const team = await teamFromToken(request, env);
  if (!team) return json({ error: 'Not signed in' }, 401);
  const { results } = await env.DB.prepare(
    'SELECT item_id, media_key, media_type, answer, points FROM hunt_submissions WHERE team_id = ?'
  ).bind(team.id).all();
  return json({ team, submissions: results, locked: await isLocked(env) });
}

async function submit(request, env) {
  const team = await teamFromToken(request, env);
  if (!team) return json({ error: 'Not signed in' }, 401);
  if (await isLocked(env)) return json({ error: 'The hunt is closed. Submissions are locked.' }, 403);

  const form = await request.formData();
  const itemId = parseInt(form.get('item_id'), 10);
  if (!itemId || itemId < 1 || itemId > 99) return json({ error: 'Bad item' }, 400);
  const answer = String(form.get('answer') || '').trim().slice(0, 1000);
  const file = form.get('file');
  const hasFile = file && typeof file === 'object' && file.size > 0;
  if (!hasFile && !answer) return json({ error: 'Add a photo, video, or answer first.' }, 400);

  let mediaKey = null;
  let mediaType = null;
  if (hasFile) {
    if (!env.MEDIA) return json({ error: 'Photo storage is not set up yet.' }, 500);
    const type = file.type || '';
    if (!type.startsWith('image/') && !type.startsWith('video/')) {
      return json({ error: 'Only photos and videos are allowed.' }, 400);
    }
    const ext = (type.split('/')[1] || 'bin').split(';')[0].replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin';
    mediaKey = `hunt/${crypto.randomUUID()}.${ext}`;
    mediaType = type.startsWith('video/') ? 'video' : 'image';
    await env.MEDIA.put(mediaKey, file.stream(), { httpMetadata: { contentType: type } });
  }

  const old = await env.DB.prepare('SELECT media_key FROM hunt_submissions WHERE team_id = ? AND item_id = ?')
    .bind(team.id, itemId).first();

  await env.DB.prepare(
    `INSERT INTO hunt_submissions (team_id, item_id, media_key, media_type, answer)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(team_id, item_id) DO UPDATE SET
       media_key = COALESCE(excluded.media_key, hunt_submissions.media_key),
       media_type = COALESCE(excluded.media_type, hunt_submissions.media_type),
       answer = CASE WHEN excluded.answer = '' THEN hunt_submissions.answer ELSE excluded.answer END,
       points = NULL,
       created_at = CURRENT_TIMESTAMP`
  ).bind(team.id, itemId, mediaKey, mediaType, answer).run();

  if (mediaKey && old && old.media_key && env.MEDIA) await env.MEDIA.delete(old.media_key);
  return json({ ok: true });
}

// Media is served to teams (code) or judges (admin key) via ?c= / ?k= since <img> can't send headers.
async function media(request, env, key) {
  const url = new URL(request.url);
  const okCode = env.HUNT_CODE && safeEqual(url.searchParams.get('c'), env.HUNT_CODE);
  const okAdmin = env.ADMIN_PASSWORD && safeEqual(url.searchParams.get('k'), env.ADMIN_PASSWORD);
  if (!okCode && !okAdmin) return new Response('Forbidden', { status: 403 });
  if (!env.MEDIA || !/^[a-f0-9-]+\.[a-z0-9]+$/i.test(key)) return new Response('Not found', { status: 404 });
  const obj = await env.MEDIA.get('hunt/' + key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('cache-control', 'private, max-age=3600');
  return new Response(obj.body, { headers });
}

async function leaderboard(env) {
  const { results } = await env.DB.prepare(
    `SELECT t.id, t.name,
       COALESCE((SELECT SUM(points) FROM hunt_submissions WHERE team_id = t.id), 0)
       + COALESCE((SELECT SUM(points) FROM hunt_bonuses WHERE team_id = t.id), 0) AS score,
       (SELECT COUNT(*) FROM hunt_submissions WHERE team_id = t.id) AS done
     FROM hunt_teams t ORDER BY score DESC, done DESC, t.name ASC`
  ).all();
  return results;
}

async function admin(request, env, path) {
  if (!env.ADMIN_PASSWORD || !safeEqual(request.headers.get('x-admin-key'), env.ADMIN_PASSWORD)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (path === 'submissions' && request.method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT s.id, s.team_id, t.name AS team, s.item_id, s.media_key, s.media_type, s.answer, s.points, s.created_at
       FROM hunt_submissions s JOIN hunt_teams t ON t.id = s.team_id
       ORDER BY s.created_at DESC`
    ).all();
    return json({ submissions: results, locked: await isLocked(env), teams: await leaderboard(env) });
  }
  if (path === 'score' && request.method === 'POST') {
    const b = await request.json();
    const pts = b.points === null ? null : parseInt(b.points, 10);
    await env.DB.prepare('UPDATE hunt_submissions SET points = ? WHERE id = ?').bind(pts, b.id).run();
    return json({ ok: true });
  }
  if (path === 'bonus' && request.method === 'POST') {
    const b = await request.json();
    await env.DB.prepare('INSERT INTO hunt_bonuses (team_id, points, note) VALUES (?, ?, ?)')
      .bind(b.team_id, parseInt(b.points, 10) || 0, String(b.note || '').slice(0, 200)).run();
    return json({ ok: true });
  }
  if (path === 'lock' && request.method === 'POST') {
    const b = await request.json();
    await env.DB.prepare("INSERT INTO hunt_settings (key, value) VALUES ('locked', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .bind(b.locked ? '1' : '0').run();
    return json({ ok: true });
  }
  return json({ error: 'Not found' }, 404);
}
