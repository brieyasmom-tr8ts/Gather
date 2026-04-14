import { GIVER_ARMY_TENURE_OPTIONS } from '../config';
import { useEvent } from '../hooks/useEvent';

export default function GiverArmyField({ giverArmy, giverArmyTenure, onChange }) {
  const { event } = useEvent();

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

      {/* Tenure - shown if Yes */}
      <div className={`overflow-hidden transition-all duration-400 ease-out ${
        giverArmy ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
      }`}>
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

      {/* Signup prompt - shown if Not yet */}
      <div className={`overflow-hidden transition-all duration-400 ease-out ${
        giverArmy === false ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="pt-2">
          <div className="bg-gradient-to-br from-gala-deep to-gala-dark rounded-2xl p-6 text-center">
            <p className="text-gala-mint text-xs uppercase tracking-widest font-bold mb-2">
              Join the movement
            </p>
            <h4 className="text-white text-xl font-bold mb-2">Become a Giver today</h4>
            <p className="text-white/80 text-sm mb-4">
              Hear from Nathan about what the Giver Army is all about.
            </p>

            {event.giver_army_video_url ? (
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                <iframe
                  src={event.giver_army_video_url}
                  title="Giver Army"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gala-mint mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p className="text-white/50 text-xs">Video coming soon</p>
                </div>
              </div>
            )}

            <a
              href={event.giver_army_signup_url || 'https://www.giverarmy.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gala-mint text-gala-deep font-bold px-6 py-3 rounded-full hover:bg-white transition-colors"
            >
              Sign Up for the Giver Army &rarr;
            </a>
            <p className="text-white/50 text-xs mt-3">(Opens in a new tab)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
