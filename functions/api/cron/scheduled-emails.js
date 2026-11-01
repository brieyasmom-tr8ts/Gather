// Public endpoint hit every few minutes by the GitHub Actions scheduler.
// It only sends emails an admin already scheduled whose time has arrived,
// and every recipient is sent at most once — so extra calls are harmless.
import { processScheduledEmails } from '../../lib/scheduled.js';

async function handle(context) {
  const { env, request } = context;
  try {
    const baseUrl = env.BASE_URL || `https://${request.headers.get('host')}`;
    const result = await processScheduledEmails(env, baseUrl);
    return json({ ok: true, ...result });
  } catch (err) {
    console.error('scheduled-emails cron error', err);
    return json({ ok: false, error: 'Processing failed' }, 500);
  }
}

export const onRequestPost = handle;
export const onRequestGet = handle;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
