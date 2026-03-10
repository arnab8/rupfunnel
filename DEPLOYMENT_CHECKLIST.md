# Deployment Checklist

Use this for every production deployment.

## 1. Pre-Deploy

- [ ] Read [FUNNEL_SETUP_GUIDE.md](FUNNEL_SETUP_GUIDE.md)
- [ ] Confirm integrations are configured:
  - [ ] Meta Pixel/CAPI
  - [ ] MailerLite
  - [ ] Wistia
  - [ ] Cal.com
- [ ] Confirm copy/assets are updated for this funnel

## 2. Netlify Environment Variables

Required:

- [ ] `META_PIXEL_ID`
- [ ] `META_DATASET_ID`
- [ ] `META_CAPI_ACCESS_TOKEN`
- [ ] `MAILERLITE_API_KEY`

Recommended:

- [ ] `MAILERLITE_GROUP_ID`
- [ ] `WISTIA_EMBED_CODE`
- [ ] `CAL_COM_BOOKING_SLUG`
- [ ] `HOME_THUMBNAIL_URL`

Optional:

- [ ] `HEADER_HTML`
- [ ] `CAPI_ENABLED`

After changing vars:

- [ ] Trigger redeploy

## 3. Deploy

- [ ] Push to `main` (or promote staging build)
- [ ] Wait for Netlify deploy to finish successfully
- [ ] Verify functions are built and published

## 4. Smoke Test (Production)

### `/` Lead flow

- [ ] Open homepage in incognito
- [ ] Submit opt-in popup
- [ ] Confirm Network has:
  - [ ] `fbevents.js`
  - [ ] `facebook.com/tr?...ev=Lead`
  - [ ] `POST /.netlify/functions/meta-capi` with `success: true`
- [ ] Confirm MailerLite subscriber created

### `/training` video

- [ ] Wistia player loads correctly
- [ ] No console errors for Wistia scripts

### `/book` -> `/congrats` application flow

- [ ] Booking widget loads and can submit
- [ ] `SubmitApplication` browser event appears
- [ ] `POST /.netlify/functions/meta-capi` for `SubmitApplication` returns `success: true`
- [ ] MailerLite transition `Lead -> Application` succeeds

## 5. Meta Validation

- [ ] In Meta Events Manager, confirm:
  - [ ] `PageView`
  - [ ] `Lead`
  - [ ] `SubmitApplication`
- [ ] Confirm dedup behavior (browser + server with same event id)
- [ ] If using test mode, confirm test events and then disable test mode

## 6. Post-Deploy Monitoring

Within first 24 hours:

- [ ] Check Netlify function logs for `meta-capi`, `subscribe`, `update-subscriber-tag`
- [ ] Check MailerLite for expected lead and application counts
- [ ] Check Meta for event volume continuity

## 7. Rollback

If critical issue:

1. `git revert <bad_commit>`
2. `git push origin main`
3. Confirm previous stable behavior returns

