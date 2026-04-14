import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EVENT, getGoogleCalendarUrl, getIcsContent } from '../config';

export default function Confirmation() {
  const { groupId } = useParams();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/registration/${groupId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Registration not found');
        return res.json();
      })
      .then((data) => setRegistration(data))
      .catch(() => setError('Registration not found. Please check your link.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const downloadIcs = () => {
    const blob = new Blob([getIcsContent()], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'givesendgo-gala-2026.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-gala-mint/30 border-t-gala-deep rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 no-print">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="text-lg font-bold text-gray-900 hover:text-gala-deep transition-colors">
            {EVENT.name}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Success Banner */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6 animate-check">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            You&rsquo;re All Set!
          </h1>
          <p className="text-gray-500 text-lg">
            {registration.attendees.length === 1
              ? 'Your ticket has been confirmed.'
              : `${registration.attendees.length} tickets have been confirmed.`}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Confirmation emails have been sent to each attendee.
          </p>
        </div>

        {/* Calendar Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 no-print">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
            </svg>
            Google Calendar
          </a>
          <button onClick={downloadIcs} className="btn-secondary text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .ics
          </button>
        </div>

        {/* Tickets */}
        <div className="space-y-6">
          {registration.attendees.map((attendee, i) => (
            <div
              key={attendee.ticket_id}
              className="card overflow-hidden animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Ticket Info */}
                <div className="flex-1 p-6 md:p-8">
                  <p className="text-xs uppercase tracking-widest text-gala-deep font-semibold mb-1">
                    {EVENT.name} {EVENT.year}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {attendee.first_name} {attendee.last_name}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-500">
                    <p>{EVENT.date}</p>
                    <p>{EVENT.time}</p>
                    <p>{EVENT.location}, {EVENT.address}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Ticket ID: <span className="font-mono">{attendee.ticket_id.substring(0, 8).toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="sm:w-48 flex items-center justify-center p-6 bg-gray-50 border-t sm:border-t-0 sm:border-l border-gray-100">
                  <img
                    src={`/api/ticket/${attendee.ticket_id}/qr`}
                    alt={`QR code for ${attendee.first_name}`}
                    className="w-36 h-36"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Print & Home */}
        <div className="flex justify-center gap-4 mt-10 no-print">
          <button onClick={() => window.print()} className="btn-secondary">
            Print Tickets
          </button>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
