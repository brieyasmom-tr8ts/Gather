# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Is This?

Gather is a GiveSendGo Gala event registration web app. Attendees register (multi-guest), receive QR code tickets via email, and check in at the event. Admins manage attendees, send bulk emails, and scan QR codes.

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS, deployed to Cloudflare Pages
- **Backend**: Cloudflare Pages Functions (Workers runtime) — file-based routing in `functions/`
- **Database**: Cloudflare D1 (SQLite), binding `DB`, database name `gala-db`
- **Email**: Brevo API (`api.brevo.com/v3/smtp/email`) — NOT Resend despite README mention
- **Bot protection**: Cloudflare Turnstile + honeypot field
- **Auth**: Custom HMAC-SHA256 tokens via `crypto.subtle`, stored in HttpOnly cookie `gala_admin_session` (24h TTL)
- **QR codes**: `qrcode` npm package (SVG), `html5-qrcode` for scanner

### API routing

Pages Functions use file-based routing (`functions/api/`). Admin endpoints are protected by `functions/api/admin/_middleware.js` which verifies the auth cookie. Non-admin endpoints (`register.js`, `event.js`, `registration/`, `ticket/`) are public.

### Event configuration

Event details (name, date, location, etc.) live in the `event_settings` D1 table (singleton row, `id=1`). The frontend fetches these via `/api/event` using the `useEvent()` hook, with hardcoded fallbacks in `src/config.js`. Both the frontend config and email templates have fallback defaults — keep them in sync.

### Database schema

Two main tables: `registrations` (groups) and `attendees` (individual tickets). `event_settings` is a singleton config table. See `schema.sql` for full schema. Key fields on attendees: `ticket_id` (unique UUID), `is_waitlist`, `checked_in`, `cancelled`, `giver_army` + `giver_army_tenure`.

## Commands

```bash
# Local development (runs at http://localhost:8788)
npm run dev

# Build frontend
npm run build

# Deploy (build + push to Cloudflare Pages)
npm run deploy

# Database
npm run db:init              # init D1 locally
npm run db:init:remote       # init D1 in production
npx wrangler d1 execute gala-db --remote --command "SQL HERE"

# Frontend deploy via git (auto-deploys on push)
git add -A && git commit -m "message" && git push origin main
```

## Key Patterns

- Registration accepts 1–10 attendees per group, each gets a unique `ticket_id` (UUID)
- Ticket display ID is first 8 chars of UUID, uppercased
- Soft-delete for cancellation (`cancelled` flag, not row deletion)
- Admin migrations run in-browser via `/api/admin/migrate` endpoint
- Tailwind custom colors: `primary-*` (blue) and `gala-*` (`dark`, `deep`, `mint`, `light`)

## Environment Variables

Set in Cloudflare Pages dashboard: `ADMIN_PASSWORD`, `AUTH_SECRET`, `RESEND_API_KEY` (actually Brevo key), `EMAIL_FROM`, `BASE_URL`, `MAX_ATTENDEES`, `TURNSTILE_SECRET_KEY` (optional), `TURNSTILE_SITE_KEY` (optional).
