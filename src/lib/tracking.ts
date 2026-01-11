import { UserData } from '@/contexts/UserContext';

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

// Trigger Meta Pixel event (browser-side)
export function triggerPixelEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const eventId = generateEventId();
    (window as any).fbq('track', eventName, params, { eventID: eventId });
    return eventId;
  }
  return null;
}

// Send CAPI event to server
export async function sendCapiEvent(
  eventName: string,
  userData: UserData,
  accessToken: string,
  pixelId: string,
  testEventCode?: string
) {
  try {
    const formattedData = await formatUserDataForMeta(userData);
    const eventId = generateEventId();
    
    const response = await fetch('/api/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        userData: formattedData,
        accessToken,
        pixelId,
        testEventCode,
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        sourceUrl: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      throw new Error('CAPI request failed');
    }

    return eventId;
  } catch (error) {
    console.error('CAPI event error:', error);
    return null;
  }
}

// Add subscriber to MailerLite
export async function addToMailerLite(
  userData: UserData,
  apiKey: string,
  groupId: string,
  tag: string
) {
  try {
    const response = await fetch('/api/mailerlite', {
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
