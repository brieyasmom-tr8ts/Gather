// Admin: printable attendee badges (4x3 letter page → 12 per sheet).
// GET /api/admin/badges              → all confirmed
// GET /api/admin/badges?ids=1,2,3    → specific attendees
// Output: an HTML document optimized for the browser's Print → Save as PDF.
import QRCode from 'qrcode';
import { buildPublicEvent } from '../../lib/event.js';

const TENURE_LABEL = {
  'new': 'New this year',
  '1year': '1 year',
  '2-3years': '2–3 years',
  '4-5years': '4–5 years',
  '5plus': '5+ years',
};

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids');
  const ids = idsParam ? idsParam.split(',').map((n) => parseInt(n, 10)).filter(Boolean) : null;

  let sql, binds;
  if (ids?.length) {
    sql = `SELECT id, ticket_id, first_name, last_name, is_giver_army, giver_army_tenure
           FROM attendees WHERE id IN (${ids.map(()=>'?').join(',')})`;
    binds = ids;
  } else {
    sql = `SELECT id, ticket_id, first_name, last_name, is_giver_army, giver_army_tenure
           FROM attendees WHERE cancelled = 0 AND is_waitlist = 0 ORDER BY last_name ASC, first_name ASC`;
    binds = [];
  }
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  const event = await buildPublicEvent(env.DB);

  const cards = await Promise.all((results || []).map(async (a) => {
    const qrSvg = await QRCode.toString(a.ticket_id, {
      type: 'svg', width: 120, margin: 1,
      color: { dark: '#0F2B3E', light: '#FFFFFF00' },
    });
    const tag = a.is_giver_army
      ? `Giver Army${a.giver_army_tenure ? ' · ' + (TENURE_LABEL[a.giver_army_tenure] || a.giver_army_tenure) : ''}`
      : 'Guest';
    const name = escapeHtml(`${a.first_name} ${a.last_name}`);
    return `
      <div class="badge">
        <div class="top">
          <div class="event">${escapeHtml(event.name)}</div>
          <div class="date">${escapeHtml(event.long_date || '')}</div>
        </div>
        <div class="name">${name}</div>
        <div class="tag">${escapeHtml(tag)}</div>
        <div class="qr">${qrSvg}</div>
      </div>`;
  }));

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Badges — ${escapeHtml(event.name)}</title>
<style>
  @page { size: letter; margin: 0.25in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; }
  .toolbar { padding: 16px; text-align: center; background: #fff; border-bottom: 1px solid #e5e7eb; }
  .toolbar button { background: #085078; color: white; border: 0; padding: 10px 20px; border-radius: 999px; font-weight: 600; cursor: pointer; }
  .sheet { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 3.33in; gap: 0; max-width: 8in; margin: 0 auto; padding: 0.25in 0; }
  .badge {
    border: 1px dashed #cbd5e1;
    padding: 0.2in 0.25in;
    display: flex; flex-direction: column; justify-content: space-between;
    break-inside: avoid; page-break-inside: avoid;
    background: #fff;
  }
  .top { font-size: 10px; color: #64748b; text-align: center; }
  .top .event { font-weight: 700; color: #0f172a; letter-spacing: 0.5px; }
  .name { font-size: 26px; font-weight: 800; text-align: center; letter-spacing: -0.5px; line-height: 1.1; }
  .tag { font-size: 11px; color: #085078; text-align: center; font-weight: 600; background: #ECFDF5; padding: 4px 8px; border-radius: 999px; align-self: center; }
  .qr { text-align: center; margin-top: 4px; }
  .qr svg { width: 96px; height: 96px; }
  @media print {
    .toolbar { display: none; }
    body { background: white; }
    .badge { border: 1px dashed #94a3b8; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save as PDF</button>
    <span style="margin-left:16px;color:#64748b;font-size:14px;">${(results||[]).length} badge${(results||[]).length===1?'':'s'}</span>
  </div>
  <div class="sheet">${cards.join('')}</div>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
