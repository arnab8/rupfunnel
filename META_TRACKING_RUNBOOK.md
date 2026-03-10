# Meta Tracking Runbook

This runbook covers Meta Pixel + CAPI operations for this app.

## 1. Event Design in This App

- `PageView`
  - Browser, base pixel in `index.html`
- `Lead`
  - Browser: popup form submit on `/`
  - Server: CAPI on same submit, shared `event_id`
- `SubmitApplication`
  - Browser: `/congrats`
  - Server: booking flow + congrats fallback, shared `event_id`

## 2. Required Netlify Variables

- `META_PIXEL_ID`
- `META_DATASET_ID`
- `META_CAPI_ACCESS_TOKEN`

Recommended:

- Keep `META_PIXEL_ID` and `META_DATASET_ID` aligned unless your Meta setup requires otherwise.

## 3. Where Tracking Logic Lives

- Browser base pixel:
  - `index.html`
- Lead flow:
  - `src/pages/Index.tsx`
- SubmitApplication flow:
  - `src/pages/Book.tsx`
  - `src/pages/Congrats.tsx`
- Shared tracking helper:
  - `src/lib/tracking.ts`
- CAPI server endpoint:
  - `netlify/functions/meta-capi.js`

## 4. Test Procedure

### 4.1 Lead

1. Open DevTools -> Network.
2. Submit popup on `/`.
3. Confirm:
   - Browser request `facebook.com/tr?...ev=Lead`
   - `POST /.netlify/functions/meta-capi`
   - Response JSON includes:
     - `success: true`
     - `events_received: 1`

### 4.2 SubmitApplication

1. Go through `/book` and complete booking.
2. Keep Network `Preserve log` enabled.
3. Confirm:
   - `POST /.netlify/functions/meta-capi` for `SubmitApplication`
   - Browser `SubmitApplication` on `/congrats`

## 5. Why You Might See Browser But Not Server in Meta UI

This can happen even when server delivery is working because:

- Browser and server are deduplicated by `event_id`
- Meta may attribute display to one source in UI

Use network + response payload as source of truth:

- `success: true`
- `events_received: 1`
- `fbtrace_id` present

## 6. Test Event Codes

- In test mode, set test codes via `/admin` Events tab.
- Do not hardcode test event codes in code for production.

## 7. Idempotency Behavior

- `SubmitApplication` uses localStorage idempotency by email to avoid duplicate production sends.
- When Application CAPI test mode is enabled, idempotency is bypassed for easier repeated testing.

## 8. Troubleshooting

### `fbevents.js` blocked

- Disable browser tracking protection and ad blockers for testing

### No `meta-capi` request in Network

- Confirm user reaches actual submit path
- For booking flow, use `Preserve log` due fast redirect

### `meta-capi` returns error

- Validate Netlify vars
- Rotate CAPI token if expired
- Check Netlify function logs

