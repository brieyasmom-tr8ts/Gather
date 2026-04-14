import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EVENT } from '../config';

export default function Ticket() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ticket/${ticketId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => setTicket(data))
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-gala-mint/30 border-t-gala-deep rounded-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h1>
          <p className="text-gray-500 mb-6">This ticket doesn&rsquo;t exist or has been removed.</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="card max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-gala-dark to-gala-purple p-6 text-center text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-gala-mint mb-1">{EVENT.year}</p>
          <h1 className="text-2xl font-bold">{EVENT.name}</h1>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
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
            <p>{EVENT.date}</p>
            <p>{EVENT.time}</p>
            <p>{EVENT.location}, {EVENT.address}</p>
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
