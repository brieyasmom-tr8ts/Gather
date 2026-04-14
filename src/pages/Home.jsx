import { Link } from 'react-router-dom';
import { EVENT } from '../config';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero - solid bold background */}
      <section className="min-h-screen flex items-center justify-center bg-gala-deep">
        <div className="text-center px-6 max-w-3xl mx-auto animate-fade-in">
          <div className="inline-block bg-gala-mint text-gala-deep text-sm font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-8">
            You&rsquo;re Invited
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white mb-6 tracking-tight">
            {EVENT.name}
          </h1>

          <p className="text-4xl md:text-5xl text-gala-mint font-bold mb-10">
            {EVENT.year}
          </p>

          <p className="text-xl md:text-2xl text-white mb-10 font-medium">
            {EVENT.tagline}
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl inline-block px-8 py-5 mb-12">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-white text-lg font-medium">
              <span>{EVENT.date}</span>
              <span className="hidden sm:block text-gala-mint">|</span>
              <span>{EVENT.time}</span>
              <span className="hidden sm:block text-gala-mint">|</span>
              <span>{EVENT.location}</span>
            </div>
          </div>

          <div className="block">
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-gala-mint text-gala-deep
                         px-14 py-5 rounded-full text-xl font-extrabold
                         hover:bg-white
                         transform hover:scale-105 active:scale-[0.98]
                         transition-all duration-200 ease-out"
            >
              Reserve Your Spot
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Event Details - clean white with bold blocks */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gala-deep mb-6">
              An Evening to Remember
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {EVENT.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <DetailCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
              title="Date & Time"
              line1={EVENT.date}
              line2={EVENT.time}
            />
            <DetailCard
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="inline-flex items-center justify-center text-lg px-10 py-4 rounded-full
                         bg-gala-deep text-white font-bold
                         hover:bg-gala-dark
                         active:scale-[0.98] transition-all duration-200 ease-out"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gala-deep">
        <div className="max-w-4xl mx-auto text-center text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} GiveSendGo. All rights reserved.</p>
        </div>
      </footer>
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
