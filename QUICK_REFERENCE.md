## **QUICK REFERENCE: KEY CODE CHANGES**

Fast lookup for the most important code patterns after the audit fixes.

---

## **1. Meta Pixel Initialization**

```typescript
// In src/lib/tracking.ts
export function initializeMetaPixel(pixelId: string) {
  if (!pixelId) {
    console.warn('initializeMetaPixel: pixelId is empty');
    return;
  }

  if (typeof window === 'undefined') return;

  if ((window as any).fbq) {
    console.log('Meta Pixel already initialized');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://connect.facebook.net/en_US/fbevents.js`;
  
  script.onload = () => {
    if ((window as any).fbq) {
      (window as any).fbq('init', pixelId);
      (window as any).fbq('track', 'PageView');
      console.log('Meta Pixel initialized with ID:', pixelId);
    }
  };

  document.head.appendChild(script);
}

// Called in App.tsx useEffect:
if (validatedConfig.metaPixelId) {
  initializeMetaPixel(validatedConfig.metaPixelId);
}
```

---

## **2. Browser Pixel Event (Advanced Matching)**

```typescript
// In src/pages/Index.tsx form submission
triggerPixelEvent("Lead", {
  // Standard params
  content_name: "VSL Opt-in",
  content_category: "Executive Training",
  value: 0,
  currency: "USD",
  
  // Advanced matching fields (improves score significantly)
  email: formData.email,
  phone: formData.phone,
  first_name: formData.fullName.split(" ")[0],
  last_name: formData.fullName.split(" ").slice(1).join(" "),
  
  // UTM context
  ...(utmParams.utmCampaign && { utm_campaign: utmParams.utmCampaign }),
  ...(utmParams.utmContent && { utm_content: utmParams.utmContent }),
});
```

---

## **3. Server-Side CAPI Event**

```typescript
// In src/pages/Index.tsx
await sendCapiEvent(
  "Lead",
  fullUserData,  // UserData interface
  config.metaPixelId,
  config.leadCapiTestEnabled ? config.leadCapiTestEventCode : undefined
);

// Handler signature:
export async function sendCapiEvent(
  eventName: string,
  userData: UserData,
  pixelId: string,
  testEventCode?: string
): Promise<string | null>
```

**CAPI request format (automatic in sendCapiEvent):**
```json
{
  "eventName": "Lead",
  "userData": {
    "em": "sha256(email)",
    "ph": "sha256(phone)",
    "fn": "sha256(first_name)",
    "ln": "sha256(last_name)",
    "external_id": "sha256(email)",
    "fbp": "cookie_value",
    "fbc": "cookie_value"
  },
  "testEventCode": "TEST123",
  "eventId": "1234567890_abc",
  "eventTime": 1704067200,
  "sourceUrl": "https://...",
  "userAgent": "Mozilla/5.0..."
}
```

---

## **4. MailerLite Subscription (Fixed)**

```typescript
// Frontend call (src/pages/Index.tsx) - unchanged
const subscribeResponse = await fetch("/.netlify/functions/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: formData.fullName,
    phone: formData.phone,
    email: formData.email,
    designation: formData.jobRole,
    utmCampaign: utmParams.utmCampaign || "",
    utmContent: utmParams.utmContent || "",
    tags: ["Lead"],  // Informational only now
    groupId: config.mailerLiteGroupId || "",  // THIS is what matters
  }),
});

// Backend implementation (netlify/functions/subscribe.js)
// Creates subscriber:
POST /api/subscribers {
  email, name, fields: { phone, designation, utm_campaign, utm_content }
}

// Adds to group:
POST /api/subscribers/{id}/groups/{groupId}
// (groups are the segmentation mechanism in MailerLite v2)

// Note: No tag search or PUT with group names
```

---

## **5. Thumbnail Configuration**

```typescript
// Config flow: environment var → config.js → App.tsx → AdminContext → Index.tsx → VideoThumbnail

// 1. Environment variable (.env.local or Netlify env)
HOME_THUMBNAIL_URL=https://picsum.photos/800/600

// 2. Config endpoint returns it (netlify/functions/config.js)
{
  homeThumbnailUrl: process.env.HOME_THUMBNAIL_URL || ""
}

// 3. App.tsx loads and merges with AdminContext
const validatedConfig = validateServerConfig(data);
// ...
<AdminProvider initialServerConfig={config}>

// 4. AdminContext merges server + admin config
loadedConfig = {
  ...loadedConfig,
  homeThumbnailUrl: initialServerConfig.homeThumbnailUrl || loadedConfig.homeThumbnailUrl,
}

// 5. Index.tsx passes to component
<VideoThumbnail 
  onClick={handleCtaClick}
  thumbnailUrl={config.homeThumbnailUrl || undefined}
/>

// 6. VideoThumbnail displays image or fallback
{thumbnailUrl ? (
  <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
) : (
  // yellow gradient fallback
)}
```

---

## **6. Config Type Safety**

```typescript
// src/types/config.ts
export interface ServerConfig {
  metaPixelId: string;
  headerCodeBlock: string;
  capiEnabled: boolean;
  mailerLiteApiKeyPresent: boolean;
  mailerLiteGroupId?: string;
  wistiaEmbedCode?: string;
  calComBookingSlug?: string;
  homeThumbnailUrl?: string;
  version?: string;
}

export function validateServerConfig(data: unknown): ServerConfig {
  if (!data || typeof data !== 'object') {
    throw new ConfigError('Invalid config', 'INVALID_TYPE');
  }
  // Validates all required fields...
  return validatedConfig;
}

// Usage in App.tsx
try {
  const data = await res.json();
  const validatedConfig = validateServerConfig(data);  // Type-safe
  setConfig(validatedConfig);
} catch (e) {
  if (e instanceof ConfigError) {
    console.error('Config validation failed:', e.message);
  }
}
```

---

## **7. CAPI Netlify Function Structure**

```javascript
// netlify/functions/meta-capi.js
exports.handler = async (event) => {
  // 1. Validate credentials
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  
  // 2. Parse request
  const { eventName, userData, testEventCode, eventId, eventTime, sourceUrl } = JSON.parse(event.body);
  
  // 3. Enrich with server-side data
  const clientIp = getClientIp(event);  // From x-forwarded-for header
  const serverUserAgent = event.headers['user-agent'];
  
  // 4. Hash sensitive data
  const hashedUserData = {
    em: await hashValue(userData.email),
    ph: await hashValue(userData.phone),
    // ... etc
  };
  
  // 5. Build CAPI payload
  const capiEvent = {
    event_name: eventName,
    event_time: eventTime,
    event_source_url: sourceUrl,
    action_source: 'website',
    user_data: hashedUserData,
    event_id: eventId,
    test_event_code: testEventCode,
  };
  
  // 6. Send to Meta
  const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      data: [capiEvent],
      access_token: accessToken,
    }),
  });
  
  // 7. Return result
  const result = await response.json();
  return { statusCode: 200, body: JSON.stringify({ success: true, ...result }) };
};
```

---

## **8. Admin Panel Thumbnail Field**

```tsx
// In src/pages/Admin.tsx within "Integrations" tab
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Video className="w-5 h-5" />
      Homepage Thumbnail
    </CardTitle>
    <CardDescription>Global thumbnail image URL for the homepage hero</CardDescription>
  </CardHeader>
  <CardContent>
    <div>
      <Label htmlFor="homeThumbnailUrl">Thumbnail URL</Label>
      <Input
        id="homeThumbnailUrl"
        value={localConfig.homeThumbnailUrl}
        onChange={(e) => updateConfig('homeThumbnailUrl', e.target.value)}
        placeholder="https://example.com/thumbnail.jpg"
        className="mt-1"
      />
      <p className="text-sm text-muted-foreground mt-2">
        Leave blank to show the default yellow gradient. Use a CDN or cloud storage URL.
      </p>
    </div>
  </CardContent>
</Card>
```

---

## **9. Error Handling Pattern**

```typescript
// App.tsx config loading with retry logic
const loadConfig = async () => {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Timeout wrapper
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/.netlify/functions/config", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Config endpoint returned ${res.status}`);
      }

      const data = await res.json();
      const validatedConfig = validateServerConfig(data);
      
      setConfig(validatedConfig);
      return;  // Success
    } catch (e) {
      retries++;
      console.warn(`Config load attempt ${retries} failed:`, e);
      
      if (retries < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retries - 1) * 1000)
        );
      }
    }
  }

  // After all retries, use defaults and show error
  setConfigError("Unable to load configuration.");
  setConfig(defaultServerConfig);
};
```

---

## **10. Environment Variables Checklist**

### **Required for all integrations:**
```bash
# Meta
META_PIXEL_ID=123456789
META_CAPI_ACCESS_TOKEN=token_with_ads_management_scope

# MailerLite
MAILERLITE_API_KEY=api_key_from_dashboard
MAILERLITE_GROUP_ID=group_id_from_dashboard

# Optional (set in Admin panel if not in env)
HOME_THUMBNAIL_URL=https://cdn.example.com/image.jpg
WISTIA_EMBED_CODE=<script src="..." data-wvideo="..."></script>
CAL_COM_BOOKING_SLUG=username/booking-type

# Feature flags
CAPI_ENABLED=true
```

### **Get values from:**
- **Meta Pixel ID**: https://business.facebook.com/pixels/
- **CAPI Token**: Business Manager → Data Sources → Conversions API
- **MailerLite API Key**: https://dashboard.mailerlite.com/integrations/api
- **MailerLite Group ID**: MailerLite → Subscribers → Groups → right-click group
- **Wistia embed**: Video → Share → Embed → copy script tag
- **Cal.com slug**: https://cal.com/your-username/event-type

---

## **11. Testing Commands**

```bash
# Local dev
netlify dev

# Deploy
git push origin main

# Check function logs
netlify logs --functions

# Debug mode
netlify dev --debug

# Test MailerLite API key
curl -X GET https://connect.mailerlite.com/api/subscribers \
  -H "Authorization: Bearer YOUR_KEY"

# Test Meta CAPI token (in browser console)
fetch('/.netlify/functions/meta-capi', {
  method: 'POST',
  body: JSON.stringify({
    eventName: 'Lead',
    userData: { em: 'hash', ph: 'hash' },
    pixelId: 'YOUR_PIXEL_ID'
  })
}).then(r => r.json()).then(console.log)
```

---

## **12. Troubleshooting by Symptom**

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| App stuck on "Loading..." | Config fetch timeout | Check `META_PIXEL_ID` is set, restart dev |
| Subscribers don't appear in MailerLite | Invalid API key or group ID | Verify in Netlify env vars, test API key with curl |
| Wistia video doesn't load | Embed code malformed or missing | Check embed code in Admin → paste again from Wistia |
| Cal.com iframe 404 | Wrong slug format or not public | Verify slug: `username/type`, test on cal.com directly |
| Pixel events not in Meta Events Manager | Pixel ID wrong or not initialized | Verify `META_PIXEL_ID` in config, check `window.fbq` in console |
| CAPI events don't appear | Token invalid or test code wrong | Check token has `ads_management` scope, verify test code |
| Thumbnail doesn't load | URL invalid or CORS blocked | Test URL in browser, check for 403/404 in Network tab |

---

**Last Updated:** January 12, 2025
**All fixes tested and ready for production deployment**
