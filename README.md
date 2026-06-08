# GiveSendGo Gala — Event Registration

Production-ready event registration for the GiveSendGo Gala (and reusable for
future GiveSendGo events). Built on **Cloudflare Pages + Pages Functions + D1**.

## Features

- Premium public site: hero, countdown, event details, FAQ, arrival info
- Registration flow: primary + up to **one** guest, inline validation, pre-submit review
- Automatic **waitlist** mode when capacity is reached
- **Giver Army** opt-in with tenure + conditional video CTA for non-members
- Media consent + optional phone number for SMS
- Secure, token-based **edit registration** link
- Token-based admin with tabbed dashboard:
  - Overview (capacity, confirmed, remaining, waitlist, check-in progress, analytics)
  - Attendee management (search, filters, edit, cancel, resend, move from waitlist)
  - Email center (editable templates, preview, test send, bulk send by audience)
  - Event settings (single source of truth — date/time/venue/FAQ/links/capacity)
- **QR scanner** + manual search check-in with live "X / Y checked in" count
- Printable **badges PDF** (browser "Save as PDF")
- CSV export respecting filters

## File structure

```
.
├── index.html
├── package.json
├── wrangler.toml
├── schema.sql                  ← full current schema (D1)
├── migrations/
│   └── 0001_v2_upgrade.sql     ← upgrade an older DB to v2
├── functions/                  ← Cloudflare Pages Functions (Workers)
│   ├── lib/
│   │   ├── auth.js             ← HMAC admin session cookie
│   │   ├── email.js            ← Resend + {{var}} template rendering
│   │   └── event.js            ← single source of truth for event data
│   └── api/
│       ├── event.js            ← GET /api/event (public event data)
│       ├── register.js         ← POST /api/register
│       ├── registration/[groupId].js
│       ├── edit/[token].js     ← public edit flow
│       ├── ticket/[ticketId]/{index,qr}.js
│       └── admin/
│           ├── _middleware.js  ← cookie auth
│           ├── login.js  logout.js
│           ├── stats.js  settings.js  templates.js
│           ├── attendees.js  export.js  badges.js  bulk-email.js
│           ├── resend-email.js  check-in.js
│           ├── attendee/[id].js      ← update / cancel / move-from-waitlist
│           └── template/[slug].js    ← save / preview / test-send
└── src/                        ← React app (Vite)
    ├── App.jsx  main.jsx  config.js  index.css
    ├── hooks/
    │   ├── useEvent.js         ← /api/event fetch + calendar helpers
    │   └── useCountdown.js
    ├── components/
    │   ├── AttendeeForm.jsx  FAQ.jsx  Countdown.jsx  SiteFooter.jsx
    │   └── admin/
    │       ├── OverviewTab.jsx  AttendeesTab.jsx
    │       ├── EmailTab.jsx     SettingsTab.jsx
    └── pages/
        ├── Home.jsx   Register.jsx  Confirmation.jsx  Edit.jsx
        ├── FAQPage.jsx Ticket.jsx   Scanner.jsx
        ├── AdminLogin.jsx  Admin.jsx
```

## Database schema (current)

Tables (see `schema.sql` for full SQL):

- `event_settings(key, value)` — key/value table; drives everything on the
  public site. Includes `gala_date`, `start_time`, `end_time`, `time_zone`,
  venue, dress code, parking info, capacity, FAQ JSON, etc.
- `registrations(id, group_id, edit_token, total_attendees, is_waitlist, created_at)`
- `attendees(id, ticket_id, registration_group_id, first_name, last_name, email,
  phone, is_giver_army, giver_army_tenure, media_consent, is_waitlist,
  waitlist_timestamp, cancelled, cancelled_at, checked_in, checked_in_at,
  created_at, updated_at)`
- `email_templates(slug, name, subject, body, updated_at)`

`attendees.email` has a column-level UNIQUE constraint, so an email can only
be registered once per event. Two admin actions:

- **Cancel** — keeps the row, marks `cancelled = 1`. Email stays locked
  (cannot be re-registered). Useful for audit trails.
- **Delete** — hard-removes the attendee row, freeing up the email for a
  fresh registration.

### Derived datetime values

Admins never enter ISO strings. The server derives from
`gala_date + start_time + end_time + time_zone`:

- `iso_start`, `iso_end`
- `calendar_start`, `calendar_end` (for Google/Apple calendar)
- `countdown_target` (drives the homepage countdown)

## Required environment variables

Set these as Cloudflare Pages environment variables **and** in `.dev.vars` for
local development. Only event content lives in D1; secrets stay in env.

| Variable          | Purpose                                                        |
|-------------------|----------------------------------------------------------------|
| `ADMIN_PASSWORD`  | Password for the admin dashboard login                         |
| `AUTH_SECRET`     | Random string used to sign the admin session cookie (32+ char) |
| `RESEND_API_KEY`  | API key for [Resend](https://resend.com) (email delivery)       |
| `EMAIL_FROM`      | Verified sender address, e.g. `Gala <gala@yourdomain.com>`     |
| `BASE_URL`        | Public URL, used in email links (e.g. `https://gala.example.com`) |

See `.dev.vars.example` for a template.

## Local development

```bash
# 1. Install deps
npm install

# 2. Create D1 database (first time)
wrangler d1 create gala-db
# → copy the returned database_id into wrangler.toml

# 3. Create schema
npm run db:init

# 4. Create .dev.vars from the example and fill in values
cp .dev.vars.example .dev.vars

# 5. Dev server (Pages Functions + Vite together)
npm run dev
```

Visit http://localhost:8788 (Wrangler prints the exact port).

- Public: `/`, `/register`, `/faq`, `/confirmation/:id`, `/edit/:token`
- Admin:  `/admin/login`, `/admin`, `/admin/scanner`

To test check-in, open `/admin/scanner` and either scan a QR from the
confirmation page or use the manual search tab.

## Deploying to Cloudflare

1. **Create the D1 database**
   ```bash
   wrangler d1 create gala-db
   ```
   Put the returned `database_id` into `wrangler.toml`.

2. **Apply the schema** to the remote DB:
   ```bash
   npm run db:init:remote
   ```

3. **Set secrets** on Pages:
   ```bash
   wrangler pages secret put ADMIN_PASSWORD
   wrangler pages secret put AUTH_SECRET
   wrangler pages secret put RESEND_API_KEY
   wrangler pages secret put EMAIL_FROM
   wrangler pages secret put BASE_URL
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. Sign in at `/admin/login`, then update event details in the **Settings** tab.

## Upgrading from the previous schema

If the database predates v2 (no `is_waitlist`, `media_consent`, `edit_token`,
`email_templates`, or `event_settings`), run the migration first, then re-run
the full schema to seed missing tables and settings:

```bash
npm run db:migrate:remote
npm run db:init:remote
```

Both files are idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN`,
`INSERT OR IGNORE`).

## Reusing for other events

Everything public-facing is driven by `event_settings`. Change the settings in
the admin Settings tab to re-theme the app for a different event — no code
changes needed. To start fresh for a new event, clear `registrations` /
`attendees` rows (or create a second D1 database).

## Tech

- Cloudflare Pages (static hosting)
- Cloudflare Pages Functions (Workers runtime for /api/*)
- Cloudflare D1 (SQLite) for persistence
- React 18 + Vite + React Router + Tailwind CSS
- Resend for transactional email
- html5-qrcode for scanning
- qrcode for QR SVG generation
