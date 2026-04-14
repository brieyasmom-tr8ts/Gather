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

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center bg-gala-deep py-20">
        <div className="text-center px-6 max-w-4xl mx-auto animate-fade-in">
          <div className="inline-block bg-gala-mint text-gala-deep text-sm font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-8">
            You&rsquo;re Invited
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white mb-6 tracking-tight">
            {event.name}
          </h1>

          <p className="text-4xl md:text-5xl text-gala-mint font-bold mb-10">
            {event.year}
          </p>

          <p className="text-xl md:text-2xl text-white mb-10 font-medium">
            {event.tagline}
          </p>

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

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl inline-block px-6 sm:px-8 py-5 mb-10">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-white text-base sm:text-lg font-medium">
              <span>{event.event_date}</span>
              <span className="hidden sm:block text-gala-mint">|</span>
              <span>{event.event_time}</span>
              <span className="hidden sm:block text-gala-mint">|</span>
              <span>{event.location}</span>
            </div>
          </div>

          {/* Ticket availability */}
          {event.max_attendees > 0 && event.available !== null && (
            <div className="mb-8">
              {event.is_full ? (
                <p className="text-gala-mint text-lg font-semibold">
                  Event is full &mdash; join the waitlist below
                </p>
              ) : (
                <p className="text-white/80 text-sm">
                  <span className="text-gala-mint font-bold">{event.available}</span> {event.available === 1 ? 'spot' : 'spots'} remaining
                </p>
              )}
            </div>
          )}

          <div>
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-gala-mint text-gala-deep
                         px-14 py-5 rounded-full text-xl font-extrabold
                         hover:bg-white
                         transform hover:scale-105 active:scale-[0.98]
                         transition-all duration-200 ease-out"
            >
              {event.is_full ? 'Join Waitlist' : 'Reserve Your Spot'}
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gala-deep mb-6">
              An Evening to Remember
            </h2>
            {event.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <DetailCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
              title="Date & Time"
              line1={event.event_date}
              line2={event.event_time}
            />
            <DetailCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              }
              title="Location"
              line1={event.location}
              line2={event.address}
            />
            <DetailCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
              }
              title="Dress Code"
              line1={event.dress_code}
              line2="Come dressed to celebrate"
            />
          </div>

          <div className="text-center mt-16 space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center text-lg px-10 py-4 rounded-full
                         bg-gala-deep text-white font-bold
                         hover:bg-gala-dark
                         active:scale-[0.98] transition-all duration-200 ease-out"
            >
              Register Now
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center justify-center text-lg px-8 py-4 rounded-full
                         bg-white text-gala-deep font-bold border-2 border-gala-deep
                         hover:bg-gala-mint/10
                         active:scale-[0.98] transition-all duration-200 ease-out"
            >
              FAQ
            </Link>
          </div>
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
    <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-gray-100">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gala-deep text-gala-mint mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gala-deep mb-2">{title}</h3>
      <p className="text-gray-800 font-medium">{line1}</p>
      <p className="text-gray-600">{line2}</p>
    </div>
  );
}
