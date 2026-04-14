// Fallback values shown while the /api/event fetch is in flight.
// Actual event content is authored in the admin UI and stored in D1.

export const FALLBACK_EVENT = {
  name: 'GiveSendGo Gala',
  year: '2026',
  tagline: 'An Evening of Celebration & Generosity',
  description: 'Join us for an unforgettable evening celebrating the power of generosity.',
  long_date: 'Saturday, October 18, 2026',
  short_date: 'Oct 18, 2026',
  weekday: 'Saturday',
  time_range: '6:00 PM – 9:30 PM',
  start_time: '18:00',
  end_time: '21:30',
  start_time_human: '6:00 PM',
  end_time_human: '9:30 PM',
  gala_date: '2026-10-18',
  time_zone: 'America/Chicago',
  iso_start: '2026-10-18T18:00:00',
  iso_end: '2026-10-18T21:30:00',
  calendar_start: '20261018T180000',
  calendar_end: '20261018T213000',
  countdown_target: '2026-10-18T18:00:00',
  venue_name: 'The Grand Ballroom',
  venue_address: '',
  venue_city: 'Nashville',
  venue_state: 'TN',
  dress_code: 'Black Tie Optional',
  parking_info: '',
  arrival_info: '',
  giver_army_video_url: '',
  giver_army_signup_url: 'https://www.giverarmy.com',
  photos_url: '',
  next_event_url: '',
  hero_image_url: '',
  turnstile_site_key: '',
  faq: [],
  max_capacity: 0,
  registered: 0,
  waitlist_count: 0,
  available: null,
  is_full: false,
  edit_cutoff_hours: 24,
};

export const GIVER_ARMY_TENURE_OPTIONS = [
  { value: 'new',       label: 'New this year' },
  { value: '1year',     label: 'About 1 year' },
  { value: '2-3years',  label: '2\u20133 years' },
  { value: '4-5years',  label: '4\u20135 years' },
  { value: '5plus',     label: '5+ years' },
];

export const TENURE_LABEL = Object.fromEntries(
  GIVER_ARMY_TENURE_OPTIONS.map((o) => [o.value, o.label])
);
