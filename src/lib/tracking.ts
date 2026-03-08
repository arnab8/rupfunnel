import { UserData } from '@/contexts/UserContext';

declare global {
  interface Window {
    fbq?: (event: string, name: string, data?: Record<string, unknown>, options?: Record<string, unknown>) => void;
  }
}

/**
 * Initialize Meta Pixel
 * Must be called once with the pixel ID before any events are tracked
 */
export function initializeMetaPixel(pixelId: string) {
  if (!pixelId) {
    console.warn('initializeMetaPixel: pixelId is empty');
    return;
  }

  if (typeof window === 'undefined') return;

  // Check if pixel is already initialized
  if ((window as any).fbq) {
    console.log('Meta Pixel already initialized');
    return;
  }

  // Initialize Meta Pixel script
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

  script.onerror = () => {
    console.error('Failed to load Meta Pixel script');
  };

  document.head.appendChild(script);
}

// Hash function for Meta CAPI (SHA-256)
export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Split full name into first and last name
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

// Format user data for Meta CAPI
export async function formatUserDataForMeta(userData: UserData) {
  const { firstName, lastName } = splitName(userData.fullName);
  
  const [hashedEmail, hashedPhone, hashedFirstName, hashedLastName] = await Promise.all([
    hashValue(userData.email),
    hashValue(userData.phone.replace(/\D/g, '')),
    hashValue(firstName),
    lastName ? hashValue(lastName) : Promise.resolve(''),
  ]);

  return {
    em: hashedEmail,
    ph: hashedPhone,
    fn: hashedFirstName,
    ln: hashedLastName,
    external_id: hashedEmail,
    fbp: userData.fbp || getCookie('_fbp') || '',
    fbc: userData.fbc || getCookie('_fbc') || '',
  };
}

// Get cookie value
export function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

// Capture UTM parameters from URL
export function captureUtmParams(): { utmCampaign?: string; utmContent?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    utmCampaign: params.get('utm_campaign') || undefined,
    utmContent: params.get('utm_content') || undefined,
  };
}

// Generate event ID for deduplication
export function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Device fingerprinting helpers
export function getDeviceFingerprint() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return {
    screen_resolution: `${screen.width}x${screen.height}`,
    browser_language: navigator.language || (navigator as any).userLanguage || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    device_type: isMobile ? 'mobile' : 'desktop',
    user_agent: navigator.userAgent,
  };
}

/**
 * Trigger Meta Pixel event (browser-side)
 * 
 * This sends data to the browser pixel for immediate processing.
 * For better matching, also call sendCapiEvent() to send server-side.
 */
export function triggerPixelEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  advancedMatching?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    console.warn(`triggerPixelEvent: fbq not available for event ${eventName}`);
    return null;
  }

  const resolvedEventId = eventId || generateEventId();

  // Combine standard params with advanced matching data
  const eventData = {
    ...params,
    ...advancedMatching,
  };

  (window as any).fbq('track', eventName, eventData, { eventID: resolvedEventId });
  console.log(`Pixel event tracked: ${eventName}`, resolvedEventId);

  return resolvedEventId;
}

/**
 * Send CAPI event to server
 * 
 * This sends user data to the backend, which enriches it with server-side
 * information (IP, User-Agent) and sends to Meta's Conversion API.
 * 
 * @param eventName - Event name (e.g., 'Lead', 'SubmitApplication')
 * @param userData - User data to include
 * @param pixelId - Meta Pixel ID for CAPI endpoint
 * @param testEventCode - Optional test event code for validation
 * @returns Event ID if successful, null otherwise
 */
export async function sendCapiEvent(
  eventName: string,
  userData: UserData,
  pixelId: string,
  testEventCode?: string,
  eventId?: string,
  customData?: Record<string, unknown>
) {
  if (!pixelId) {
    console.warn('sendCapiEvent: pixelId is required');
    return null;
  }

  try {
    const formattedData = await formatUserDataForMeta(userData);
    const resolvedEventId = eventId || generateEventId();

    const response = await fetch('/.netlify/functions/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        userData: formattedData,
        testEventCode: testEventCode || undefined,
        eventId: resolvedEventId,
        eventTime: Math.floor(Date.now() / 1000),
        sourceUrl: window.location.href,
        userAgent: navigator.userAgent,
        externalId: (userData as any).externalId || undefined,
        customData: customData || {},
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('CAPI event error:', error);
      return null;
    }

    const result = await response.json();
    console.log('CAPI event sent successfully:', eventName, resolvedEventId, result);
    return resolvedEventId;
  } catch (error) {
    console.error('CAPI event error:', error);
    return null;
  }
}

/**
 * Track an event with both browser pixel and server CAPI
 * 
 * This is the recommended approach for best event matching.
 * It sends the same event to both channels for deduplication and better data quality.
 */
export async function trackEventWithCapi(
  eventName: string,
  userData: UserData,
  pixelId: string,
  pixelEventData?: Record<string, unknown>,
  testEventCode?: string
) {
  const eventId = generateEventId();

  // Fire browser pixel
  const pixelEventId = triggerPixelEvent(eventName, pixelEventData, undefined, eventId);

  // Send to CAPI with same event ID for deduplication
  // Allow pixel event to fire regardless of CAPI success
  await sendCapiEvent(eventName, userData, pixelId, testEventCode, eventId, pixelEventData);

  return pixelEventId;
}

// Add subscriber to MailerLite (kept for compatibility)
export async function addToMailerLite(
  userData: UserData,
  apiKey: string,
  groupId: string,
  tag: string
) {
  try {
    const response = await fetch('/.netlify/functions/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        name: userData.fullName,
        phone: userData.phone,
        jobRole: userData.jobRole,
        apiKey,
        groupId,
        tag,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('MailerLite error:', error);
    return false;
  }
}
