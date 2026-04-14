import { useCallback, useEffect, useState } from 'react';

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage',
  'Pacific/Honolulu', 'UTC',
];

const FIELDS = [
  ['Event', [
    ['event_name', 'Event Title', 'text'],
    ['event_year', 'Year', 'text'],
    ['event_tagline', 'Tagline', 'text'],
    ['event_description', 'Description', 'textarea'],
  ]],
  ['Date & Time', [
    ['gala_date', 'Gala Date', 'date'],
    ['start_time', 'Start Time', 'time'],
    ['end_time', 'End Time', 'time'],
    ['time_zone', 'Time Zone', 'timezone'],
    ['edit_cutoff_hours', 'Edit cutoff (hours before start)', 'number'],
  ]],
  ['Venue', [
    ['venue_name', 'Venue Name', 'text'],
    ['venue_address', 'Address', 'text'],
    ['venue_city', 'City', 'text'],
    ['venue_state', 'State', 'text'],
  ]],
  ['Details', [
    ['dress_code', 'Dress Code', 'text'],
    ['max_capacity', 'Max Capacity', 'number'],
    ['parking_info', 'Parking info', 'textarea'],
    ['arrival_info', 'Arrival info', 'textarea'],
  ]],
  ['Giver Army', [
    ['giver_army_video_url', 'Video URL (embed URL)', 'text'],
    ['giver_army_signup_url', 'Signup URL', 'text'],
  ]],
  ['Media & Links', [
    ['hero_image_url', 'Hero image URL', 'text'],
    ['photos_url', 'Photos URL (post-event)', 'text'],
    ['next_event_url', 'Next event URL', 'text'],
    ['turnstile_site_key', 'Turnstile Site Key (bot protection)', 'text'],
  ]],
  ['FAQ (JSON array of {q, a})', [
    ['faq_json', 'FAQ JSON', 'textarea'],
  ]],
];

export default function SettingsTab({ showToast, onSaved }) {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/settings');
    const data = await r.json();
    setSettings(data.settings || {});
    setOriginal(data.settings || {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const dirty = JSON.stringify(settings) !== JSON.stringify(original);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await r.json();
      if (r.ok) {
        showToast('Settings saved');
        setOriginal(data.settings);
        onSaved?.();
      } else showToast(data.error || 'Save failed', 'error');
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 max-w-prose">
        Date &amp; time values below drive the countdown, the confirmation emails, and every page on
        the public site. No ISO strings or calendar fields — they&rsquo;re generated automatically from
        <strong> Gala Date + Start Time + End Time + Time Zone</strong>.
      </p>

      {FIELDS.map(([section, fields]) => (
        <div key={section} className="card p-6">
          <h3 className="font-semibold text-gala-dark mb-4">{section}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(([key, label, type]) => (
              <FieldRow
                key={key}
                colSpan={type === 'textarea' ? 2 : 1}
                label={label}
              >
                {renderInput(type, settings[key] || '', (v) => update(key, v))}
              </FieldRow>
            ))}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="btn-primary shadow-xl shadow-gala-deep/30"
        >
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'No changes'}
        </button>
      </div>
    </div>
  );
}

function FieldRow({ label, colSpan = 1, children }) {
  return (
    <div className={colSpan === 2 ? 'md:col-span-2' : ''}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function renderInput(type, value, onChange) {
  if (type === 'textarea') {
    return (
      <textarea
        rows={5}
        className="input-field font-sans"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (type === 'timezone') {
    return (
      <select className="input-field" value={value || 'America/Chicago'} onChange={(e) => onChange(e.target.value)}>
        {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
      </select>
    );
  }
  return (
    <input
      type={type}
      className="input-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
