import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AttendeeForm from '../components/AttendeeForm';
import Countdown from '../components/Countdown';
import SiteFooter from '../components/SiteFooter';
import { useEvent } from '../hooks/useEvent';
import { useCountdown } from '../hooks/useCountdown';

const emptyAttendee = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  giverArmy: null,
  giverArmyTenure: '',
  mediaConsent: false,
});

export default function Register() {
  const navigate = useNavigate();
  const { event } = useEvent();
  const countdown = useCountdown(event.countdown_target);
  const [attendees, setAttendees] = useState([emptyAttendee()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [stage, setStage] = useState('form'); // 'form' | 'review'
  const [honeypot, setHoneypot] = useState('');

  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!event.turnstile_site_key) return;
    const render = () => {
      if (!window.turnstile || !turnstileRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: event.turnstile_site_key,
        callback: (t) => setTurnstileToken(t),
        'expired-callback': () => setTurnstileToken(null),
        'error-callback': () => setTurnstileToken(null),
      });
    };
    if (window.turnstile) render();
    else {
      const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (existing) existing.addEventListener('load', render);
      else {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true; script.defer = true;
        script.onload = render;
        document.head.appendChild(script);
      }
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [event.turnstile_site_key]);

  const isFull = event.is_full;
  const venueLine = useMemo(() =>
    [event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
      .filter(Boolean).join(' · '),
    [event]);

  const updateAttendee = (i, data) => {
    setAttendees((prev) => prev.map((a, idx) => (idx === i ? data : a)));
    setErrors((prev) => { const next = { ...prev }; delete next[i]; return next; });
  };
  const addGuest = () => attendees.length < 2 && setAttendees((p) => [...p, emptyAttendee()]);
  const removeGuest = (i) => {
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));
    setErrors({});
  };

  const validate = () => {
    const next = {};
    const emails = new Set();
    attendees.forEach((a, i) => {
      const f = {};
      if (!a.firstName.trim()) f.firstName = 'First name is required';
      if (!a.lastName.trim()) f.lastName = 'Last name is required';
      if (!a.email.trim()) f.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) f.email = 'Please enter a valid email';
      else if (emails.has(a.email.toLowerCase())) f.email = 'This email is already used above';
      if (!a.mediaConsent) f.mediaConsent = 'Please acknowledge the consent to continue';
      if (a.email) emails.add(a.email.toLowerCase());
      if (Object.keys(f).length) next[i] = f;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStage('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: honeypot,
          turnstileToken,
          attendees: attendees.map((a) => ({
            firstName: a.firstName.trim(),
            lastName: a.lastName.trim(),
            email: a.email.trim().toLowerCase(),
            phone: (a.phone || '').trim(),
            giverArmy: a.giverArmy || false,
            giverArmyTenure: a.giverArmy ? a.giverArmyTenure || null : null,
            mediaConsent: !!a.mediaConsent,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.duplicateEmails) {
          const dup = {};
          attendees.forEach((a, i) => {
            if (data.duplicateEmails.includes(a.email.toLowerCase())) {
              dup[i] = { email: 'This email is already registered' };
            }
          });
          setErrors(dup);
          setStage('form');
        }
        setServerError(data.error || 'Registration failed. Please try again.');
        return;
      }
      navigate(`/confirmation/${data.groupId}`);
    } catch {
      setServerError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gala-dark hover:text-gala-deep transition">
            {event.name}
          </Link>
          <Link to="/faq" className="text-sm text-gray-500 hover:text-gala-deep">FAQ</Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-gala-dark to-gala-deep text-white">
        <div className="max-w-3xl mx-auto px-6 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{event.long_date}</h1>
          <p className="text-white/80 text-lg mb-2">{event.time_range}</p>
          {venueLine && <p className="text-white/60 text-sm">{venueLine}</p>}
          <div className="mt-5"><Countdown label={countdown.label} /></div>
        </div>
      </section>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        {isFull && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">We&rsquo;re currently full — join the waitlist.</p>
              <p className="text-sm mt-1">We&rsquo;ll notify you if space opens up.</p>
            </div>
          </div>
        )}

        {stage === 'form' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gala-dark mb-2">
                {isFull ? 'Join the Waitlist' : 'Reserve Your Spot'}
              </h2>
              <p className="text-gray-500">
                Register yourself{attendees.length < 2 ? ' and optionally add one guest' : ' and your guest'}.
              </p>
            </div>

            <form onSubmit={handleReview} className="space-y-5">
              {attendees.map((a, i) => (
                <AttendeeForm
                  key={i} index={i}
                  attendee={a}
                  onChange={updateAttendee}
                  onRemove={removeGuest}
                  errors={errors[i]}
                  isPrimary={i === 0}
                  event={event}
                />
              ))}

              {attendees.length < 2 && (
                <button
                  type="button"
                  onClick={addGuest}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gala-mint hover:text-gala-deep hover:bg-gala-mint/10 transition font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add a Guest
                </button>
              )}

              <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
                <label>Leave empty<input type="text" name="website" tabIndex="-1" autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
              </div>

              {event.turnstile_site_key && (
                <div className="flex justify-center"><div ref={turnstileRef} /></div>
              )}

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={event.turnstile_site_key && !turnstileToken}
                className="btn-primary w-full py-4 text-lg rounded-2xl"
              >
                Review Registration
              </button>
            </form>
          </>
        ) : (
          <ReviewStage
            attendees={attendees}
            event={event}
            isWaitlist={isFull}
            submitting={submitting}
            serverError={serverError}
            onBack={() => { setStage('form'); setServerError(''); }}
            onConfirm={handleSubmit}
          />
        )}
      </main>

      <p className="text-center text-xs text-gray-400 pb-8 px-6">
        By registering, you agree to receive event-related communications.
      </p>

      <SiteFooter />
    </div>
  );
}

function ReviewStage({ attendees, event, isWaitlist, submitting, serverError, onBack, onConfirm }) {
  const total = attendees.length;
  const venueLine = [event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
    .filter(Boolean).join(' · ');

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gala-dark mb-2">Review &amp; Confirm</h2>
        <p className="text-gray-500">Everything look right?</p>
      </div>

      <div className="card p-6 mb-5">
        <h3 className="text-sm uppercase tracking-widest text-gray-400 font-semibold mb-3">Event</h3>
        <p className="text-gala-dark text-lg font-bold">{event.name}{event.year ? ` ${event.year}` : ''}</p>
        <p className="text-gray-700 mt-1">{event.long_date} · {event.time_range}</p>
        {venueLine && <p className="text-gray-500 mt-1">{venueLine}</p>}
        {event.dress_code && (
          <p className="text-gray-500 mt-3 pt-3 border-t border-gray-100 text-sm">
            <span className="font-semibold text-gala-dark">Dress code:</span> {event.dress_code}
          </p>
        )}
      </div>

      <div className="card p-6 mb-5">
        <h3 className="text-sm uppercase tracking-widest text-gray-400 font-semibold mb-3">
          {total} Attendee{total === 1 ? '' : 's'} ({total} ticket{total === 1 ? '' : 's'})
        </h3>
        <ul className="divide-y divide-gray-100">
          {attendees.map((a, i) => (
            <li key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gala-dark">{a.firstName} {a.lastName}</p>
                <p className="text-sm text-gray-500">{a.email}</p>
              </div>
              <div className="flex flex-col items-end text-xs gap-1">
                {a.giverArmy && (
                  <span className="px-2 py-1 rounded-full bg-gala-mint/20 text-gala-dark font-semibold">
                    Giver Army
                  </span>
                )}
                {a.phone && <span className="text-gray-400">{a.phone}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isWaitlist && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm mb-5">
          You&rsquo;re joining the <strong>waitlist</strong>. We&rsquo;ll email you if a spot opens up.
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 rounded-2xl">Back to edit</button>
        <button onClick={onConfirm} disabled={submitting} className="btn-primary flex-1 rounded-2xl">
          {submitting ? 'Submitting…' : isWaitlist ? 'Join Waitlist' : 'Confirm Registration'}
        </button>
      </div>
    </div>
  );
}
