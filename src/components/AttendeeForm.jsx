import GiverArmyField from './GiverArmyField';

export default function AttendeeForm({ index, attendee, onChange, onRemove, errors, isPrimary }) {
  const handleChange = (field, value) => {
    onChange(index, { ...attendee, [field]: value });
  };

  const handleGiverArmyChange = (updates) => {
    onChange(index, { ...attendee, ...updates });
  };

  return (
    <div className="animate-scale-in">
      <div className="card p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isPrimary
                ? 'bg-gala-deep text-white'
                : 'bg-gala-mint text-gala-deep'
            }`}>
              {index + 1}
            </div>
            <h3 className="font-semibold text-gray-900">
              Guest {index + 1}
            </h3>
          </div>
          {!isPrimary && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="Remove guest"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor={`first-${index}`}>First Name</label>
              <input
                id={`first-${index}`}
                type="text"
                value={attendee.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="First name"
                className={`input-field ${errors?.firstName ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                autoComplete="given-name"
              />
              {errors?.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor={`last-${index}`}>Last Name</label>
              <input
                id={`last-${index}`}
                type="text"
                value={attendee.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Last name"
                className={`input-field ${errors?.lastName ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                autoComplete="family-name"
              />
              {errors?.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor={`email-${index}`}>Email</label>
              <input
                id={`email-${index}`}
                type="email"
                value={attendee.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
                className={`input-field ${errors?.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                autoComplete="email"
              />
              {errors?.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor={`phone-${index}`}>Phone Number</label>
              <input
                id={`phone-${index}`}
                type="tel"
                value={attendee.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className={`input-field ${errors?.phone ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                autoComplete="tel"
              />
              {errors?.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <GiverArmyField
            giverArmy={attendee.giverArmy}
            giverArmyTenure={attendee.giverArmyTenure}
            onChange={handleGiverArmyChange}
          />

          {/* Dietary & Accessibility Needs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor={`dietary-${index}`}>Dietary Needs</label>
              <input
                id={`dietary-${index}`}
                type="text"
                value={attendee.dietaryNeeds}
                onChange={(e) => handleChange('dietaryNeeds', e.target.value)}
                placeholder="e.g. Vegetarian, gluten-free, nut allergy"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank if none</p>
            </div>
            <div>
              <label className="label" htmlFor={`accessibility-${index}`}>Accessibility Needs</label>
              <input
                id={`accessibility-${index}`}
                type="text"
                value={attendee.accessibilityNeeds}
                onChange={(e) => handleChange('accessibilityNeeds', e.target.value)}
                placeholder="e.g. Wheelchair access, hearing loop"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank if none</p>
            </div>
          </div>

          {/* Photo Consent */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attendee.photoConsent}
                onChange={(e) => handleChange('photoConsent', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-gala-deep focus:ring-gala-mint"
              />
              <span className="text-sm text-gray-600">
                I consent to being photographed/recorded during the event. Photos and videos may be used for promotional purposes.
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
