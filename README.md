# Rupfunnel

Production-ready React + Netlify funnel app with:

- Homepage opt-in popup (`/`)
- Training page (`/training`) with Wistia embed
- Booking page (`/book`) with Cal.com
- Confirmation page (`/congrats`)
- Meta Pixel + Meta CAPI (browser + server dedup)
- MailerLite subscriber + group tagging

## Start Here

If you are deploying this app for your own funnel, read these in order:

1. [FUNNEL_SETUP_GUIDE.md](FUNNEL_SETUP_GUIDE.md)
2. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. [META_TRACKING_RUNBOOK.md](META_TRACKING_RUNBOOK.md)

## Local Development

```bash
npm install
npm run dev
```

For local Netlify Functions:

```bash
netlify dev
```

## Core Integrations (where they live)

- Meta CAPI function:
  - `netlify/functions/meta-capi.js`
- MailerLite subscribe function:
  - `netlify/functions/subscribe.js`
- MailerLite lead->application transition:
  - `netlify/functions/update-subscriber-tag.js`
- Lead event flow:
  - `src/pages/Index.tsx`
- SubmitApplication flow:
  - `src/pages/Book.tsx` and `src/pages/Congrats.tsx`
- Tracking helpers:
  - `src/lib/tracking.ts`
- Server config endpoint:
  - `netlify/functions/config.js`

## Netlify Environment Variables (summary)

Required:

- `META_PIXEL_ID`
- `META_DATASET_ID`
- `META_CAPI_ACCESS_TOKEN`
- `MAILERLITE_API_KEY`

Recommended:

- `MAILERLITE_GROUP_ID`
- `WISTIA_EMBED_CODE`
- `CAL_COM_BOOKING_SLUG`
- `HOME_THUMBNAIL_URL`

Optional:

- `HEADER_HTML`
- `CAPI_ENABLED`

Full instructions:
- [FUNNEL_SETUP_GUIDE.md](FUNNEL_SETUP_GUIDE.md)

