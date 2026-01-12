## **DEPLOYMENT CHECKLIST: VSL Funnel Audit Fixes**

Use this checklist to ensure smooth deployment to production.

---

## **PHASE 0: PRE-DEPLOYMENT (Today)**

- [ ] Read [AUDIT_IMPLEMENTATION_SUMMARY.md](AUDIT_IMPLEMENTATION_SUMMARY.md)
- [ ] Review [VISUAL_AUDIT_REPORT.md](VISUAL_AUDIT_REPORT.md)
- [ ] Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) key sections
- [ ] All code changes committed to git
- [ ] No uncommitted changes: `git status` shows clean

---

## **PHASE 1: LOCAL TESTING (Before Deployment)**

### **1a. Environment Setup**

- [ ] Copy `.env.example` to `.env.local` (if not exists)
- [ ] Add to `.env.local`:
  ```
  META_PIXEL_ID=YOUR_DEV_PIXEL_ID
  META_CAPI_ACCESS_TOKEN=YOUR_DEV_TOKEN
  MAILERLITE_API_KEY=YOUR_DEV_API_KEY
  MAILERLITE_GROUP_ID=YOUR_DEV_GROUP_ID
  HOME_THUMBNAIL_URL=https://picsum.photos/800/600
  ```
- [ ] Verify `.env.local` is in `.gitignore` (not committed)
- [ ] Verify all required values are non-empty (no empty strings)

### **1b. Local Dev Server**

- [ ] Terminal: `cd vsl-funnel`
- [ ] Terminal: `npm install` (if needed)
- [ ] Terminal: `netlify dev`
- [ ] Browser: Navigate to `http://localhost:8888`
- [ ] DevTools Console: Should show no red errors on load
- [ ] Look for: `"Meta Pixel initialized with ID: [ID]"` ✅

### **1c. MailerLite Integration Test**

- [ ] Homepage loads without errors
- [ ] Click "Click Here to Get Access" or wait for popup
- [ ] Fill form:
  - Full Name: `Test User 001`
  - Email: `test+$(date +%s)@example.com` ← Use unique each time
  - Phone: `+1 555-123-4567`
  - Job Role: `VP Test`
- [ ] Click submit
- [ ] Toast appears (success or notice)
- [ ] Redirected to `/training` ✅
- [ ] **Check MailerLite Dashboard:**
  - Go to **Subscribers → All Subscribers**
  - Find your test email
  - Verify fields: `phone`, `designation`, `utm_campaign`, `utm_content` are populated
  - Verify subscriber is in Group: `[YOUR_MAILERLITE_GROUP_ID]`
- [ ] Mark test complete: `echo "Test $(date)" >> /tmp/ml_test.log`

### **1d. Wistia Test**

- [ ] Ensure `WISTIA_EMBED_CODE` is set in `.env.local` (or set in Admin panel)
- [ ] On `/training` page, you should see a video player
- [ ] Video player has play button, timeline, volume control
- [ ] **Network tab:** Check for requests to `.wistia.com` (should exist)
- [ ] No console errors like "Wistia script failed"

### **1e. Cal.com Test**

- [ ] Ensure `CAL_COM_BOOKING_SLUG` is set: `your-username/your-booking`
- [ ] Click "Apply Now" from `/training` → goes to `/book`
- [ ] See Cal.com iframe or embed
- [ ] Fields are pre-filled with your name, email, phone
- [ ] **Network tab:** Check for requests to `cal.com` (should exist)

### **1f. Thumbnail Test**

- [ ] Go to `/` (homepage)
- [ ] Hero section should show image (from `HOME_THUMBNAIL_URL`) instead of yellow
- [ ] Play button visible over image
- [ ] Mobile responsive (test with DevTools device emulation)

### **1g. Facebook Pixel Test**

- [ ] In Admin panel (`/admin`):
  - Password: `executive2024`
  - Go to **Tracking → Meta Pixel ID**
  - Should be pre-filled with `META_PIXEL_ID` from env
- [ ] Submit opt-in form again
- [ ] DevTools Console: Look for `"Pixel event tracked: Lead [ID]"` ✅
- [ ] DevTools Network: Look for requests to `.facebook.com` (fbevents.js script)

### **1h. CAPI Test**

- [ ] In Admin panel:
  - Go to **Events → Lead Event**
  - Check "Enable Test Mode"
  - Enter: `TEST123` (test event code)
  - Click **Save**
- [ ] Submit opt-in form
- [ ] DevTools Network:
  - Find `POST /.netlify/functions/meta-capi`
  - Response should show: `"success": true`
- [ ] **In Meta Events Manager:**
  - Go to https://business.facebook.com/events_manager/
  - Select your Pixel (test pixel)
  - Go to **Test Events** tab
  - Click submit form again
  - Within 10 seconds, you should see `Lead` event appear with test code `TEST123`

### **1i. Error Handling Test**

- [ ] **Simulate config failure:**
  - Rename `.env.local` to `.env.local.bak`
  - Refresh browser
  - App should show "Initializing app..." then banner: "Unable to load configuration"
  - App should still load (graceful degradation)
  - Rename back: `mv .env.local.bak .env.local`
- [ ] **Simulate network issue:**
  - DevTools → Network → select "Slow 3G"
  - Refresh page
  - Config should load with retries (may take 10+ seconds)
  - No infinite loop or crash

---

## **PHASE 2: STAGING DEPLOYMENT (If you have staging)**

If you have a staging environment:

- [ ] Create staging branch: `git checkout -b staging`
- [ ] Push to GitHub: `git push origin staging`
- [ ] Netlify automatically deploys (if configured)
- [ ] Repeat all tests from Phase 1 on staging URL
- [ ] Verify error logs: `netlify logs --functions`
- [ ] Check Meta sandbox: Events should appear in Test tab

---

## **PHASE 3: PRODUCTION DEPLOYMENT**

### **3a. Environment Variables (Netlify Dashboard)**

Go to: **Site Settings → Build & Deploy → Environment variables**

Set these with **PRODUCTION values** (different from dev):

```
META_PIXEL_ID=YOUR_PRODUCTION_PIXEL_ID
META_CAPI_ACCESS_TOKEN=YOUR_PRODUCTION_CAPI_TOKEN
MAILERLITE_API_KEY=YOUR_PRODUCTION_API_KEY
MAILERLITE_GROUP_ID=YOUR_PRODUCTION_GROUP_ID
HOME_THUMBNAIL_URL=https://your-production-cdn.com/thumbnail.jpg
WISTIA_EMBED_CODE=<script src="..." data-wvideo="..."></script>
CAL_COM_BOOKING_SLUG=your-production-username/booking
CAPI_ENABLED=true
```

### **3b. Verify Environment Variables**

- [ ] Click each variable, verify value is correct
- [ ] No typos in keys (use exact names above)
- [ ] No trailing/leading spaces
- [ ] All sensitive tokens are valid and have correct permissions

### **3c. Code Deployment**

Option A: **Deploy from Git**
```bash
git add .
git commit -m "Audit fixes: MailerLite, CAPI, thumbnail, config safety"
git push origin main
```
- [ ] GitHub shows commit
- [ ] Netlify shows "Deploy in progress"
- [ ] Wait for green checkmark (build success)

Option B: **Manual Deploy** (if needed)
```bash
netlify deploy --prod
```

### **3d. Monitor Deployment**

- [ ] Go to Netlify Dashboard → **Deploys**
- [ ] Wait for status: ✅ **Published**
- [ ] Note deploy URL and timestamp
- [ ] Check build log for errors: Click deploy → **View logs**
- [ ] Expected log messages:
  ```
  Build succeeded
  Functions bundled and ready
  Deploy completed
  ```

### **3e. Post-Deployment Smoke Test**

Within 5 minutes of deployment:

- [ ] Open live URL in fresh incognito window
- [ ] Homepage loads without errors (DevTools Console)
- [ ] Look for: `"Meta Pixel initialized with ID: [PRODUCTION_ID]"`
- [ ] Fill opt-in form, submit
- [ ] Toast appears
- [ ] Redirected to `/training`
- [ ] **Check MailerLite:**
  - Subscriber should appear in PRODUCTION account within 30 seconds
  - Fields properly populated
- [ ] **Check Meta Events Manager:**
  - Go to **Events Manager → Your Production Pixel**
  - Should show `Lead` event (not in Test Events, just regular view)
  - May take 10–60 seconds to appear

---

## **PHASE 4: POST-DEPLOYMENT (After Go-Live)**

### **4a. Monitoring (24 hours after deploy)**

- [ ] Check Netlify function logs daily:
  ```bash
  netlify logs --functions
  ```
- [ ] Look for errors:
  ```
  MAILERLITE_API_KEY not set
  META_CAPI_ACCESS_TOKEN invalid
  Failed to add subscriber
  ```
- [ ] Set up alerts in Netlify (optional):
  - Site Settings → **Notifications** → Add Slack/email for deploy failures

### **4b. Real User Testing**

- [ ] Ask team members to submit opt-in form
- [ ] Each submission should result in:
  - [ ] MailerLite subscriber (within 1 min)
  - [ ] Meta Pixel event (within 10 sec)
  - [ ] CAPI event (within 30 sec)
- [ ] Verify event matching score in Meta Events Manager
  - [ ] Should see "8–10" indicators (hover over event for details)
  - [ ] If <7, debug by checking user data matching

### **4c. Weekly Spot Checks**

- [ ] Every Monday: Run one end-to-end test
- [ ] Submit form → Verify subscriber → Check Meta events
- [ ] Review Netlify function logs for any patterns of errors
- [ ] Check Meta Events Manager for expected volume

### **4d. Monthly Review**

- [ ] Check MailerLite: New subscribers growing as expected?
- [ ] Check Meta: Event matching score stable at 8+?
- [ ] Check Cal.com: Booking volume what you expected?
- [ ] Any error patterns in function logs?
- [ ] Any performance issues (slow config load, CAPI delays)?

---

## **TROUBLESHOOTING DURING DEPLOYMENT**

### **If build fails:**
1. Check Netlify build logs for specific error
2. Common issues:
   - Missing dependency: `npm install`
   - TypeScript error: Check `AUDIT_IMPLEMENTATION_SUMMARY.md` for type fixes
   - Env var issue: Verify Netlify Dashboard has all vars set
3. Fix locally, test with `netlify dev`, then push again

### **If config doesn't load:**
1. Check `META_PIXEL_ID` is set in Netlify env vars
2. Check `/.netlify/functions/config` endpoint:
   - Open live site → DevTools Console
   - Type: `fetch('/.netlify/functions/config').then(r => r.json()).then(console.log)`
   - Should show JSON with `metaPixelId` field
3. If 404: Functions not deployed (rebuild needed)
4. If error: Check Netlify Dashboard → Functions → Logs

### **If subscribers don't appear in MailerLite:**
1. Check MAILERLITE_API_KEY is correct
2. Verify it's not just a display lag (wait 60 seconds)
3. Check function logs:
   ```bash
   netlify logs --functions | grep -i mailerlite
   ```
4. Look for: `MAILERLITE_API_KEY environment variable is not set`
5. Re-verify key in Netlify Dashboard

### **If Meta events don't appear:**
1. Wait up to 60 seconds (not instantaneous)
2. Check META_CAPI_ACCESS_TOKEN has `ads_management` scope:
   - Meta Business Manager → Settings → Accounts → Users
   - Regenerate token if unsure
3. Check function logs:
   ```bash
   netlify logs --functions | grep -i capi
   ```
4. Look for: `"success": false` or `401 Unauthorized` → token issue

---

## **ROLLBACK PLAN (If critical issue)**

If production is broken:

1. **Immediate rollback:**
   ```bash
   git revert HEAD
   git push origin main
   # Netlify auto-deploys previous version
   # Wait ~5 minutes for deployment
   ```

2. **Or manually redeploy previous version:**
   - Netlify Dashboard → **Deploys**
   - Find last good deploy (before this one)
   - Click menu (three dots) → **Publish deploy**
   - Wait for green checkmark

3. **Root cause analysis:**
   - Check logs from failed deploy
   - Review what changed
   - Refer to AUDIT_IMPLEMENTATION_SUMMARY.md for expected behavior
   - Fix locally, test on staging, redeploy

---

## **SIGN-OFF**

Once all tests pass, deployment is complete:

- [ ] **Deployed:** `(production URL)`
- [ ] **Deploy Time:** `(timestamp)`
- [ ] **Deployer:** `(your name)`
- [ ] **Verified By:** `(QA/reviewer name)`
- [ ] **Status:** ✅ **LIVE & STABLE**

---

## **QUICK REFERENCE: Critical Checks**

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Config loads | Browser → DevTools Console | `"Meta Pixel initialized with ID: ..."` |
| Subscriber created | MailerLite Dashboard | New row in **Subscribers → All Subscribers** |
| Pixel fires | DevTools → Network | Request to `.facebook.com/fbevents.js` exists |
| CAPI fires | DevTools Network → `meta-capi` | Response: `"success": true` |
| Function logs | `netlify logs --functions` | No `ERROR` messages |

---

**DEPLOYMENT INITIATED:** [Date & Time]  
**STATUS:** Ready for production  
**RISK LEVEL:** Low (all backward compatible, with rollback plan)

---

Need help? Refer to:
- [AUDIT_TESTING_GUIDE.md](AUDIT_TESTING_GUIDE.md) — Detailed testing steps
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) — Code snippets & troubleshooting
- [VISUAL_AUDIT_REPORT.md](VISUAL_AUDIT_REPORT.md) — Architecture overview
