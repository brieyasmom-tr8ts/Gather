# GiveSendGo Gala - Event Registration

A production-ready event registration web app built on Cloudflare's edge platform.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS (deployed to Cloudflare Pages)
- **Backend**: Cloudflare Pages Functions (Workers runtime)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Email**: Resend API
- **QR Codes**: `qrcode` npm package (SVG output)

## Features

- Public registration page with multi-guest support
- Unique QR code ticket per attendee
- Confirmation emails with QR code and calendar links
- Admin dashboard with stats, search, and CSV export
- Mobile QR scanner for event-day check-in
- Giver Army membership tracking with tenure

## Environment Variables

Copy `.dev.vars.example` to `.dev.vars` for local development:

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD` | Password for the admin dashboard |
| `AUTH_SECRET` | Random secret for signing auth tokens (min 32 chars) |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `EMAIL_FROM` | Sender email (must be verified in Resend) |
| `BASE_URL` | Public URL of the app (for email links) |
| `MAX_ATTENDEES` | Max capacity, 0 for unlimited |

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .dev.vars from example
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your values

# 3. Create the D1 database locally
npx wrangler d1 execute gala-db --local --file=schema.sql

# 4. Start dev server
npm run dev
```

The app runs at `http://localhost:8788` with hot reload.

## Deployment

### 1. Create the D1 database

```bash
npx wrangler d1 create gala-db
```

Copy the returned `database_id` into `wrangler.toml`.

### 2. Initialize the schema

```bash
npm run db:init:remote
```

### 3. Set environment variables

In the Cloudflare dashboard (Pages > Settings > Environment Variables), set:

- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `BASE_URL`
- `MAX_ATTENDEES`

### 4. Deploy

```bash
npm run deploy
```

## Project Structure

```
functions/          Cloudflare Pages Functions (API)
  api/
    admin/          Admin-only endpoints (auth middleware)
    registration/   Registration lookup
    ticket/         QR code generation, ticket lookup
    register.js     Registration endpoint
  lib/
    auth.js         Token creation/verification
    email.js        Email template + Resend integration
src/                React frontend
  components/       Reusable form components
  pages/            Route pages
  config.js         Event details (dates, location, etc.)
schema.sql          D1 database schema
```

## Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/register` | Registration form |
| `/confirmation/:groupId` | Ticket confirmation |
| `/ticket/:ticketId` | Individual ticket view |
| `/admin/login` | Admin login |
| `/admin` | Admin dashboard |
| `/admin/scanner` | QR code check-in scanner |

## Customization

Edit `src/config.js` to change event details (name, date, location, etc.).
The email template is in `functions/lib/email.js`.
Colors are defined in `tailwind.config.js`.
