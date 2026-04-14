import { useCallback, useEffect, useMemo, useState } from 'react';
import { TENURE_LABEL } from '../../config';

const INITIAL_FILTERS = {
  search: '',
  checked_in: '',
  giver_army: '',
  waitlist: 'no',
  cancelled: 'no',
};

export default function AttendeesTab({ showToast, onDataChange }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [edit, setEdit] = useState(null);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    return q.toString();
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/attendees?${queryString}`);
      const data = await r.json();
      setAttendees(data.attendees || []);
    } finally {
      setLoading(false);
    }
  }, [queryString]);
  useEffect(() => { load(); }, [load]);

  const toggleSelected = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const allVisibleSelected = attendees.length > 0 && attendees.every((a) => selected.has(a.id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(attendees.map((a) => a.id)));
  };

  const resend = async (id) => {
    try {
      const r = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId: id }),
      });
      const data = await r.json();
      if (r.ok && data.ok) showToast('Confirmation email sent');
      else showToast(data.error || 'Failed to send', 'error');
    } catch { showToast('Failed to send', 'error'); }
  };

  const checkIn = async (ticket_id) => {
    const r = await fetch('/api/admin/check-in', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: ticket_id }),
    });
    const data = await r.json();
    if (data.status === 'checked_in') {
      showToast(`${data.attendee.first_name} checked in`);
      load(); onDataChange?.();
    } else if (data.status === 'already_checked_in') {
      showToast('Already checked in', 'warning');
    } else { showToast(data.error || 'Check-in failed', 'error'); }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this registration? The attendee will be marked as cancelled and freed from the count.')) return;
    const r = await fetch(`/api/admin/attendee/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    if (r.ok) { showToast('Registration cancelled'); load(); onDataChange?.(); }
    else showToast('Failed to cancel', 'error');
  };

  const moveFromWaitlist = async (id) => {
    const r = await fetch(`/api/admin/attendee/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'move_to_confirmed' }),
    });
    if (r.ok) { showToast('Moved to confirmed'); load(); onDataChange?.(); }
    else showToast('Failed', 'error');
  };

  const exportCsv = () => {
    const url = `/api/admin/export?${queryString}`;
    window.location.href = url;
  };

  const openBadges = () => {
    const ids = [...selected];
    const url = ids.length ? `/api/admin/badges?ids=${ids.join(',')}` : '/api/admin/badges';
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search by name or email…"
            className="input-field !py-2 pl-9"
          />
        </div>
        <Select label="Check-in" value={filters.checked_in} onChange={(v) => setFilters((f) => ({ ...f, checked_in: v }))}
                options={[['', 'Any'], ['yes', 'Checked in'], ['no', 'Not checked in']]} />
        <Select label="Giver Army" value={filters.giver_army} onChange={(v) => setFilters((f) => ({ ...f, giver_army: v }))}
                options={[['', 'Any'], ['yes', 'Yes'], ['no', 'No']]} />
        <Select label="Waitlist" value={filters.waitlist} onChange={(v) => setFilters((f) => ({ ...f, waitlist: v }))}
                options={[['no', 'Confirmed only'], ['yes', 'Waitlist only'], ['', 'All']]} />
        <Select label="Cancelled" value={filters.cancelled} onChange={(v) => setFilters((f) => ({ ...f, cancelled: v }))}
                options={[['no', 'Active'], ['yes', 'Cancelled only']]} />
        <div className="ml-auto flex gap-2">
          <button onClick={exportCsv} className="btn-secondary text-sm py-2">Export CSV</button>
          <button onClick={openBadges} className="btn-secondary text-sm py-2">
            {selected.size ? `Badges (${selected.size})` : 'All Badges'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="accent-gala-deep" />
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Giver Army</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : attendees.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No attendees match these filters.</td></tr>
              ) : attendees.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelected(a.id)} className="accent-gala-deep" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gala-dark">{a.first_name} {a.last_name}</p>
                    <p className="text-xs text-gray-400 md:hidden">{a.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{a.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {a.is_giver_army ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gala-deep bg-gala-mint/20 px-2 py-0.5 rounded-full">
                        {TENURE_LABEL[a.giver_army_tenure] || 'Giver Army'}
                      </span>
                    ) : (<span className="text-xs text-gray-300">—</span>)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.cancelled ? (
                      <Pill tone="red">Cancelled</Pill>
                    ) : a.is_waitlist ? (
                      <Pill tone="amber">Waitlist</Pill>
                    ) : a.checked_in ? (
                      <Pill tone="green">Checked In</Pill>
                    ) : (<Pill tone="gray">Pending</Pill>)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      {!a.cancelled && !a.checked_in && !a.is_waitlist && (
                        <button onClick={() => checkIn(a.ticket_id)} className="text-gala-deep hover:underline font-semibold">Check in</button>
                      )}
                      {!a.cancelled && a.is_waitlist && (
                        <button onClick={() => moveFromWaitlist(a.id)} className="text-gala-deep hover:underline font-semibold">Move in</button>
                      )}
                      {!a.cancelled && (
                        <>
                          <button onClick={() => setEdit(a)} className="text-gray-500 hover:text-gray-800">Edit</button>
                          <button onClick={() => resend(a.id)} className="text-gray-500 hover:text-gray-800">Resend</button>
                          <button onClick={() => cancel(a.id)} className="text-red-500 hover:text-red-700">Cancel</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edit && (
        <EditAttendeeModal
          attendee={edit}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); load(); onDataChange?.(); showToast('Attendee updated'); }}
        />
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="text-xs text-gray-500 flex flex-col">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
              className="mt-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function Pill({ tone, children }) {
  const styles = {
    green:  'text-green-700 bg-green-50',
    amber:  'text-amber-700 bg-amber-50',
    red:    'text-red-700 bg-red-50',
    gray:   'text-gray-500 bg-gray-100',
  }[tone] || 'text-gray-500 bg-gray-100';
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${styles}`}>
      {children}
    </span>
  );
}

function EditAttendeeModal({ attendee, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: attendee.first_name, lastName: attendee.last_name,
    email: attendee.email, phone: attendee.phone || '',
    isGiverArmy: !!attendee.is_giver_army, giverArmyTenure: attendee.giver_army_tenure || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    const r = await fetch(`/api/admin/attendee/${attendee.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', ...form }),
    });
    setSaving(false);
    if (r.ok) onSaved();
    else { const d = await r.json(); setErr(d.error || 'Save failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gala-dark mb-4">Edit attendee</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First" />
            <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last" />
          </div>
          <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isGiverArmy} onChange={(e) => setForm({ ...form, isGiverArmy: e.target.checked })} />
            Giver Army
          </label>
          {form.isGiverArmy && (
            <select className="input-field" value={form.giverArmyTenure} onChange={(e) => setForm({ ...form, giverArmyTenure: e.target.value })}>
              <option value="">— tenure —</option>
              {Object.entries(TENURE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
