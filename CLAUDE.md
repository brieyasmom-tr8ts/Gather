# Gather — GiveSendGo Giver Gala Registration

## Project overview
Event registration site for the GiveSendGo Giver Gala. React frontend + Cloudflare Pages Functions backend with D1 (SQLite) database.

## Tech stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Cloudflare Pages Functions (Workers runtime)
- **Database**: Cloudflare D1 (SQLite)
- **Email**: Resend API
- **QR**: html5-qrcode (scanning), qrcode (generation)

## Key directories
- `src/` — React app (pages, components, hooks)
- `functions/` — Cloudflare Pages Functions (`/api/*` routes)
- `functions/lib/` — Shared server utilities (auth, email, event config)
- `public/` — Static assets
- `schema.sql` — Full D1 schema
- `migrations/` — Incremental DB migrations

## Development
```bash
npm install
npm run db:init        # create local D1 tables
npm run dev            # wrangler pages dev + vite (localhost:8788)
```

## Environment variables
Secrets go in `.dev.vars` locally (see `.dev.vars.example`):
`ADMIN_PASSWORD`, `AUTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `BASE_URL`, `GIVER_ARMY_API_URL`, `GIVER_ARMY_API_KEY`

## Deploy
```bash
npm run deploy         # builds + deploys to Cloudflare Pages
```

## Design palette
- Dark navy: `#042B3E` (gala-dark)
- Deep blue: `#085078` (gala-deep)
- Mint: `#85D8CE` (gala-mint)
- Light mint: `#B8EAE4` (gala-light)
- Primary/red accent: `#E8553D`
- Font: Inter

## Architecture notes
- All public event content is driven by `event_settings` in D1 — editable from the admin Settings tab
- Admin auth uses HMAC-signed session cookies (`functions/lib/auth.js`)
- Registration enforces one email per event via a partial unique index
- Waitlist mode activates automatically when capacity is reached
