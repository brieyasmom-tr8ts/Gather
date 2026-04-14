import { useEffect, useState } from 'react';

/**
 * Reactive countdown hook.
 * Accepts an ISO-like string (e.g. "2026-10-18T18:00:00") interpreted in
 * the visitor's local time zone — which is the expected UX for a countdown:
 * "days until the gala" from wherever the user is.
 */
export function useCountdown(isoTarget) {
  const [remaining, setRemaining] = useState(() => compute(isoTarget));
  useEffect(() => {
    if (!isoTarget) return;
    setRemaining(compute(isoTarget));
    const id = setInterval(() => setRemaining(compute(isoTarget)), 60 * 1000);
    return () => clearInterval(id);
  }, [isoTarget]);
  return remaining;
}

function compute(iso) {
  if (!iso) return { past: true, days: 0, hours: 0, minutes: 0, label: '' };
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return { past: true, days: 0, hours: 0, minutes: 0, label: '' };
  const ms = target - Date.now();
  if (ms <= 0) return { past: true, days: 0, hours: 0, minutes: 0, label: 'The gala is here' };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  let label;
  if (days >= 2) label = `${days} days until the gala`;
  else if (days === 1) label = `1 day until the gala`;
  else if (hours >= 1) label = `${hours} hour${hours === 1 ? '' : 's'} until the gala`;
  else label = `${minutes} min until the gala`;
  return { past: false, days, hours, minutes, label };
}
