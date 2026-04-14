import { useEffect, useState } from 'react';
import { FALLBACK_EVENT } from '../config';

export function useEvent() {
  const [event, setEvent] = useState(FALLBACK_EVENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/event')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setEvent({ ...FALLBACK_EVENT, ...data });
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return { event, loading, reload: () => setEvent((e) => ({ ...e })) };
}

/** Build calendar links that match the event's stored dates. */
export function buildGoogleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.name}${event.year ? ' ' + event.year : ''}`,
    dates: `${event.calendar_start}/${event.calendar_end}`,
    location: [event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
      .filter(Boolean).join(', '),
    details: event.description || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function buildIcsContent(event) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GiveSendGo//Gala//EN',
    'BEGIN:VEVENT',
    `UID:${(event.name || 'event').toLowerCase().replace(/\s+/g, '-')}-${event.year || ''}@givesendgo.com`,
    `DTSTART:${event.calendar_start}`,
    `DTEND:${event.calendar_end}`,
    `SUMMARY:${event.name}${event.year ? ' ' + event.year : ''}`,
    `LOCATION:${[event.venue_name, [event.venue_city, event.venue_state].filter(Boolean).join(', ')]
      .filter(Boolean).join(', ')}`,
    `DESCRIPTION:${event.description || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(event, filename) {
  const blob = new Blob([buildIcsContent(event)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${(event.name || 'event').toLowerCase().replace(/\s+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
