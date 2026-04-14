import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/admin/event')
      .then((r) => {
        if (r.status === 401) { navigate('/admin/login'); return null; }
        return r.json();
      })
      .then((data) => data && setSettings(data));
  }, [navigate]);

  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const update = (field, value) => setSettings({ ...settings, [field]: value });

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.status === 401) { navigate('/admin/login'); return; }
      if (res.ok) show('Saved');
      else show('Save failed', 'error');
    } catch {
      show('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runMigrations = async () => {
    if (!confirm('Run database migrations? This is safe to run multiple times.')) return;
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' });
      if (res.status === 401) { navigate('/admin/login'); return; }
      const data = await res.json();
      const errors = data.results?.filter((r) => r.status === 'error') || [];
      if (errors.length) {
        show(`${errors.length} migration(s) failed - check console`, 'error');
        console.error('Migration errors:', errors);
      } else {
        show('Migrations complete!');
        // Reload settings
        fetch('/api/admin/event').then((r) => r.json()).then(setSettings);
      }
    } catch {
      show('Migration failed', 'error');
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-gala-mint/30 border-t-gala-deep rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-500 hover:text-gala-deep">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Event Settings</h1>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary text-sm py-2">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <Section title="Event Details">
          <Field label="Event Name" value={settings.name} onChange={(v) => update('name', v)} />
          <Field label="Year" value={settings.year} onChange={(v) => update('year', v)} />
          <Field label="Tagline" value={settings.tagline || ''} onChange={(v) => update('tagline', v)} />
          <Field label="Description" value={settings.description || ''} onChange={(v) => update('description', v)} textarea />
        </Section>

        <Section title="Date & Time">
          <Field label="Date (display)" value={settings.event_date || ''} onChange={(v) => update('event_date', v)} placeholder="Saturday, June 6, 2026" />
          <Field label="Time (display)" value={settings.event_time || ''} onChange={(v) => update('event_time', v)} placeholder="6:00 PM - 11:00 PM" />
          <Field label="ISO Start (for countdown)" value={settings.iso_start || ''} onChange={(v) => update('iso_start', v)} placeholder="2026-06-06T18:00:00" hint="YYYY-MM-DDTHH:MM:SS in local time" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calendar Start" value={settings.calendar_start || ''} onChange={(v) => update('calendar_start', v)} placeholder="20260606T180000" />
            <Field label="Calendar End" value={settings.calendar_end || ''} onChange={(v) => update('calendar_end', v)} placeholder="20260606T230000" />
          </div>
        </Section>

        <Section title="Location">
          <Field label="Venue" value={settings.location || ''} onChange={(v) => update('location', v)} />
          <Field label="Address" value={settings.address || ''} onChange={(v) => update('address', v)} placeholder="Nashville, TN" />
        </Section>

        <Section title="Attendance">
          <Field
            label="Maximum Attendees"
            type="number"
            value={settings.max_attendees || 0}
            onChange={(v) => update('max_attendees', parseInt(v) || 0)}
            hint="Set to 0 for unlimited. When full, registrations go to waitlist."
          />
          <Field label="Dress Code" value={settings.dress_code || ''} onChange={(v) => update('dress_code', v)} placeholder="Black Tie Optional" />
        </Section>

        <Section title="FAQ Content">
          <Field label="Parking Info" value={settings.faq_parking || ''} onChange={(v) => update('faq_parking', v)} textarea />
          <Field label="What to Expect" value={settings.faq_what_to_expect || ''} onChange={(v) => update('faq_what_to_expect', v)} textarea />
        </Section>

        <Section title="Giver Army Signup">
          <Field label="Signup URL" value={settings.giver_army_signup_url || ''} onChange={(v) => update('giver_army_signup_url', v)} placeholder="https://www.giverarmy.com" />
          <Field label="Video URL (YouTube/Vimeo embed)" value={settings.giver_army_video_url || ''} onChange={(v) => update('giver_army_video_url', v)} placeholder="https://www.youtube.com/embed/..." hint="Use the embed URL, not the watch URL" />
        </Section>

        <div className="pb-8 space-y-3">
          <button onClick={save} disabled={saving} className="btn-primary w-full py-4 rounded-2xl text-lg">
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
          <button
            onClick={runMigrations}
            className="btn-secondary w-full text-sm py-2"
            title="Apply pending database schema updates"
          >
            Run Database Migrations
          </button>
        </div>
      </main>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-xl text-sm animate-slide-up
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}
        `}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, hint, textarea }) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="input-field"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
        />
      )}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
