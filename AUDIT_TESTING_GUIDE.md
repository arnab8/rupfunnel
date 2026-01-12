## **COMPLETE VERIFICATION GUIDE: VSL Funnel Implementation**

This guide walks you through testing all fixed components locally and in production.

---

## **SECTION A: ENVIRONMENT VARIABLES SETUP**

### **Local Development (.env.local)**

Create or update `.env.local` in the root of `vsl-funnel/`:

```
# Meta Pixel
VITE_META_PIXEL_ID=YOUR_PIXEL_ID_HERE
META_PIXEL_ID=YOUR_PIXEL_ID_HERE

# Meta CAPI
META_CAPI_ACCESS_TOKEN=YOUR_CAPI_ACCESS_TOKEN_HERE

# MailerLite
MAILERLITE_API_KEY=YOUR_MAILERLITE_API_KEY_HERE
MAILERLITE_GROUP_ID=YOUR_GROUP_ID_HERE

# Optional: Server-side config overrides (can also be set in Admin panel)
HOME_THUMBNAIL_URL=https://your-cdn.com/thumbnail.jpg
WISTIA_EMBED_CODE=<script src="..." data-wvideo="..."></script>
CAL_COM_BOOKING_SLUG=username/event-type

# Header HTML (optional custom scripts)
HEADER_HTML=

# CAPI Settings
CAPI_ENABLED=true

# Admin Auth Password (optional override)
REACT_APP_ADMIN_PASSWORD=executive2024
```

### **Netlify Dashboard Environment Variables**

Go to: **Site Settings → Build & Deploy → Environment**

Set the same variables:
- `META_PIXEL_ID`
- `META_CAPI_ACCESS_TOKEN`
- `MAILERLITE_API_KEY`
- `MAILERLITE_GROUP_ID`
- `HOME_THUMBNAIL_URL` (optional)
- `WISTIA_EMBED_CODE` (optional)
- `CAL_COM_BOOKING_SLUG` (optional)
- `CAPI_ENABLED=true`

**Note:** Keep secrets secure. Never commit `.env.local` to git.

---

## **SECTION B: LOCAL DEVELOPMENT TESTING**

### **1. Start Netlify Dev Server**

```bash
cd vsl-funnel
npm install  # If not already done
netlify dev
```

You should see:
```
   ┌─────────────────────────────────────────────────────────────┐
   │                   Netlify Dev Server                         │
   │        Local:     http://localhost:8888                      │
   │        Netlify:   http://localhost:8888                      │
   └─────────────────────────────────────────────────────────────┘
```

Navigate to `http://localhost:8888` in your browser.

### **2. Test Config Loading (App.tsx)**

**Expected behavior:**
- App should NOT show "Loading..." for more than 2 seconds
- Should initialize without errors in console
- Pixel ID should be logged: `"Meta Pixel initialized with ID: [YOUR_ID]"`

**To verify:**
1. Open **DevTools → Console**
2. Look for: `"Meta Pixel initialized with ID: YOUR_PIXEL_ID"` or `"Failed to load config after 3 retries"`
3. No red errors should appear during app load

**If stuck on "Loading...":**
- Check that `META_PIXEL_ID` is set in `.env.local`
- Restart `netlify dev`
- Check Netlify function logs: `netlify dev --debug`

---

### **3. Test MailerLite Subscription**

**Flow:**
1. Visit `http://localhost:8888`
2. Click "Click Here to Get Access" or wait for popup
3. Fill in form:
   - Full Name: `Test User`
   - Email: `test+$(date +%s)@example.com`  ← Use unique email each test
   - Phone: `+1 555-123-4567`
   - Designation: `Director`
4. Click "Watch Now"

**Expected:**
- Form submits without errors
- Toast appears (success or "notice")
- User redirected to `/training` (if you're logged in) or to opt-in gate
- **Check MailerLite Dashboard:**
  - Go to **Subscribers → All Subscribers**
  - Search for the email you just submitted
  - Verify subscriber is in the correct **Group** (specified by `MAILERLITE_GROUP_ID`)
  - Subscriber should have fields: `phone`, `designation`, `utm_campaign`, `utm_content` populated

**If subscription fails:**
1. Open **DevTools → Network** tab
2. Find `POST /.netlify/functions/subscribe`
3. Check **Response** tab for error details
4. Common issues:
   - `MAILERLITE_API_KEY` not set → `500 error`
   - Invalid `MAILERLITE_GROUP_ID` → Subscriber created but not added to group (logged as warning)
   - Invalid email format → `400 error: Email is required`

---

### **4. Test Wistia Embed (Training Page)**

**Setup:**
1. In **Admin panel** (http://localhost:8888/admin):
   - Password: `executive2024`
   - Go to **Integrations → Wistia Video**
   - Paste your Wistia embed code (or use a test code)
   - Click **Save Configuration**

**Test:**
1. Complete opt-in form to reach `/training`
2. You should see the Wistia video player
3. Verify:
   - ✅ Video iframe loads (check Network tab for `.wistia.com` requests)
   - ✅ Play button works
   - ✅ "Apply Now" button appears after `vslButtonDelay` seconds (default: 30s)

**If video doesn't appear:**
1. Check **DevTools → Network → iframe** from `.wistia.com`
2. Check embed code syntax (should be `<script data-wvideo="..."></script>`)
3. Verify no Content Security Policy (CSP) blocks Wistia
4. In **DevTools → Console**, look for errors like `"Wistia script failed to load"`

---

### **5. Test Cal.com Booking (Book Page)**

**Setup:**
1. Create a Cal.com account and booking type (or use test URL: `username/booking`)
2. In **Admin → Integrations → Cal.com Booking**:
   - Enter slug: `your-username/your-booking-type`
   - Click **Save**

**Test:**
1. From `/training`, click "Apply Now" to go to `/book`
2. You should see:
   - ✅ Cal.com iframe OR embed code (depending on config)
   - ✅ Pre-filled fields: Name, Email, Phone (from UserContext)
3. Fill booking form and submit
4. After successful booking, you're redirected to `/congrats`

**If iframe doesn't load:**
1. Check **Network** for `cal.com` requests
2. Verify slug is correct: `https://cal.com/[slug]`
3. Check that `userData` exists (redirect to `/` if not)
4. Verify Cal.com allows embedding (check CORS headers)

---

### **6. Test Homepage Thumbnail Control**

**Setup:**
1. Get a test image URL (e.g., from Unsplash, S3, Cloudinary): `https://picsum.photos/800/600`
2. In **Admin → Integrations → Homepage Thumbnail**:
   - Paste URL: `https://picsum.photos/800/600`
   - Click **Save**
3. Go back to `/` (homepage)

**Expected:**
- ✅ Hero section shows your image instead of yellow gradient
- ✅ Play button still visible over image
- ✅ Image is responsive on mobile

**If image doesn't load:**
1. Check CORS headers on image server
2. Verify URL is valid: `curl https://your-url.com/image.jpg`
3. Check **Network** tab for 404/403 errors
4. Use public CDN URLs (Cloudinary, Unsplash, S3 public) for best compatibility

---

### **7. Test Facebook Pixel Events (Browser)**

**Setup:**
1. Create a Meta Pixel and get Pixel ID: https://business.facebook.com/pixels/
2. Set `META_PIXEL_ID` in `.env.local`
3. Restart `netlify dev`

**Test:**
1. Go to `http://localhost:8888`
2. Open **DevTools → Console**
3. Submit opt-in form
4. Look for logs:
   ```
   Pixel event tracked: Lead [EVENT_ID]
   ```
5. **In Meta Events Manager:**
   - Go to **Meta Business → Events Manager**
   - Select your Pixel
   - Go to **Test Events** tab
   - Submit form again
   - You should see `Lead` event appear within 10 seconds

**If pixel events don't appear:**
1. Verify `META_PIXEL_ID` is correct (not empty)
2. Check console for: `initializeMetaPixel: pixelId is empty` → means env var not loaded
3. Check that `fbq` is defined: Type in console: `window.fbq` → should return function
4. Verify pixel is created and active in Meta Business Manager

---

### **8. Test CAPI (Server-Side) Events**

**Setup:**
1. Get CAPI Access Token from Meta Business Manager:
   - Go to **Settings → Data Sources → Conversions API**
   - Generate access token (needs `ads_management` scope)
2. Set `META_CAPI_ACCESS_TOKEN` in `.env.local`
3. Enable test mode:
   - Go to **Admin → Events → Lead Event**
   - Check "Enable Test Mode"
   - Enter test event code (e.g., `TEST123`)
   - Click **Save**

**Test:**
1. Submit opt-in form
2. **DevTools → Network**, look for `POST /.netlify/functions/meta-capi`
3. Check **Response** tab:
   ```json
   {
     "success": true,
     "message": "Event sent to Meta CAPI",
     "eventId": "1234567890_abc123",
     "capiResult": { "events_received": 1, "events_processed": 1 }
   }
   ```
4. **In Meta Events Manager:**
   - Go to **Test Events** tab
   - You should see `Lead` event with `"Test Event Code": "TEST123"`
   - Event matching score will show data hash quality

**If CAPI fails:**
1. Check **Netlify function logs:**
   ```bash
   netlify dev --debug
   ```
   Look for error in `/meta-capi` logs
2. Verify `META_CAPI_ACCESS_TOKEN` is correct and has proper permissions
3. Check Meta Business Manager for CAPI setup errors
4. Common error: `401 Unauthorized` → Token expired or invalid
5. Verify payload format matches Meta docs: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters

---

### **9. Test Event Matching Score (End-to-End)**

**What you're testing:** Both browser pixel and CAPI fire with matching data

**Test flow:**
1. Clear browser cookies and cache
2. Visit homepage with UTM params:
   ```
   http://localhost:8888/?utm_campaign=test_campaign&utm_content=test_content
   ```
3. Submit opt-in form with:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `+1 555-123-4567`
   - Job Role: `VP of Sales`
4. Check logs:
   - Console: `"Pixel event tracked: Lead [ID]"` ✅
   - Network: `meta-capi` response shows `"events_received": 1` ✅
5. In **Meta Events Manager → Test Events**:
   - Wait 10 seconds
   - You should see TWO events with same event_id (browser + CAPI)
   - Check matching score (green = 8+, yellow = 5-7, red = <5)

**Improving matching score:**
- ✅ Include all available fields (email, phone, name, job role)
- ✅ Send both browser pixel AND CAPI with same event_id (already implemented)
- ✅ Use first-party identifiers (_fbp, _fbc cookies)
- ✅ Ensure user data is normalized (lowercase email, remove phone formatting)

---

## **SECTION C: PRODUCTION DEPLOYMENT & TESTING**

### **1. Deploy to Netlify**

```bash
git add .
git commit -m "Audit fixes: MailerLite, CAPI, thumbnail control, config type safety"
git push origin main  # Or your main branch
```

Netlify should auto-deploy. Monitor:
1. Go to **Netlify Dashboard → Deploys**
2. Wait for build to complete (green checkmark)
3. Click deploy URL to open live site

### **2. Set Production Environment Variables**

In **Netlify → Site Settings → Build & Deploy → Environment:**

```
META_PIXEL_ID=YOUR_PRODUCTION_PIXEL_ID
META_CAPI_ACCESS_TOKEN=YOUR_PRODUCTION_TOKEN
MAILERLITE_API_KEY=YOUR_PRODUCTION_API_KEY
MAILERLITE_GROUP_ID=YOUR_PRODUCTION_GROUP_ID
HOME_THUMBNAIL_URL=https://prod-cdn.example.com/thumbnail.jpg
WISTIA_EMBED_CODE=(your embed code)
CAL_COM_BOOKING_SLUG=your-username/booking-slug
CAPI_ENABLED=true
```

**Note:** Use different credentials for production vs. local dev.

### **3. Test Production Site**

Repeat **Section B** tests on your live URL:

- [ ] Config loads without timeout
- [ ] Opt-in form submits
- [ ] MailerLite receives subscriber (check dashboard)
- [ ] Wistia video plays on `/training`
- [ ] Cal.com iframe loads on `/book`
- [ ] Thumbnail displays correctly
- [ ] Browser pixel fires (check Events Manager)
- [ ] CAPI events appear (check Test Events tab)
- [ ] Redirect flow works: `/` → `/training` → `/book` → `/congrats`

### **4. Monitor Errors in Production**

Set up error tracking (Sentry, LogRocket, or Netlify built-in):

**Netlify Functions Logs:**
```bash
netlify logs --functions
```

**Browser Errors:**
- Open DevTools on live site
- Reproduce flows
- Check for red errors

---

## **SECTION D: CHECKLIST FOR GO-LIVE**

- [ ] **Config Endpoint** works without errors
- [ ] **MailerLite** subscribers appear in correct group with tags
- [ ] **Wistia** video loads and plays on `/training`
- [ ] **Cal.com** booking works and records bookings
- [ ] **Homepage Thumbnail** displays custom image
- [ ] **Meta Pixel** fires `Lead` and `SubmitApplication` events
- [ ] **CAPI** events appear in Test Events with matching score ≥ 7
- [ ] **UTM parameters** captured and stored
- [ ] **User data** persists in localStorage and context
- [ ] **Redirects** work correctly (unauthorized users sent to `/`)
- [ ] **Error handling** gracefully handles failures (toasts, redirects, logging)
- [ ] **Mobile responsive** on all pages
- [ ] **SSL/TLS** certificate valid (HTTPS only)
- [ ] **Admin panel** password is strong and stored securely

---

## **SECTION E: COMMON ISSUES & FIXES**

### **Issue: Meta Pixel not initializing**
- **Cause:** `META_PIXEL_ID` not set
- **Fix:** Verify in `.env.local` and Netlify env vars, restart dev server
- **Verify:** `console.log(window.fbq)` should return function

### **Issue: MailerLite subscribers not appearing**
- **Cause:** Invalid `MAILERLITE_API_KEY` or `MAILERLITE_GROUP_ID`
- **Fix:** Check API key format, verify group ID exists
- **Verify:** Test API key with curl:
  ```bash
  curl -X GET https://connect.mailerlite.com/api/subscribers \
    -H "Authorization: Bearer YOUR_KEY" | head
  ```

### **Issue: CAPI events don't appear in Test Events**
- **Cause:** Token invalid, test event code wrong, or server error
- **Fix:** Check `netlify dev --debug` for `/meta-capi` errors
- **Verify:** Token permissions: needs `ads_management` scope

### **Issue: Wistia or Cal.com embeds don't load**
- **Cause:** CORS, CSP, or malformed embed code
- **Fix:** Check Network tab for failed requests
- **Verify:** Embed code syntax, CDN is accessible

### **Issue: Thumbnail image doesn't load**
- **Cause:** Invalid URL, CORS, or image doesn't exist
- **Fix:** Test URL in browser directly
- **Verify:** URL is public and CORS-enabled

---

## **SECTION F: DATABASE & ANALYTICS INTEGRATION (FUTURE)**

Currently, subscribers are stored in MailerLite. For advanced tracking:

1. **Add database (Supabase, Firebase, or PostgreSQL):**
   - Store user records with timestamps and event history
   - Track page visits, form submissions, booking status
   - Enable CRM integration

2. **Add event tracking (Mixpanel, Amplitude, or custom):**
   - Track user funnel progression
   - Analyze drop-off rates
   - Identify high-intent users

3. **Add webhook handlers:**
   - Listen to Cal.com booking confirmations
   - Listen to MailerLite automation events
   - Trigger downstream actions (CRM updates, email sequences)

---

## **REFERENCE: API ENDPOINTS**

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/.netlify/functions/config` | GET | Load server config | None |
| `/.netlify/functions/subscribe` | POST | Add subscriber to MailerLite | API Key (server-side) |
| `/.netlify/functions/meta-capi` | POST | Send CAPI event to Meta | API Token (server-side) |

---

This guide covers all major flows. If you encounter issues not listed, check browser console and Netlify function logs for detailed error messages.
