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
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <h3 className="font-semibold text-gray-900">
              {isPrimary ? 'Your Information' : `Guest ${index}`}
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

          <GiverArmyField
            giverArmy={attendee.giverArmy}
            giverArmyTenure={attendee.giverArmyTenure}
            onChange={handleGiverArmyChange}
          />
        </div>
      </div>
    </div>
  );
}
