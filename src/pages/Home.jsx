import { Link } from 'react-router-dom';
import { EVENT } from '../config';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gala-dark via-gala-red to-gala-dark hero-pattern overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-orange-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-yellow-300/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-fade-in">
          <p className="text-base md:text-lg uppercase tracking-[0.3em] text-amber-300 mb-6 font-semibold">
            You&rsquo;re Invited
          </p>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            {EVENT.name}
          </h1>

          <p className="text-3xl md:text-4xl text-amber-300 font-semibold mb-8 drop-shadow-md">
            {EVENT.year}
          </p>

          <p className="text-xl md:text-2xl text-white/90 mb-6 font-light">
            {EVENT.tagline}
          </p>

          <div className="flex flex-col items-center gap-1.5 text-white/70 mb-14 text-lg">
            <p>{EVENT.date}</p>
            <p>{EVENT.time}</p>
            <p className="font-medium text-white/80">{EVENT.location} &middot; {EVENT.address}</p>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900
                       px-12 py-5 rounded-full text-xl font-bold
                       shadow-2xl shadow-amber-400/40 hover:shadow-amber-300/50
                       transform hover:scale-105 active:scale-[0.98]
                       transition-all duration-300 ease-out"
          >
            Reserve Your Spot
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-7 h-7 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              An Evening to Remember
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              {EVENT.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <DetailCard
              icon={
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
              title="Date & Time"
              line1={EVENT.date}
              line2={EVENT.time}
            />
            <DetailCard
              icon={
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              }
              title="Location"
              line1={EVENT.location}
              line2={EVENT.address}
            />
            <DetailCard
              icon={
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                </svg>
              }
              title="Admission"
              line1="Complimentary"
              line2="RSVP Required"
            />
          </div>

          <div className="text-center mt-16">
            <Link
              to="/register"
              className="btn-primary text-lg px-10 py-4 rounded-full"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} GiveSendGo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function DetailCard({ icon, title, line1, line2 }) {
  return (
    <div className="card p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{line1}</p>
      <p className="text-gray-500 text-sm">{line2}</p>
    </div>
  );
}
