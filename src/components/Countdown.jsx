// Simple, elegant countdown pill driven by the useCountdown hook.

export default function Countdown({ label }) {
  if (!label) return null;
  return (
    <div className="inline-flex items-center gap-2 bg-white text-gala-dark px-5 py-2 rounded-full text-sm font-semibold shadow-lg shadow-black/10">
      <svg className="w-4 h-4 text-gala-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
      </svg>
      {label}
    </div>
  );
}
