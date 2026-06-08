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
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-36">
          {/* Top — title area, centered */}
          <div className="text-center mb-16 md:mb-20">
            <p className="text-gala-mint/80 text-xs font-semibold uppercase tracking-[0.3em] mb-6">
              GiveSendGo Giver Gala
            </p>
            <h1 className="text-white font-extrabold tracking-tight text-6xl md:text-8xl lg:text-9xl leading-[0.9]">
              {event.name}
              {event.year && <><br /><span className="text-gala-mint">{event.year}</span></>}
            </h1>
            {event.tagline && (
              <p className="text-white/60 text-lg md:text-xl font-light mt-6 max-w-xl mx-auto">
                {event.tagline}
              </p>
            )}
          </div>

          {/* Middle — event info cards in a row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-14">
            <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-6 py-5 text-center border border-white/10">
              <p className="text-gala-mint text-[10px] font-bold uppercase tracking-[0.2em] mb-1">When</p>
              <p className="text-white font-semibold text-lg">{event.long_date}</p>
            </div>
            <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-6 py-5 text-center border border-white/10">
              <p className="text-gala-mint text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Schedule</p>
              <p className="text-white font-bold text-lg">Gala 7:00 – 10:00 PM</p>
              <p className="text-white/60 text-sm mt-1">VIP Cocktail Hour 6:00 PM</p>
              <p className="text-white/40 text-xs">Giver Army members</p>
            </div>
            <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-6 py-5 text-center border border-white/10">
              <p className="text-gala-mint text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Where</p>
              <p className="text-white font-semibold text-sm leading-snug">{event.venue_name}</p>
              <p className="text-white/60 text-xs mt-0.5">{[event.venue_city, event.venue_state].filter(Boolean).join(', ')}</p>
            </div>
          </div>

          {/* Bottom — CTA + countdown */}
          <div className="text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-gala-mint text-gala-dark px-10 py-4 rounded-full text-lg font-extrabold hover:bg-white transition-all shadow-xl shadow-gala-mint/20 active:scale-[0.98]"
            >
              {event.is_full ? 'Join Waitlist' : 'Reserve Your Spot'}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {showRemaining && (
              <p className="mt-4 text-xs uppercase tracking-[0.22em] font-semibold text-gala-mint">
                Only {event.available} spot{event.available === 1 ? '' : 's'} left
              </p>
            )}

            <div className="mt-10">
              <Countdown label={countdown.label} />
            </div>
          </div>
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
