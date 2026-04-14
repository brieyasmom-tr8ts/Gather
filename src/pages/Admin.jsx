import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, attendeesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/attendees${search ? `?search=${encodeURIComponent(search)}` : ''}`),
      ]);

      if (statsRes.status === 401 || attendeesRes.status === 401) {
        navigate('/admin/login');
        return;
      }

      setStats(await statsRes.json());
      const data = await attendeesRes.json();
      setAttendees(data.attendees);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/export');
      if (res.status === 401) { navigate('/admin/login'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gala-attendees-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const handleResend = async (attendeeId) => {
    setResending(attendeeId);
    try {
      const res = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId }),
      });
      if (res.status === 401) { navigate('/admin/login'); return; }
      if (res.ok) {
        showToast('Email sent successfully');
      } else {
        showToast('Failed to send email', 'error');
      }
    } catch {
      showToast('Failed to send email', 'error');
    } finally {
      setResending(null);
    }
  };

  const handleManualCheckIn = async (ticketId) => {
    try {
      const res = await fetch('/api/admin/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      if (res.status === 401) { navigate('/admin/login'); return; }
      const data = await res.json();
      if (data.status === 'checked_in') {
        showToast(`${data.attendee.first_name} checked in!`);
        fetchData();
      } else if (data.status === 'already_checked_in') {
        showToast('Already checked in', 'warning');
      }
    } catch {
      showToast('Check-in failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-gala-mint/30 border-t-gala-deep rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Event Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/scanner"
              className="btn-primary text-sm py-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
              Scanner
            </Link>
            <button onClick={handleExport} className="btn-secondary text-sm py-2">
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Registered" value={stats.total} color="primary" />
            <StatCard label="Checked In" value={stats.checkedIn} color="green" />
            <StatCard label="Remaining" value={stats.total - stats.checkedIn} color="gray" />
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field pl-12"
            />
          </div>
        </div>

        {/* Attendee Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Giver Army</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendees.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{a.first_name} {a.last_name}</p>
                      <p className="text-sm text-gray-400 md:hidden">{a.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{a.email}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {a.giver_army ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gala-deep bg-gala-mint/20 px-2 py-1 rounded-full">
                          Yes {a.giver_army_tenure && `\u00B7 ${a.giver_army_tenure}`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {a.checked_in ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!a.checked_in && (
                          <button
                            onClick={() => handleManualCheckIn(a.ticket_id)}
                            className="text-xs text-gala-deep hover:text-gala-dark font-medium"
                            title="Manual check-in"
                          >
                            Check In
                          </button>
                        )}
                        <button
                          onClick={() => handleResend(a.id)}
                          disabled={resending === a.id}
                          className="text-xs text-gray-400 hover:text-gray-600 font-medium disabled:opacity-50"
                          title="Resend email"
                        >
                          {resending === a.id ? '...' : 'Resend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {attendees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      {search ? 'No attendees match your search.' : 'No registrations yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up
          px-6 py-3 rounded-xl text-white font-medium shadow-xl text-sm
          ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'}
        `}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    primary: 'bg-gala-mint/20 text-gala-deep',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="card p-6">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]?.split(' ')[1] || 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
