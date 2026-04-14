import { Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';

export default function FAQ() {
  const { event } = useEvent();

  const items = [
    {
      q: 'What is the dress code?',
      a: event.dress_code || 'Black Tie Optional',
    },
    {
      q: 'Where is the event and is parking available?',
      a: `${event.location}, ${event.address}. ${event.faq_parking || ''}`,
    },
    {
      q: 'What can I expect?',
      a: event.faq_what_to_expect || '',
    },
    {
      q: 'What time should I arrive?',
      a: `Doors open at ${event.event_time?.split(' - ')[0] || '6:00 PM'}. We recommend arriving 15 minutes early.`,
    },
    {
      q: 'Can I bring a guest?',
      a: 'Yes. You can register up to 2 people (yourself and one guest) on the registration page.',
    },
    {
      q: 'What if I can no longer attend?',
      a: 'Please contact us as soon as possible so we can release your spot.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gala-deep">
            {event.name}
          </Link>
          <Link to="/register" className="text-sm font-semibold text-gala-deep hover:text-gala-dark">
            Register &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gala-deep mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500">Everything you need to know about the event</p>
        </div>

        <div className="space-y-4">
          {items.map((item, i) => (
            <details key={i} className="group card p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-gala-deep text-lg list-none">
                <span>{item.q}</span>
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed whitespace-pre-wrap">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/register"
            className="inline-flex items-center text-lg px-10 py-4 rounded-full bg-gala-deep text-white font-bold hover:bg-gala-dark active:scale-[0.98] transition-all"
          >
            Reserve Your Spot
          </Link>
        </div>
      </main>

      <footer className="py-8 px-6 bg-gala-deep">
        <div className="max-w-4xl mx-auto text-center text-sm text-white/60">
          <Link to="/" className="hover:text-white">Home</Link>
          <span className="mx-3">&middot;</span>
          <Link to="/register" className="hover:text-white">Register</Link>
        </div>
      </footer>
    </div>
  );
}
