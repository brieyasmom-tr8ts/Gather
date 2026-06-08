import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';

function useCountdown(isoStart) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!isoStart) return null;
  const target = new Date(isoStart).getTime();
  if (isNaN(target)) return null;

  const diff = target - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { days, hours, minutes, seconds };
}

export default function Home() {
  const { event } = useEvent();
  const countdown = useCountdown(event.iso_start);
  const showRemaining =
    typeof event.available === 'number' &&
    event.max_attendees > 0 &&
    event.available <= Math.max(30, Math.floor(event.max_attendees * 0.15));

  const mapsQuery = [event.location, event.address].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={event.hero_image_url ? {
          backgroundImage: `linear-gradient(rgba(4,43,62,.72), rgba(8,80,120,.78)), url("${event.hero_image_url}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : { background: 'linear-gradient(135deg, #042B3E 0%, #085078 70%, #0A628F 100%)' }}
      >
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-gala-mint border border-gala-mint/30 text-xs font-semibold uppercase tracking-[0.22em] px-4 py-1.5 rounded-full mb-8 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-gala-mint animate-pulse" />
            You&rsquo;re Invited
          </div>

          <h1 className="text-white font-extrabold tracking-tight text-5xl md:text-7xl lg:text-8xl mb-5">
            {event.name}
          </h1>
          {event.year && (
            <p className="text-gala-mint text-2xl md:text-3xl font-semibold mb-8">{event.year}</p>
          )}
          {event.tagline && (
            <p className="text-white/90 text-lg md:text-xl font-light max-w-2xl mx-auto mb-10">
              {event.tagline}
            </p>
          )}

          {/* Event facts */}
          <div className="inline-block bg-white/8 border border-white/15 backdrop-blur-md rounded-2xl px-6 py-5 mb-10">
            <p className="text-white text-2xl md:text-3xl font-bold mb-1">{event.event_date}</p>
            <p className="text-white/80 text-lg">{event.event_time}</p>
            {event.location && (
              <p className="text-white/70 text-sm mt-3 pt-3 border-t border-white/10">
                {event.location}{event.address ? ` \u00B7 ${event.address}` : ''}
              </p>
            )}
          </div>

          {/* Countdown */}
          {countdown && (
            <div className="mb-10">
              <p className="text-gala-mint text-sm uppercase tracking-widest font-semibold mb-4">
                Counting Down
              </p>
              <div className="flex justify-center gap-3 md:gap-6">
                <CountBox value={countdown.days} label="Days" />
                <CountBox value={countdown.hours} label="Hours" />
                <CountBox value={countdown.minutes} label="Min" />
                <CountBox value={countdown.seconds} label="Sec" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-gala-mint text-gala-dark px-10 py-4 rounded-full text-lg font-extrabold hover:bg-white transition-all shadow-xl shadow-gala-mint/20 active:scale-[0.98]"
            >
              {event.is_full ? 'Join Waitlist' : 'Reserve Your Spot'}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a href="#details" className="text-white/80 hover:text-white text-sm font-medium px-6 py-3">
              Event details &darr;
            </a>
          </div>

          {showRemaining && (
            <p className="mt-8 text-xs uppercase tracking-[0.22em] font-semibold text-gala-mint">
              Only {event.available} spot{event.available === 1 ? '' : 's'} left
            </p>
          )}
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 px-6 bg-gala-dark">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="block w-12 h-px bg-gala-mint/40" />
            <svg className="w-8 h-8 text-gala-mint/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
            <span className="block w-12 h-px bg-gala-mint/40" />
          </div>
          <p className="text-2xl md:text-4xl font-bold text-white italic leading-snug tracking-wide">
            Generosity is the Gateway for the Gospel
          </p>
          <div className="mt-6 flex justify-center">
            <span className="block w-16 h-1 rounded-full bg-gala-mint/50" />
          </div>
        </div>
      </section>

      {/* Details */}
      <section id="details" className="py-20 md:py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gala-dark mb-4 tracking-tight">
              An Evening to Remember
            </h2>
            {event.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <DetailCard
              title="Date &amp; Time"
              line1={event.event_date}
              line2={event.event_time}
              icon={<IconCalendar />}
            />
            <DetailCard
              title="Venue"
              line1={event.location}
              line2={event.address}
              icon={<IconPin />}
            />
            <DetailCard
              title="Dress Code"
              line1={event.dress_code || 'Cocktail Attire'}
              line2="Dress to celebrate"
              icon={<IconBowtie />}
            />
          </div>
        </div>
      </section>

      {/* Plan Your Arrival */}
      {(event.faq_parking || event.faq_what_to_expect) && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-3xl md:text-4xl font-extrabold text-gala-dark mb-12">
              Plan Your Arrival
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {event.faq_what_to_expect && (
                <ArrivalCard title="What to Expect" body={event.faq_what_to_expect} />
              )}
              {event.faq_parking && (
                <ArrivalCard title="Parking" body={event.faq_parking} />
              )}
            </div>
            {mapsQuery && (
              <div className="mt-6 text-center">
                <a
                  className="text-gala-deep font-semibold hover:underline text-sm"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                >
                  Open in Google Maps &rarr;
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="py-16 px-6 bg-gala-dark">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-white text-3xl md:text-4xl font-extrabold mb-4">
            {event.is_full ? 'Join the Waitlist' : 'Ready to celebrate?'}
          </h2>
          <p className="text-gala-mint/90 mb-8 text-lg">
            {event.is_full
              ? "We're currently full \u2014 join the waitlist and we'll notify you if space opens up."
              : 'Reserve your spot now. We look forward to seeing you.'}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 bg-gala-mint text-gala-dark px-10 py-4 rounded-full text-lg font-extrabold hover:bg-white transition-all"
          >
            {event.is_full ? 'Join Waitlist' : 'Reserve Your Spot'}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gala-deep">
        <div className="max-w-4xl mx-auto text-center text-sm text-white/60">
          <Link to="/faq" className="hover:text-white">FAQ</Link>
          <span className="mx-3">&middot;</span>
          <span>&copy; {new Date().getFullYear()} GiveSendGo. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function CountBox({ value, label }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 md:px-5 md:py-4 min-w-[70px] md:min-w-[90px]">
      <div className="text-3xl md:text-5xl font-extrabold text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs md:text-sm text-gala-mint uppercase tracking-wider mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}

function DetailCard({ icon, title, line1, line2 }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-100 shadow-sm">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gala-deep text-gala-mint mb-5">{icon}</div>
      <h3 className="text-lg font-bold text-gala-dark mb-2">{title}</h3>
      <p className="text-gray-800 font-medium">{line1}</p>
      {line2 && <p className="text-gray-500 text-sm mt-1">{line2}</p>}
    </div>
  );
}

function ArrivalCard({ title, body }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-100">
      <h3 className="font-bold text-gala-dark mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{body}</p>
    </div>
  );
}

function IconCalendar() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 6.75h15A1.5 1.5 0 0121 8.25v11.25A1.5 1.5 0 0119.5 21h-15A1.5 1.5 0 013 19.5V8.25a1.5 1.5 0 011.5-1.5z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconBowtie() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l6 6-6 6V6zm18 0l-6 6 6 6V6zM9 9h6v6H9V9z" />
    </svg>
  );
}
