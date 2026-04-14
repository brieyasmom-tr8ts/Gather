import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Scanner() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('qr'); // 'qr' | 'manual'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const r = await fetch('/api/admin/stats');
      if (r.status === 401) return navigate('/admin/login');
      if (r.ok) setStats(await r.json());
    } catch {}
  };

  // QR camera
  useEffect(() => {
    if (mode !== 'qr') return;
    let scanner = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
          handleScan,
          () => {}
        );
      } catch {
        setError('Camera access denied. Switch to manual check-in or reload the page.');
      }
    })();

    return () => {
      if (scanner && scanner.isScanning) scanner.stop().catch(() => {});
    };
  }, [mode]);

  const handleScan = async (text) => {
    if (processingRef.current) return;
    processingRef.current = true;
    let ticketId = text;
    const uuid = text.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuid) ticketId = uuid[1];
    await submitCheckIn({ ticketId });
    setTimeout(() => { setResult(null); processingRef.current = false; }, 3500);
  };

  const submitCheckIn = async (body) => {
    try {
      const r = await fetch('/api/admin/check-in', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.status === 401) return navigate('/admin/login');
      const data = await r.json();
      if (data.status === 'checked_in') {
        setResult({ type: 'success', title: 'Checked in', name: `${data.attendee.first_name} ${data.attendee.last_name}`, detail: data.attendee.email });
      } else if (data.status === 'already_checked_in') {
        setResult({ type: 'warning', title: 'Already checked in', name: `${data.attendee.first_name} ${data.attendee.last_name}`, detail: `at ${new Date(data.attendee.checked_in_at).toLocaleTimeString()}` });
      } else if (data.status === 'waitlist') {
        setResult({ type: 'error', title: 'Waitlist', name: 'This attendee is on the waitlist', detail: 'Please confirm manually before check-in' });
      } else if (data.status === 'cancelled') {
        setResult({ type: 'error', title: 'Cancelled', name: 'Registration cancelled', detail: '' });
      } else {
        setResult({ type: 'error', title: 'Invalid ticket', name: 'Not found', detail: '' });
      }
      loadStats();
    } catch {
      setResult({ type: 'error', title: 'Error', name: 'Could not verify ticket', detail: '' });
    }
  };

  // Manual search
  useEffect(() => {
    if (mode !== 'manual' || query.length < 2) { setMatches([]); return; }
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/check-in?q=${encodeURIComponent(query)}`);
        if (r.ok) setMatches((await r.json()).results || []);
      } catch {}
    }, 200);
    return () => clearTimeout(id);
  }, [query, mode]);

  const quickCheckIn = async (row) => {
    await submitCheckIn({ id: row.id });
    setQuery(''); setMatches([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-white">
      <header className="bg-gray-900 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <Link to="/admin" className="font-semibold flex items-center gap-2 hover:text-gala-mint">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
        <div className="text-sm text-white/70">
          {stats && <>{stats.checkedIn} / {stats.registered} checked in</>}
        </div>
      </header>

      {/* Mode switch */}
      <div className="flex justify-center gap-2 p-3 bg-gray-900 border-b border-white/10">
        <button
          onClick={() => setMode('qr')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${mode === 'qr' ? 'bg-gala-mint text-gala-dark' : 'bg-white/10 text-white/70'}`}
        >QR Scanner</button>
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${mode === 'manual' ? 'bg-gala-mint text-gala-dark' : 'bg-white/10 text-white/70'}`}
        >Manual Check-In</button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {mode === 'qr' ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            {error ? (
              <div className="text-center px-6">
                <p className="text-red-300 text-lg mb-4">{error}</p>
                <button onClick={() => setMode('manual')} className="btn-primary">Switch to manual</button>
              </div>
            ) : (
              <>
                <div id="qr-reader" className="w-full max-w-lg mx-auto" />
                <p className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm">
                  Point camera at the ticket QR code
                </p>
              </>
            )}
            {result && (
              <ResultOverlay result={result} onClose={() => setResult(null)} />
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-6">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full px-5 py-4 rounded-2xl bg-white text-gala-dark text-lg font-medium focus:outline-none focus:ring-4 focus:ring-gala-mint/40"
            />
            <ul className="mt-4 space-y-2">
              {matches.map((m) => (
                <li key={m.id}
                    className={`card p-4 flex items-center justify-between text-gala-dark
                                ${m.checked_in ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'}`}
                    onClick={() => !m.checked_in && quickCheckIn(m)}
                >
                  <div>
                    <p className="font-semibold">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                    {m.is_waitlist ? <span className="text-xs text-amber-600">Waitlist</span> : null}
                  </div>
                  {m.checked_in ? (
                    <span className="text-xs font-medium text-green-600">Checked in</span>
                  ) : (
                    <span className="text-xs font-medium text-gala-deep">Tap to check in →</span>
                  )}
                </li>
              ))}
              {query.length >= 2 && !matches.length && (
                <li className="text-center text-white/60 py-8">No matches.</li>
              )}
            </ul>
            {result && <ResultOverlay result={result} onClose={() => setResult(null)} />}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultOverlay({ result, onClose }) {
  const bg = {
    success: 'bg-emerald-500/95',
    warning: 'bg-amber-500/95',
    error: 'bg-red-500/95',
  }[result.type] || 'bg-gray-700/95';

  return (
    <div className={`fixed inset-0 ${bg} flex items-center justify-center z-30 animate-fade-in`}>
      <button onClick={onClose} className="absolute top-5 right-6 text-white/90 text-xl">×</button>
      <div className="text-center text-white px-6">
        <h2 className="text-4xl font-extrabold mb-2">{result.title}</h2>
        <p className="text-2xl font-medium mb-1 opacity-95">{result.name}</p>
        {result.detail && <p className="text-lg opacity-80">{result.detail}</p>}
      </div>
    </div>
  );
}
