import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function Ticket() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ticket/${ticketId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setTicket)
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gala-deep rounded-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gala-dark mb-2">Ticket Not Found</h1>
          <p className="text-gray-500 mb-6">This ticket doesn&rsquo;t exist or has been removed.</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const event = ticket.event || {};
  const venueLine = [event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
    .filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="card max-w-sm w-full overflow-hidden">
        <div className="bg-gradient-to-br from-gala-dark to-gala-deep p-6 text-center text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-gala-mint mb-1">
            {event.year || ''}
          </p>
          <h1 className="text-2xl font-bold">{event.name || 'Event'}</h1>
        </div>

        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gala-dark mb-1">
            {ticket.first_name} {ticket.last_name}
          </h2>
          <p className="text-gray-400 text-sm mb-6">{ticket.email}</p>

          <img
            src={`/api/ticket/${ticketId}/qr`}
            alt="Ticket QR Code"
            className="w-48 h-48 mx-auto mb-4"
          />

          <p className="text-xs font-mono text-gray-400 mb-6">
            {ticketId.substring(0, 8).toUpperCase()}
          </p>

          <div className="text-sm text-gray-500 space-y-1 border-t border-gray-100 pt-4">
            <p>{event.long_date}</p>
            <p>{event.time_range}</p>
            {venueLine && <p>{venueLine}</p>}
          </div>

          {ticket.checked_in ? (
            <div className="mt-4 py-2 px-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              Checked In
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
