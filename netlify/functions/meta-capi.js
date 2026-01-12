/**
 * Netlify Function: Facebook Conversion API (CAPI)
 * 
 * This function receives user data and event information from the frontend,
 * enriches it with server-side data (IP, User-Agent), and sends it to Meta's
 * Conversion API for improved event matching and deduplication.
 * 
 * IMPORTANT: Set these environment variables in Netlify Dashboard:
 * - META_PIXEL_ID: Your Meta Pixel ID (from Business Manager)
 * - META_CAPI_ACCESS_TOKEN: Your CAPI Access Token (with ads_management scope)
 * 
 * Get CAPI token from: https://www.facebook.com/business/help/503306463479099
 */

/**
 * Hash a string using SHA-256 (simulating server-side)
 * This ensures consistent hashing across frontend and backend
 */
async function hashValue(value) {
  if (!value) return '';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize and extract IP address from request headers
 */
function getClientIp(event) {
  // Try headers first (Netlify includes them in event.headers)
  const xForwardedFor = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'];
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list; take the first
    return xForwardedFor.split(',')[0].trim();
  }
  
  const cfConnectingIp = event.headers['cf-connecting-ip'] || event.headers['CF-Connecting-IP'];
  if (cfConnectingIp) return cfConnectingIp;
  
  // Fallback (less reliable)
  return event.headers['x-client-ip'] || event.headers['X-Client-IP'] || '';
}

/**
 * Normalize phone number: remove all non-digits
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Normalize email: lowercase and trim
 */
function normalizeEmail(email) {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only POST allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.error('Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server configuration error',
        details: 'CAPI credentials not configured',
      }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const {
      eventName,
      userData,
      testEventCode,
      eventId,
      eventTime,
      sourceUrl,
      userAgent: frontendUserAgent,
    } = body;

    if (!eventName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'eventName is required' }),
      };
    }

    // Enrich user data with server-side information
    const clientIp = getClientIp(event);
    const serverUserAgent = event.headers['user-agent'] || frontendUserAgent || '';

    // Prepare hashed user data for CAPI
    // CAPI expects normalized + hashed PII for better matching
    const hashedUserData = {
      // Email (hashed on frontend, but we re-hash server-side for confirmation)
      em: userData?.em || (await hashValue(userData?.email || '')),
      
      // Phone (normalized and hashed)
      ph: userData?.ph || (await hashValue(normalizePhone(userData?.phone || ''))),
      
      // First name (hashed)
      fn: userData?.fn || (await hashValue(userData?.firstName || '')),
      
      // Last name (hashed)
      ln: userData?.ln || (await hashValue(userData?.lastName || '')),
      
      // External ID (usually email, hashed)
      external_id: userData?.external_id || (await hashValue(normalizeEmail(userData?.email || ''))),
      
      // IP address (hashed) - server provides authoritative value
      ...(clientIp && { ge: await hashValue(clientIp) }),
      
      // User agent (browser info, hashed) - server provides authoritative value
      ...(serverUserAgent && { ua: await hashValue(serverUserAgent) }),
      
      // First-party identifiers (from Meta's pixel cookies)
      ...(userData?.fbp && { fbp: userData.fbp }),
      ...(userData?.fbc && { fbc: userData.fbc }),
    };

    // Build CAPI event payload
    // Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
    const capiEvent = {
      // Required
      event_name: eventName,
      event_time: eventTime || Math.floor(Date.now() / 1000),
      
      // Recommended for event matching
      event_source_url: sourceUrl || '',
      action_source: 'website', // Could be 'website', 'app', 'email', etc.
      
      // User data (for matching)
      user_data: hashedUserData,
      
      // Event ID (for deduplication with browser pixel)
      event_id: eventId || '',
      
      // Custom data (optional contextual info)
      custom_data: {
        currency: userData?.currency || 'USD',
        value: userData?.value || 0,
      },
    };

    // If testEventCode provided, add it for validation
    if (testEventCode) {
      capiEvent.test_event_code = testEventCode;
    }

    // Send to Meta CAPI
    const capiResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [capiEvent],
          access_token: accessToken,
        }),
      }
    );

    const capiResult = await capiResponse.json();

    if (!capiResponse.ok) {
      console.error('CAPI error:', capiResult);
      return {
        statusCode: capiResponse.status,
        headers,
        body: JSON.stringify({
          error: 'CAPI request failed',
          details: capiResult,
        }),
      };
    }

    // Success
    console.log('CAPI event sent successfully:', eventName, 'Event ID:', eventId);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Event sent to Meta CAPI',
        eventId,
        capiResult,
      }),
    };
  } catch (error) {
    console.error('CAPI function error:', error);

    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
