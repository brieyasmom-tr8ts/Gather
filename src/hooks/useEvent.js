import { useEffect, useState } from 'react';
import { EVENT as FALLBACK } from '../config';

// Fallback values aligned with new API shape
const DEFAULTS = {
  name: FALLBACK.name,
  year: FALLBACK.year,
  tagline: FALLBACK.tagline,
  event_date: FALLBACK.date,
  event_time: FALLBACK.time,
  location: FALLBACK.location,
  address: FALLBACK.address,
  description: FALLBACK.description,
  dress_code: 'Black Tie Optional',
  faq_parking: 'Complimentary valet parking is available at the venue entrance.',
  faq_what_to_expect: 'A beautiful evening with dinner, live entertainment, inspiring stories, and celebration.',
  calendar_start: FALLBACK.calendarStart,
  calendar_end: FALLBACK.calendarEnd,
  iso_start: '2026-06-06T18:00:00',
  max_attendees: 0,
  giver_army_signup_url: 'https://www.giverarmy.com',
  giver_army_video_url: '',
  registered: 0,
  available: null,
  is_full: false,
};

export function useEvent() {
  const [event, setEvent] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/event')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setEvent({ ...DEFAULTS, ...data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { event, loading };
}

export function buildGoogleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.name} ${event.year}`,
    dates: `${event.calendar_start}/${event.calendar_end}`,
    location: `${event.location}, ${event.address}`,
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
    `UID:${event.name.toLowerCase().replace(/\s+/g, '-')}-${event.year}@giverarmy.com`,
    `DTSTART:${event.calendar_start}`,
    `DTEND:${event.calendar_end}`,
    `SUMMARY:${event.name} ${event.year}`,
    `LOCATION:${event.location}, ${event.address}`,
    `DESCRIPTION:${event.description || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
