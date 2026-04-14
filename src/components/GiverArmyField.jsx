import { GIVER_ARMY_TENURE_OPTIONS } from '../config';

export default function GiverArmyField({ giverArmy, giverArmyTenure, onChange }) {
  return (
    <div className="space-y-4">
      {/* Giver Army Toggle */}
      <div>
        <label className="label">Are you part of the Giver Army?</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange({ giverArmy: true })}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              giverArmy
                ? 'bg-gala-deep text-white shadow-md shadow-gala-deep/25'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Yes!
          </button>
          <button
            type="button"
            onClick={() => onChange({ giverArmy: false, giverArmyTenure: '' })}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              giverArmy === false
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Not yet
          </button>
        </div>
      </div>

      {/* Tenure Selection - animated reveal */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-out ${
          giverArmy ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-2">
          <label className="label">
            How long have you been part of the Giver Army?
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GIVER_ARMY_TENURE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ giverArmyTenure: option.value })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  giverArmyTenure === option.value
                    ? 'bg-gala-deep text-white shadow-md shadow-gala-deep/25 scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {giverArmy && (
            <p className="text-xs text-gala-deep mt-2 font-medium animate-fade-in">
              Welcome to the family!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
