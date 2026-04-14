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

  const active = templates.find((t) => t.slug === activeSlug);

  return (
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
          </>
        )}
      </div>
    </div>
  );
}
