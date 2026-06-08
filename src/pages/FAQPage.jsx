import { Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';
import FAQ from '../components/FAQ';
import SiteFooter from '../components/SiteFooter';

export default function FAQPage() {
  const { event } = useEvent();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gala-dark hover:text-gala-deep">
            {event.name}
          </Link>
          <Link to="/register" className="text-sm font-semibold text-gala-deep hover:text-gala-dark">
            Register →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-14 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gala-dark mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-500 mb-10">{event.long_date} · {event.time_range}</p>

        {event.faq?.length ? (
          <FAQ items={event.faq} />
        ) : (
          <p className="text-gray-400">FAQs will appear here once configured.</p>
        )}

        {(event.arrival_info || event.parking_info) && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-gala-dark mb-4">Plan Your Arrival</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {event.arrival_info && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gala-dark mb-2">Arrival</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-line">{event.arrival_info}</p>
                </div>
              )}
              {event.parking_info && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gala-dark mb-2">Parking</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-line">{event.parking_info}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
