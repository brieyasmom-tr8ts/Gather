import { useCallback, useEffect, useState } from 'react';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All confirmed' },
  { value: 'waitlist', label: 'Waitlist only' },
  { value: 'giver_army', label: 'Giver Army' },
  { value: 'non_giver_army', label: 'Non Giver Army' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'not_checked_in', label: 'Not checked in' },
];

export default function EmailTab({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const [draft, setDraft] = useState(null);
  const [preview, setPreview] = useState('');
  const [testTo, setTestTo] = useState('');
  const [sending, setSending] = useState(false);
  const [bulkAudience, setBulkAudience] = useState('all');
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduleAudience, setScheduleAudience] = useState('all');
  const [scheduleRefresh, setScheduleRefresh] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/templates');
    const data = await r.json();
    setTemplates(data.templates || []);
    if (!activeSlug && data.templates?.[0]) setActiveSlug(data.templates[0].slug);
  }, [activeSlug]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeSlug) return;
    const t = templates.find((x) => x.slug === activeSlug);
    if (t) setDraft({ subject: t.subject, body: t.body });
  }, [activeSlug, templates]);

  const runPreview = async () => {
    if (!activeSlug || !draft) return;
    const r = await fetch(`/api/admin/template/${activeSlug}?preview=1`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = await r.json();
    setPreview(data.html || '');
  };

  const save = async () => {
    if (!activeSlug || !draft) return;
    const r = await fetch(`/api/admin/template/${activeSlug}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (r.ok) { showToast('Template saved'); load(); }
    else showToast('Save failed', 'error');
  };

  const sendTest = async () => {
    if (!testTo) return showToast('Enter a test email', 'error');
    setSending(true);
    const r = await fetch(`/api/admin/template/${activeSlug}?test=1`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, toEmail: testTo }),
    });
    setSending(false);
    const data = await r.json();
    if (r.ok && data.ok) showToast(`Test sent to ${testTo}`);
    else showToast(data.error || 'Test failed', 'error');
  };

  const sendBulk = async () => {
    if (!confirm(`Send "${active?.name || 'this template'}" to the selected audience?`)) return;
    setSending(true);
    const r = await fetch('/api/admin/bulk-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: activeSlug, audience: bulkAudience, ...draft && { overrideSubject: draft.subject, overrideBody: draft.body } }),
    });
    setSending(false);
    const data = await r.json();
    if (r.ok) showToast(`Sent ${data.sent}${data.failed ? `, ${data.failed} failed` : ''}`);
    else showToast(data.error || 'Bulk send failed', 'error');
  };

  const schedule = async () => {
    if (!scheduleAt) return showToast('Pick a date and time', 'error');
    if (hasUnsaved && !confirm('You have unsaved changes to this template. Scheduled emails use the SAVED version. Schedule anyway?')) return;
    const when = new Date(scheduleAt);
    const r = await fetch('/api/admin/scheduled-emails', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: activeSlug, audience: scheduleAudience, sendAt: when.toISOString() }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      showToast(`Scheduled for ${when.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`);
      setScheduleAt('');
      setScheduleRefresh((n) => n + 1);
    } else showToast(data.error || 'Could not schedule', 'error');
  };

  const active = templates.find((t) => t.slug === activeSlug);
  const hasUnsaved = !!(active && draft && (draft.subject !== active.subject || draft.body !== active.body));

  return (
    <div className="space-y-6">
    <EmailHealth />
    <ScheduledList templates={templates} showToast={showToast} refreshKey={scheduleRefresh} />
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <aside className="card p-2 h-fit">
        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold px-3 pt-2">Templates</p>
        <nav className="mt-1">
          {templates.map((t) => (
            <button
              key={t.slug}
              onClick={() => setActiveSlug(t.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeSlug === t.slug ? 'bg-gala-dark text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>
      </aside>

      <div className="space-y-4">
        {!active ? (
          <div className="card p-8 text-gray-400">Select a template.</div>
        ) : (
          <>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gala-dark">{active.name}</h3>
                <p className="text-xs text-gray-400">Updated {new Date(active.updated_at).toLocaleString()}</p>
              </div>
              <label className="label">Subject</label>
              <input
                className="input-field"
                value={draft?.subject || ''}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              />
              <label className="label mt-3">Body</label>
              <textarea
                className="input-field font-mono text-sm"
                rows={14}
                value={draft?.body || ''}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-2">
                Variables: <code>{'{{first_name}}'}</code>, <code>{'{{event_name}}'}</code>,{' '}
                <code>{'{{event_date}}'}</code>, <code>{'{{event_time}}'}</code>,{' '}
                <code>{'{{location}}'}</code>, <code>{'{{dress_code}}'}</code>,{' '}
                <code>{'{{qr_code}}'}</code>, <code>{'{{edit_link}}'}</code>
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={save} className="btn-primary text-sm">Save template</button>
                <button onClick={runPreview} className="btn-secondary text-sm">Preview</button>
              </div>
            </div>

            {preview && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gala-dark">Preview</h3>
                  <button onClick={() => setPreview('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                </div>
                <iframe
                  title="Email preview"
                  srcDoc={preview}
                  className="w-full h-[480px] border border-gray-100 rounded-xl"
                />
              </div>
            )}

            <div className="card p-5">
              <h3 className="font-semibold text-gala-dark mb-3">Send test</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  className="input-field flex-1 min-w-[220px]"
                  placeholder="you@example.com"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
                <button onClick={sendTest} disabled={sending} className="btn-secondary text-sm">
                  {sending ? 'Sending…' : 'Send test'}
                </button>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gala-dark mb-3">Bulk send</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="input-field max-w-xs"
                  value={bulkAudience}
                  onChange={(e) => setBulkAudience(e.target.value)}
                >
                  {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button onClick={sendBulk} disabled={sending} className="btn-primary text-sm">
                  {sending ? 'Sending…' : 'Send to audience'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Bulk emails use the current (unsaved) draft subject/body.</p>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gala-dark mb-3">Schedule send</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="datetime-local"
                  className="input-field max-w-[240px]"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
                <select
                  className="input-field max-w-xs"
                  value={scheduleAudience}
                  onChange={(e) => setScheduleAudience(e.target.value)}
                >
                  {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button onClick={schedule} className="btn-primary text-sm">Schedule</button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Time is in your computer's time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
                Scheduled emails use the <strong>saved</strong> template at the moment they send, so you can keep editing until then.
                They usually go out within 5–15 minutes of the scheduled time.
              </p>
              {hasUnsaved && <p className="text-xs text-amber-600 mt-1">You have unsaved changes — click "Save template" first.</p>}
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}

const AUDIENCE_LABEL = Object.fromEntries(AUDIENCE_OPTIONS.map((o) => [o.value, o.label]));

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function ScheduledList({ showToast, refreshKey }) {
  const [items, setItems] = useState([]);
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/scheduled-emails');
      const d = await r.json();
      setItems(d.scheduled || []);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const cancel = async (id) => {
    if (!confirm('Cancel this scheduled email?')) return;
    const r = await fetch(`/api/admin/scheduled-emails?id=${id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { showToast('Scheduled email cancelled'); load(); }
    else showToast(d.error || 'Could not cancel', 'error');
  };

  const tone = {
    pending: 'text-gala-deep bg-gala-mint/20', sending: 'text-amber-700 bg-amber-50',
    sent: 'text-green-700 bg-green-50', failed: 'text-red-700 bg-red-50', cancelled: 'text-gray-500 bg-gray-100',
  };
  const label = { pending: 'Scheduled', sending: 'Sending…', sent: 'Sent', failed: 'Failed', cancelled: 'Cancelled' };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gala-dark mb-3">Scheduled emails</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing scheduled yet. Pick a template below and use "Schedule send".</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((s) => (
            <div key={s.id} className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium text-gala-dark text-sm">{s.template_name || s.slug}</p>
                <p className="text-xs text-gray-500">
                  {fmt(s.send_at)} · {AUDIENCE_LABEL[s.audience] || s.audience}
                  {s.status !== 'pending' && s.status !== 'cancelled' && (
                    <> · {s.sent_count} of {s.recipient_count} sent{s.failed_count ? `, ${s.failed_count} failed` : ''}</>
                  )}
                </p>
                {s.last_error && s.failed_count > 0 && <p className="text-xs text-red-500 mt-0.5 break-all">{s.last_error}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tone[s.status] || tone.cancelled}`}>
                {label[s.status] || s.status}
              </span>
              {s.status === 'pending' && (
                <button onClick={() => cancel(s.id)} className="text-xs text-red-500 hover:text-red-700">Cancel</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailHealth() {
  const [st, setSt] = useState(null);
  const [loading, setLoading] = useState(false);
  const check = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/email-status');
      setSt(await r.json());
    } catch { setSt({ error: 'Could not load email status' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { check(); }, [check]);

  const Row = ({ ok, children }) => (
    <p className="text-sm flex items-start gap-2">
      <span className={ok === true ? 'text-green-600' : ok === false ? 'text-red-600' : 'text-gray-400'}>
        {ok === true ? '✓' : ok === false ? '✗' : '•'}
      </span>
      <span className="text-gray-700">{children}</span>
    </p>
  );

  const healthy = st && st.apiKeyConfigured && st.apiKeyValid && st.senderVerified !== false;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gala-dark">
          Email status {st && (healthy
            ? <span className="ml-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Working</span>
            : <span className="ml-2 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Needs attention</span>)}
        </h3>
        <button onClick={check} disabled={loading} className="text-xs text-gala-deep hover:underline">
          {loading ? 'Checking…' : 'Re-check'}
        </button>
      </div>
      {!st ? <p className="text-sm text-gray-400">Checking…</p> : (
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-1">
          <div className="space-y-1">
            <Row ok={st.apiKeyConfigured}>{st.apiKeyConfigured ? 'Brevo API key is set' : 'BREVO_API_KEY is not set in Cloudflare — no emails will send'}</Row>
            {st.apiKeyConfigured && (
              <Row ok={st.apiKeyValid}>
                {st.apiKeyValid
                  ? <>Brevo key works{st.account?.credits != null ? ` · ${st.account.credits} email credits left` : ''}</>
                  : (st.error || 'Brevo key is not valid')}
              </Row>
            )}
            {st.apiKeyValid && (
              <Row ok={st.senderVerified}>
                {st.senderVerified ? <>Sender verified: {st.from}</> : <>Sender <strong>{st.from}</strong> is not verified in Brevo</>}
              </Row>
            )}
            <Row ok={st.last24h?.failed ? false : (st.last24h?.sent ? true : null)}>
              Last 24h: {st.last24h?.sent || 0} sent, {st.last24h?.failed || 0} failed
              {st.last24h?.skipped ? `, ${st.last24h.skipped} skipped` : ''}
            </Row>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Recent signup emails</p>
            {st.recent?.length ? (
              <ul className="text-xs space-y-0.5 max-h-40 overflow-y-auto">
                {st.recent.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={r.status === 'sent' ? 'text-green-600' : 'text-red-600'}>{r.status === 'sent' ? '✓' : '✗'}</span>
                    <span className="text-gray-600 truncate">{r.email}</span>
                    <span className="text-gray-400 ml-auto whitespace-nowrap">{fmt(r.created_at.replace(' ', 'T') + 'Z')}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-gray-400">No signup emails recorded yet (tracking starts with this update).</p>}
          </div>
        </div>
      )}
    </div>
  );
}
