import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';
import { useCountdown } from '../hooks/useCountdown';
import Countdown from '../components/Countdown';
import FAQ from '../components/FAQ';
import SiteFooter from '../components/SiteFooter';

export default function Home() {
  const { event } = useEvent();
  const countdown = useCountdown(event.countdown_target);
  const venueLine = [event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
    .filter(Boolean).join(' · ');
  const showRemaining =
    typeof event.available === 'number' &&
    event.max_capacity > 0 &&
    event.available <= Math.max(30, Math.floor(event.max_capacity * 0.15));

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

          {/* Primary event facts */}
          <div className="inline-block bg-white/8 border border-white/15 backdrop-blur-md rounded-2xl px-6 py-5 mb-10">
            <p className="text-gala-mint text-sm font-semibold uppercase tracking-widest mb-1">
              {event.weekday || ''}
            </p>
            <p className="text-white text-2xl md:text-3xl font-bold mb-1">{event.long_date}</p>
            <p className="text-white/80 text-lg">{event.time_range}</p>
            {venueLine && (
              <p className="text-white/70 text-sm mt-3 pt-3 border-t border-white/10">{venueLine}</p>
            )}
          </div>

          <div className="mb-8">
            <Countdown label={countdown.label} />
          </div>

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
              Event details ↓
            </a>
          </div>

          {showRemaining && (
            <p className="mt-8 text-xs uppercase tracking-[0.22em] font-semibold text-gala-mint">
              Only {event.available} spot{event.available === 1 ? '' : 's'} left
            </p>
          )}
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
              line1={event.long_date}
              line2={event.time_range}
              icon={<IconCalendar />}
            />
            <DetailCard
              title="Venue"
              line1={event.venue_name}
              line2={[event.venue_city, event.venue_state].filter(Boolean).join(', ')}
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
      {(event.parking_info || event.arrival_info) && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-3xl md:text-4xl font-extrabold text-gala-dark mb-12">
              Plan Your Arrival
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {event.arrival_info && (
                <ArrivalCard title="Arrival" body={event.arrival_info} />
              )}
              {event.parking_info && (
                <ArrivalCard title="Parking" body={event.parking_info} />
              )}
            </div>
            {venueLine && (
              <div className="mt-6 text-center">
                <a
                  className="text-gala-deep font-semibold hover:underline text-sm"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue_name, event.venue_address, event.venue_city, event.venue_state].filter(Boolean).join(', '))}`}
                >
                  Open in Google Maps →
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {event.faq?.length > 0 && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-center text-3xl md:text-4xl font-extrabold text-gala-dark mb-10">
              Frequently Asked
            </h2>
            <FAQ items={event.faq} />
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
              ? "We're currently full — join the waitlist and we'll notify you if space opens up."
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

      <SiteFooter />
    </div>
  );
}

function DetailCard({ icon, title, line1, line2 }) {
  return (
    <div className="card p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gala-deep text-gala-mint mb-5">{icon}</div>
      <h3 className="text-lg font-bold text-gala-dark mb-2">{title}</h3>
      <p className="text-gray-800 font-medium">{line1}</p>
      {line2 && <p className="text-gray-500 text-sm mt-1">{line2}</p>}
    </div>
  );
}

function ArrivalCard({ title, body }) {
  return (
    <div className="card p-6">
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
