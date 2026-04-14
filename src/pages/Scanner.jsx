import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Scanner() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    let scanner = null;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-reader');
        scannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1,
          },
          handleScan,
          () => {} // Ignore errors from scanning
        );
      } catch (err) {
        setError('Camera access denied. Please allow camera access and reload.');
      }
    };

    initScanner();

    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  const handleScan = async (decodedText) => {
    if (processingRef.current) return;
    processingRef.current = true;

    // Extract ticket ID (could be a UUID or a URL containing one)
    let ticketId = decodedText;
    const uuidMatch = decodedText.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch) {
      ticketId = uuidMatch[1];
    }

    try {
      const res = await fetch('/api/admin/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      if (res.status === 401) {
        navigate('/admin/login');
        return;
      }

      const data = await res.json();

      if (data.status === 'checked_in') {
        setResult({
          type: 'success',
          title: 'Checked In!',
          name: `${data.attendee.first_name} ${data.attendee.last_name}`,
          detail: data.attendee.email,
        });
      } else if (data.status === 'already_checked_in') {
        setResult({
          type: 'warning',
          title: 'Already Checked In',
          name: `${data.attendee.first_name} ${data.attendee.last_name}`,
          detail: `Checked in at ${new Date(data.attendee.checked_in_at).toLocaleTimeString()}`,
        });
      } else {
        setResult({
          type: 'error',
          title: 'Invalid Ticket',
          name: 'This ticket was not found',
          detail: 'Please check and try again',
        });
      }
    } catch {
      setResult({
        type: 'error',
        title: 'Scan Error',
        name: 'Could not verify ticket',
        detail: 'Please check connection and try again',
      });
    }

    setScanning(false);

    // Auto-reset after 4 seconds
    setTimeout(() => {
      setResult(null);
      setScanning(true);
      processingRef.current = false;
    }, 4000);
  };

  const resultStyles = {
    success: 'scanner-success',
    warning: 'scanner-warning',
    error: 'scanner-error',
  };

  const resultIcons = {
    success: (
      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    error: (
      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between z-10">
        <Link to="/admin" className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
        <span className="text-white/60 text-sm">QR Scanner</span>
      </header>

      {/* Scanner */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-center px-6">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div
              id="qr-reader"
              ref={scannerRef}
              className="w-full max-w-lg mx-auto"
              style={{ border: 'none' }}
            />

            {scanning && (
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-white/60 text-lg">Point camera at QR code</p>
              </div>
            )}
          </>
        )}

        {/* Result Overlay */}
        {result && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${resultStyles[result.type]} animate-fade-in z-20`}
          >
            <div className="text-center text-white px-8">
              <div className="flex justify-center mb-4 animate-check">
                {resultIcons[result.type]}
              </div>
              <h2 className="text-4xl font-bold mb-2">{result.title}</h2>
              <p className="text-2xl font-medium mb-1 opacity-90">{result.name}</p>
              <p className="text-lg opacity-70">{result.detail}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
