# Meta Pixel + CAPI Runbook (Non-Technical)

This guide explains how to maintain Meta tracking in this app without touching code.

## What is already configured

- `Lead` event:
  - Browser Pixel fires when popup form is submitted on `/`
  - Server CAPI fires immediately after, with the same `event_id` (dedup)
- `SubmitApplication` event:
  - Server CAPI fires on `/book` when booking is completed (before navigation)
  - Browser Pixel fires on `/congrats` with the same `event_id` (dedup)

## Where this is implemented (for developers)

- Browser + CAPI Lead flow: `src/pages/Index.tsx`
- Booking CAPI flow before redirect: `src/pages/Book.tsx`
- Browser SubmitApplication pixel in head: `src/pages/Congrats.tsx`
- Shared tracking helpers: `src/lib/tracking.ts`
- Server CAPI endpoint: `netlify/functions/meta-capi.js`

## Required credentials and IDs

- Meta Dataset ID (or Pixel ID): `907493832199906`
- CAPI access token: keep in Netlify env var only

## Update order (important)

1. Rotate/get a valid CAPI token in Meta Events Manager.
2. Update Netlify environment variables.
3. Deploy site.
4. Enable test code in Admin (optional for testing).
5. Run Lead and SubmitApplication test flows.
6. Confirm in Meta Events Manager Test Events.
7. Disable test mode after validation.

## Step 1: Update Netlify environment variables

In Netlify -> Site settings -> Environment variables, set:

- `META_DATASET_ID=907493832199906`
- `META_CAPI_ACCESS_TOKEN=<YOUR_NEW_TOKEN>`

Optional fallback:

- `META_PIXEL_ID=907493832199906`

Notes:

- Never paste tokens into app code or Admin UI.
- After saving env vars, trigger a new deploy.

## Step 2: Optional Admin settings

In `/admin`:

- Tracking tab:
  - `Meta Pixel ID` should match `907493832199906`
- Events tab:
  - For testing, turn on test mode and set a `Test Event Code` for:
    - Lead
    - SubmitApplication

Click `Save Configuration`.

## Step 3: Verify Lead event (popup on `/`)

1. Open site in incognito.
2. Open DevTools -> Network.
3. Go to `/`.
4. Open and submit popup form.
5. Confirm:
   - Browser request to Facebook (pixel traffic).
   - `POST /.netlify/functions/meta-capi` returns `200` with `"success": true`.
6. In Meta Events Manager -> Test Events:
   - `Lead` appears within ~10-60 seconds.

## Step 4: Verify SubmitApplication event (`/book` -> `/congrats`)

1. Continue funnel to `/book`.
2. Complete booking in Cal.com widget.
3. Before/at redirect to `/congrats`, confirm in Network:
   - `POST /.netlify/functions/meta-capi` for `SubmitApplication` returns `200`.
4. On `/congrats`, browser pixel fires `SubmitApplication`.
5. In Meta Events Manager -> Test Events:
   - `SubmitApplication` appears.

## How deduplication works

- Each event uses one shared `event_id` for browser + server.
- Meta deduplicates duplicate copies of the same event automatically.

## How to update later (quick checklist)

1. Change only token/ID in Netlify env vars.
2. Redeploy.
3. Re-run the two tests above.
4. If events fail, check Netlify function logs for `meta-capi`.

## Troubleshooting

- `500` from `/.netlify/functions/meta-capi`:
  - Missing/invalid `META_CAPI_ACCESS_TOKEN` or dataset/pixel ID.
- Browser event appears but CAPI does not:
  - Check Netlify env vars + function logs.
- CAPI appears but browser does not:
  - Verify pixel base code is present in `index.html`.
- Events visible in browser but not in Meta:
  - Wait up to 60 seconds; then check test code and selected dataset in Events Manager.
