import { GIVER_ARMY_TENURE_OPTIONS } from '../config';

export default function AttendeeForm({ index, attendee, onChange, onRemove, errors, isPrimary, event }) {
  const handle = (field, value) => onChange(index, { ...attendee, [field]: value });
  const label = isPrimary ? 'You' : 'Your guest';

  return (
    <div className="card p-6 md:p-7 animate-scale-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isPrimary ? 'bg-gala-deep text-white' : 'bg-gala-mint text-gala-dark'}`}>
            {index + 1}
          </div>
          <h3 className="font-semibold text-gala-dark">{label}</h3>
        </div>
        {!isPrimary && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-red-500 transition p-1"
            aria-label="Remove guest"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id={`first-${index}`} label="First Name"
          value={attendee.firstName}
          onChange={(v) => handle('firstName', v)}
          error={errors?.firstName}
          autoComplete="given-name"
        />
        <Field
          id={`last-${index}`} label="Last Name"
          value={attendee.lastName}
          onChange={(v) => handle('lastName', v)}
          error={errors?.lastName}
          autoComplete="family-name"
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Field
          id={`email-${index}`} label="Email" type="email"
          value={attendee.email}
          onChange={(v) => handle('email', v)}
          error={errors?.email}
          autoComplete="email"
        />
        <Field
          id={`phone-${index}`} label="Phone (optional)" type="tel"
          value={attendee.phone}
          placeholder="For SMS reminders"
          onChange={(v) => handle('phone', v)}
          error={errors?.phone}
          autoComplete="tel"
        />
      </div>

      {/* Giver Army */}
      <div className="mt-6">
        <label className="label">Are you part of the Giver Army?</label>
        <div className="flex gap-3">
          <TogglePill active={attendee.giverArmy === true} onClick={() => handle('giverArmy', true)}>Yes</TogglePill>
          <TogglePill active={attendee.giverArmy === false} onClick={() => onChange(index, { ...attendee, giverArmy: false, giverArmyTenure: '' })}>No</TogglePill>
        </div>

        {attendee.giverArmy === true && (
          <div className="mt-4 animate-fade-in">
            <label className="label">How long have you been part of the Giver Army journey?</label>
            <div className="flex flex-wrap gap-2">
              {GIVER_ARMY_TENURE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handle('giverArmyTenure', o.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    attendee.giverArmyTenure === o.value
                      ? 'bg-gala-deep text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {attendee.giverArmy === false && (
          <GiverArmyCTA event={event} />
        )}
      </div>

      {/* Media consent */}
      <div className="mt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={attendee.mediaConsent || false}
            onChange={(e) => handle('mediaConsent', e.target.checked)}
            className="mt-1 w-5 h-5 accent-gala-deep rounded"
          />
          <span className="text-sm text-gray-700">
            I consent to photo/video at the event for use by GiveSendGo in event recaps and promotional materials.
            <span className={`ml-1 text-xs ${errors?.mediaConsent ? 'text-red-500' : 'text-gray-400'}`}>
              (required)
            </span>
          </span>
        </label>
        {errors?.mediaConsent && (
          <p className="text-red-500 text-xs mt-1">{errors.mediaConsent}</p>
        )}
      </div>
    </div>
  );
}

function Field({ id, label, type = 'text', value, onChange, error, autoComplete, placeholder }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function TogglePill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
        active ? 'bg-gala-deep text-white shadow shadow-gala-deep/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function GiverArmyCTA({ event }) {
  if (!event?.giver_army_video_url && !event?.giver_army_signup_url) return null;
  return (
    <div className="mt-5 p-5 bg-gala-mint/10 border border-gala-mint/40 rounded-2xl animate-fade-in">
      <h4 className="font-bold text-gala-dark mb-1">Want to be part of the Giver Army?</h4>
      <p className="text-sm text-gray-600 mb-4">
        The Giver Army is a community of passionate people who believe in the power of generosity. Learn more below.
      </p>
      {event.giver_army_video_url && (
        <div className="aspect-video mb-4 rounded-xl overflow-hidden bg-black/90">
          <iframe
            src={event.giver_army_video_url}
            title="Giver Army"
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {event.giver_army_signup_url && (
        <a
          href={event.giver_army_signup_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-gala-deep text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-gala-dark transition"
        >
          Join Now
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      )}
    </div>
  );
}
