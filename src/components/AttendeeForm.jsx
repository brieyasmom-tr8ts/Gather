import { GIVER_ARMY_TENURE_OPTIONS } from '../config';

export default function AttendeeForm({ index, attendee, onChange, onRemove, errors, isPrimary, event }) {
  const handle = (field, value) => onChange(index, { ...attendee, [field]: value });
  const label = isPrimary ? 'You' : 'Your guest';

  const handleEmailBlur = async () => {
    const email = attendee.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (attendee._verifiedEmail === email) return;
    onChange(index, { ...attendee, _verifyingArmy: true, _armyChecked: false });
    try {
      const res = await fetch(`/api/giver-army/verify?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        onChange(index, { ...attendee, _verifyingArmy: false, _armyChecked: true, _verifiedEmail: email, giverArmy: false, giverArmyVerified: false });
        return;
      }
      const data = await res.json();
      const isValidTenure = GIVER_ARMY_TENURE_OPTIONS.some((o) => o.value === data.tenure);
      onChange(index, {
        ...attendee,
        giverArmy: !!data.active,
        giverArmyTenure: data.active && isValidTenure ? data.tenure : '',
        giverArmyVerified: !!data.active,
        giverArmyMemberSince: data.memberSince || '',
        _verifiedEmail: email,
        _verifyingArmy: false,
        _armyChecked: true,
      });
    } catch {
      onChange(index, { ...attendee, _verifyingArmy: false, _armyChecked: true, _verifiedEmail: email, giverArmy: false, giverArmyVerified: false });
    }
  };

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
          onBlur={handleEmailBlur}
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

      {/* Giver Army — auto-verified via API on email blur */}
      <div className="mt-6">
        <label className="label">Giver Army Status</label>

        {/* Loading state */}
        {attendee._verifyingArmy && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl animate-pulse">
            <svg className="w-5 h-5 text-gala-deep animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm text-gray-600">Checking Giver Army membership...</span>
          </div>
        )}

        {/* Not yet checked — prompt to enter email */}
        {!attendee._verifyingArmy && !attendee._armyChecked && (
          <p className="text-sm text-gray-500 italic">Enter your email above to check your Giver Army membership.</p>
        )}

        {/* Verified member */}
        {!attendee._verifyingArmy && attendee._armyChecked && attendee.giverArmyVerified && (
          <div className="animate-fade-in">
            <div className="p-4 bg-gala-mint/15 border border-gala-mint/40 rounded-xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">🎖️</span>
                <h4 className="text-gala-dark font-bold text-sm">You're part of the Giver Army!</h4>
              </div>
              {attendee.giverArmyMemberSince && (
                <p className="text-sm text-gray-600 ml-10">Member since {attendee.giverArmyMemberSince}</p>
              )}
            </div>

            <div className="mt-4 p-4 bg-gala-mint/10 border border-gala-mint/40 rounded-xl">
              <p className="text-sm font-semibold text-gala-dark mb-2">
                🥂 You're invited to the VIP Cocktail Hour!
              </p>
              <p className="text-xs text-gray-600 mb-3">
                As a Giver Army member, you have exclusive access to a VIP cocktail hour from 6:00 – 6:45 PM before the main event begins.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendee.vipCocktail || false}
                  onChange={(e) => handle('vipCocktail', e.target.checked)}
                  className="w-5 h-5 accent-gala-deep rounded"
                />
                <span className="text-sm font-semibold text-gala-dark">
                  I'll be attending the VIP Cocktail Hour
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Not a member */}
        {!attendee._verifyingArmy && attendee._armyChecked && !attendee.giverArmyVerified && (
          <div className="animate-fade-in">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm text-gray-700 font-medium mb-3">
                We didn't find a Giver Army membership for this email.
              </p>

              {!attendee._reviewRequested ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={event?.giver_army_signup_url || 'https://www.giverarmy.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-gala-deep text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-gala-dark transition"
                  >
                    Sign Up Now
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    onClick={() => handle('_reviewRequested', true)}
                    className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-full text-sm hover:bg-gray-100 transition"
                  >
                    I think I'm a member — request a review
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    ✅ Review requested — our team will verify your membership and follow up.
                  </p>
                </div>
              )}
            </div>

            {!attendee._reviewRequested && event?.giver_army_video_url && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Learn about the Giver Army:</p>
                <div className="aspect-video rounded-xl overflow-hidden bg-black/90">
                  <iframe
                    src={event.giver_army_video_url}
                    title="Giver Army"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
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

function Field({ id, label, type = 'text', value, onChange, onBlur, error, autoComplete, placeholder }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`input-field ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

