import { useEvent } from '../../hooks/useEvent';
import { TENURE_LABEL } from '../../config';

export default function OverviewTab({ stats, refresh, showToast }) {
  const { event } = useEvent();
  if (!stats) return <div className="p-8 text-gray-400">Loading…</div>;

  const remaining = stats.capacity > 0 ? Math.max(0, stats.capacity - stats.registered) : null;
  const checkedInPct = stats.registered > 0 ? Math.round((stats.checkedIn / stats.registered) * 100) : 0;
  const gaPct = stats.registered > 0 ? Math.round((stats.giverArmy / stats.registered) * 100) : 0;

  const maxPerDay = Math.max(1, ...(stats.perDay || []).map((d) => d.n));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Capacity"        value={stats.capacity || '—'} />
        <StatCard label="Confirmed"       value={stats.registered} accent="bg-gala-deep text-white" />
        <StatCard label="Remaining"       value={remaining == null ? '—' : remaining} />
        <StatCard label="Waitlist"        value={stats.waitlist} />
        <StatCard label="Checked In"      value={`${stats.checkedIn}${stats.registered ? ` / ${stats.registered}` : ''}`} accent="bg-green-600 text-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Groups"          value={stats.groups} />
        <StatCard label="Giver Army"      value={`${stats.giverArmy}${stats.registered ? ` · ${gaPct}%` : ''}`} />
        <StatCard label="Non Giver Army"  value={stats.nonGiverArmy} />
      </div>

      {/* Check-in progress bar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gala-dark">Check-in progress</h3>
          <span className="text-sm text-gray-500">{checkedInPct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gala-mint to-gala-deep transition-all" style={{ width: `${checkedInPct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {stats.checkedIn} of {stats.registered} confirmed attendees checked in
        </p>
      </div>

      {/* Event summary */}
      <div className="card p-6">
        <h3 className="font-semibold text-gala-dark mb-3">Event</h3>
        <p className="text-gray-600 text-sm">{event.long_date} · {event.time_range}</p>
        <p className="text-gray-500 text-sm">{event.venue_name}{event.venue_city ? ` · ${event.venue_city}, ${event.venue_state}` : ''}</p>
        <p className="text-gray-400 text-xs mt-2">Time zone: {event.time_zone}</p>
      </div>

      {/* Per-day bar chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-gala-dark mb-4">Registrations (last 30 days)</h3>
        {stats.perDay.length === 0 ? (
          <p className="text-gray-400 text-sm">No registrations yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {stats.perDay.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.n}`}
                className="flex-1 bg-gala-mint/60 hover:bg-gala-deep transition-colors rounded-t-sm"
                style={{ height: `${(d.n / maxPerDay) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Giver Army tenure breakdown */}
      {stats.tenureBreakdown?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gala-dark mb-4">Giver Army tenure</h3>
          <ul className="space-y-2">
            {stats.tenureBreakdown.map((row) => {
              const pct = stats.giverArmy > 0 ? Math.round((row.n / stats.giverArmy) * 100) : 0;
              return (
                <li key={row.tenure} className="flex items-center gap-3">
                  <span className="w-36 text-sm text-gray-600">
                    {TENURE_LABEL[row.tenure] || (row.tenure || 'Unspecified')}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gala-deep" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm w-14 text-right font-medium text-gala-dark">{row.n} · {pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={refresh} className="btn-secondary text-sm">Refresh</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-4 border border-gray-100 ${accent || 'bg-white'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? 'opacity-80' : 'text-gray-400'}`}>{label}</p>
      <p className="text-2xl md:text-3xl font-extrabold">{value}</p>
    </div>
  );
}
