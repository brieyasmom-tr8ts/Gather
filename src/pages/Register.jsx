import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AttendeeForm from '../components/AttendeeForm';
import { EVENT } from '../config';
import { useEvent } from '../hooks/useEvent';

const emptyAttendee = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  giverArmy: null,
  giverArmyTenure: '',
  photoConsent: true,
});

export default function Register() {
  const navigate = useNavigate();
  const { event } = useEvent();
  const [attendees, setAttendees] = useState([emptyAttendee()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Load Turnstile script and render widget
  useEffect(() => {
    if (!event.turnstile_site_key) return;

    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: event.turnstile_site_key,
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(null),
        'error-callback': () => setTurnstileToken(null),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (existing) {
        existing.addEventListener('load', renderWidget);
      } else {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
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

  const updateAttendee = (index, data) => {
    setAttendees((prev) => prev.map((a, i) => (i === index ? data : a)));
    // Clear errors for this attendee
    setErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const addGuest = () => {
    if (attendees.length >= 2) return;
    setAttendees((prev) => [...prev, emptyAttendee()]);
  };

  const removeGuest = (index) => {
    setAttendees((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        const k = parseInt(key);
        if (k < index) next[k] = prev[k];
        else if (k > index) next[k - 1] = prev[k];
      });
      return next;
    });
  };

  const validate = () => {
    const newErrors = {};
    const emails = new Set();

    attendees.forEach((a, i) => {
      const fieldErrors = {};
      if (!a.firstName.trim()) fieldErrors.firstName = 'First name is required';
      if (!a.lastName.trim()) fieldErrors.lastName = 'Last name is required';
      if (!a.email.trim()) {
        fieldErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) {
        fieldErrors.email = 'Please enter a valid email';
      } else if (emails.has(a.email.toLowerCase())) {
        fieldErrors.email = 'This email is already used above';
      }

      if (a.email) emails.add(a.email.toLowerCase());
      if (Object.keys(fieldErrors).length) newErrors[i] = fieldErrors;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: honeypot, // honeypot — bots fill this, humans don't
          turnstileToken,
          attendees: attendees.map((a) => ({
            firstName: a.firstName.trim(),
            lastName: a.lastName.trim(),
            email: a.email.trim().toLowerCase(),
            phone: a.phone.trim(),
            giverArmy: a.giverArmy || false,
            giverArmyTenure: a.giverArmy ? a.giverArmyTenure : null,
            photoConsent: a.photoConsent !== false,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.duplicateEmails) {
          const dupErrors = {};
          attendees.forEach((a, i) => {
            if (data.duplicateEmails.includes(a.email.toLowerCase())) {
              dupErrors[i] = { email: 'This email is already registered' };
            }
          });
          setErrors(dupErrors);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gray-900 hover:text-gala-deep transition-colors">
            {EVENT.name}
          </Link>
          <span className="text-sm text-gray-400">{EVENT.date}</span>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Reserve Your Spot
          </h1>
          <p className="text-gray-500">
            Register yourself and any guests you&rsquo;d like to bring.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {attendees.map((attendee, index) => (
            <AttendeeForm
              key={index}
              index={index}
              attendee={attendee}
              onChange={updateAttendee}
              onRemove={removeGuest}
              errors={errors[index]}
              isPrimary={index === 0}
            />
          ))}

          {/* Add Guest */}
          {attendees.length < 2 && (
            <button
              type="button"
              onClick={addGuest}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500
                         hover:border-gala-mint hover:text-gala-deep hover:bg-gala-mint/10
                         transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add a Guest
            </button>
          )}

          {/* Honeypot - invisible to humans, filled by bots */}
          <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
            <label>
              Website (leave this empty)
              <input
                type="text"
                name="website"
                tabIndex="-1"
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>

          {/* Turnstile widget */}
          {event.turnstile_site_key && (
            <div className="flex justify-center">
              <div ref={turnstileRef} />
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm animate-fade-in">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || (event.turnstile_site_key && !turnstileToken)}
            className="btn-primary w-full py-4 text-lg rounded-2xl"
          >
            {submitting ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Registering...
              </span>
            ) : (
              `Complete Registration${attendees.length > 1 ? ` (${attendees.length} attendees)` : ''}`
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          By registering, you agree to receive event-related communications.
        </p>
      </main>
    </div>
  );
}
