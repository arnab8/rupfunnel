/**
 * Site configuration (static values and Netlify env var fallbacks).
 * Update these values directly in this file or set Netlify environment variables.
 *
 * Netlify env vars (recommended for secrets):
 * - VITE_META_PIXEL_ID
 * - VITE_MAILERLITE_API_KEY
 * - VITE_MAILERLITE_GROUP_ID
 * - VITE_CAL_COM_BOOKING_SLUG
 * - VITE_WISTIA_EMBED_CODE
 * - VITE_THUMBNAIL_URL
 * - VITE_POPUP_DELAY
 * - VITE_VSL_BUTTON_DELAY
 * - VITE_ENABLE_EXTERNAL_ID_FIELD
 * - VITE_EXTERNAL_ID_FIELD_LABEL
 */

export const siteConfig = {
  // Meta Pixel & CAPI
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID ?? '',
  headerCodeBlock: '', // Optional: custom header code

  // Lead CAPI
  leadCapiAccessToken: import.meta.env.VITE_LEAD_CAPI_ACCESS_TOKEN ?? '',
  leadCapiTestEventCode: import.meta.env.VITE_LEAD_CAPI_TEST_EVENT_CODE ?? 'TEST12345',
  leadCapiTestEnabled: import.meta.env.VITE_LEAD_CAPI_TEST_ENABLED === 'true',

  // Submit Application CAPI
  applicationCapiAccessToken: import.meta.env.VITE_APPLICATION_CAPI_ACCESS_TOKEN ?? '',
  applicationCapiTestEventCode: import.meta.env.VITE_APPLICATION_CAPI_TEST_EVENT_CODE ?? 'TEST12345',
  applicationCapiTestEnabled: import.meta.env.VITE_APPLICATION_CAPI_TEST_ENABLED === 'true',

  // MailerLite
  mailerLiteApiKey: import.meta.env.VITE_MAILERLITE_API_KEY ?? '',
  mailerLiteGroupId: import.meta.env.VITE_MAILERLITE_GROUP_ID ?? '',

  // Wistia
  wistiaEmbedCode: import.meta.env.VITE_WISTIA_EMBED_CODE ?? '',

  // Homepage Thumbnail
  homeThumbnailUrl: import.meta.env.VITE_THUMBNAIL_URL ?? '', // Leave blank for default gradient

  // Cal.com
  calComBookingSlug: import.meta.env.VITE_CAL_COM_BOOKING_SLUG ?? 'the-first-time-ceo/strategy-session',

  // UX Timing
  popupDelay: Number(import.meta.env.VITE_POPUP_DELAY) ?? 30,
  vslButtonDelay: Number(import.meta.env.VITE_VSL_BUTTON_DELAY) ?? 0,

  // External CRM ID
  enableExternalIdField: import.meta.env.VITE_ENABLE_EXTERNAL_ID_FIELD === 'true',
  externalIdFieldLabel: import.meta.env.VITE_EXTERNAL_ID_FIELD_LABEL ?? 'External CRM ID (optional)',
} as const;
