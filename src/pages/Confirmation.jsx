import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import { buildGoogleCalendarUrl, downloadIcs } from '../hooks/useEvent';

export default function Confirmation() {
  const { groupId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/registration/${groupId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError('Registration not found. Please check your link.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <Loader />;
  if (error || !data) return <ErrorScreen message={error} />;

  const { attendees, event, editToken, isWaitlist } = data;
  const venueLine = [event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
    .filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 no-print">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gala-dark">{event.name}</Link>
          <Link to="/faq" className="text-sm text-gray-500 hover:text-gala-deep">FAQ</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        {/* Success banner */}
        <div className="text-center mb-10 animate-fade-in">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 animate-check ${isWaitlist ? 'bg-amber-100' : 'bg-green-100'}`}>
            {isWaitlist ? (
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gala-dark mb-2">
            {isWaitlist ? 'You\u2019re on the waitlist' : 'You\u2019re all set!'}
          </h1>
          <p className="text-gray-500 text-lg">
            {isWaitlist
              ? 'We\u2019ll email you if space opens up.'
              : attendees.length === 1
                ? 'Your ticket has been confirmed.'
                : `${attendees.length} tickets have been confirmed.`}
          </p>
          {!isWaitlist && (
            <p className="text-gray-400 text-sm mt-2">
              Check your email for your QR code and ticket details.
            </p>
          )}
        </div>

        {/* Event card */}
        <div className="card p-6 md:p-7 mb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-gala-deep font-semibold mb-1">
            {event.weekday}
          </p>
          <p className="text-gala-dark text-2xl font-extrabold">{event.long_date}</p>
          <p className="text-gray-700 mt-1">{event.time_range}</p>
          {venueLine && <p className="text-gray-500 mt-2">{venueLine}</p>}
          {event.dress_code && (
            <p className="text-gray-500 mt-3 pt-3 border-t border-gray-100 text-sm">
              <span className="font-semibold text-gala-dark">Dress code:</span> {event.dress_code}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-5 no-print">
            <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
              </svg>
              Google Calendar
            </a>
            <button onClick={() => downloadIcs(event)} className="btn-secondary text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Apple / .ics
            </button>
            {editToken && (
              <Link to={`/edit/${editToken}`} className="btn-secondary text-sm">
                Edit registration
              </Link>
            )}
          </div>
        </div>

        {/* Tickets */}
        {!isWaitlist && (
          <div className="space-y-4">
            {attendees.map((a, i) => (
              <div
                key={a.ticket_id}
                className="card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-6">
                    <p className="text-xs uppercase tracking-widest text-gala-deep font-semibold mb-1">
                      {event.name}{event.year ? ` · ${event.year}` : ''}
                    </p>
                    <h3 className="text-xl font-bold text-gala-dark mb-3">
                      {a.first_name} {a.last_name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p>{event.long_date}</p>
                      <p>{event.time_range}</p>
                      {venueLine && <p>{venueLine}</p>}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Ticket ID: <span className="font-mono">{a.ticket_id.substring(0, 8).toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="sm:w-48 flex items-center justify-center p-6 bg-gray-50 border-t sm:border-t-0 sm:border-l border-gray-100">
                    <img
                      src={`/api/ticket/${a.ticket_id}/qr`}
                      alt={`QR code for ${a.first_name}`}
                      className="w-36 h-36"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plan your arrival */}
        {(event.arrival_info || event.parking_info) && !isWaitlist && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gala-dark mb-3">Plan Your Arrival</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {event.arrival_info && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gala-dark mb-1">Arrival</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{event.arrival_info}</p>
                </div>
              )}
              {event.parking_info && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gala-dark mb-1">Parking</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{event.parking_info}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-10 justify-center no-print">
          <button onClick={() => window.print()} className="btn-secondary">Print Tickets</button>
          <Link to="/faq" className="btn-secondary">View FAQ</Link>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gala-deep rounded-full" />
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{message}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
