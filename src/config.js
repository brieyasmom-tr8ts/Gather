export const EVENT = {
  name: 'GiveSendGo Gala',
  year: '2026',
  tagline: 'An Evening of Celebration & Generosity',
  date: 'Saturday, June 6, 2026',
  time: '6:00 PM - 11:00 PM',
  location: 'The Grand Ballroom',
  address: 'Nashville, TN',
  description:
    'Join us for an unforgettable evening celebrating the power of generosity. Enjoy fine dining, inspiring stories, live entertainment, and the company of those who believe in giving.',

  // For calendar links
  calendarStart: '20260606T180000',
  calendarEnd: '20260606T230000',
  calendarLocation: 'The Grand Ballroom, Nashville, TN',
};

export const GIVER_ARMY_TENURE_OPTIONS = [
  { value: 'new', label: 'New this year' },
  { value: '1year', label: 'About 1 year' },
  { value: '2-3years', label: '2\u20133 years' },
  { value: '4-5years', label: '4\u20135 years' },
  { value: '5plus', label: '5+ years' },
];

export function getGoogleCalendarUrl() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${EVENT.name} ${EVENT.year}`,
    dates: `${EVENT.calendarStart}/${EVENT.calendarEnd}`,
    location: EVENT.calendarLocation,
    details: EVENT.description,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function getIcsContent() {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GiveSendGo//Gala//EN',
    'BEGIN:VEVENT',
    `UID:givesendgo-gala-${EVENT.year}@givesendgo.com`,
    `DTSTART:${EVENT.calendarStart}`,
    `DTEND:${EVENT.calendarEnd}`,
    `SUMMARY:${EVENT.name} ${EVENT.year}`,
    `LOCATION:${EVENT.calendarLocation}`,
    `DESCRIPTION:${EVENT.description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
