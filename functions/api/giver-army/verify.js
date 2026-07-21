// Proxies Giver Army membership lookups to the GiveSendGo Laravel API.
// Kept server-side so the bearer token never reaches the browser.
export async function onRequestGet(context) {
  const { request, env } = context;
  const email = (new URL(request.url).searchParams.get('email') || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'A valid email is required.' }, 400);
  }

  if (!env.GIVER_ARMY_API_URL || !env.GIVER_ARMY_API_KEY) {
    return json({ active: false });
  }

  try {
    const upstream = new URL('/api/giver-army/verify', env.GIVER_ARMY_API_URL);
    upstream.searchParams.set('email', email);

    const res = await fetch(upstream, {
      headers: { Authorization: `Bearer ${env.GIVER_ARMY_API_KEY}` },
    });

    if (!res.ok) {
      console.error('giver-army verify upstream error', res.status);
      return json({ active: false });
    }

    const data = await res.json();
    return json({
      active: !!data.active,
      memberSince: data.member_since || null,
      tenure: data.tenure || null,
    });
  } catch (err) {
    console.error('giver-army verify error', err);
    return json({ active: false });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
