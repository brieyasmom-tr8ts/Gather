import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OverviewTab from '../components/admin/OverviewTab';
import AttendeesTab from '../components/admin/AttendeesTab';
import EmailTab from '../components/admin/EmailTab';
import SettingsTab from '../components/admin/SettingsTab';

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'attendees',  label: 'Attendees' },
  { id: 'email',      label: 'Email' },
  { id: 'settings',   label: 'Settings' },
];

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => window.location.hash.replace('#', '') || 'overview');
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/stats');
      if (r.status === 401) return navigate('/admin/login');
      if (r.ok) setStats(await r.json());
    } catch {}
  }, [navigate]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Sync tab with URL hash
  useEffect(() => {
    window.location.hash = tab;
  }, [tab]);

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-extrabold text-gala-dark">Admin</h1>
            <nav className="hidden md:flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                    tab === t.id ? 'bg-gala-dark text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/scanner" className="btn-primary text-sm py-2">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
              Check-In
            </Link>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2">
              Log out
            </button>
          </div>
        </div>

        {/* Mobile tab bar */}
        <nav className="md:hidden flex overflow-x-auto border-t border-gray-100 px-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition ${
                tab === t.id ? 'border-gala-deep text-gala-dark' : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'overview' && <OverviewTab stats={stats} refresh={loadStats} showToast={showToast} />}
        {tab === 'attendees' && <AttendeesTab showToast={showToast} onDataChange={loadStats} />}
        {tab === 'email' && <EmailTab showToast={showToast} />}
        {tab === 'settings' && <SettingsTab showToast={showToast} onSaved={loadStats} />}
      </main>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up px-5 py-3 rounded-xl text-white font-medium shadow-xl text-sm ${
          toast.type === 'error' ? 'bg-red-500' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
