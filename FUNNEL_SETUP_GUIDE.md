# Funnel Setup Guide

This guide is for someone who clones this repository and wants to launch their own funnel with:

- Their own brand assets
- Their own MailerLite account
- Their own Meta Pixel + CAPI
- Their own Cal.com booking
- Their own Wistia video

It is written for operators and non-developers first, with developer notes where needed.

## 1. What This App Does

Flow:

1. Visitor lands on `/`.
2. Opt-in popup captures lead data and sends:
   - Browser `Lead` event via Pixel
   - Server `Lead` event via CAPI
   - Subscriber to MailerLite
3. Visitor watches training on `/training` (Wistia).
4. Visitor books on `/book` (Cal.com).
5. On `/congrats`, app sends `SubmitApplication` events and updates MailerLite group from `Lead` to `Application`.

## 2. Accounts You Need Before Setup

- Netlify (hosting + functions)
- Meta Business Manager / Events Manager
- MailerLite
- Cal.com
- Wistia

## 3. Netlify Environment Variables

Set these in Netlify:
`Site settings -> Build & deploy -> Environment`

### Required

- `META_PIXEL_ID`
  - Example: `907493832199906`
- `META_DATASET_ID`
  - Usually same as Pixel ID for this implementation
- `META_CAPI_ACCESS_TOKEN`
  - From Meta Events Manager (Conversions API)
- `MAILERLITE_API_KEY`

### Recommended

- `MAILERLITE_GROUP_ID`
  - Main group for new opt-ins
- `WISTIA_EMBED_CODE`
  - Full embed HTML/script if you want env-managed video
- `CAL_COM_BOOKING_SLUG`
  - Example: `your-org/strategy-session`
- `HOME_THUMBNAIL_URL`
  - Hero thumbnail image URL for `/`

### Optional

- `HEADER_HTML`
  - Extra scripts you want injected into `<head>`
- `CAPI_ENABLED`
  - Informational flag from config endpoint

After changing env vars, redeploy the site.

## 4. Meta Pixel + CAPI Setup

### 4.1 Pixel Base Code

Base Pixel is installed in:
- `index.html` (`PageView` on load)

If you use a different Pixel ID:
1. Update `index.html` Pixel ID.
2. Set `META_PIXEL_ID` in Netlify.
3. Set `META_DATASET_ID` in Netlify.

### 4.2 CAPI Credentials

Set in Netlify:

- `META_DATASET_ID`
- `META_CAPI_ACCESS_TOKEN`

CAPI function path:
- `netlify/functions/meta-capi.js`

### 4.3 Event Mapping

- `Lead`
  - Browser: fired on popup submit (`/`)
  - Server: fired immediately after, same `event_id` for dedup
- `SubmitApplication`
  - Browser: fired on `/congrats`
  - Server: fired on booking flow + congrats fallback

### 4.4 Testing

1. Enable Meta Test Event Code in app admin (`/admin` -> Events tab), or send without test code for production.
2. Open DevTools Network.
3. Submit opt-in:
   - Confirm `POST /.netlify/functions/meta-capi` with response containing:
     - `success: true`
     - `events_received: 1`
4. Complete booking and confirm same for `SubmitApplication`.

## 5. MailerLite Setup

### 5.1 Create Groups

Create these groups in MailerLite:

- `Lead`
- `Application`

The app uses:

- `subscribe` function to add leads
- `update-subscriber-tag` function to move `Lead -> Application`

### 5.2 Set API Key

Set in Netlify:
- `MAILERLITE_API_KEY`

Optional:
- `MAILERLITE_GROUP_ID` (main list/group for all leads)

### 5.3 Fields Sent

Lead submit sends:

- `email`
- `name` (full name)
- `phone`
- `designation`
- `utm_campaign`
- `utm_content`

## 6. Cal.com Setup

Set one of:

- `CAL_COM_BOOKING_SLUG` in Netlify, or
- Booking slug/embed in `/admin`

Booking page file:
- `src/pages/Book.tsx`

Behavior:

- Prefills name/email/phone from captured lead data
- On booking completion, triggers `SubmitApplication`
- Redirects to `/congrats`

Optional identifiers in admin:

- Text notification field identifier
- WhatsApp field identifier

## 7. Wistia Setup

Training page file:
- `src/pages/Training.tsx`

Behavior:

- Uses `config.wistiaEmbedCode` if provided
- Otherwise falls back to built-in default embed

You can manage Wistia via:

1. Netlify env var `WISTIA_EMBED_CODE`, or
2. `/admin` integrations tab

## 8. Brand Assets and Content

Common files to update:

- Homepage headline and copy:
  - `src/pages/Index.tsx`
- Training page copy:
  - `src/pages/Training.tsx`
- Confirmation page copy:
  - `src/pages/Congrats.tsx`
- Favicon and images:
  - `public/` assets and `index.html`
- Hero thumbnail:
  - `HOME_THUMBNAIL_URL` or admin field

## 9. What to Configure in Admin vs Netlify

### Netlify (server-side secrets and defaults)

- CAPI token
- MailerLite API key
- Default integration values

### Admin panel `/admin` (runtime overrides)

- Pixel ID display/config value
- CAPI test mode + test event code
- Wistia embed override
- Cal.com booking slug override
- Popup delay and UI controls

Important:
- Admin config stores in browser localStorage for that admin browser.
- Netlify env vars are the source of truth for secure credentials.

## 10. How Lead Quality Scoring is Optimized (Meta Event Match Quality)

This app improves quality by sending both browser and server signals with dedup.

Implemented optimizations:

1. Browser + server dual-channel tracking
   - Pixel (`fbq`) + CAPI
2. Dedup via shared `event_id`
   - Prevents double counting while preserving signal
3. Advanced matching fields
   - Email, phone, first name, last name
4. First-party identifiers
   - `_fbp` and `_fbc` captured and sent
5. Server-enriched request context
   - `client_ip_address` and `client_user_agent` in CAPI payload
6. Normalization + hashing for user PII
   - SHA-256 where required
7. UTM propagation
   - Campaign/content values attached to events

## 11. Go-Live Verification

1. `PageView` appears in Meta.
2. `Lead` appears from browser and CAPI:
   - Network shows `/.netlify/functions/meta-capi` success
3. `SubmitApplication` appears from browser and CAPI.
4. MailerLite receives subscriber and group updates:
   - `Lead` then `Application`
5. Wistia loads on `/training`.
6. Cal.com booking works on `/book`.

## 12. Common Failure Modes and Fixes

### Only browser events, no server events

- Check Netlify vars: `META_DATASET_ID`, `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`
- Check Network for `POST /.netlify/functions/meta-capi`
- Check function response JSON for errors

### `SubmitApplication` missing during fast redirects

- Confirm congrats fallback CAPI is deployed
- Use DevTools `Preserve log` during booking flow

### MailerLite not updating groups

- Confirm group names exist: `Lead`, `Application`
- Check function logs and API key validity

### Pixel blocked

- Disable tracking protection/ad blockers while testing
- Verify `fbevents.js` request is not blocked

## 13. Handoff Checklist (for a New Team)

- [ ] Netlify env vars set
- [ ] Meta Pixel ID replaced and verified
- [ ] CAPI token set and tested
- [ ] MailerLite API key + groups tested
- [ ] Wistia embed updated
- [ ] Cal.com slug updated
- [ ] Homepage/training/congrats copy updated
- [ ] Hero thumbnail/profile images updated
- [ ] Browser + server events verified in Meta

