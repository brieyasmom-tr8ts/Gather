# Giver Army Membership Verification API — Spec

## Overview

The Gather Gala registration site needs to verify whether a registrant is an active Giver Army member. This requires a simple, read-only API endpoint on the GiveSendGo side that the Gala app can call during registration.

**Goal:** Replace the current honor-system ("Are you part of the Giver Army? Yes/No") with a real-time lookup so only verified members receive VIP Cocktail Hour access.

---

## What We Need

**One endpoint.** That's it.

### `GET /api/giver-army/verify`

**Query parameters:**

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `email`   | string | Yes      | The email address to look up       |

**Response (200 OK):**

```json
{
  "active": true,
  "member_since": "2023-04-15",
  "tenure": "2-3years"
}
```

If the email is **not found** or the member is **inactive**:

```json
{
  "active": false
}
```

### Field details

| Field          | Type    | Description                                                                 |
|----------------|---------|-----------------------------------------------------------------------------|
| `active`       | boolean | `true` if the email belongs to a current, active Giver Army member          |
| `member_since` | string  | (optional) ISO date when they joined — nice to have, not required           |
| `tenure`       | string  | (optional) One of: `new`, `1year`, `2-3years`, `4-5years`, `5plus`. If you can calculate this from `member_since`, great. If not, we can derive it on our end. |

---

## Authentication

The endpoint must be protected so only the Gala app can call it.

**Recommended: API key via header**

```
GET /api/giver-army/verify?email=someone@example.com
Authorization: Bearer <API_KEY>
```

- Generate a random API key (32+ characters)
- Share it with us securely — we'll store it as a Cloudflare Pages secret (`GIVER_ARMY_API_KEY`)
- Reject any request without a valid key with `401 Unauthorized`

---

## Error Responses

| Status | When                          | Body                                      |
|--------|-------------------------------|--------------------------------------------|
| 200    | Email found or not found      | `{ "active": true/false, ... }`            |
| 400    | Missing or invalid email      | `{ "error": "Email parameter is required" }` |
| 401    | Missing or invalid API key    | `{ "error": "Unauthorized" }`              |
| 500    | Internal server error         | `{ "error": "Internal server error" }`     |

**Note:** A valid email that is not a member should return `200` with `"active": false`, not a 404. This keeps the integration simple — the Gala app only needs to check the `active` field.

---

## How We'll Use It

Here's the flow on the Gala registration side:

1. User enters their email address
2. User clicks "Yes" on "Are you part of the Giver Army?"
3. Gala app calls `GET /api/giver-army/verify?email=<their email>`
4. **If `active: true`:**
   - Show a "Verified Giver Army Member" badge
   - Auto-populate tenure if provided
   - Show the VIP Cocktail Hour opt-in checkbox
5. **If `active: false`:**
   - Show a message: "We couldn't find this email in the Giver Army. Please make sure you're using the same email you signed up with."
   - Provide a link to join at giverarmy.com
   - No VIP access

---

## Technical Notes

- **Rate limiting:** We don't expect high volume (a few hundred registrations total), but basic rate limiting is fine if you want it.
- **CORS:** The call will be made server-side from Cloudflare Workers, so CORS headers are **not** needed.
- **Caching:** No caching needed on your end. We won't cache results either since membership status could change.
- **HTTPS:** Required.
- **Response time:** Under 500ms ideally, but not critical — we'll show a brief loading state.

---

## Implementation Estimate

This is a lightweight endpoint:
- One route
- One database query (`SELECT active, created_at FROM giver_army_members WHERE email = ?`)
- One API key check
- ~20-30 lines of code depending on your framework

---

## What We Need From You

1. The API endpoint URL once it's live (staging first is fine)
2. An API key for authentication
3. Confirmation of the response format (the above is a suggestion — we can adapt to whatever you return)

Questions? Reach out to Heather.
